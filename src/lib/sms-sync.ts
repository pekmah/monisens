import { DEFAULT_CURRENCY, DEFAULT_FINANCE_CATEGORIES } from "@/lib/finance/constants";
import {
  acceptSmsCandidate,
  getSmsSyncState,
  ingestSmsParseResult,
  listCategories,
  markSmsCandidateDismissed,
  updateSmsSyncState,
} from "@/lib/finance/repository";
import type { ParsedSmsCandidate } from "@/lib/finance/types";
import type { NativeSmsMessage } from "@/lib/sms-native";

type SmsParser = {
  key: string;
  matches: (message: NativeSmsMessage) => boolean;
  parse: (message: NativeSmsMessage) => ParsedSmsCandidate | null;
};

const KNOWN_SENDERS = [
  /mpesa/i,
  /m-pesa/i,
  /equity/i,
  /kcb/i,
  /ncba/i,
  /absa/i,
  /coop/i,
  /co-op/i,
];

const smsParsers: SmsParser[] = [
  {
    key: "mpesa",
    matches: (message) => /mpesa|m-pesa/i.test(message.sender) || /\bKsh/i.test(message.body),
    parse: parseMpesaMessage,
  },
  {
    key: "bank-credit-debit",
    matches: (message) =>
      KNOWN_SENDERS.some((matcher) => matcher.test(message.sender)) &&
      /(debited|credited|spent|received)/i.test(message.body),
    parse: parseBankDebitCreditMessage,
  },
];

export function computeSmsFingerprint(message: NativeSmsMessage) {
  return `${normalizeText(message.sender)}:${message.receivedAt}:${hashString(message.body)}`;
}

export function parseSmsMessage(message: NativeSmsMessage): ParsedSmsCandidate | null {
  const parser = smsParsers.find((entry) => entry.matches(message));

  if (!parser) {
    return null;
  }

  const parsed = parser.parse(message);
  if (!parsed) {
    return {
      amountMinor: 0,
      categoryId: null,
      confidence: 0,
      currency: DEFAULT_CURRENCY,
      direction: "expense",
      merchant: message.sender,
      occurredAt: message.receivedAt,
      parserKey: parser.key,
      parseStatus: "failed",
    };
  }

  return parsed;
}

export async function importSmsMessages(messages: NativeSmsMessage[]) {
  const categories = listCategories();
  let matchedCount = 0;

  for (const message of messages) {
    const parsed = parseSmsMessageWithCategories(message, categories);
    if (parsed?.parseStatus === "matched") {
      matchedCount += 1;
    }

    ingestSmsParseResult({
      body: message.body,
      deviceMessageId: message.id,
      fingerprint: computeSmsFingerprint(message),
      parsed,
      readAt: message.readAt,
      receivedAt: message.receivedAt,
      sender: message.sender,
    });
  }

  updateSmsSyncState({
    lastError: null,
    lastImportCount: messages.length,
    lastImportedAt: messages.length ? Math.max(...messages.map((message) => message.receivedAt)) : Date.now(),
  });

  return {
    importedCount: messages.length,
    matchedCount,
  };
}

export function recordSmsListenerEvent(message: NativeSmsMessage) {
  const parsed = parseSmsMessageWithCategories(message, listCategories());
  ingestSmsParseResult({
    body: message.body,
    deviceMessageId: message.id,
    fingerprint: computeSmsFingerprint(message),
    parsed,
    readAt: message.readAt,
    receivedAt: message.receivedAt,
    sender: message.sender,
  });
  updateSmsSyncState({
    lastError: null,
    lastListenerEventAt: message.receivedAt,
  });
}

export function setSmsListenerEnabled(enabled: boolean) {
  updateSmsSyncState({
    isListenerEnabled: enabled,
    lastError: null,
  });
}

export function setSmsSyncError(message: string | null) {
  updateSmsSyncState({
    lastError: message,
  });
}

export function getSmsListenerEnabled() {
  return Boolean(getSmsSyncState()?.isListenerEnabled);
}

export function acceptSmsCandidateUseCase(id: string) {
  return acceptSmsCandidate(id);
}

export function dismissSmsCandidateUseCase(id: string) {
  markSmsCandidateDismissed(id);
}

function parseSmsMessageWithCategories(message: NativeSmsMessage, categories: ReturnType<typeof listCategories>) {
  const parsed = parseSmsMessage(message);

  if (!parsed || parsed.parseStatus !== "matched") {
    return parsed;
  }

  return {
    ...parsed,
    categoryId: parsed.categoryId ?? suggestCategoryId(message, parsed.merchant, categories),
  };
}

function parseMpesaMessage(message: NativeSmsMessage): ParsedSmsCandidate | null {
  const amountMinor = extractAmountMinor(message.body);
  if (!amountMinor) {
    return null;
  }

  const reference = message.body.match(/^([A-Z0-9]{8,12})\b/i)?.[1];
  const incomeMerchant = extractBetween(message.body, "from ", " on");
  const expenseMerchant =
    extractBetween(message.body, "to ", " on") ??
    extractBetween(message.body, "paid to ", " on") ??
    extractBetween(message.body, "for account ", " on");
  const direction =
    /received ksh/i.test(message.body) || /have received/i.test(message.body)
      ? "income"
      : "expense";
  const merchant =
    sanitizeMerchant(direction === "income" ? incomeMerchant : expenseMerchant) ??
    fallbackMerchant(message.sender, message.body);

  return {
    amountMinor,
    categoryId: direction === "income" ? "cat-income" : null,
    confidence: 92,
    currency: DEFAULT_CURRENCY,
    direction,
    merchant,
    notes: "Imported from M-PESA SMS review queue.",
    occurredAt: message.receivedAt,
    parserKey: "mpesa",
    parseStatus: "matched",
    reference,
  };
}

function parseBankDebitCreditMessage(message: NativeSmsMessage): ParsedSmsCandidate | null {
  const amountMinor = extractAmountMinor(message.body);
  if (!amountMinor) {
    return null;
  }

  const direction =
    /credited|received/i.test(message.body) && !/debited/i.test(message.body)
      ? "income"
      : "expense";
  const merchant =
    sanitizeMerchant(
      extractBetween(message.body, "from ", ".") ??
      extractBetween(message.body, "to ", ".") ??
      extractBetween(message.body, "at ", "."),
    ) ?? fallbackMerchant(message.sender, message.body);
  const reference = message.body.match(/\b([A-Z0-9]{6,16})\b/)?.[1];

  return {
    amountMinor,
    categoryId: direction === "income" ? "cat-income" : null,
    confidence: 80,
    currency: DEFAULT_CURRENCY,
    direction,
    merchant,
    notes: `Imported from ${message.sender} SMS review queue.`,
    occurredAt: message.receivedAt,
    parserKey: "bank-credit-debit",
    parseStatus: "matched",
    reference,
  };
}

function extractAmountMinor(body: string) {
  const amountMatch = body.match(/(?:Ksh|KES)\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (!amountMatch) {
    return null;
  }

  const normalized = Number(amountMatch[1].replace(/,/g, ""));
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : null;
}

function extractBetween(value: string, startToken: string, endToken: string) {
  const lower = value.toLowerCase();
  const startIndex = lower.indexOf(startToken.toLowerCase());
  if (startIndex === -1) {
    return null;
  }

  const fromIndex = startIndex + startToken.length;
  const endIndex = lower.indexOf(endToken.toLowerCase(), fromIndex);
  const slice = endIndex === -1 ? value.slice(fromIndex) : value.slice(fromIndex, endIndex);

  return slice.trim() || null;
}

function fallbackMerchant(sender: string, body: string) {
  return sanitizeMerchant(sender) ?? sanitizeMerchant(body.split(" ").slice(0, 4).join(" ")) ?? "SMS transaction";
}

function sanitizeMerchant(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/\s+/g, " ").replace(/[.,]$/, "").trim() || null;
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return String(Math.abs(hash));
}

function suggestCategoryId(
  message: NativeSmsMessage,
  merchant: string,
  categories: ReturnType<typeof listCategories>,
) {
  const value = `${message.sender} ${merchant} ${message.body}`.toLowerCase();
  const defaultCategory = categories.find((category) => category.id === "cat-other")?.id
    ?? DEFAULT_FINANCE_CATEGORIES.find((category) => category.id === "cat-other")?.id
    ?? null;

  if (/uber|bolt|fuel|matatu|taxi|transport/.test(value)) {
    return categories.find((category) => category.id === "cat-transport")?.id ?? defaultCategory;
  }

  if (/kplc|water|airtime|internet|bill|utility/.test(value)) {
    return categories.find((category) => category.id === "cat-bills")?.id ?? defaultCategory;
  }

  if (/java house|restaurant|food|supermarket|grocer|dining/.test(value)) {
    return categories.find((category) => category.id === "cat-food")?.id ?? defaultCategory;
  }

  return defaultCategory;
}

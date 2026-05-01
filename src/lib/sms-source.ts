import { DEFAULT_CURRENCY } from "@/lib/finance/constants";
import {
  clearSmsCandidateForMessage,
  getActiveSmsSourceProfilesForMatching,
  getSmsMessageById,
  ingestSmsParseResult,
} from "@/lib/finance/repository";
import type {
  ParsedSmsCandidate,
  SmsSourceMatchField,
  SmsSourceMatchType,
  SmsSourceProfileRecord,
} from "@/lib/finance/types";
import type { NativeSmsMessage } from "@/lib/sms-native";

type MatchResult = {
  matchedConditionCount: number;
  profile: SmsSourceProfileRecord;
  score: number;
};

export function resolveSmsSourceMessage(message: NativeSmsMessage) {
  const profiles = getActiveSmsSourceProfilesForMatching();
  const matches = profiles
    .map((profile) => scoreProfileMatch(profile, message))
    .filter((result): result is MatchResult => result !== null)
    .sort(compareMatchResults);

  const exclusionMatches = matches.filter(
    (result) => result.profile.action === "exclude",
  );

  const winner = exclusionMatches[0] ?? matches[0] ?? null;
  const parsed = winner ? parseWithProfile(winner.profile, message) : null;

  return {
    matchScore: winner?.score ?? null,
    parsed,
    sourceAction: winner?.profile.action ?? null,
    sourceProfileId: winner?.profile.id ?? null,
  };
}

export function reprocessSmsMessageById(messageId: string) {
  const message = getSmsMessageById(messageId);
  if (!message) {
    throw new Error("SMS message not found.");
  }

  clearSmsCandidateForMessage(messageId);
  const resolved = resolveSmsSourceMessage({
    body: message.body,
    id: message.id,
    readAt: message.readAt,
    receivedAt: message.receivedAt,
    sender: message.sender,
  });

  ingestSmsParseResult({
    body: message.body,
    deviceMessageId: message.id,
    fingerprint: message.fingerprint,
    matchScore: resolved.matchScore,
    parsed: resolved.parsed,
    readAt: message.readAt,
    receivedAt: message.receivedAt,
    sender: message.sender,
    sourceAction: resolved.sourceAction,
    sourceProfileId: resolved.sourceProfileId,
  });
}

function parseWithProfile(
  profile: SmsSourceProfileRecord,
  message: NativeSmsMessage,
): ParsedSmsCandidate | null {
  if (profile.action === "exclude" || profile.parserKey === "none") {
    return null;
  }

  switch (profile.parserKey) {
    case "mpesa":
      return parseMpesaMessage(message);
    case "bank-credit-debit":
      return parseBankDebitCreditMessage(message);
    default:
      return null;
  }
}

function scoreProfileMatch(
  profile: SmsSourceProfileRecord,
  message: NativeSmsMessage,
): MatchResult | null {
  const enabledMatchers = profile.matchers.filter((matcher) => matcher.enabled);
  if (enabledMatchers.length === 0) {
    return null;
  }

  let score = 0;
  let matchedConditionCount = 0;

  for (const matcher of enabledMatchers) {
    const targetValue = matcher.field === "sender" ? message.sender : message.body;
    const matcherScore = scoreMatcher({
      field: matcher.field,
      matchType: matcher.matchType,
      pattern: matcher.pattern,
      value: targetValue,
      caseSensitive: matcher.caseSensitive,
    });

    if (matcherScore === null) {
      return null;
    }

    score += matcherScore;
    matchedConditionCount += 1;
  }

  return {
    matchedConditionCount,
    profile,
    score,
  };
}

function compareMatchResults(left: MatchResult, right: MatchResult) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }

  if (right.matchedConditionCount !== left.matchedConditionCount) {
    return right.matchedConditionCount - left.matchedConditionCount;
  }

  return left.profile.sortOrder - right.profile.sortOrder;
}

function scoreMatcher(input: {
  caseSensitive: boolean;
  field: SmsSourceMatchField;
  matchType: SmsSourceMatchType;
  pattern: string;
  value: string;
}) {
  const { caseSensitive, field, matchType, pattern, value } = input;
  const normalizedPattern = caseSensitive ? pattern : pattern.toLowerCase();
  const normalizedValue = caseSensitive ? value : value.toLowerCase();

  switch (matchType) {
    case "exact":
      if (normalizedValue !== normalizedPattern) {
        return null;
      }
      return baseScore(field, matchType) + normalizedPattern.length;
    case "contains":
      if (!normalizedValue.includes(normalizedPattern)) {
        return null;
      }
      return baseScore(field, matchType) + normalizedPattern.length;
    case "regex": {
      try {
        const expression = new RegExp(pattern, caseSensitive ? "" : "i");
        return expression.test(value) ? baseScore(field, matchType) : null;
      } catch {
        return null;
      }
    }
    default:
      return null;
  }
}

function baseScore(field: SmsSourceMatchField, matchType: SmsSourceMatchType) {
  if (field === "sender") {
    switch (matchType) {
      case "exact":
        return 400;
      case "regex":
        return 300;
      default:
        return 250;
    }
  }

  return matchType === "regex" ? 180 : 120;
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
    categoryId: null,
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

function parseBankDebitCreditMessage(
  message: NativeSmsMessage,
): ParsedSmsCandidate | null {
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
    categoryId: null,
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
  return (
    sanitizeMerchant(sender) ??
    sanitizeMerchant(body.split(" ").slice(0, 4).join(" ")) ??
    "SMS transaction"
  );
}

function sanitizeMerchant(value?: string | null) {
  if (!value) {
    return null;
  }

  return value.replace(/\s+/g, " ").replace(/[.,]$/, "").trim() || null;
}

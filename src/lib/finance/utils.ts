import { format, isThisWeek, isToday, isYesterday } from "date-fns";

import type { TransactionRecord, TransactionSectionItem, TransactionSectionRecord } from "@/lib/finance/types";

export function createId(prefix = "id") {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${random}`;
}

export function monthKeyFromTimestamp(timestamp: number) {
  return format(timestamp, "yyyy-MM");
}

export function toAmountMinor(value: string) {
  const normalized = Number(value.replace(/[^0-9.-]/g, ""));

  if (!Number.isFinite(normalized)) {
    throw new Error("Enter a valid amount.");
  }

  return Math.round(normalized * 100);
}

export function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amountMinor / 100);
}

export function formatSignedMoney(
  amountMinor: number,
  currency: string,
  direction: "expense" | "income",
) {
  const sign = direction === "income" ? "+" : "-";
  return `${sign} ${formatMoney(amountMinor, currency)}`;
}

export function formatTransactionTime(timestamp: number) {
  return format(timestamp, "h:mm a");
}

export function formatTransactionMetaDate(timestamp: number) {
  return format(timestamp, "MMM d, yyyy, h:mm a");
}

export function buildTransactionSections(
  transactions: TransactionRecord[],
): TransactionSectionRecord[] {
  const groups = new Map<string, TransactionSectionItem[]>();

  for (const transaction of transactions) {
    const title = getTransactionSectionTitle(transaction.transactionAt);
    const items = groups.get(title) ?? [];

    items.push({
      accent: transaction.categoryColor,
      amountLabel: formatSignedMoney(
        transaction.amountMinor,
        transaction.currency,
        transaction.direction,
      ),
      category: transaction.categoryLabel,
      hint: undefined,
      id: transaction.id,
      time: formatTransactionTime(transaction.transactionAt),
      title: transaction.merchant,
    });

    groups.set(title, items);
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ data, title }));
}

function getTransactionSectionTitle(timestamp: number) {
  if (isToday(timestamp)) {
    return "Today";
  }

  if (isYesterday(timestamp)) {
    return "Yesterday";
  }

  if (isThisWeek(timestamp, { weekStartsOn: 1 })) {
    return "Earlier This Week";
  }

  return format(timestamp, "MMM d");
}

export function accentBackground(color: string) {
  return `${color}1F`;
}

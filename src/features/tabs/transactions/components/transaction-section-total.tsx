import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { TransactionSectionItem } from "@/lib/finance/types";
import { formatMoney } from "@/lib/finance/utils";

export type TransactionSectionTotalProps = {
  transactions: TransactionSectionItem[];
};

export function TransactionSectionTotal({
  transactions,
}: TransactionSectionTotalProps) {
  const theme = useAppTheme();
  const total = useMemo(() => calculateSectionTotal(transactions), [transactions]);
  const color =
    total.signedMinor > 0
      ? theme.colors.primary
      : total.signedMinor < 0
        ? theme.colors.error
        : theme.colors.mutedText;

  return (
    <AppText
      numberOfLines={1}
      style={[styles.total, { color }]}
      variant="labelMd"
    >
      {formatSectionTotal(total.signedMinor, total.currency)}
    </AppText>
  );
}

function calculateSectionTotal(transactions: TransactionSectionItem[]) {
  // Keep the arithmetic local to the header component so each section computes
  // once from its already-flattened rows instead of recalculating per item.
  return transactions.reduce(
    (total, transaction) => ({
      currency: total.currency ?? transaction.currency,
      signedMinor:
        total.signedMinor +
        (transaction.direction === "income"
          ? transaction.amountMinor
          : -transaction.amountMinor),
    }),
    { currency: "KES", signedMinor: 0 },
  );
}

function formatSectionTotal(signedMinor: number, currency: string) {
  if (signedMinor === 0) {
    return formatMoney(0, currency);
  }

  const prefix = signedMinor > 0 ? "+ " : "- ";
  return `${prefix}${formatMoney(Math.abs(signedMinor), currency)}`;
}

const styles = StyleSheet.create({
  total: {
    flexShrink: 0,
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
});

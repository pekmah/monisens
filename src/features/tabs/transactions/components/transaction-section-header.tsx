import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { Spacing } from "@/constants/theme";
import type { TransactionSectionItem } from "@/lib/finance/types";

import { TransactionSectionTotal } from "./transaction-section-total";

export type TransactionSectionHeaderProps = {
  title: string;
  transactions: TransactionSectionItem[];
};

export function TransactionSectionHeader({
  title,
  transactions,
}: TransactionSectionHeaderProps) {
  return (
    <View style={styles.header}>
      <AppText color="mutedText" style={styles.sectionTitle} variant="labelMd">
        {title.toUpperCase()}
      </AppText>
      <TransactionSectionTotal transactions={transactions} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontFamily: font.headerSemiBold,
    letterSpacing: 1.8,
  },
});

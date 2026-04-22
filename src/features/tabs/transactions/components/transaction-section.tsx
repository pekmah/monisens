import { StyleSheet, View } from "react-native";

import { AppFlashList } from "@/components/base";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { Spacing } from "@/constants/theme";
import {
  TransactionListItem,
  type TransactionListItemData,
} from "@/features/tabs/transactions/components/transaction-list-item";

export type TransactionSectionData = {
  data: TransactionListItemData[];
  title: string;
};

export type TransactionSectionProps = {
  section: TransactionSectionData;
};

export function TransactionSection({ section }: TransactionSectionProps) {
  return (
    <View style={styles.section}>
      <AppText color="mutedText" style={styles.sectionTitle} variant="labelMd">
        {section.title.toUpperCase()}
      </AppText>
      <AppFlashList
        data={section.data}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyExtractor={(transaction) => transaction.id}
        renderItem={({ item }) => <TransactionListItem transaction={item} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
    letterSpacing: 1.8,
    paddingHorizontal: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
  },
});

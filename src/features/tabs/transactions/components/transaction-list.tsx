import { useCallback, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppFlashList } from "@/components/base";
import { Sizes, Spacing } from "@/constants/theme";
import type { TransactionSectionRecord } from "@/lib/finance/types";

import {
  TransactionListItem,
  type TransactionListItemData,
} from "./transaction-list-item";
import { TransactionSectionHeader } from "./transaction-section-header";

import type { ReactElement } from "react";

type TransactionListRow =
  | {
      id: string;
      title: string;
      type: "section";
    }
  | {
      id: string;
      transaction: TransactionListItemData;
      type: "transaction";
    };

export type TransactionListProps = {
  contentBottomPadding: number;
  footer: ReactElement;
  header: ReactElement;
  sections: TransactionSectionRecord[];
};

export function TransactionList({
  contentBottomPadding,
  footer,
  header,
  sections,
}: TransactionListProps) {
  const rows = useMemo(() => flattenTransactionSections(sections), [sections]);

  const renderItem = useCallback(({ item }: { item: TransactionListRow }) => {
    if (item.type === "section") {
      return <TransactionSectionHeader title={item.title} />;
    }

    return <TransactionListItem transaction={item.transaction} />;
  }, []);

  const keyExtractor = useCallback((item: TransactionListRow) => item.id, []);

  // A single virtualized list owns the scroll container so FlashList can measure
  // rows predictably even when transaction history grows large.
  return (
    <AppFlashList
      contentContainerStyle={[
        styles.content,
        { paddingBottom: contentBottomPadding },
      ]}
      data={rows}
      ItemSeparatorComponent={TransactionListSeparator}
      keyboardShouldPersistTaps="handled"
      keyExtractor={keyExtractor}
      ListEmptyComponent={footer}
      ListHeaderComponent={header}
      renderItem={renderItem}
      scrollEnabled
    />
  );
}

function TransactionListSeparator() {
  return <View style={styles.separator} />;
}

function flattenTransactionSections(sections: TransactionSectionRecord[]) {
  const rows: TransactionListRow[] = [];

  for (const section of sections) {
    rows.push({
      id: `section:${section.title}`,
      title: section.title,
      type: "section",
    });

    for (const transaction of section.data) {
      rows.push({
        id: `transaction:${transaction.id}`,
        transaction,
        type: "transaction",
      });
    }
  }

  return rows;
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Sizes["xl"],
  },
  separator: {
    height: Spacing.sm,
  },
});

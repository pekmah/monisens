import { router, Tabs, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components/base";
import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  CategoryCard,
  DetailHeader,
  MetaRowsCard,
  SuggestionCard,
  TransactionHeroCard,
  type MetaRow,
} from "@/features/transaction-detail/components";
import { formatTransactionMetaDate, useFinance } from "@/lib/finance";

export default function TransactionDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { deleteTransaction, snapshot, updateTransaction } = useFinance();
  const transaction = snapshot?.transactions.find((item) => item.id === params.id);
  const [editingCategory, setEditingCategory] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!transaction) {
    return (
      <TabScreen>
        <Tabs.Screen options={{ headerShown: false }} />
        <AppText color="mutedText" variant="bodyMd">
          Transaction not found in local storage.
        </AppText>
      </TabScreen>
    );
  }

  const currentTransaction = transaction;

  const metaRows: MetaRow[] = [
    {
      label: "Status",
      tone: currentTransaction.syncStatus === "synced" ? "success" : undefined,
      value:
        currentTransaction.syncStatus === "synced" ? "Synced" : "Pending sync",
    },
    { label: "Source", value: currentTransaction.source.toUpperCase() },
    {
      label: "Timestamp",
      value: formatTransactionMetaDate(currentTransaction.transactionAt),
    },
    { label: "Account", value: currentTransaction.accountLabel },
    { label: "Reference", value: currentTransaction.reference || "Not provided" },
  ];

  async function handleCategoryChange(categoryId: string) {
    if (categoryId === currentTransaction.categoryId) {
      setEditingCategory(false);
      return;
    }

    setBusy(true);
    await updateTransaction(currentTransaction.id, { categoryId });
    setBusy(false);
    setEditingCategory(false);
  }

  async function handleDelete() {
    setBusy(true);
    await deleteTransaction(currentTransaction.id);
    router.replace("/transactions");
  }

  return (
    <TabScreen>
      <Tabs.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader />
        <TransactionHeroCard transaction={currentTransaction} />
        <MetaRowsCard rows={metaRows} />
        <CategoryCard
          activeCategoryId={currentTransaction.categoryId}
          categories={snapshot?.categories ?? []}
          editing={editingCategory}
          onEditToggle={() => setEditingCategory((value) => !value)}
          onSelectCategory={(categoryId) => void handleCategoryChange(categoryId)}
        />
        <SuggestionCard />
        <View style={styles.actions}>
          <AppButton
            disabled={busy}
            onPress={() => setEditingCategory((value) => !value)}
            title={editingCategory ? "Stop editing" : "Edit category"}
            variant="secondary"
          />
          <AppButton
            disabled={busy}
            onPress={() => void handleDelete()}
            title="Delete transaction"
            variant="danger"
          />
        </View>
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["13xl"],
  },
});

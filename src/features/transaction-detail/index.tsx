import { router, Tabs, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppSafeArea, AppText, ConfirmationDialog } from "@/components/base";
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
  const { deleteTransaction, loadTransactionById, snapshot, updateTransaction } = useFinance();
  const snapshotTransaction = snapshot?.transactions.find((item) => item.id === params.id);
  const [transaction, setTransaction] = useState(snapshotTransaction ?? null);
  const [editingCategory, setEditingCategory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (snapshotTransaction) {
      setTransaction(snapshotTransaction);
      return () => {
        cancelled = true;
      };
    }

    if (!params.id) {
      setTransaction(null);
      return () => {
        cancelled = true;
      };
    }

    void loadTransactionById(params.id).then((result) => {
      if (!cancelled) {
        setTransaction(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [loadTransactionById, params.id, snapshotTransaction]);

  if (!transaction) {
    return (
      <TabScreen>
        <Tabs.Screen options={{ headerShown: false }} />
        <AppSafeArea edges={["top"]} style={styles.safeArea}>
          <AppText color="mutedText" variant="bodyMd">
            Transaction not found in local storage.
          </AppText>
        </AppSafeArea>
      </TabScreen>
    );
  }

  const currentTransaction = transaction;

  const metaRows: MetaRow[] = [
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
      <AppSafeArea edges={["top"]} style={styles.safeArea}>
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
              onPress={() => setDeleteDialogVisible(true)}
              title="Delete transaction"
              variant="danger"
            />
          </View>
        </ScrollView>
      </AppSafeArea>
      <ConfirmationDialog
        cancelLabel="Keep transaction"
        confirmLabel="Delete transaction"
        description={`This will remove ${currentTransaction.merchant} from your ledger.`}
        loading={busy}
        onCancel={() => setDeleteDialogVisible(false)}
        onConfirm={() => {
          setDeleteDialogVisible(false);
          void handleDelete();
        }}
        title="Delete transaction?"
        visible={deleteDialogVisible}
      />
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
  safeArea: {
    flex: 1,
  },
});

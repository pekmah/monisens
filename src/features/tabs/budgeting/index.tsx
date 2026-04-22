import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppFlashList, AppText, AppTextInput } from "@/components/base";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  BudgetOverviewCard,
  BudgetTipCard,
  CategoryAllocationsCard,
} from "@/features/tabs/budgeting/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

export default function BudgetingScreen() {
  const theme = useAppTheme();
  const { createBudget, snapshot } = useFinance();
  const [creating, setCreating] = useState(false);
  const [categoryId, setCategoryId] = useState(snapshot?.categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!categoryId && snapshot?.categories[0]) {
      setCategoryId(snapshot.categories[0].id);
    }
  }, [categoryId, snapshot?.categories]);

  async function handleCreateBudget() {
    if (!amount.trim() || !categoryId) {
      return;
    }

    await createBudget({ amount, categoryId, notes });
    setAmount("");
    setNotes("");
    setCreating(false);
  }

  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BudgetOverviewCard overview={snapshot?.budgetOverview ?? null} />
        <BudgetTipCard />
        {creating ? (
          <View
            style={[
              styles.createCard,
              { backgroundColor: theme.colors.surfaceContainerLow },
            ]}
          >
            <AppText variant="titleMd">New budget envelope</AppText>
            <AppTextInput
              label="Amount"
              keyboardType="decimal-pad"
              onChangeText={setAmount}
              placeholder="12000"
              value={amount}
            />
            <AppTextInput
              label="Notes"
              onChangeText={setNotes}
              placeholder="Dining and groceries"
              value={notes}
            />
            {snapshot?.categories.length ? (
              <AppFlashList
                data={snapshot.categories}
                horizontal
                keyExtractor={(category) => category.id}
                renderItem={({ item: category }) => {
                  const active = category.id === categoryId;

                  return (
                    <AppButton
                      onPress={() => setCategoryId(category.id)}
                      title={category.label}
                      variant={active ? "primary" : "secondary"}
                    />
                  );
                }}
                scrollEnabled
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
              />
            ) : (
              <AppText color="mutedText" variant="bodyMd">
                No categories are stored in the database yet.
              </AppText>
            )}
            <View style={styles.actions}>
              <AppButton onPress={() => setCreating(false)} title="Cancel" variant="secondary" />
              <AppButton
                disabled={!snapshot?.categories.length}
                onPress={() => void handleCreateBudget()}
                title="Save budget"
              />
            </View>
            {!snapshot?.categories.length ? (
              <AppText color="mutedText" variant="bodyMd">
                Add categories to the database before creating budgets.
              </AppText>
            ) : null}
          </View>
        ) : null}
        <CategoryAllocationsCard
          categories={snapshot?.budgetAllocations ?? []}
          onAddBudget={() => setCreating(true)}
        />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  categorySeparator: {
    width: Spacing.sm,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
  createCard: {
    borderRadius: Radii.xl,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
});

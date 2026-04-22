import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppText, AppTextInput } from "@/components/base";
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
  const [categoryId, setCategoryId] = useState(snapshot?.categories[0]?.id ?? "cat-food");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

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
            <View style={styles.categoryRow}>
              {snapshot?.categories.map((category) => {
                const active = category.id === categoryId;
                return (
                  <AppButton
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    title={category.label}
                    variant={active ? "primary" : "secondary"}
                  />
                );
              })}
            </View>
            <View style={styles.actions}>
              <AppButton onPress={() => setCreating(false)} title="Cancel" variant="secondary" />
              <AppButton onPress={() => void handleCreateBudget()} title="Save budget" />
            </View>
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
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import {
  AppButton,
  AppText,
  AppTextInput,
  CategorySelectField,
  KeyboardController,
} from "@/components/base";
import { Radii, Sizes, Spacing, type AppTheme } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  BudgetOverviewCard,
  BudgetTipCard,
  CategoryAllocationsCard,
} from "@/features/tabs/budgeting/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney, useFinance } from "@/lib/finance";

export default function BudgetingScreen() {
  const theme = useAppTheme();
  const { createBudget, snapshot } = useFinance();
  const [creating, setCreating] = useState(false);
  const [categoryId, setCategoryId] = useState(snapshot?.categories[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const createCardThemeStyle = getCreateCardThemeStyle(theme);

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
      <KeyboardController
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BudgetOverviewCard overview={snapshot?.budgetOverview ?? null} />
        <BillsPlanningCard
          dueSoonCount={snapshot?.bills.dueSoonCount ?? 0}
          monthlyImpactMinor={snapshot?.bills.monthlyImpactMinor ?? 0}
          overdueCount={snapshot?.bills.overdueCount ?? 0}
          scheduleCount={snapshot?.bills.schedules.length ?? 0}
        />
        <BudgetTipCard />
        {creating ? (
          <View
            style={[
              styles.createCard,
              createCardThemeStyle,
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
            <CategorySelectField
              onSelect={(value) => setCategoryId(value)}
              selectedValue={categoryId}
              title="Choose budget category"
            />
            <View style={styles.actions}>
              <AppButton onPress={() => setCreating(false)} title="Cancel" variant="secondary" />
              <AppButton
                disabled={!categoryId}
                onPress={() => void handleCreateBudget()}
                title="Save budget"
              />
            </View>
            {!categoryId ? (
              <AppText color="mutedText" variant="bodyMd">
                Choose a category before creating budgets.
              </AppText>
            ) : null}
          </View>
        ) : null}
        <CategoryAllocationsCard
          categories={snapshot?.budgetAllocations ?? []}
          onAddBudget={() => setCreating(true)}
        />
      </KeyboardController>
    </TabScreen>
  );
}

function BillsPlanningCard({
  dueSoonCount,
  monthlyImpactMinor,
  overdueCount,
  scheduleCount,
}: {
  dueSoonCount: number;
  monthlyImpactMinor: number;
  overdueCount: number;
  scheduleCount: number;
}) {
  const theme = useAppTheme();
  const billsCardThemeStyle = getBillsCardThemeStyle(theme);
  const billsIconThemeStyle = getBillsIconThemeStyle(theme);
  const status =
    overdueCount > 0
      ? `${overdueCount} overdue`
      : dueSoonCount > 0
        ? `${dueSoonCount} due soon`
        : scheduleCount > 0
          ? "On schedule"
          : "Not set up";

  return (
    <View
      style={[
        styles.billsCard,
        billsCardThemeStyle,
      ]}
    >
      <View style={styles.billsHeader}>
        <View style={[styles.billsIcon, billsIconThemeStyle]}>
          <Feather color={theme.colors.secondary} name="calendar" size={Sizes.xl} />
        </View>
        <View style={styles.billsCopy}>
          <AppText variant="titleMd">Bills planning</AppText>
          <AppText color="mutedText" variant="bodyMd">
            Track recurring and one-time obligations, then confirm payments from real transactions.
          </AppText>
        </View>
      </View>
      <View style={styles.billsMetrics}>
        <BillMetric label="Schedules" value={String(scheduleCount)} />
        <BillMetric label="Status" value={status} />
        <BillMetric label="Monthly" value={formatMoney(monthlyImpactMinor, "KES")} />
      </View>
      <AppButton
        onPress={() => router.push("/bills" as never)}
        title={scheduleCount > 0 ? "Manage bills" : "Set up bills"}
        variant="secondary"
      />
    </View>
  );
}

function getCreateCardThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
  };
}

function getBillsCardThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
  };
}

function getBillsIconThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: `${theme.colors.secondary}14`,
  };
}

function BillMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.billMetric}>
      <AppText color="mutedText" variant="labelMd">
        {label}
      </AppText>
      <AppText variant="labelMd">{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  billMetric: {
    flex: 1,
    gap: Sizes.xxs,
  },
  billsCard: {
    borderRadius: Radii.xl,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  billsCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  billsHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  billsIcon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  billsMetrics: {
    flexDirection: "row",
    gap: Spacing.md,
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

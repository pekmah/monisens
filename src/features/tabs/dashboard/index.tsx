import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";

import { AppFlashList } from "@/components/base";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import {
  ProgressBar,
  SurfaceCard,
  TabScreen,
} from "@/features/tabs/_components";
import {
  SpendingDonutChart,
  TransactionRow,
} from "@/features/tabs/dashboard/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney, useFinance } from "@/lib/finance";
import type { TransactionRecord } from "@/lib/finance/types";

type SpendingPeriod = "today" | "week" | "month" | "year" | "all";

const spendingPeriods: { label: string; value: SpendingPeriod }[] = [
  { label: "Today", value: "today" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
];

export default function DashboardScreen() {
  const theme = useAppTheme();
  const { snapshot } = useFinance();
  const [selectedPeriod, setSelectedPeriod] =
    useState<SpendingPeriod>("today");

  const monthTotals = snapshot?.currentMonthTotals;
  const budgetedMinor = snapshot?.budgetOverview?.limitMinor ?? 0;
  const spent = useMemo(
    () => getPeriodExpenseMinor(snapshot?.transactions ?? [], selectedPeriod),
    [selectedPeriod, snapshot?.transactions],
  );
  const periodLabel = getPeriodLabel(selectedPeriod);
  const monthSpent = monthTotals?.expenseMinor ?? 0;
  const remainingBudget = Math.max(budgetedMinor - monthSpent, 0);
  const budgetProgress =
    budgetedMinor > 0
      ? Math.min((monthSpent / budgetedMinor) * 100, 100)
      : 0;
  const monthPillThemeStyle = getMonthPillThemeStyle(theme);
  const fabThemeStyle = getFabThemeStyle(theme);

  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SurfaceCard elevated style={styles.hero} tone="primary">
          <View style={styles.heroContent}>
            <View>
              <AppText
                color="onPrimary"
                style={styles.overline}
                variant="labelMd"
              >
                MONEY SPENT {periodLabel.toUpperCase()}
              </AppText>
              <AppText
                color="onPrimary"
                style={styles.heroAmount}
                variant="displayLg"
              >
                {formatMoney(spent, "KES")}
              </AppText>
            </View>
            <View style={styles.periodSelector}>
              {spendingPeriods.map((period) => {
                const selected = period.value === selectedPeriod;
                const periodPillThemeStyle = getPeriodPillThemeStyle(
                  theme,
                  selected,
                );

                return (
                  <AppPressable
                    key={period.value}
                    onPress={() => setSelectedPeriod(period.value)}
                    style={[styles.periodPill, periodPillThemeStyle]}
                  >
                    <AppText
                      color={selected ? "primary" : "onPrimary"}
                      style={styles.periodPillText}
                      variant="labelMd"
                    >
                      {period.label}
                    </AppText>
                  </AppPressable>
                );
              })}
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroFooter}>
              <View>
                <AppText
                  color="onPrimary"
                  style={styles.overlineSmall}
                  variant="labelMd"
                >
                  BUDGETED THIS MONTH
                </AppText>
                <AppText
                  color="onPrimary"
                  style={styles.heroSecondaryAmount}
                  variant="titleMd"
                >
                  {formatMoney(budgetedMinor, "KES")}
                </AppText>
              </View>
              <View style={styles.heroFooterMetric}>
                <AppText
                  color="onPrimary"
                  style={styles.overlineSmall}
                  variant="labelMd"
                >
                  REMAINING
                </AppText>
                <AppText
                  color="onPrimary"
                  style={styles.heroSecondaryAmount}
                  variant="titleMd"
                >
                  {formatMoney(remainingBudget, "KES")}
                </AppText>
              </View>
            </View>
            <ProgressBar
              color={theme.colors.onPrimaryContainer}
              progress={budgetProgress}
            />
          </View>
          <View style={styles.heroOrb} />
        </SurfaceCard>

        <View style={styles.bentoGrid}>
          <SurfaceCard style={styles.transactionsCard}>
            <View style={styles.transactionsHeader}>
              <AppText style={styles.cardTitle} variant="titleMd">
                Recent Transactions
              </AppText>
              <Link href="/transactions" asChild>
                <AppPressable>
                  <AppText color="primary" variant="labelMd">
                    View all
                  </AppText>
                </AppPressable>
              </Link>
            </View>
            <View style={styles.transactionList}>
              {snapshot?.dashboardTransactions.length ? (
                <AppFlashList
                  data={snapshot.dashboardTransactions}
                  ItemSeparatorComponent={() => (
                    <View style={styles.listSeparator} />
                  )}
                  keyExtractor={(transaction) => transaction.id}
                  renderItem={({ item }) => <TransactionRow {...item} />}
                />
              ) : (
                <AppText color="mutedText" variant="bodyMd">
                  No transactions stored locally yet.
                </AppText>
              )}
            </View>
          </SurfaceCard>

          <SurfaceCard style={styles.breakdownCard} tone="low">
            <View style={styles.breakdownHeader}>
              <AppText style={styles.cardTitle} variant="titleMd">
                Spending Breakdown
              </AppText>
              <View style={[styles.monthPill, monthPillThemeStyle]}>
                <AppText color="primary" variant="labelMd">
                  This Month
                </AppText>
              </View>
            </View>
            <View style={styles.breakdownContent}>
              <SpendingDonutChart
                data={snapshot?.breakdown ?? []}
                totalLabel={formatMoney(monthTotals?.expenseMinor ?? 0, "KES")}
              />
              <View style={styles.legendGrid}>
                {snapshot?.breakdown.length ? (
                  <AppFlashList
                    data={snapshot.breakdown}
                    ItemSeparatorComponent={() => (
                      <View style={styles.legendSeparator} />
                    )}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    renderItem={({ item, index }) => (
                      <View style={getLegendColumnStyle(index)}>
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              getLegendDotStyle(item.color),
                            ]}
                          />
                          <View style={styles.legendCopy}>
                            <AppText
                              color="mutedText"
                              numberOfLines={1}
                              style={styles.legendLabel}
                              variant="labelMd"
                            >
                              {item.label}
                            </AppText>
                            <AppText
                              numberOfLines={1}
                              style={styles.legendValue}
                              variant="labelMd"
                            >
                              {item.value}
                            </AppText>
                          </View>
                        </View>
                      </View>
                    )}
                  />
                ) : (
                  <AppText color="mutedText" variant="bodyMd">
                    Expense categories will appear after local transactions are
                    stored.
                  </AppText>
                )}
              </View>
            </View>
          </SurfaceCard>
        </View>
      </ScrollView>
      <AppPressable
        onPress={() => router.push("/transactions/new")}
        style={[styles.fab, fabThemeStyle]}
      >
        <Feather color={theme.colors.onPrimary} name="plus" size={Sizes["4xl"]} />
      </AppPressable>
    </TabScreen>
  );
}

function getPeriodExpenseMinor(
  transactions: TransactionRecord[],
  period: SpendingPeriod,
) {
  const start = getPeriodStartTimestamp(period);

  return transactions.reduce((total, transaction) => {
    if (transaction.direction !== "expense") {
      return total;
    }

    if (start && transaction.transactionAt < start) {
      return total;
    }

    return total + transaction.amountMinor;
  }, 0);
}

function getPeriodStartTimestamp(period: SpendingPeriod) {
  const now = new Date();

  if (period === "all") {
    return null;
  }

  if (period === "today") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
  }

  if (period === "week") {
    const day = now.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysSinceMonday,
    ).getTime();
  }

  if (period === "month") {
    return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  }

  return new Date(now.getFullYear(), 0, 1).getTime();
}

function getPeriodLabel(period: SpendingPeriod) {
  if (period === "week") {
    return "this week";
  }

  if (period === "month") {
    return "this month";
  }

  if (period === "year") {
    return "this year";
  }

  if (period === "all") {
    return "overall";
  }

  return "today";
}

function getPeriodPillThemeStyle(
  theme: AppTheme,
  selected: boolean,
): ViewStyle {
  return {
    backgroundColor: selected
      ? theme.colors.onPrimary
      : "rgba(255,255,255,0.12)",
  };
}

function getMonthPillThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: `${theme.colors.primary}1A`,
  };
}

function getLegendColumnStyle(index: number): ViewStyle[] {
  return [
    styles.legendColumn,
    index % 2 === 0 ? styles.legendColumnLeft : styles.legendColumnRight,
  ];
}

function getLegendDotStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
}

function getFabThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primary,
  };
}

const styles = StyleSheet.create({
  bentoGrid: {
    gap: Spacing.lg,
  },
  breakdownCard: {
    gap: Sizes["2xl"] + Sizes.xxs,
    padding: Spacing.xl,
    borderWidth: Sizes.xxs - 1,
    borderColor: "rgba(0,0,0,0.07)",
  },
  breakdownContent: {
    gap: Spacing.xl,
  },
  breakdownHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  content: {
    gap: Spacing.xl,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
  cardTitle: {
    fontFamily: font.headerBold,
  },
  fab: {
    alignItems: "center",
    borderRadius: Radii.full,
    bottom: Sizes["3xl"],
    height: Sizes["12xl"],
    justifyContent: "center",
    position: "absolute",
    right: Sizes.xl,
    width: Sizes["12xl"],
  },
  hero: {
    minHeight: Sizes["20xl"],
  },
  heroAmount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["3xl"],
    lineHeight: LineHeights["4xl"],
  },
  heroContent: {
    gap: Spacing.lg,
    zIndex: 1,
  },
  heroDivider: {
    backgroundColor: "rgba(255,255,255,0.24)",
    height: Sizes.hairline,
  },
  heroFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  heroFooterMetric: {
    alignItems: "flex-end",
  },
  heroOrb: {
    backgroundColor: "rgba(255,255,255,0.09)",
    borderRadius: Radii.full,
    height: Sizes["18xl"],
    position: "absolute",
    right: -Sizes["5xl"],
    top: -Sizes["4xl"],
    width: Sizes["18xl"],
  },
  heroSecondaryAmount: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.xl,
  },
  legendCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: Sizes.none,
  },
  legendColumn: {
    flex: 1,
  },
  legendColumnLeft: {
    paddingRight: Spacing.sm,
  },
  legendColumnRight: {
    paddingLeft: Spacing.sm,
  },
  legendDot: {
    borderRadius: Radii.full,
    height: Sizes.md,
    marginTop: Sizes.xs,
    width: Sizes.md,
  },
  legendGrid: {
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  legendLabel: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  legendSeparator: {
    height: Spacing.md,
  },
  legendValue: {
    fontFamily: font.headerSemiBold,
  },
  listSeparator: {
    height: Spacing.md,
  },
  monthPill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  periodPill: {
    borderRadius: Radii.full,
    minHeight: Sizes["5xl"],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  periodPillText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.md,
  },
  periodSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.1,
    lineHeight: LineHeights.xs,
  },
  overlineSmall: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.1,
    lineHeight: LineHeights.xs,
  },
  transactionList: {
    gap: Spacing.md,
  },
  transactionsCard: {
    gap: Spacing.lg,
    borderWidth: Sizes.xxs - 1,
    borderColor: "rgba(0,0,0,0.07)",
  },
  transactionsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

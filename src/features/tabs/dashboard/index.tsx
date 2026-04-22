import { Feather } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

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

export default function DashboardScreen() {
  const theme = useAppTheme();
  const { snapshot } = useFinance();

  const monthTotals = snapshot?.currentMonthTotals;
  const spendable = Math.max(monthTotals?.netMinor ?? 0, 0);
  const spent = monthTotals?.expenseMinor ?? 0;
  const budgetProgress =
    monthTotals && monthTotals.incomeMinor > 0
      ? Math.min((spent / monthTotals.incomeMinor) * 100, 100)
      : 0;

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
                SAFE TO SPEND TODAY
              </AppText>
              <AppText
                color="onPrimary"
                style={styles.heroAmount}
                variant="displayLg"
              >
                {formatMoney(spendable, "KES")}
              </AppText>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroFooter}>
              <View>
                <AppText
                  color="onPrimary"
                  style={styles.overlineSmall}
                  variant="labelMd"
                >
                  REMAINING THIS MONTH
                </AppText>
                <AppText color="onPrimary" style={styles.heroSecondaryAmount} variant="titleMd">
                  {formatMoney(spendable, "KES")}
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
          <SurfaceCard elevated style={styles.transactionsCard}>
            <View style={styles.transactionsHeader}>
              <AppText
                style={{ fontFamily: font.headerBold }}
                variant="titleMd"
              >
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
                  ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
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
              <AppText
                style={{ fontFamily: font.headerBold }}
                variant="titleMd"
              >
                Spending Breakdown
              </AppText>
              <View
                style={[
                  styles.monthPill,
                  { backgroundColor: `${theme.colors.primary}1A` },
                ]}
              >
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
                    ItemSeparatorComponent={() => <View style={styles.legendSeparator} />}
                    keyExtractor={(item) => item.label}
                    numColumns={2}
                    renderItem={({ item, index }) => (
                      <View
                        style={[
                          styles.legendColumn,
                          index % 2 === 0 ? styles.legendColumnLeft : styles.legendColumnRight,
                        ]}
                      >
                        <View style={styles.legendItem}>
                          <View
                            style={[
                              styles.legendDot,
                              { backgroundColor: item.color },
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
                    Expense categories will appear after local transactions are stored.
                  </AppText>
                )}
              </View>
            </View>
          </SurfaceCard>
        </View>
      </ScrollView>
      <AppPressable
        onPress={() => router.push("/transactions/new")}
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      >
        <Feather color={theme.colors.onPrimary} name="plus" size={28} />
      </AppPressable>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  bentoGrid: {
    gap: Spacing.lg,
  },
  breakdownCard: {
    gap: Sizes["2xl"] + Sizes.xxs,
    padding: Spacing.xl,
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
  },
  transactionsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

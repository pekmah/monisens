import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

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
  InsightCard,
  SpendingDonutChart,
  TransactionRow,
} from "@/features/tabs/dashboard/components";
import { useAppTheme } from "@/hooks/use-app-theme";

const breakdown = [
  {
    amount: 8400,
    color: "#ff9800",
    label: "Food & Dining",
    value: "KES 8,400",
  },
  { amount: 3600, color: "#005db7", label: "Transport", value: "KES 3,600" },
  { amount: 12000, color: "#7a2faa", label: "Utilities", value: "KES 12,000" },
  { amount: 21000, color: "#0d631b", label: "Savings", value: "KES 21,000" },
];

const recentTransactions = [
  {
    accent: "#fb923c",
    amount: "- KES 4,200",
    bg: "#ffedd5",
    icon: "shopping-cart" as const,
    meta: "Today, 2:45 PM",
    title: "Naivas Supermarket",
  },
  {
    accent: "#60a5fa",
    amount: "- KES 1,500",
    bg: "#dbeafe",
    icon: "credit-card" as const,
    meta: "Yesterday, 6:12 PM",
    title: "M-Pesa Transfer",
  },
  {
    accent: "#4ade80",
    amount: "+ KES 145,000",
    bg: "#dcfce7",
    icon: "briefcase" as const,
    meta: "Oct 28, 9:00 AM",
    title: "Salary Deposit",
  },
  {
    accent: "#c084fc",
    amount: "- KES 2,000",
    bg: "#f3e8ff",
    icon: "zap" as const,
    meta: "Oct 27, 4:20 PM",
    title: "KPLC Tokens",
  },
  {
    accent: "#fb923c",
    amount: "- KES 1,150",
    bg: "#f5f5f4",
    icon: "coffee" as const,
    meta: "Oct 26, 1:15 PM",
    title: "Java House CBD",
  },
];

export default function DashboardScreen() {
  const theme = useAppTheme();

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
                KES 2,500
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
                <AppText color="onPrimary" variant="titleMd">
                  KES 45,000
                </AppText>
              </View>
              <View style={styles.availablePill}>
                <AppText color="onPrimary" variant="labelMd">
                  82% Available
                </AppText>
              </View>
            </View>
            <ProgressBar
              color={theme.colors.onPrimaryContainer}
              progress={82}
            />
          </View>
          <View style={styles.heroOrb} />
        </SurfaceCard>

        <View style={styles.bentoGrid}>
          <SurfaceCard style={styles.quickInsights} tone="low">
            <View style={styles.sectionHeader}>
              <Feather
                color={theme.colors.tertiary}
                name="bar-chart-2"
                size={20}
              />
              <AppText
                style={{ fontFamily: font.headerBold }}
                variant="titleMd"
              >
                Quick Insights
              </AppText>
            </View>
            <InsightCard accent={theme.colors.error}>
              You spent <AppText variant="labelMd">25% more</AppText> this week
              compared to your average.
            </InsightCard>
            <InsightCard accent={theme.colors.tertiary}>
              <AppText variant="labelMd">Food</AppText> is your highest expense
              category today.
            </InsightCard>
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
              <SpendingDonutChart data={breakdown} totalLabel="KES 45k" />
              <View style={styles.legendGrid}>
                {breakdown.map((item) => (
                  <View key={item.label} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <View>
                      <AppText color="mutedText" variant="labelMd">
                        {item.label}
                      </AppText>
                      <AppText variant="labelMd">{item.value}</AppText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </SurfaceCard>
        </View>

        <SurfaceCard elevated style={styles.transactionsCard}>
          <View style={styles.transactionsHeader}>
            <AppText style={{ fontFamily: font.headerBold }} variant="titleMd">
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
            {recentTransactions.map((transaction) => (
              <TransactionRow key={transaction.title} {...transaction} />
            ))}
          </View>
        </SurfaceCard>
      </ScrollView>
      <AppPressable
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
      >
        <Feather color={theme.colors.onPrimary} name="plus" size={28} />
      </AppPressable>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  availablePill: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Sizes.xs + Sizes.xxs,
  },
  bentoGrid: {
    gap: Spacing.lg,
  },
  breakdownCard: {
    gap: Sizes["2xl"] + Sizes.xxs,
    padding: Spacing.xl,
  },
  breakdownContent: {
    alignItems: "center",
    gap: Spacing.xl,
  },
  breakdownHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  content: {
    gap: Spacing.xl,
    paddingBottom: Sizes["14xl"] + Sizes["9xl"],
  },
  fab: {
    alignItems: "center",
    borderRadius: Radii.full,
    bottom: Sizes["14xl"],
    elevation: 12,
    height: Sizes["11xl"],
    justifyContent: "center",
    position: "absolute",
    right: Spacing.xl,
    shadowColor: "#0d631b",
    shadowOffset: { width: Sizes.none, height: Sizes.sm + Sizes.xxs },
    shadowOpacity: 0.28,
    shadowRadius: Sizes["2xl"] + Sizes.xxs,
    width: Sizes["11xl"],
  },
  hero: {
    borderRadius: Radii["2xl"],
    overflow: "hidden",
    padding: Spacing["2xl"],
  },
  heroAmount: {
    fontSize: FontSizes["4xl"] - 2,
    lineHeight: LineHeights["5xl"],
    // letter spacing:+2
    letterSpacing: 1,
  },
  heroContent: {
    gap: Sizes["2xl"] + Sizes.xxs,
    zIndex: 1,
  },
  heroDivider: {
    backgroundColor: "rgba(255,255,255,0.14)",
    height: StyleSheet.hairlineWidth,
  },
  heroFooter: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroOrb: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: Sizes["14xl"],
    height: Sizes["19xl"],
    position: "absolute",
    right: -(Sizes["13xl"] - Sizes.xs),
    top: -(Sizes["13xl"] - Sizes.sm),
    width: Sizes["19xl"],
  },
  legendDot: {
    borderRadius: Sizes.sm - Sizes.xxs,
    height: Sizes.md,
    width: Sizes.md,
  },
  legendGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.lg,
  },
  legendItem: {
    alignItems: "center",
    flexBasis: "45%",
    flexDirection: "row",
    gap: Spacing.md,
  },
  monthPill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Sizes.xs + Sizes.xxs,
  },
  overline: {
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    opacity: 0.82,
  },
  overlineSmall: {
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    opacity: 0.72,
  },
  quickInsights: {
    gap: Spacing.lg,
    padding: Spacing.xl,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  transactionList: {
    gap: Sizes.xxs,
  },
  transactionsCard: {
    borderRadius: Radii["2xl"],
    padding: Spacing.xl,
  },
  transactionsHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
});

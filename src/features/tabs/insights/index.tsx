import { ScrollView, StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  CategoryAllocationCard,
  SpendingAlertCard,
  SubscriptionsCard,
  TrajectoryCard,
} from "@/features/tabs/insights/components";
import { formatMoney } from "@/lib/finance";

const allocations = [
  { color: "#fb923c", label: "Food & Drink", value: 42 },
  { color: "#3b82f6", label: "Transport", value: 28 },
  { color: "#a855f7", label: "Entertainment", value: 15 },
  { color: "#22c55e", label: "Utilities", value: 15 },
];

const subscriptions = [
  {
    accent: "#e11d48",
    amount: formatMoney(120000, "KES"),
    meta: "Due in 3 days",
    title: "Netflix Premium",
  },
  {
    accent: "#16a34a",
    amount: formatMoney(95000, "KES"),
    meta: "Due in 12 days",
    title: "Spotify Family",
  },
  {
    accent: "#2563eb",
    amount: formatMoney(40000, "KES"),
    meta: "Due in 15 days",
    title: "Google One 2TB",
  },
];

export default function InsightsScreen() {
  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AppText color="primary" style={styles.overline} variant="labelMd">
            PORTFOLIO INSIGHTS
          </AppText>
          <AppText style={styles.title} variant="displayLg">
            Financial Trajectory
          </AppText>
        </View>
        <TrajectoryCard />
        <View style={styles.insightGrid}>
          <SpendingAlertCard />
          <CategoryAllocationCard allocations={allocations} />
        </View>
        <SubscriptionsCard subscriptions={subscriptions} />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.xl,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
  hero: {
    gap: Sizes.xs,
    paddingTop: Spacing.sm,
  },
  insightGrid: {
    gap: Spacing.lg,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  title: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["3xl"],
    lineHeight: LineHeights["4xl"],
  },
});

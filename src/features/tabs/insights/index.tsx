import { router } from "expo-router";
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
import { type InsightSubscriptionRecord, useFinance } from "@/lib/finance";

export default function InsightsScreen() {
  const { snapshot } = useFinance();

  function handleSetUpBill(subscription: InsightSubscriptionRecord) {
    const params = new URLSearchParams({
      amount: String(subscription.amountMinor / 100),
      merchant: subscription.title,
    });

    if (subscription.categoryId) {
      params.set("categoryId", subscription.categoryId);
    }

    router.push(`/bills/new?${params.toString()}` as never);
  }

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

        <TrajectoryCard trajectory={snapshot?.trajectory ?? null} />

        <View style={styles.insightGrid}>
          <SpendingAlertCard spendingAlert={snapshot?.spendingAlert ?? null} />
          <CategoryAllocationCard allocations={snapshot?.insightAllocations ?? []} />
        </View>

        <SubscriptionsCard
          onSetUpBill={handleSetUpBill}
          subscriptions={snapshot?.insightSubscriptions ?? []}
        />
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

import { ScrollView, StyleSheet } from "react-native";

import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  CategoryAllocationCard,
  SpendingAlertCard,
  SubscriptionsCard,
  TrajectoryCard,
} from "@/features/tabs/insights/components";

const allocations = [
  { label: "Food & Drink", value: 42 },
  { label: "Transport", value: 28 },
  { label: "Entertainment", value: 15 },
  { label: "Utilities", value: 15 },
];

const subscriptions = [
  { amount: "KES 1,200", icon: "film" as const, meta: "Due in 3 days", title: "Netflix Premium" },
  { amount: "KES 950", icon: "music" as const, meta: "Due in 12 days", title: "Spotify Family" },
  { amount: "KES 400", icon: "hard-drive" as const, meta: "Due in 15 days", title: "Google One 2TB" },
];

export default function InsightsScreen() {
  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TrajectoryCard />
        <SpendingAlertCard />
        <CategoryAllocationCard allocations={allocations} />
        <SubscriptionsCard subscriptions={subscriptions} />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
});

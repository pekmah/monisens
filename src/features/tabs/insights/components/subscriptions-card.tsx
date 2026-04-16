import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/base";
import { AppText } from "@/components/base/app-text";
import { Spacing } from "@/constants/theme";
import { RowItem, SurfaceCard } from "@/features/tabs/_components";

type RowItemProps = Parameters<typeof RowItem>[0];

export type Subscription = Pick<RowItemProps, "amount" | "icon" | "meta" | "title">;

export type SubscriptionsCardProps = {
  subscriptions: Subscription[];
};

export function SubscriptionsCard({ subscriptions }: SubscriptionsCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <AppText variant="titleMd">Subscriptions</AppText>
        <AppButton title="Manage All" variant="ghost" />
      </View>
      {subscriptions.map((subscription) => (
        <RowItem
          amount={subscription.amount}
          icon={subscription.icon}
          key={subscription.title}
          meta={subscription.meta}
          title={subscription.title}
        />
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

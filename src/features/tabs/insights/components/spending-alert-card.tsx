import { StyleSheet } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";

export function SpendingAlertCard() {
  return (
    <SurfaceCard style={styles.card} tone="low">
      <AppText color="tertiary" variant="labelMd">
        SPENDING ALERT
      </AppText>
      <AppText variant="titleMd">You overspent on transport by KES 2,000</AppText>
      <AppText color="mutedText" variant="bodyMd">
        Commute costs are 15% higher than your set budget this month.
      </AppText>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Sizes.sm - Sizes.xxs,
  },
});

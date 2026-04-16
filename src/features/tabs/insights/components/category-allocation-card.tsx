import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export type Allocation = {
  label: string;
  value: number;
};

export type CategoryAllocationCardProps = {
  allocations: Allocation[];
};

export function CategoryAllocationCard({
  allocations,
}: CategoryAllocationCardProps) {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <AppText variant="titleMd">Category Allocation</AppText>
        <AppText color="mutedText" variant="labelMd">
          DAILY BURN KES 1,500
        </AppText>
      </View>
      {allocations.map((item) => (
        <View key={item.label} style={styles.allocation}>
          <View style={styles.allocationHeader}>
            <AppText variant="bodyMd">{item.label}</AppText>
            <AppText variant="labelMd">{item.value}%</AppText>
          </View>
          <ProgressBar
            color={
              item.label === "Food & Drink"
                ? theme.colors.primary
                : theme.colors.secondary
            }
            progress={item.value}
          />
        </View>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  allocation: {
    gap: Spacing.sm,
  },
  allocationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    gap: Spacing.lg,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";

export type Allocation = {
  color: string;
  label: string;
  value: number;
};

export type CategoryAllocationCardProps = {
  allocations: Allocation[];
};

export function CategoryAllocationCard({
  allocations,
}: CategoryAllocationCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <AppText style={styles.title} variant="titleMd">
        Category Allocation
      </AppText>
      {allocations.map((item) => (
        <View key={item.label} style={styles.allocation}>
          <View style={styles.allocationHeader}>
            <View style={styles.labelRow}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <AppText style={styles.label} variant="bodyMd">
                {item.label}
              </AppText>
            </View>
            <AppText style={styles.value} variant="labelMd">
              {item.value}%
            </AppText>
          </View>
          <ProgressBar color={item.color} progress={item.value} />
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    gap: Spacing.xl,
    padding: Sizes["3xl"],
  },
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  label: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  labelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
  },
  value: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
});

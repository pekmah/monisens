import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppFlashList } from "@/components/base";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import type { InsightAllocationRecord } from "@/lib/finance";

export type CategoryAllocationCardProps = {
  allocations: InsightAllocationRecord[];
};

export function CategoryAllocationCard({
  allocations,
}: CategoryAllocationCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      <AppText style={styles.title} variant="titleMd">
        Category Allocation
      </AppText>
      {allocations.length ? (
        <AppFlashList
          data={allocations}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(item) => item.label}
          renderItem={({ item }) => (
            <View style={styles.allocation}>
              <View style={styles.allocationHeader}>
                <View style={styles.labelRow}>
                  <View style={[styles.dot, getDotThemeStyle(item.color)]} />
                  <AppText style={styles.label} variant="bodyMd">
                    {item.label}
                  </AppText>
                </View>
                <View style={styles.valueGroup}>
                  <AppText style={styles.value} variant="labelMd">
                    {item.percentage}%
                  </AppText>
                  <AppText color="mutedText" style={styles.amount} variant="bodyMd">
                    {item.amountLabel}
                  </AppText>
                </View>
              </View>
              <ProgressBar color={item.color} progress={item.percentage} />
            </View>
          )}
        />
      ) : (
        <AppText color="mutedText" variant="bodyMd">
          Category allocation will appear once you have expense activity for this month.
        </AppText>
      )}
    </SurfaceCard>
  );
}

function getDotThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
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
  amount: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
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
  separator: {
    height: Spacing.xl,
  },
  title: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
  },
  value: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  valueGroup: {
    alignItems: "flex-end",
    gap: Sizes.xxs,
  },
});

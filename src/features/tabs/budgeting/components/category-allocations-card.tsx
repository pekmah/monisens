import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/base";
import { AppText } from "@/components/base/app-text";
import { Sizes } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export type BudgetCategory = {
  label: string;
  meta: string;
  spent: string;
  status: string;
  value: number;
};

export type CategoryAllocationsCardProps = {
  categories: BudgetCategory[];
};

export function CategoryAllocationsCard({
  categories,
}: CategoryAllocationsCardProps) {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <AppText variant="titleMd">Category Allocations</AppText>
        <AppButton title="Add" variant="ghost" />
      </View>
      {categories.map((category) => (
        <View key={category.label} style={styles.category}>
          <View style={styles.categoryHeader}>
            <View>
              <AppText variant="titleMd">{category.label}</AppText>
              <AppText color="mutedText" variant="bodyMd">
                {category.meta}
              </AppText>
            </View>
            <AppText variant="labelMd">{category.value}%</AppText>
          </View>
          <ProgressBar
            color={
              category.value > 90 ? theme.colors.tertiary : theme.colors.primary
            }
            progress={category.value}
          />
          <View style={styles.categoryFooter}>
            <AppText color="mutedText" variant="bodyMd">
              {category.spent}
            </AppText>
            <AppText color="primary" variant="labelMd">
              {category.status}
            </AppText>
          </View>
        </View>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Sizes["2xl"],
  },
  category: {
    gap: Sizes.sm + Sizes.xxs,
  },
  categoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

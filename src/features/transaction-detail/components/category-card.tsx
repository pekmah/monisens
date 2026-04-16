import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/base";
import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

const categories = ["Food & Drinks", "Shopping", "Transport", "Utilities"];

export function CategoryCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <AppText variant="titleMd">Category</AppText>
        <AppButton title="Edit" variant="ghost" />
      </View>
      <View style={styles.grid}>
        {categories.map((category, index) => (
          <View
            key={category}
            style={[
              styles.pill,
              {
                backgroundColor:
                  index === 0
                    ? theme.colors.primary
                    : theme.colors.surfaceContainerHigh,
                borderRadius: theme.radii.sm,
              },
            ]}
          >
            <AppText color={index === 0 ? "onPrimary" : "text"} variant="labelMd">
              {category}
            </AppText>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Sizes.md + Sizes.xxs,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Sizes.sm + Sizes.xs / 4,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

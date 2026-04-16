import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

const categories = [
  { color: "#fb923c", label: "Food & Drinks" },
  { color: "#005db7", label: "Transport" },
  { color: "#7a2faa", label: "Client Meetings" },
  { color: "#0d631b", label: "Utilities" },
];

export function CategoryCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <View>
          <AppText style={styles.title} variant="titleMd">
            Category
          </AppText>
          <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
            Update the label used in reports.
          </AppText>
        </View>
        <AppPressable style={styles.editButton}>
          <AppText color="primary" style={styles.editText} variant="labelMd">
            Edit
          </AppText>
        </AppPressable>
      </View>
      <View style={styles.grid}>
        {categories.map((category, index) => (
          <View
            key={category.label}
            style={[
              styles.pill,
              {
                backgroundColor:
                  index === 0
                    ? `${category.color}22`
                    : theme.colors.surfaceContainerLow,
                borderColor:
                  index === 0 ? category.color : theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: category.color }]} />
            <AppText
              style={[
                styles.pillText,
                { color: index === 0 ? category.color : theme.colors.text },
              ]}
              variant="labelMd"
            >
              {category.label}
            </AppText>
          </View>
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  editButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  pill: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Sizes.sm + Sizes.xs / 4,
  },
  pillText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
});

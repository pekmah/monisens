import { StyleSheet, View } from "react-native";

import { AppPressable, AppText, CategorySelectField } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { CategoryRecord } from "@/lib/finance";

export function CategoryCard({
  activeCategoryId,
  categories,
  editing,
  onEditToggle,
  onSelectCategory,
}: {
  activeCategoryId: string | null;
  categories: CategoryRecord[];
  editing: boolean;
  onEditToggle: () => void;
  onSelectCategory: (categoryId: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <View>
          <AppText style={styles.title} variant="titleMd">
            Category
          </AppText>
          <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
            {editing
              ? "Tap a category to update this transaction, then allocate it to a bill if needed."
              : "Current category for this transaction."}
          </AppText>
        </View>
        <AppPressable onPress={onEditToggle} style={styles.editButton}>
          <AppText color="primary" style={styles.editText} variant="labelMd">
            {editing ? "Done" : "Edit"}
          </AppText>
        </AppPressable>
      </View>
      {categories.length ? (
        editing ? (
          <CategorySelectField
            onSelect={(value) => onSelectCategory(value)}
            selectedValue={activeCategoryId}
            title="Update category"
          />
        ) : (
          <View
            style={[
              styles.currentValue,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    categories.find((category) => category.id === activeCategoryId)?.color
                    ?? theme.colors.outlineVariant,
                },
              ]}
            />
            <AppText style={styles.currentValueText} variant="bodyMd">
              {categories.find((category) => category.id === activeCategoryId)?.label ?? "No category selected"}
            </AppText>
          </View>
        )
      ) : (
        <AppText color="mutedText" variant="bodyMd">
          No categories are stored in the database yet.
        </AppText>
      )}
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
  currentValue: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.sm,
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  currentValueText: {
    fontFamily: font.medium,
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

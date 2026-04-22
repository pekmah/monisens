import { StyleSheet, View } from "react-native";

import { AppFlashList, AppPressable, AppText } from "@/components/base";
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
              ? "Tap a category to update this transaction."
              : "Current category for this transaction."}
          </AppText>
        </View>
        <AppPressable onPress={onEditToggle} style={styles.editButton}>
          <AppText color="primary" style={styles.editText} variant="labelMd">
            {editing ? "Done" : "Edit"}
          </AppText>
        </AppPressable>
      </View>
      <AppFlashList
        data={categories}
        horizontal
        keyExtractor={(category) => category.id}
        renderItem={({ item: category }) => {
          const isActive = category.id === activeCategoryId;

          return (
            <AppPressable
              disabled={!editing}
              onPress={() => onSelectCategory(category.id)}
              style={[
                styles.pill,
                {
                  backgroundColor: isActive
                    ? `${category.color}22`
                    : theme.colors.surfaceContainerLow,
                  borderColor: isActive ? category.color : theme.colors.outlineVariant,
                  opacity: !editing && !isActive ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: category.color }]} />
              <AppText
                style={[
                  styles.pillText,
                  { color: isActive ? category.color : theme.colors.text },
                ]}
                variant="labelMd"
              >
                {category.label}
              </AppText>
            </AppPressable>
          );
        }}
        ListEmptyComponent={
          <AppText color="mutedText" variant="bodyMd">
            No categories are stored in the database yet.
          </AppText>
        }
        scrollEnabled
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.pillSeparator} />}
      />
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
  pill: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Sizes.sm + Sizes.xs / 4,
  },
  pillSeparator: {
    width: Spacing.sm,
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

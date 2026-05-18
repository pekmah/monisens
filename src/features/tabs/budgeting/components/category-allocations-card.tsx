import { StyleSheet, View, type TextStyle, type ViewStyle } from "react-native";

import { AppFlashList, AppPressable, AppText } from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { ProgressBar } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { BudgetAllocationRecord } from "@/lib/finance";

export type CategoryAllocationsCardProps = {
  categories: BudgetAllocationRecord[];
  onAddBudget: () => void;
};

export function CategoryAllocationsCard({
  categories,
  onAddBudget,
}: CategoryAllocationsCardProps) {
  const theme = useAppTheme();
  const monthPillThemeStyle = getMonthPillThemeStyle(theme);
  const addCategoryButtonThemeStyle = getAddCategoryButtonThemeStyle(theme);
  const addCategoryIconThemeStyle = getAddCategoryIconThemeStyle(theme);
  const categoryThemeStyle = getCategoryThemeStyle(theme);

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <AppText variant="headlineSm">Budget envelopes</AppText>
          <AppText color="mutedText" variant="bodyMd">
            Each category keeps its own local limit, remaining balance, and risk.
          </AppText>
        </View>
        <View style={[styles.monthPill, monthPillThemeStyle]}>
          <AppText color="onPrimaryFixed" style={styles.monthText} variant="labelMd">
            Live
          </AppText>
        </View>
      </View>

      <AppPressable
        onPress={onAddBudget}
        style={[styles.addCategoryButton, addCategoryButtonThemeStyle]}
      >
        <View style={[styles.addCategoryIcon, addCategoryIconThemeStyle]}>
          <AppText
            color="onPrimaryFixed"
            style={styles.addCategoryIconText}
            variant="labelMd"
          >
            +
          </AppText>
        </View>
        <View style={styles.addCategoryCopy}>
          <AppText style={styles.addCategoryTitle} variant="labelMd">
            Add local budget
          </AppText>
          <AppText color="mutedText" style={styles.addCategoryMeta} variant="bodyMd">
            Create a budget envelope for one of your categories.
          </AppText>
        </View>
        <AppText color="primary" style={styles.addCategoryAction} variant="labelMd">
          Add
        </AppText>
      </AppPressable>

      <AppFlashList
        data={categories}
        keyExtractor={(category) => category.id}
        renderItem={({ item: category }) => {
          const categoryStatusColor =
            category.value > 90 ? theme.colors.error : category.accent;
          const accentBarThemeStyle = getBackgroundThemeStyle(category.accent);
          const percentBadgeThemeStyle =
            getPercentBadgeThemeStyle(categoryStatusColor);
          const percentTextThemeStyle =
            getPercentTextThemeStyle(categoryStatusColor);
          const statusDotThemeStyle =
            getBackgroundThemeStyle(categoryStatusColor);

          return (
            <View style={[styles.category, categoryThemeStyle]}>
              <View style={[styles.accentBar, accentBarThemeStyle]} />
              <View style={styles.categoryTop}>
                <View style={styles.categoryCopy}>
                  <AppText
                    numberOfLines={1}
                    style={styles.categoryTitle}
                    variant="titleMd"
                  >
                    {category.label}
                  </AppText>
                  <AppText color="mutedText" style={styles.meta} variant="bodyMd">
                    {category.meta}
                  </AppText>
                </View>
                <View style={[styles.percentBadge, percentBadgeThemeStyle]}>
                  <AppText
                    style={[styles.percentText, percentTextThemeStyle]}
                    variant="labelMd"
                  >
                    {category.value}%
                  </AppText>
                </View>
              </View>

              <ProgressBar
                color={category.value > 90 ? theme.colors.error : category.accent}
                progress={category.value}
              />

              <View style={styles.categoryFooter}>
                <View style={styles.amountGroup}>
                  <AppText
                    color="mutedText"
                    style={styles.amountLabel}
                    variant="bodyMd"
                  >
                    Used
                  </AppText>
                  <AppText style={styles.amountValue} variant="labelMd">
                    {category.spent}
                  </AppText>
                </View>
                <View style={styles.amountGroup}>
                  <AppText
                    color="mutedText"
                    style={styles.amountLabel}
                    variant="bodyMd"
                  >
                    Budget
                  </AppText>
                  <AppText style={styles.amountValue} variant="labelMd">
                    {category.budget}
                  </AppText>
                </View>
                <View style={[styles.amountGroup, styles.remainingGroup]}>
                  <AppText
                    color="mutedText"
                    style={styles.amountLabel}
                    variant="bodyMd"
                  >
                    Left
                  </AppText>
                  <AppText
                    color={category.value > 90 ? "error" : "primary"}
                    style={styles.amountValue}
                    variant="labelMd"
                  >
                    {category.remaining}
                  </AppText>
                </View>
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, statusDotThemeStyle]} />
                <AppText
                  color="mutedText"
                  style={styles.statusText}
                  variant="bodyMd"
                >
                  {category.status}
                </AppText>
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
      />
    </View>
  );
}

function getMonthPillThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primaryFixed,
  };
}

function getAddCategoryButtonThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.outlineVariant,
  };
}

function getAddCategoryIconThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primaryFixed,
  };
}

function getCategoryThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
  };
}

function getBackgroundThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
}

function getPercentBadgeThemeStyle(borderColor: string): ViewStyle {
  return {
    borderColor,
  };
}

function getPercentTextThemeStyle(color: string): TextStyle {
  return {
    color,
  };
}

const styles = StyleSheet.create({
  addCategoryAction: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  addCategoryButton: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderStyle: "dashed",
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  addCategoryCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  addCategoryIcon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["7xl"],
    justifyContent: "center",
    width: Sizes["7xl"],
  },
  addCategoryIconText: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["2xl"],
    lineHeight: LineHeights["3xl"],
  },
  addCategoryMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  addCategoryTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  accentBar: {
    borderRadius: Radii.full,
    bottom: Spacing.lg,
    left: 0,
    position: "absolute",
    top: Spacing.lg,
    width: Sizes.xs,
  },
  amountGroup: {
    flex: 1,
    gap: Sizes.xxs,
  },
  amountLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  amountValue: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  category: {
    borderRadius: Radii.lg,
    gap: Spacing.md,
    overflow: "hidden",
    padding: Spacing.lg,
    paddingLeft: Spacing.xl,
  },
  categoryCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  categoryFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  categorySeparator: {
    height: Spacing.md,
  },
  categoryTitle: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.xl,
  },
  categoryTop: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  meta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  monthPill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  monthText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  percentBadge: {
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  percentText: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  remainingGroup: {
    alignItems: "flex-end",
  },
  section: {
    gap: Spacing.xl,
  },
  statusDot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  statusRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  titleCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
});

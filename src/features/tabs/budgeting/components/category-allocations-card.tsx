import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export type BudgetCategory = {
  accent: string;
  budget: string;
  label: string;
  meta: string;
  remaining: string;
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
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <AppText variant="headlineSm">Budget envelopes</AppText>
          <AppText color="mutedText" variant="bodyMd">
            Each category keeps its own limit, remaining balance, and risk.
          </AppText>
        </View>
        <View
          style={[
            styles.monthPill,
            { backgroundColor: theme.colors.primaryFixed },
          ]}
        >
          <AppText color="onPrimaryFixed" style={styles.monthText} variant="labelMd">
            Apr
          </AppText>
        </View>
      </View>

      <AppPressable
        style={[
          styles.addCategoryButton,
          {
            backgroundColor: theme.colors.surfaceContainerLowest,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View
          style={[
            styles.addCategoryIcon,
            { backgroundColor: theme.colors.primaryFixed },
          ]}
        >
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
            Add new category
          </AppText>
          <AppText color="mutedText" style={styles.addCategoryMeta} variant="bodyMd">
            Create another envelope for planned spending.
          </AppText>
        </View>
        <AppText color="primary" style={styles.addCategoryAction} variant="labelMd">
          Add
        </AppText>
      </AppPressable>

      <View style={styles.categories}>
        {categories.map((category) => (
          <View
            key={category.label}
            style={[
              styles.category,
              { backgroundColor: theme.colors.surfaceContainerLow },
            ]}
          >
            <View
              style={[
                styles.accentBar,
                { backgroundColor: category.accent },
              ]}
            />
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
              <View
                style={[
                  styles.percentBadge,
                  {
                    borderColor:
                      category.value > 90 ? theme.colors.error : category.accent,
                  },
                ]}
              >
                <AppText
                  style={[
                    styles.percentText,
                    {
                      color:
                        category.value > 90 ? theme.colors.error : category.accent,
                    },
                  ]}
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
                <AppText color="mutedText" style={styles.amountLabel} variant="bodyMd">
                  Used
                </AppText>
                <AppText style={styles.amountValue} variant="labelMd">
                  {category.spent}
                </AppText>
              </View>
              <View style={styles.amountGroup}>
                <AppText color="mutedText" style={styles.amountLabel} variant="bodyMd">
                  Budget
                </AppText>
                <AppText style={styles.amountValue} variant="labelMd">
                  {category.budget}
                </AppText>
              </View>
              <View style={[styles.amountGroup, styles.remainingGroup]}>
                <AppText color="mutedText" style={styles.amountLabel} variant="bodyMd">
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
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      category.value > 90 ? theme.colors.error : category.accent,
                  },
                ]}
              />
              <AppText color="mutedText" style={styles.statusText} variant="bodyMd">
                {category.status}
              </AppText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
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
  categories: {
    gap: Spacing.md,
  },
  category: {
    borderRadius: Radii.lg,
    gap: Spacing.md,
    overflow: "hidden",
    padding: Spacing.lg,
    paddingLeft: Spacing.xl,
  },
  categoryFooter: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "space-between",
  },
  categoryCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
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
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  titleCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
});

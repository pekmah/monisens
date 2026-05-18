import { Feather } from "@expo/vector-icons";
import { BottomSheetFlashList } from "@gorhom/bottom-sheet";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCategoriesQuery } from "@/lib/finance/queries";
import type { CategoryRecord } from "@/lib/finance/types";

export type CategorySelectListProps = {
  closeLabel?: string;
  emptyText?: string;
  errorText?: string;
  estimatedItemSize?: number;
  getCategoryAccentColor?: (category: CategoryRecord) => string | undefined;
  getCategoryDescription?: (category: CategoryRecord) => string | undefined;
  getCategoryLabel?: (category: CategoryRecord) => string;
  getCategoryValue?: (category: CategoryRecord) => string;
  loadingText?: string;
  onClose: () => void;
  onSelect: (value: string, category: CategoryRecord) => void | Promise<void>;
  selectedValue: string | null;
};

export function CategorySelectList({
  closeLabel = "Close",
  emptyText = "No categories are stored in the database yet.",
  errorText = "Categories could not be loaded.",
  estimatedItemSize = 56,
  getCategoryAccentColor = (category) => category.color,
  getCategoryDescription,
  getCategoryLabel = (category) => category.label,
  getCategoryValue = (category) => category.id,
  loadingText = "Loading categories...",
  onClose,
  onSelect,
  selectedValue,
}: CategorySelectListProps) {
  const theme = useAppTheme();
  // The picker owns category loading so every category field has one source of
  // truth and callers only provide selection behavior.
  const categoriesQuery = useCategoriesQuery();
  const categories = categoriesQuery.data ?? [];

  if (categoriesQuery.isLoading) {
    // Loading is rendered inside the sheet body so the field can open even while
    // the category query is still resolving.
    return (
      <View style={styles.state}>
        <ActivityIndicator color={theme.colors.primary} size="small" />
        <AppText color="mutedText" variant="bodyMd">
          {loadingText}
        </AppText>
      </View>
    );
  }

  if (categoriesQuery.isError) {
    // A local retry keeps transient database/query failures recoverable without
    // dismissing the picker.
    return (
      <View style={styles.state}>
        <AppText color="error" variant="bodyMd">
          {errorText}
        </AppText>
        <AppButton
          onPress={() => void categoriesQuery.refetch()}
          title="Retry"
          variant="secondary"
        />
      </View>
    );
  }

  if (!categories.length) {
    // Empty categories are a valid app state, especially before the finance
    // store has been seeded or after local edits.
    return (
      <View style={styles.state}>
        <AppText color="mutedText" variant="bodyMd">
          {emptyText}
        </AppText>
        <AppButton onPress={onClose} title={closeLabel} variant="secondary" />
      </View>
    );
  }

  return (
    <BottomSheetFlashList
      contentContainerStyle={styles.listContent}
      data={categories}
      estimatedItemSize={estimatedItemSize}
      keyExtractor={(item) => getCategoryValue(item)}
      ListFooterComponent={
        <CategorySelectListFooter closeLabel={closeLabel} onClose={onClose} />
      }
      renderItem={({ item }) => {
        const value = getCategoryValue(item);
        const isSelected = value === selectedValue;
        const accentColor = getCategoryAccentColor(item);
        const description = getCategoryDescription?.(item);

        // Resolve category display props per row so callers can customize the
        // reusable picker without changing its list implementation.
        return (
          <AppPressable
            onPress={() => void onSelect(value, item)}
            style={[
              styles.optionRow,
              {
                backgroundColor: isSelected
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceContainerLow,
                borderColor: isSelected
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.optionCopy}>
              <View style={styles.optionLabelRow}>
                {accentColor ? (
                  <View style={[styles.dot, { backgroundColor: accentColor }]} />
                ) : null}
                <AppText style={styles.optionLabel} variant="bodyMd">
                  {getCategoryLabel(item)}
                </AppText>
              </View>
              {description ? (
                <AppText
                  color="mutedText"
                  style={styles.optionDescription}
                  variant="bodyMd"
                >
                  {description}
                </AppText>
              ) : null}
            </View>
            {isSelected ? (
              <Feather color={theme.colors.primary} name="check" size={18} />
            ) : null}
          </AppPressable>
        );
      }}
      ItemSeparatorComponent={CategorySelectListSeparator}
      showsVerticalScrollIndicator={false}
      style={styles.list}
    />
  );
}

function CategorySelectListFooter({
  closeLabel,
  onClose,
}: {
  closeLabel: string;
  onClose: () => void;
}) {
  // Keep the footer component stable for FlashList while still allowing custom labels.
  return (
    <View style={styles.footer}>
      <AppButton onPress={onClose} title={closeLabel} variant="secondary" />
    </View>
  );
}

function CategorySelectListSeparator() {
  // FlashList recycles rows, so stable separator dimensions prevent jumpy spacing.
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  footer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
    paddingTop: Sizes.xs,
  },
  optionCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  optionDescription: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  optionLabel: {
    fontFamily: font.medium,
  },
  optionLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  optionRow: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["10xl"],
    paddingHorizontal: Spacing.md + Spacing.xs,
    paddingVertical: Spacing.sm + Sizes.xs / 2,
  },
  separator: {
    height: Spacing.xs + Sizes.xs / 2,
  },
  state: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    justifyContent: "center",
    paddingBottom: Sizes["4xl"],
    paddingTop: Spacing.xl,
  },
});

export default CategorySelectList;

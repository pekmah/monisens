import { Feather } from "@expo/vector-icons";
import {
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type {
  AiClassificationStatus,
  CategoryRecord,
  SmsCandidateClassificationSource,
  SmsCandidateQuery,
  SmsCandidateSortKey,
  SmsSourceParserKey,
  TransactionDirection,
} from "@/lib/finance";

import type { ComponentProps, ReactNode } from "react";

type ReviewFilterChipProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

export type SmsReviewToolbarProps = {
  categories: CategoryRecord[];
  draftSearchText: string;
  onDraftSearchTextChange: (value: string) => void;
  onQueryChange: (query: SmsCandidateQuery) => void;
  query: SmsCandidateQuery;
  totalCount: number;
};

const sortOptions: { label: string; value: SmsCandidateSortKey }[] = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "High amount", value: "amount_high" },
  { label: "Low amount", value: "amount_low" },
  { label: "A-Z", value: "merchant_az" },
  { label: "Confidence", value: "confidence_high" },
];

const directionOptions: { label: string; value: TransactionDirection | null }[] =
  [
    { label: "All", value: null },
    { label: "Income", value: "income" },
    { label: "Expense", value: "expense" },
  ];

const aiStatusOptions: { label: string; value: AiClassificationStatus | null }[] =
  [
    { label: "All", value: null },
    { label: "Classified", value: "classified" },
    { label: "Queued", value: "queued" },
    { label: "Processing", value: "processing" },
    { label: "Failed", value: "failed" },
    { label: "Rule-based", value: "not_needed" },
  ];

const sourceOptions: {
  label: string;
  parserKey?: SmsSourceParserKey | null;
  classificationSource?: SmsCandidateClassificationSource | null;
}[] = [
  { label: "All", parserKey: null, classificationSource: null },
  { label: "M-PESA", parserKey: "mpesa" },
  { label: "Bank", parserKey: "bank-credit-debit" },
  { label: "Rules", classificationSource: "rule" },
  { label: "AI", classificationSource: "ai" },
  { label: "Memory", classificationSource: "merchant_memory" },
  { label: "User", classificationSource: "user" },
];

export function SmsReviewToolbar({
  categories,
  draftSearchText,
  onDraftSearchTextChange,
  onQueryChange,
  query,
  totalCount,
}: SmsReviewToolbarProps) {
  const theme = useAppTheme();
  const searchThemeStyle = getSearchThemeStyle(theme);
  const inputThemeStyle = getInputThemeStyle(theme);
  const hasFilters = Boolean(
    draftSearchText ||
      query.direction ||
      query.categoryId ||
      query.aiStatus ||
      query.classificationSource ||
      query.parserKey ||
      (query.sortKey && query.sortKey !== "newest"),
  );

  function updateQuery(nextQuery: Partial<SmsCandidateQuery>) {
    onQueryChange({
      ...query,
      ...nextQuery,
    });
  }

  function clearFilters() {
    onDraftSearchTextChange("");
    onQueryChange({ sortKey: "newest" });
  }

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
          <AppText color="primary" style={styles.overline} variant="labelMd">
            REVIEW QUEUE
          </AppText>
          <AppText style={styles.title} variant="titleMd">
            {totalCount} candidate{totalCount === 1 ? "" : "s"}
          </AppText>
        </View>
        {hasFilters ? (
          <AppPressable onPress={clearFilters} style={styles.clearButton}>
            <Feather color={theme.colors.primary} name="x" size={Sizes.lg} />
            <AppText color="primary" style={styles.clearText} variant="labelMd">
              Reset
            </AppText>
          </AppPressable>
        ) : null}
      </View>

      <View style={[styles.search, searchThemeStyle]}>
        <Feather color={theme.colors.outline} name="search" size={Sizes["2xl"]} />
        <TextInput
          onChangeText={onDraftSearchTextChange}
          placeholder="Search sender, name, amount, SMS"
          placeholderTextColor={theme.colors.outline}
          selectionColor={theme.colors.primary}
          style={[styles.input, inputThemeStyle]}
          value={draftSearchText}
        />
      </View>

      <ReviewFilterSection icon="sliders" label="Sort">
        {sortOptions.map((option) => (
          <ReviewFilterChip
            key={option.value}
            label={option.label}
            onPress={() => updateQuery({ sortKey: option.value })}
            selected={(query.sortKey ?? "newest") === option.value}
          />
        ))}
      </ReviewFilterSection>

      <ReviewFilterSection icon="filter" label="Direction">
        {directionOptions.map((option) => (
          <ReviewFilterChip
            key={option.value ?? "all"}
            label={option.label}
            onPress={() => updateQuery({ direction: option.value })}
            selected={(query.direction ?? null) === option.value}
          />
        ))}
      </ReviewFilterSection>

      <ReviewFilterSection icon="activity" label="AI status">
        {aiStatusOptions.map((option) => (
          <ReviewFilterChip
            key={option.value ?? "all"}
            label={option.label}
            onPress={() => updateQuery({ aiStatus: option.value })}
            selected={(query.aiStatus ?? null) === option.value}
          />
        ))}
      </ReviewFilterSection>

      <ReviewFilterSection icon="radio" label="Source">
        {sourceOptions.map((option) => (
          <ReviewFilterChip
            key={`${option.parserKey ?? ""}:${option.classificationSource ?? ""}:${option.label}`}
            label={option.label}
            onPress={() =>
              updateQuery({
                classificationSource: option.classificationSource ?? null,
                parserKey: option.parserKey ?? null,
              })
            }
            selected={
              (query.parserKey ?? null) === (option.parserKey ?? null) &&
              (query.classificationSource ?? null) ===
                (option.classificationSource ?? null)
            }
          />
        ))}
      </ReviewFilterSection>

      <ReviewFilterSection icon="tag" label="Category">
        <ReviewFilterChip
          label="All"
          onPress={() => updateQuery({ categoryId: null })}
          selected={!query.categoryId}
        />
        {categories.map((category) => (
          <ReviewFilterChip
            key={category.id}
            label={category.label}
            onPress={() => updateQuery({ categoryId: category.id })}
            selected={query.categoryId === category.id}
          />
        ))}
      </ReviewFilterSection>
    </View>
  );
}

function ReviewFilterSection({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.filterSection}>
      <View style={styles.filterLabelRow}>
        <Feather color={theme.colors.outline} name={icon} size={Sizes.md} />
        <AppText color="mutedText" style={styles.filterLabel} variant="labelMd">
          {label}
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={styles.chipRow}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function ReviewFilterChip({
  label,
  onPress,
  selected,
}: ReviewFilterChipProps) {
  const theme = useAppTheme();
  const chipThemeStyle = getChipThemeStyle(theme, selected);

  return (
    <AppPressable onPress={onPress} style={[styles.chip, chipThemeStyle]}>
      <AppText
        color={selected ? "primary" : "mutedText"}
        style={styles.chipText}
        variant="labelMd"
      >
        {label}
      </AppText>
    </AppPressable>
  );
}

function getSearchThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
  };
}

function getInputThemeStyle(theme: AppTheme): TextStyle {
  return {
    color: theme.colors.text,
    fontFamily: font.regular,
  };
}

function getChipThemeStyle(theme: AppTheme, selected: boolean): ViewStyle {
  return {
    backgroundColor: selected
      ? theme.colors.primaryFixed
      : theme.colors.surfaceContainerLow,
    borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
  };
}

const styles = StyleSheet.create({
  chip: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    justifyContent: "center",
    minHeight: Sizes["7xl"],
    paddingHorizontal: Spacing.md,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  chipText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  clearButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
    minHeight: Sizes["7xl"],
  },
  clearText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  container: {
    gap: Spacing.lg,
  },
  filterLabel: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  filterLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  filterSection: {
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    minWidth: Sizes.none,
    padding: Sizes.none,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    lineHeight: LineHeights.xs,
  },
  search: {
    alignItems: "center",
    borderRadius: Radii.xl,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
  },
  summaryCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  summaryRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

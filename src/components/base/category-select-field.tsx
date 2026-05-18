import { Feather } from "@expo/vector-icons";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useMemo,
  useRef,
  type ComponentProps,
  type MutableRefObject,
  type Ref,
} from "react";
import {
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { AppBottomSheetModal } from "@/components/base/app-bottom-sheet-modal";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import {
  CategorySelectList,
  type CategorySelectListProps,
} from "@/components/base/category-select-list";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useCategoriesQuery } from "@/lib/finance/queries";
import type { CategoryRecord } from "@/lib/finance/types";

export type CategorySelectFieldProps = Omit<
  CategorySelectListProps,
  "onClose" | "onSelect" | "selectedValue"
> & {
  disabled?: boolean;
  fieldStyle?: StyleProp<ViewStyle>;
  helperText?: string;
  helperTextStyle?: StyleProp<TextStyle>;
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  modalRef?: Ref<BottomSheetModal>;
  onSelect: (value: string, category: CategoryRecord) => void | Promise<void>;
  placeholder?: string;
  selectedValue: string | null;
  sheetSubtitle?: string;
  snapPoints?: ComponentProps<typeof BottomSheetModal>["snapPoints"];
  title?: string;
  valueStyle?: StyleProp<TextStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function assignModalRef(
  ref: Ref<BottomSheetModal> | undefined,
  value: BottomSheetModal | null,
) {
  // Support both forwarded refs and the explicit modalRef prop so callers can
  // control the same bottom sheet instance from outside the field.
  if (!ref) {
    return;
  }

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  (ref as MutableRefObject<BottomSheetModal | null>).current = value;
}

export const CategorySelectField = forwardRef<
  BottomSheetModal,
  CategorySelectFieldProps
>(function CategorySelectField(
  {
    closeLabel,
    disabled = false,
    emptyText,
    errorText,
    estimatedItemSize,
    fieldStyle,
    getCategoryAccentColor = (category) => category.color,
    getCategoryDescription,
    getCategoryLabel = (category) => category.label,
    getCategoryValue = (category) => category.id,
    helperText,
    helperTextStyle,
    label = "Category",
    labelStyle,
    loadingText,
    modalRef: modalRefProp,
    onSelect,
    placeholder = "Choose a category",
    selectedValue,
    sheetSubtitle = "Select one category.",
    snapPoints: snapPointsProp,
    title,
    valueStyle,
    wrapperStyle,
  },
  forwardedRef,
) {
  const theme = useAppTheme();
  const modalRef = useRef<BottomSheetModal>(null);
  const categoriesQuery = useCategoriesQuery();
  // The field mirrors the list query so it can show the selected label while
  // the sheet body owns the full category rendering.
  const categories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  // Derive the currently selected category from fetched data instead of asking
  // every call site to pass category records into this reusable component.
  const selectedCategory = useMemo(
    () =>
      categories.find(
        (category) => getCategoryValue(category) === selectedValue,
      ) ?? null,
    [categories, getCategoryValue, selectedValue],
  );
  const defaultSnapPoints = useMemo(
    () =>
      categories.length > 6
        ? ["78%"]
        : categories.length > 3
          ? ["64%"]
          : ["48%"],
    [categories.length],
  );
  const snapPoints = snapPointsProp ?? defaultSnapPoints;

  const setModalRef = useCallback(
    (value: BottomSheetModal | null) => {
      modalRef.current = value;
      assignModalRef(modalRefProp, value);
      assignModalRef(forwardedRef, value);
    },
    [forwardedRef, modalRefProp],
  );

  const handleOpen = useCallback(() => {
    modalRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    modalRef.current?.dismiss();
  }, []);

  const handleDismiss = useCallback(() => {
    modalRef.current = null;
  }, []);

  const handleSelect = useCallback(
    async (value: string, category: CategoryRecord) => {
      // Dismiss directly here so selection has one close path and the field
      // remains disabled until the bottom sheet confirms dismissal.
      modalRef.current?.dismiss();
      void onSelect(value, category);
    },
    [onSelect],
  );

  const selectedAccentColor = selectedCategory
    ? getCategoryAccentColor(selectedCategory)
    : undefined;

  return (
    <>
      <View style={[styles.fieldWrap, wrapperStyle]}>
        <AppText style={[styles.fieldLabel, labelStyle]} variant="labelMd">
          {label}
        </AppText>
        <AppPressable
          disabled={disabled}
          onPress={handleOpen}
          style={[
            styles.field,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
              opacity: disabled ? 0.58 : 1,
            },
            fieldStyle,
          ]}
        >
          <View style={styles.fieldValueRow}>
            {selectedAccentColor ? (
              <View
                style={[styles.dot, { backgroundColor: selectedAccentColor }]}
              />
            ) : null}
            <View style={styles.fieldCopy}>
              <AppText
                color={selectedCategory ? "text" : "mutedText"}
                style={[styles.fieldValue, valueStyle]}
                variant="bodyMd"
              >
                {selectedCategory
                  ? getCategoryLabel(selectedCategory)
                  : placeholder}
              </AppText>
              {helperText ? (
                <AppText
                  color="mutedText"
                  style={[styles.helperText, helperTextStyle]}
                  variant="bodyMd"
                >
                  {helperText}
                </AppText>
              ) : null}
            </View>
          </View>
          <Feather
            color={theme.colors.mutedText}
            name="chevron-down"
            size={18}
          />
        </AppPressable>
      </View>

      <AppBottomSheetModal
        ref={setModalRef}
        onClosePress={handleClose}
        onDismiss={handleDismiss}
        snapPoints={snapPoints}
        subtitle={sheetSubtitle}
        title={title ?? label}
      >
        {/* The sheet body fetches and renders categories, keeping call sites small. */}
        <CategorySelectList
          closeLabel={closeLabel}
          emptyText={emptyText}
          errorText={errorText}
          estimatedItemSize={estimatedItemSize}
          getCategoryAccentColor={getCategoryAccentColor}
          getCategoryDescription={getCategoryDescription}
          getCategoryLabel={getCategoryLabel}
          getCategoryValue={getCategoryValue}
          loadingText={loadingText}
          onClose={handleClose}
          onSelect={handleSelect}
          selectedValue={selectedValue}
        />
      </AppBottomSheetModal>
    </>
  );
});

const styles = StyleSheet.create({
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  field: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  fieldCopy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: 0,
  },
  fieldLabel: {
    fontFamily: font.semiBold,
  },
  fieldValue: {
    lineHeight: LineHeights.md,
  },
  fieldValueRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fieldWrap: {
    gap: Spacing.sm,
  },
  helperText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
});

export default CategorySelectField;

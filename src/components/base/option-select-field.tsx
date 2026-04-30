import { Feather } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlashList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type OptionSelectItem = {
  accentColor?: string;
  description?: string;
  label: string;
  value: string;
};

export type OptionSelectFieldProps = {
  emptyText?: string;
  helperText?: string;
  label: string;
  onSelect: (value: string) => void;
  options: OptionSelectItem[];
  placeholder?: string;
  selectedValue: string | null;
  title?: string;
};

export function OptionSelectField({
  emptyText = "No options are available yet.",
  helperText,
  label,
  onSelect,
  options,
  placeholder = "Choose an option",
  selectedValue,
  title,
}: OptionSelectFieldProps) {
  const theme = useAppTheme();
  const modalRef = useRef<BottomSheetModal>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue) ?? null,
    [options, selectedValue],
  );
  const snapPoints = useMemo(
    () => (options.length > 6 ? ["78%"] : options.length > 3 ? ["64%"] : ["48%"]),
    [options.length],
  );

  useEffect(() => {
    return () => {
      modalRef.current?.dismiss();
    };
  }, []);

  const handleOpen = useCallback(() => {
    modalRef.current?.present();
  }, []);

  const handleClose = useCallback(() => {
    modalRef.current?.dismiss();
  }, []);

  const renderBackdrop = useCallback(
    (props: Parameters<NonNullable<React.ComponentProps<typeof BottomSheetModal>["backdropComponent"]>>[0]) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.42}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <View style={styles.fieldWrap}>
        <AppText style={styles.fieldLabel} variant="labelMd">
          {label}
        </AppText>
        <AppPressable
          onPress={handleOpen}
          style={[
            styles.field,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.fieldValueRow}>
            {selectedOption?.accentColor ? (
              <View style={[styles.dot, { backgroundColor: selectedOption.accentColor }]} />
            ) : null}
            <View style={styles.fieldCopy}>
              <AppText
                color={selectedOption ? "text" : "mutedText"}
                style={styles.fieldValue}
                variant="bodyMd"
              >
                {selectedOption?.label ?? placeholder}
              </AppText>
              {helperText ? (
                <AppText color="mutedText" style={styles.helperText} variant="bodyMd">
                  {helperText}
                </AppText>
              ) : null}
            </View>
          </View>
          <Feather color={theme.colors.mutedText} name="chevron-down" size={18} />
        </AppPressable>
      </View>

      <BottomSheetModal
        ref={modalRef}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: theme.colors.surfaceContainerLowest }}
        enableDismissOnClose
        handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
        snapPoints={snapPoints}
      >
        <BottomSheetView style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetCopy}>
              <AppText style={styles.sheetTitle} variant="titleMd">
                {title ?? label}
              </AppText>
              <AppText color="mutedText" style={styles.sheetSubtitle} variant="bodyMd">
                Select one option.
              </AppText>
            </View>
            <AppPressable onPress={handleClose} style={styles.closeButton}>
              <Feather color={theme.colors.mutedText} name="x" size={18} />
            </AppPressable>
          </View>

          {options.length ? (
            <BottomSheetFlashList
              contentContainerStyle={styles.listContent}
              data={options}
              estimatedItemSize={56}
              keyExtractor={(item) => item.value}
              ListFooterComponent={
                <View style={styles.footer}>
                  <AppButton onPress={handleClose} title="Close" variant="secondary" />
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;

                return (
                  <AppPressable
                    onPress={() => {
                      onSelect(item.value);
                      handleClose();
                    }}
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
                        {item.accentColor ? (
                          <View style={[styles.dot, { backgroundColor: item.accentColor }]} />
                        ) : null}
                        <AppText style={styles.optionLabel} variant="bodyMd">
                          {item.label}
                        </AppText>
                      </View>
                      {item.description ? (
                        <AppText color="mutedText" style={styles.optionDescription} variant="bodyMd">
                          {item.description}
                        </AppText>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Feather color={theme.colors.primary} name="check" size={18} />
                    ) : null}
                  </AppPressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <AppText color="mutedText" variant="bodyMd">
                  {emptyText}
                </AppText>
              }
              showsVerticalScrollIndicator={false}
              style={styles.list}
            />
          ) : (
            <View style={styles.footer}>
              <AppText color="mutedText" variant="bodyMd">
                {emptyText}
              </AppText>
              <AppButton onPress={handleClose} title="Close" variant="secondary" />
            </View>
          )}
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}

const styles = StyleSheet.create({
  closeButton: {
    padding: Spacing.sm,
  },
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
  footer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  helperText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.xl,
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
  sheetContent: {
    flex: 1,
    gap: Spacing.lg,
    paddingBottom: Sizes["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  sheetCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  sheetSubtitle: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  sheetTitle: {
    fontFamily: font.headerSemiBold,
  },
});

export default OptionSelectField;

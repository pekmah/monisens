import { Feather } from "@expo/vector-icons";
import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type MutableRefObject,
  type Ref,
} from "react";
import {
  StyleSheet,
  type StyleProp,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";

import { AppBottomSheetModal } from "@/components/base/app-bottom-sheet-modal";
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
  closeLabel?: string;
  disabled?: boolean;
  emptyText?: string;
  fieldStyle?: StyleProp<ViewStyle>;
  helperText?: string;
  helperTextStyle?: StyleProp<TextStyle>;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  modalRef?: Ref<BottomSheetModal>;
  onSelect: (value: string) => void;
  options: OptionSelectItem[];
  placeholder?: string;
  selectedValue: string | null;
  sheetSubtitle?: string;
  snapPoints?: ComponentProps<typeof BottomSheetModal>["snapPoints"];
  title?: string;
  valueStyle?: StyleProp<TextStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
};

function assignModalRef(ref: Ref<BottomSheetModal> | undefined, value: BottomSheetModal | null) {
  if (!ref) {
    return;
  }

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  (ref as MutableRefObject<BottomSheetModal | null>).current = value;
}

export const OptionSelectField = forwardRef<BottomSheetModal, OptionSelectFieldProps>(
  function OptionSelectField(
    {
      closeLabel = "Close",
      disabled = false,
      emptyText = "No options are available yet.",
      fieldStyle,
      helperText,
      helperTextStyle,
      label,
      labelStyle,
      modalRef: modalRefProp,
      onSelect,
      options,
      placeholder = "Choose an option",
      selectedValue,
      sheetSubtitle = "Select one option.",
      snapPoints: snapPointsProp,
      title,
      valueStyle,
      wrapperStyle,
    },
    forwardedRef,
  ) {
    const theme = useAppTheme();
    const modalRef = useRef<BottomSheetModal>(null);
    const suppressOpenUntilRef = useRef(0);

    const selectedOption = useMemo(
      () => options.find((option) => option.value === selectedValue) ?? null,
      [options, selectedValue],
    );
    const defaultSnapPoints = useMemo(
      () => (options.length > 6 ? ["78%"] : options.length > 3 ? ["64%"] : ["48%"]),
      [options.length],
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

    useEffect(() => {
      return () => {
        modalRef.current?.dismiss();
      };
    }, []);

    const handleOpen = useCallback(() => {
      if (disabled || Date.now() < suppressOpenUntilRef.current) {
        return;
      }

      modalRef.current?.present();
    }, [disabled]);

    const handleClose = useCallback(() => {
      modalRef.current?.dismiss();
    }, []);

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
              {selectedOption?.accentColor ? (
                <View style={[styles.dot, { backgroundColor: selectedOption.accentColor }]} />
              ) : null}
              <View style={styles.fieldCopy}>
                <AppText
                  color={selectedOption ? "text" : "mutedText"}
                  style={[styles.fieldValue, valueStyle]}
                  variant="bodyMd"
                >
                  {selectedOption?.label ?? placeholder}
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
            <Feather color={theme.colors.mutedText} name="chevron-down" size={18} />
          </AppPressable>
        </View>

        <AppBottomSheetModal
          ref={setModalRef}
          onClosePress={handleClose}
          snapPoints={snapPoints}
          subtitle={sheetSubtitle}
          title={title ?? label}
        >
          {options.length ? (
            <BottomSheetFlatList
              contentContainerStyle={styles.listContent}
              data={options}
              keyExtractor={(item) => item.value}
              ListFooterComponent={
                <View style={styles.footer}>
                  <AppButton onPress={handleClose} title={closeLabel} variant="secondary" />
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;

                return (
                  <AppPressable
                    onPress={() => {
                      suppressOpenUntilRef.current = Date.now() + 400;
                      handleClose();
                      setTimeout(() => {
                        onSelect(item.value);
                      }, 0);
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
                        <AppText
                          color="mutedText"
                          style={styles.optionDescription}
                          variant="bodyMd"
                        >
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
              <AppButton onPress={handleClose} title={closeLabel} variant="secondary" />
            </View>
          )}
        </AppBottomSheetModal>
      </>
    );
  },
);

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
});

export default OptionSelectField;

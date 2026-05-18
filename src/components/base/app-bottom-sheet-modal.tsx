import { Feather } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, type ComponentProps, type ReactNode, useCallback } from "react";
import { StyleSheet, type StyleProp, View, type ViewStyle } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type AppBottomSheetModalProps = Omit<
  ComponentProps<typeof BottomSheetModal>,
  "backdropComponent" | "backgroundStyle" | "children" | "handleIndicatorStyle"
> & {
  backdropOpacity?: number;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onClosePress?: () => void;
  showCloseButton?: boolean;
  subtitle?: ReactNode;
  title?: ReactNode;
};

export const AppBottomSheetModal = forwardRef<
  BottomSheetModal,
  AppBottomSheetModalProps
>(function AppBottomSheetModal(
  {
    backdropOpacity = 0.42,
    children,
    contentStyle,
    onClosePress,
    showCloseButton = true,
    subtitle,
    title,
    ...modalProps
  },
  ref,
) {
  const theme = useAppTheme();

  // Centralize bottom sheet backdrop behavior so feature components do not need
  // to recreate the same modal chrome and dismissal rules.
  const renderBackdrop = useCallback(
    (
      props: Parameters<
        NonNullable<ComponentProps<typeof BottomSheetModal>["backdropComponent"]>
      >[0],
    ) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={backdropOpacity}
        pressBehavior="close"
      />
    ),
    [backdropOpacity],
  );

  return (
    <BottomSheetModal
      ref={ref}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.colors.surfaceContainerLowest }}
      enableDismissOnClose
      handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
      {...modalProps}
    >
      <BottomSheetView style={[styles.content, contentStyle]}>
        {title || subtitle || showCloseButton ? (
          // Header content is optional so the same wrapper can support simple
          // action sheets and fully titled selection flows.
          <View style={styles.header}>
            <View style={styles.copy}>
              {title ? (
                <AppText style={styles.title} variant="titleMd">
                  {title}
                </AppText>
              ) : null}
              {subtitle ? (
                <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            {showCloseButton ? (
              <AppPressable onPress={onClosePress} style={styles.closeButton}>
                <Feather color={theme.colors.mutedText} name="x" size={18} />
              </AppPressable>
            ) : null}
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    gap: Spacing.lg,
    paddingBottom: Sizes["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  copy: {
    flex: 1,
    gap: Sizes.xs,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

export default AppBottomSheetModal;

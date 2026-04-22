import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const ENTER_EXIT_DURATION_MS = 220;

export type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  visible: boolean;
};

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  loading = false,
  onCancel,
  onConfirm,
  title,
  visible,
}: ConfirmationDialogProps) {
  const theme = useAppTheme();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      progress.value = withTiming(1, { duration: ENTER_EXIT_DURATION_MS });
      return;
    }

    progress.value = withTiming(0, { duration: ENTER_EXIT_DURATION_MS });
    const timeout = setTimeout(() => {
      setMounted(false);
    }, ENTER_EXIT_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [18, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.96, 1]) },
    ],
  }));

  if (!mounted) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
      transparent
      visible={mounted}
    >
      <View style={styles.host}>
        <Animated.View
          style={[
            styles.backdrop,
            backdropStyle,
            { backgroundColor: "rgba(16, 24, 40, 0.5)" },
          ]}
        >
          <AppPressable onPress={loading ? undefined : onCancel} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View
          style={[
            styles.cardWrap,
            cardStyle,
          ]}
        >
          <View
            style={[
              styles.card,
              theme.elevation.ambient,
              {
                backgroundColor: theme.colors.surfaceContainerLowest,
                borderColor: theme.colors.outlineVariant,
                shadowColor: "rgba(15, 23, 42, 0.22)",
              },
            ]}
          >
            <View style={styles.header}>
              <View
                style={[
                  styles.iconTile,
                  {
                    backgroundColor: `${theme.colors.error}14`,
                    borderColor: `${theme.colors.error}22`,
                  },
                ]}
              >
                <Feather color={theme.colors.error} name="trash-2" size={18} />
              </View>
              <View style={styles.copy}>
                <AppText style={styles.title} variant="titleMd">
                  {title}
                </AppText>
                <AppText color="mutedText" style={styles.description} variant="bodyMd">
                  {description}
                </AppText>
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                disabled={loading}
                fullWidth
                onPress={onCancel}
                title={cancelLabel}
                variant="secondary"
              />
              <AppButton
                fullWidth
                loading={loading}
                onPress={onConfirm}
                title={confirmLabel}
                variant="danger"
              />
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.sm,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.xl,
    padding: Spacing.xl,
  },
  cardWrap: {
    width: "100%",
  },
  copy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: 0,
  },
  description: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  host: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    height: Sizes["7xl"],
    justifyContent: "center",
    width: Sizes["7xl"],
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

export default ConfirmationDialog;

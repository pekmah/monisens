import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function BackupCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard elevated style={styles.card} tone="primary">
      <View style={styles.copy}>
        <AppText color="onPrimary" style={styles.title} variant="headlineSm">
          Secure Backups
        </AppText>
        <AppText color="onPrimaryContainer" style={styles.description} variant="bodyMd">
          Last backup performed today at 04:12 AM. Your data is encrypted
          end-to-end.
        </AppText>
      </View>

      <View style={styles.actions}>
        <AppPressable style={styles.secondaryAction}>
          <Feather color={theme.colors.onPrimary} name="rotate-ccw" size={18} />
          <AppText color="onPrimary" style={styles.secondaryActionText} variant="labelMd">
            Restore
          </AppText>
        </AppPressable>
        <AppPressable
          style={[
            styles.primaryAction,
            { backgroundColor: theme.colors.onPrimary },
          ]}
        >
          <Feather color={theme.colors.primary} name="upload-cloud" size={18} />
          <AppText color="primary" style={styles.primaryActionText} variant="labelMd">
            Backup Now
          </AppText>
        </AppPressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.xl,
    padding: Sizes["3xl"],
  },
  copy: {
    gap: Spacing.sm,
  },
  description: {
    opacity: 0.9,
  },
  primaryAction: {
    alignItems: "center",
    borderRadius: Radii.full,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    paddingHorizontal: Spacing.lg,
  },
  primaryActionText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radii.full,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    paddingHorizontal: Spacing.lg,
  },
  secondaryActionText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerBold,
  },
});

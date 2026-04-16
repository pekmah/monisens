import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

const controls = [
  {
    action: "Delete old transactions",
    color: "primary" as const,
    icon: "trash-2" as const,
    meta: "Remove historical data to save space or protect privacy.",
    title: "Storage Cleanup",
  },
  {
    action: "Report incorrect parsing",
    color: "tertiary" as const,
    icon: "alert-circle" as const,
    meta: "Help us improve by flagging errors in AI categorization.",
    title: "Quality Control",
  },
];

export function DataControlsCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: `${theme.colors.secondary}14` },
          ]}
        >
          <Feather color={theme.colors.secondary} name="database" size={18} />
        </View>
        <AppText style={styles.title} variant="titleMd">
          Data Management
        </AppText>
      </View>

      <View style={styles.controls}>
        {controls.map((control) => {
          const color = theme.colors[control.color];

          return (
            <View
              key={control.title}
              style={[
                styles.control,
                {
                  backgroundColor: theme.colors.surfaceContainerLow,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <AppText style={[styles.controlTitle, { color }]} variant="labelMd">
                {control.title}
              </AppText>
              <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
                {control.meta}
              </AppText>
              <AppPressable style={styles.controlAction}>
                <Feather color={color} name={control.icon} size={16} />
                <AppText style={[styles.controlActionText, { color }]} variant="labelMd">
                  {control.action}
                </AppText>
              </AppPressable>
            </View>
          );
        })}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xl,
  },
  control: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  controlAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  controlActionText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  controlMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  controls: {
    gap: Spacing.md,
  },
  controlTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

import { Feather } from "@expo/vector-icons";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { Radii, Sizes, Spacing, type AppTheme } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ComponentProps, PropsWithChildren } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

type TabScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}> &
  ViewProps;

export function TabScreen({ children, style, ...viewProps }: TabScreenProps) {
  const theme = useAppTheme();
  const screenThemeStyle = getTabScreenThemeStyle(theme);

  return (
    <View
      {...viewProps}
      // Screens can layer local layout tweaks on top of the shared tab padding
      // without reimplementing the tab surface wrapper in each feature.
      style={[styles.screen, screenThemeStyle, style]}
    >
      {children}
    </View>
  );
}

export function SurfaceCard({
  children,
  elevated,
  style,
  tone = "default",
}: PropsWithChildren<{
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "low" | "highest" | "primary";
}>) {
  const theme = useAppTheme();
  const cardThemeStyle = getSurfaceCardThemeStyle(theme, tone);

  return (
    <View
      style={[
        styles.card,
        cardThemeStyle,
        elevated ? theme.elevation.ambient : undefined,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function MetricCard({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "primary";
  value: string;
}) {
  const theme = useAppTheme();
  const isPrimary = tone === "primary";
  const metricGlowStyle = getMetricGlowThemeStyle(theme);

  return (
    <SurfaceCard
      style={styles.metricCard}
      tone={isPrimary ? "primary" : "default"}
    >
      <AppText color={isPrimary ? "onPrimary" : "mutedText"} variant="labelMd">
        {label}
      </AppText>
      <AppText color={isPrimary ? "onPrimary" : "text"} variant="titleMd">
        {value}
      </AppText>
      {isPrimary ? (
        <View style={[styles.metricGlow, metricGlowStyle]} />
      ) : null}
    </SurfaceCard>
  );
}

export function IconTile({
  color,
  icon,
}: {
  color?: string;
  icon: FeatherName;
}) {
  const theme = useAppTheme();
  const tileThemeStyle = getIconTileThemeStyle(theme, color);

  return (
    <View style={[styles.tile, tileThemeStyle]}>
      <Feather color={theme.colors.primary} name={icon} size={Sizes.xl} />
    </View>
  );
}

export function RowItem({
  amount,
  icon,
  meta,
  onPress,
  title,
  tone,
}: {
  amount?: string;
  icon: FeatherName;
  meta: string;
  onPress?: () => void;
  title: string;
  tone?: string;
}) {
  return (
    <AppPressable onPress={onPress} style={styles.row}>
      <IconTile color={tone} icon={icon} />
      <View style={styles.rowCopy}>
        <AppText variant="titleMd">{title}</AppText>
        <AppText color="mutedText" variant="bodyMd">
          {meta}
        </AppText>
      </View>
      {amount ? (
        <AppText
          color={amount.startsWith("+") ? "primary" : "text"}
          variant="labelMd"
        >
          {amount}
        </AppText>
      ) : null}
    </AppPressable>
  );
}

export function ProgressBar({
  color,
  progress,
}: {
  color?: string;
  progress: number;
}) {
  const theme = useAppTheme();
  const progressTrackThemeStyle = getProgressTrackThemeStyle(theme);
  const progressFillThemeStyle = getProgressFillThemeStyle(theme, color, progress);

  return (
    <View style={[styles.progressTrack, progressTrackThemeStyle]}>
      <View style={[styles.progressFill, progressFillThemeStyle]} />
    </View>
  );
}

function getTabScreenThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.background,
  };
}

function getSurfaceCardThemeStyle(
  theme: AppTheme,
  tone: "default" | "low" | "highest" | "primary",
): ViewStyle {
  const backgroundColor =
    tone === "primary"
      ? theme.colors.primary
      : tone === "highest"
        ? theme.colors.surfaceContainerHighest
        : tone === "low"
          ? theme.colors.surfaceContainerLow
          : theme.colors.surfaceContainerLowest;

  return {
    backgroundColor,
    borderRadius: theme.radii.lg,
  };
}

function getMetricGlowThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primaryFixed,
  };
}

function getIconTileThemeStyle(theme: AppTheme, color?: string): ViewStyle {
  return {
    backgroundColor: color ?? theme.colors.surfaceContainerHigh,
  };
}

function getProgressTrackThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: `${theme.colors.text}50`,
  };
}

function getProgressFillThemeStyle(
  theme: AppTheme,
  color: string | undefined,
  progress: number,
): ViewStyle {
  return {
    backgroundColor: color ?? theme.colors.primary,
    width: `${Math.min(Math.max(progress, 0), 100)}%`,
  };
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    padding: Sizes.xl,
  },
  metricCard: {
    flex: 1,
    gap: Sizes.sm - Sizes.xxs,
    minHeight: Sizes["14xl"],
  },
  metricGlow: {
    borderRadius: Sizes["9xl"],
    height: Sizes["14xl"],
    opacity: 0.14,
    position: "absolute",
    right: -Sizes["5xl"],
    top: -Sizes["3xl"],
    width: Sizes["14xl"],
  },
  progressFill: {
    borderRadius: Radii.full,
    height: "100%",
  },
  progressTrack: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["12xl"],
  },
  rowCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  screen: {
    flex: 1,
    paddingHorizontal: Sizes.xl,
    paddingTop: Sizes.xl,
  },
  tile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
});

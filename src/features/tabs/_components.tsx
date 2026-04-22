import { Feather } from "@expo/vector-icons";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ComponentProps, PropsWithChildren } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

export function TabScreen({ children }: PropsWithChildren) {
  const theme = useAppTheme();

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
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
  style?: ViewStyle | ViewStyle[];
  tone?: "default" | "low" | "highest" | "primary";
}>) {
  const theme = useAppTheme();
  const backgroundColor =
    tone === "primary"
      ? theme.colors.primary
      : tone === "highest"
        ? theme.colors.surfaceContainerHighest
        : tone === "low"
          ? theme.colors.surfaceContainerLow
          : theme.colors.surfaceContainerLowest;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderRadius: theme.radii.lg,
        },
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
        <View
          style={[
            styles.metricGlow,
            { backgroundColor: theme.colors.primaryFixed },
          ]}
        />
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

  return (
    <View
      style={[
        styles.tile,
        { backgroundColor: color ?? theme.colors.surfaceContainerHigh },
      ]}
    >
      <Feather color={theme.colors.primary} name={icon} size={18} />
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
  const theme = useAppTheme();

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
          style={{
            color: amount.startsWith("+")
              ? theme.colors.primary
              : theme.colors.text,
          }}
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

  return (
    <View
      style={[
        styles.progressTrack,
        { backgroundColor: theme.colors.text + "50" },
      ]}
    >
      <View
        style={[
          styles.progressFill,
          {
            backgroundColor: color ?? theme.colors.primary,
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
          },
        ]}
      />
    </View>
  );
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

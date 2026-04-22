import { Feather } from "@expo/vector-icons";
import { StyleSheet, Switch, View } from "react-native";

import { AppFlashList } from "@/components/base";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

export type SettingsRow = {
  actionLabel?: string;
  meta: string;
  title: string;
  toggle?: boolean;
};

export type SettingsGroup = {
  icon: FeatherName;
  rows: SettingsRow[];
  title: string;
  tone: "primary" | "tertiary";
};

export type SettingsGroupCardProps = {
  group: SettingsGroup;
};

export function SettingsGroupCard({ group }: SettingsGroupCardProps) {
  const theme = useAppTheme();
  const toneColor =
    group.tone === "tertiary" ? theme.colors.tertiary : theme.colors.primary;
  const toneBackground =
    group.tone === "tertiary"
      ? theme.colors.tertiaryFixed
      : theme.colors.primaryFixed;

  return (
    <SurfaceCard style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={[styles.iconTile, { backgroundColor: `${toneColor}14` }]}>
          <Feather color={toneColor} name={group.icon} size={18} />
        </View>
        <AppText style={styles.groupTitle} variant="titleMd">
          {group.title}
        </AppText>
      </View>
      <AppFlashList
        data={group.rows}
        keyExtractor={(row) => row.title}
        renderItem={({ item: row }) => (
          <AppPressable style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <AppText style={styles.rowTitle} variant="labelMd">
                {row.title}
              </AppText>
              <AppText color="mutedText" style={styles.rowMeta} variant="bodyMd">
                {row.meta}
              </AppText>
            </View>
            {typeof row.toggle === "boolean" ? (
              <Switch
                thumbColor={
                  row.toggle
                    ? theme.colors.primary
                    : theme.colors.surfaceContainerLowest
                }
                trackColor={{
                  false: theme.colors.surfaceContainerHighest,
                  true: theme.colors.primaryContainer,
                }}
                value={row.toggle}
              />
            ) : row.actionLabel ? (
              <View style={styles.actionRow}>
                <AppText color="mutedText" style={styles.actionLabel} variant="bodyMd">
                  {row.actionLabel}
                </AppText>
                <Feather color={theme.colors.outline} name="chevron-right" size={18} />
              </View>
            ) : null}
          </AppPressable>
        )}
      />
      <View
        style={[
          styles.cardGlow,
          { backgroundColor: toneBackground },
        ]}
      />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  actionLabel: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  actionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  cardGlow: {
    borderRadius: Radii.full,
    height: Sizes["13xl"],
    opacity: 0.12,
    position: "absolute",
    right: -Sizes["5xl"],
    top: -Sizes["5xl"],
    width: Sizes["13xl"],
  },
  group: {
    gap: Spacing.lg,
    position: "relative",
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  groupTitle: {
    fontFamily: font.headerSemiBold,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  rowMeta: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  rowTitle: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  settingCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  settingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Sizes.md + Sizes.xxs,
    minHeight: Sizes["11xl"] + Sizes.xxs,
  },
});

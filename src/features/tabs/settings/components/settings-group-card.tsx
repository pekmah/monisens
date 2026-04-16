import { StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { IconTile, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export type SettingsRow = {
  meta: string;
  title: string;
  toggle?: boolean;
};

export type SettingsGroup = {
  icon: Parameters<typeof IconTile>[0]["icon"];
  rows: SettingsRow[];
  title: string;
};

export type SettingsGroupCardProps = {
  group: SettingsGroup;
};

export function SettingsGroupCard({ group }: SettingsGroupCardProps) {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.group}>
      <View style={styles.groupHeader}>
        <IconTile icon={group.icon} />
        <AppText variant="titleMd">{group.title}</AppText>
      </View>
      {group.rows.map((row) => (
        <View key={row.title} style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <AppText variant="bodyLg">{row.title}</AppText>
            <AppText color="mutedText" variant="bodyMd">
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
          ) : null}
        </View>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.lg,
  },
  groupHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
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

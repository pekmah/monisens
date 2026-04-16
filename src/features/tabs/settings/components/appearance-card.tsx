import { Feather } from "@expo/vector-icons";
import { StyleSheet, Switch, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useThemeController } from "@/lib/theme-controller";

const modes = [
  { icon: "sun" as const, label: "Light", value: "light" as const },
  { icon: "moon" as const, label: "Dark", value: "dark" as const },
];

export function AppearanceCard() {
  const theme = useAppTheme();
  const { colorScheme, setThemeOverride, systemColorScheme, themeOverride } =
    useThemeController();
  const isDark = colorScheme === "dark";
  const modeLabel = isDark ? "Dark" : "Light";
  const sourceLabel = themeOverride
    ? `${modeLabel} selected`
    : `Following system ${systemColorScheme}`;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: `${theme.colors.secondary}14` },
          ]}
        >
          <Feather color={theme.colors.secondary} name="monitor" size={18} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.title} variant="titleMd">
            Appearance
          </AppText>
          <AppText color="mutedText" style={styles.meta} variant="bodyMd">
            {sourceLabel}
          </AppText>
        </View>
        <Switch
          onValueChange={(value) => setThemeOverride(value ? "dark" : "light")}
          thumbColor={isDark ? theme.colors.primary : theme.colors.surfaceContainerLowest}
          trackColor={{
            false: theme.colors.surfaceContainerHighest,
            true: theme.colors.primaryContainer,
          }}
          value={isDark}
        />
      </View>

      <View
        style={[
          styles.segment,
          { backgroundColor: theme.colors.surfaceContainerLow },
        ]}
      >
        {modes.map((mode) => {
          const selected = colorScheme === mode.value;

          return (
            <AppPressable
              key={mode.value}
              onPress={() => setThemeOverride(mode.value)}
              style={[
                styles.segmentButton,
                selected
                  ? {
                      backgroundColor: theme.colors.surfaceContainerLowest,
                      borderColor: theme.colors.outlineVariant,
                    }
                  : undefined,
              ]}
            >
              <Feather
                color={selected ? theme.colors.primary : theme.colors.mutedText}
                name={mode.icon}
                size={16}
              />
              <AppText
                color={selected ? "primary" : "mutedText"}
                style={styles.segmentText}
                variant="labelMd"
              >
                {mode.label}
              </AppText>
            </AppPressable>
          );
        })}
      </View>

      {themeOverride ? (
        <AppPressable
          onPress={() => setThemeOverride(null)}
          style={[
            styles.systemButton,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <Feather color={theme.colors.outline} name="smartphone" size={16} />
          <AppText color="mutedText" style={styles.systemText} variant="labelMd">
            Use system appearance
          </AppText>
        </AppPressable>
      ) : null}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  meta: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  segment: {
    borderRadius: Radii.lg,
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.xs,
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
  },
  segmentText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  systemButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  systemText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

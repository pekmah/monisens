import { Feather } from "@expo/vector-icons";
import { StyleSheet, Switch, View } from "react-native";

import { AppFlashList, AppPressable, AppText } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { DEFAULT_FONT_SCALE, getFontScaleLabel } from "@/lib/font-scale";
import { useThemeController } from "@/lib/theme-controller";

const modes = [
  { icon: "sun" as const, label: "Light", value: "light" as const },
  { icon: "moon" as const, label: "Dark", value: "dark" as const },
];

export function AppearanceCard() {
  const theme = useAppTheme();
  const {
    canDecreaseFontScale,
    canIncreaseFontScale,
    colorScheme,
    decreaseFontScale,
    fontScale,
    increaseFontScale,
    setFontScale,
    setThemeOverride,
    systemColorScheme,
    themeOverride,
  } = useThemeController();
  const isDark = colorScheme === "dark";
  const modeLabel = isDark ? "Dark" : "Light";
  const sourceLabel = themeOverride
    ? `${modeLabel} selected`
    : `Following system ${systemColorScheme}`;
  const textScaleLabel = getFontScaleLabel(fontScale);
  const fontPercentage = `${Math.round(fontScale * 100)}%`;

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
        <AppFlashList
          data={modes}
          horizontal
          keyExtractor={(mode) => mode.value}
          renderItem={({ item: mode }) => {
            const selected = colorScheme === mode.value;

            return (
              <AppPressable
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
          }}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.segmentSeparator} />}
        />
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

      <View
        style={[
          styles.fontSection,
          { backgroundColor: theme.colors.surfaceContainerLow },
        ]}
      >
        <View style={styles.fontHeader}>
          <View
            style={[
              styles.fontIconTile,
              { backgroundColor: `${theme.colors.primary}14` },
            ]}
          >
            <Feather color={theme.colors.primary} name="type" size={16} />
          </View>
          <View style={styles.fontCopy}>
            <AppText style={styles.title} variant="titleMd">
              Text Size
            </AppText>
            <AppText color="mutedText" style={styles.meta} variant="bodyMd">
              {textScaleLabel} ({fontPercentage})
            </AppText>
          </View>
        </View>

        <View style={styles.fontControls}>
          <AppPressable
            disabled={!canDecreaseFontScale}
            onPress={decreaseFontScale}
            style={[
              styles.fontButton,
              {
                backgroundColor: canDecreaseFontScale
                  ? theme.colors.surfaceContainerLowest
                  : theme.colors.surfaceContainerHighest,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Feather
              color={
                canDecreaseFontScale ? theme.colors.text : theme.colors.outline
              }
              name="minus"
              size={16}
            />
          </AppPressable>

          <View
            style={[
              styles.fontPreview,
              {
                backgroundColor: theme.colors.surfaceContainerLowest,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <AppText scaleBehavior="always" style={styles.previewTitle} variant="labelMd">
              Aa
            </AppText>
            <AppText color="mutedText" style={styles.previewMeta} variant="bodyMd">
              Comfortable reading
            </AppText>
          </View>

          <AppPressable
            disabled={!canIncreaseFontScale}
            onPress={increaseFontScale}
            style={[
              styles.fontButton,
              {
                backgroundColor: canIncreaseFontScale
                  ? theme.colors.surfaceContainerLowest
                  : theme.colors.surfaceContainerHighest,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Feather
              color={
                canIncreaseFontScale ? theme.colors.text : theme.colors.outline
              }
              name="plus"
              size={16}
            />
          </AppPressable>
        </View>

        <View style={styles.fontFooter}>
          <AppText color="mutedText" style={styles.fontHint} variant="bodyMd">
            Body text, labels, and standard titles scale. Oversized headers stay fixed.
          </AppText>
          {fontScale !== DEFAULT_FONT_SCALE ? (
            <AppPressable
              onPress={() => setFontScale(DEFAULT_FONT_SCALE)}
              style={[
                styles.resetButton,
                { borderColor: theme.colors.outlineVariant },
              ]}
            >
              <AppText color="mutedText" style={styles.systemText} variant="labelMd">
                Reset size
              </AppText>
            </AppPressable>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  fontButton: {
    alignItems: "center",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    height: Sizes["10xl"],
    justifyContent: "center",
    width: Sizes["10xl"],
  },
  fontControls: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fontCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  fontFooter: {
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  fontHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  fontHint: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  fontIconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["5xl"],
    justifyContent: "center",
    width: Sizes["5xl"],
  },
  fontPreview: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Sizes.xxs,
    justifyContent: "center",
    minHeight: Sizes["10xl"],
    paddingHorizontal: Spacing.md,
  },
  fontSection: {
    borderRadius: Radii.lg,
    gap: Spacing.md,
    padding: Spacing.md,
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
  previewMeta: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  previewTitle: {
    fontFamily: font.headerSemiBold,
  },
  resetButton: {
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  segment: {
    borderRadius: Radii.lg,
    padding: Spacing.xs,
  },
  segmentButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    minWidth: Sizes["13xl"],
    paddingHorizontal: Spacing.lg,
  },
  segmentSeparator: {
    width: Spacing.sm,
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

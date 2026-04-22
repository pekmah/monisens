import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function SuggestionCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card} tone="low">
      <View style={styles.topRow}>
        <View
          style={[styles.icon, { backgroundColor: theme.colors.tertiaryFixed }]}
        >
          <Feather color={theme.colors.tertiary} name="zap" size={18} />
        </View>
        <View style={styles.copy}>
          <AppText color="tertiary" style={styles.overline} variant="labelMd">
            INTELLIGENCE TIP
          </AppText>
          <AppText style={styles.title} variant="titleMd">
            Cleaner reporting
          </AppText>
        </View>
      </View>
      <AppText color="mutedText" style={styles.body} variant="bodyMd">
        This looks like dining. Keep it in Food & Drinks, or split it into
        Client Meetings when it is business-related.
      </AppText>
      <View style={styles.actions}>
        <AppPressable
          style={[
            styles.secondaryAction,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <AppText style={styles.secondaryActionText} variant="labelMd">
            Split
          </AppText>
        </AppPressable>
        <AppPressable
          style={[styles.primaryAction, { backgroundColor: theme.colors.primary }]}
        >
          <AppText color="onPrimary" style={styles.primaryActionText} variant="labelMd">
            Keep category
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
  body: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.lg,
  },
  card: {
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    lineHeight: LineHeights.xs,
  },
  primaryAction: {
    alignItems: "center",
    borderRadius: Radii.full,
    flex: 1,
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
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    flex: 1,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    paddingHorizontal: Spacing.lg,
  },
  secondaryActionText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Sizes.md + Sizes.xxs,
  },
});

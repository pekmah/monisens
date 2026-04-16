import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function BudgetTipCard() {
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
            SMART SAVING
          </AppText>
          <AppText variant="titleMd">Trim unused subscriptions</AppText>
        </View>
        <View
          style={[
            styles.savingsPill,
            { backgroundColor: theme.colors.surfaceContainerLowest },
          ]}
        >
          <AppText color="primary" style={styles.savings} variant="labelMd">
            KES 1,200
          </AppText>
        </View>
      </View>
      <AppText color="mutedText" variant="bodyMd">
        Three recurring payments have not been used in 60 days. Reviewing them
        keeps the month on plan without touching core bills.
      </AppText>
      <View style={styles.footer}>
        <AppText color="mutedText" style={styles.footerText} variant="bodyMd">
          Potential monthly savings
        </AppText>
        <Feather color={theme.colors.primary} name="arrow-up-right" size={16} />
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  overline: {
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    lineHeight: LineHeights.xs,
  },
  savings: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  savingsPill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Sizes.md + Sizes.xxs,
  },
});

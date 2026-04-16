import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function SpendingAlertCard() {
  const theme = useAppTheme();

  return (
    <View style={styles.grid}>
      <SurfaceCard
        style={[
          styles.alert,
          {
            backgroundColor: `${theme.colors.tertiary}14`,
            borderLeftColor: theme.colors.tertiary,
          },
        ]}
      >
        <Feather
          color={theme.colors.tertiary}
          name="alert-triangle"
          size={35}
          style={styles.watermark}
        />
        <AppText color="tertiary" style={styles.overline} variant="labelMd">
          SPENDING ALERT
        </AppText>
        <AppText style={styles.alertTitle} variant="titleMd">
          You overspent on transport by{" "}
          <AppText color="tertiary" style={styles.alertTitle} variant="titleMd">
            KES 2,000
          </AppText>
        </AppText>
        <AppText color="mutedText" style={styles.description} variant="bodyMd">
          Commute costs are 15% higher than your set budget this month.
        </AppText>
      </SurfaceCard>

      <SurfaceCard
        style={[styles.burnRate, { borderLeftColor: theme.colors.primary }]}
        tone="low"
      >
        <AppText color="primary" style={styles.overline} variant="labelMd">
          DAILY BURN RATE
        </AppText>
        <AppText style={styles.burnAmount} variant="headlineSm">
          KES 1,500
        </AppText>
        <AppText color="mutedText" style={styles.description} variant="bodyMd">
          Average daily expenditure
        </AppText>
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  alert: {
    borderLeftWidth: Sizes.xxs - 2,
    gap: Spacing.sm,
    position: "relative",
  },
  alertTitle: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights["2xl"],
  },
  burnAmount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["3xl"],
    lineHeight: LineHeights["4xl"],
  },
  burnRate: {
    borderLeftWidth: Sizes.xxs - 2,
    gap: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  grid: {
    gap: Spacing.lg,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    lineHeight: LineHeights.xs,
  },
  watermark: {
    opacity: 0.08,
    position: "absolute",
    right: Sizes.xs,
    top: Sizes.xs,
  },
});

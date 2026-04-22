import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney, type SpendingAlertRecord } from "@/lib/finance";

export function SpendingAlertCard({
  spendingAlert,
}: {
  spendingAlert: SpendingAlertRecord | null;
}) {
  const theme = useAppTheme();

  if (!spendingAlert) {
    return (
      <SurfaceCard style={styles.emptyCard} tone="low">
        <AppText style={styles.emptyTitle} variant="titleMd">
          Spending Alert
        </AppText>
        <AppText color="mutedText" style={styles.description} variant="bodyMd">
          Budget alerts will appear once you have budget and spending activity.
        </AppText>
      </SurfaceCard>
    );
  }

  const isOverBudget = spendingAlert.status === "over_budget";

  return (
    <View style={styles.grid}>
      <SurfaceCard
        style={[
          styles.alert,
          {
            backgroundColor: isOverBudget
              ? `${theme.colors.tertiary}14`
              : `${theme.colors.primary}14`,
            borderLeftColor: isOverBudget ? theme.colors.tertiary : theme.colors.primary,
          },
        ]}
      >
        <Feather
          color={isOverBudget ? theme.colors.tertiary : theme.colors.primary}
          name={isOverBudget ? "alert-triangle" : "check-circle"}
          size={35}
          style={styles.watermark}
        />
        <AppText
          color={isOverBudget ? "tertiary" : "primary"}
          style={styles.overline}
          variant="labelMd"
        >
          {isOverBudget ? "SPENDING ALERT" : "BUDGET STATUS"}
        </AppText>
        <AppText style={styles.alertTitle} variant="titleMd">
          {spendingAlert.alertTitle}
          {spendingAlert.alertAmountMinor ? " by " : ""}
          {spendingAlert.alertAmountMinor ? (
            <AppText
              color={isOverBudget ? "tertiary" : "primary"}
              style={styles.alertTitle}
              variant="titleMd"
            >
              {formatMoney(spendingAlert.alertAmountMinor, "KES")}
            </AppText>
          ) : null}
        </AppText>
        <AppText color="mutedText" style={styles.description} variant="bodyMd">
          {spendingAlert.alertDescription}
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
          {formatMoney(spendingAlert.burnRateMinor, "KES")}
        </AppText>
        <AppText color="mutedText" style={styles.description} variant="bodyMd">
          Average daily expenditure this month
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
  emptyCard: {
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontFamily: font.headerSemiBold,
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

import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { ProgressBar } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney, type BudgetOverviewRecord } from "@/lib/finance";

export function BudgetOverviewCard({
  overview,
}: {
  overview: BudgetOverviewRecord | null;
}) {
  const theme = useAppTheme();
  const progress =
    overview && overview.limitMinor > 0
      ? Math.min((overview.spentMinor / overview.limitMinor) * 100, 100)
      : 0;
  const planPillThemeStyle = getPlanPillThemeStyle(theme);
  const daysBadgeThemeStyle = getDaysBadgeThemeStyle(theme);
  const runwayThemeStyle = getRunwayThemeStyle(theme);
  const metricThemeStyle = getMetricThemeStyle(theme);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <View style={[styles.planPill, planPillThemeStyle]}>
            <AppText
              color="onPrimaryFixed"
              style={styles.planPillText}
              variant="labelMd"
            >
              CURRENT PLAN
            </AppText>
          </View>
          <AppText style={styles.amount} variant="displayLg">
            {formatMoney(overview?.remainingMinor ?? 0, "KES")}
          </AppText>
          <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
            left to allocate or spend safely this month
          </AppText>
        </View>
        <View style={[styles.daysBadge, daysBadgeThemeStyle]}>
          <AppText style={styles.daysNumber} variant="titleMd">
            {overview?.daysLeft ?? 0}
          </AppText>
          <AppText color="mutedText" style={styles.daysLabel} variant="bodyMd">
            days left
          </AppText>
        </View>
      </View>

      <View style={[styles.runway, runwayThemeStyle]}>
        <View style={styles.runwayTop}>
          <AppText style={styles.runwayTitle} variant="titleMd">
            Spending runway
          </AppText>
          <AppText color="primary" style={styles.runwayStatus} variant="labelMd">
            {overview?.runwayStatus ?? "On pace"}
          </AppText>
        </View>
        <View style={styles.progressBlock}>
          <ProgressBar color={theme.colors.primary} progress={progress} />
          <View style={styles.progressLabels}>
            <AppText color="mutedText" style={styles.progressLabel} variant="bodyMd">
              {formatMoney(overview?.spentMinor ?? 0, "KES")} spent
            </AppText>
            <AppText color="mutedText" style={styles.progressLabel} variant="bodyMd">
              {formatMoney(overview?.limitMinor ?? 0, "KES")} limit
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.metrics}>
        <View style={[styles.metric, metricThemeStyle]}>
          <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
            Safe per day
          </AppText>
          <AppText style={styles.metricValue} variant="titleMd">
            {formatMoney(overview?.safePerDayMinor ?? 0, "KES")}
          </AppText>
        </View>
        <View style={[styles.metric, metricThemeStyle]}>
          <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
            Expected buffer
          </AppText>
          <AppText color="primary" style={styles.metricValue} variant="titleMd">
            {formatMoney(overview?.bufferMinor ?? 0, "KES")}
          </AppText>
        </View>
      </View>
    </View>
  );
}

function getPlanPillThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primaryFixed,
  };
}

function getDaysBadgeThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.outlineVariant,
  };
}

function getRunwayThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.outlineVariant,
  };
}

function getMetricThemeStyle(theme: AppTheme): ViewStyle {
  return {
    borderColor: theme.colors.outlineVariant,
  };
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: font.headerExtraBold,
    fontSize: FontSizes["5xl"],
    flexShrink: 1,
    letterSpacing: -1.2,
    lineHeight: LineHeights["5xl"],
  },
  copy: {
    flex: 1,
    gap: Sizes.sm,
    minWidth: 0,
  },
  daysBadge: {
    alignItems: "center",
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    minWidth: Sizes["13xl"],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  daysLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  daysNumber: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["2xl"],
    lineHeight: LineHeights["3xl"],
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.lg,
    justifyContent: "space-between",
  },
  metric: {
    borderLeftWidth: Sizes.xs,
    flex: 1,
    gap: Sizes.xs,
    paddingLeft: Spacing.md,
  },
  metricLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  metrics: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  metricValue: {
    fontFamily: font.headerBold,
  },
  planPill: {
    alignSelf: "flex-start",
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  planPillText: {
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    lineHeight: LineHeights.xs,
  },
  progressBlock: {
    gap: Spacing.md,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  runway: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  runwayStatus: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  runwayTitle: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.lg,
  },
  runwayTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  section: {
    gap: Spacing.xl,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.xl,
    maxWidth: Sizes["18xl"],
  },
});

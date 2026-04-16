import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function BudgetOverviewCard() {
  const theme = useAppTheme();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <View
            style={[
              styles.planPill,
              { backgroundColor: theme.colors.primaryFixed },
            ]}
          >
            <AppText
              color="onPrimaryFixed"
              style={styles.planPillText}
              variant="labelMd"
            >
              APRIL PLAN
            </AppText>
          </View>
          <AppText style={styles.amount} variant="displayLg">
            KES 18,000
          </AppText>
          <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
            left to allocate before the month closes
          </AppText>
        </View>
        <View
          style={[
            styles.daysBadge,
            {
              backgroundColor: theme.colors.surfaceContainerLowest,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <AppText style={styles.daysNumber} variant="titleMd">
            18
          </AppText>
          <AppText color="mutedText" style={styles.daysLabel} variant="bodyMd">
            days left
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.runway,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.runwayTop}>
          <AppText style={styles.runwayTitle} variant="titleMd">
            Spending runway
          </AppText>
          <AppText color="primary" style={styles.runwayStatus} variant="labelMd">
            On pace
          </AppText>
        </View>
        <View style={styles.progressBlock}>
          <ProgressBar color={theme.colors.primary} progress={64} />
          <View style={styles.progressLabels}>
            <AppText color="mutedText" style={styles.progressLabel} variant="bodyMd">
              KES 32,000 spent
            </AppText>
            <AppText color="mutedText" style={styles.progressLabel} variant="bodyMd">
              KES 50,000 limit
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.metrics}>
        <View
          style={[
            styles.metric,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
            Safe per day
          </AppText>
          <AppText style={styles.metricValue} variant="titleMd">
            KES 2,500
          </AppText>
        </View>
        <View
          style={[
            styles.metric,
            { borderColor: theme.colors.outlineVariant },
          ]}
        >
          <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
            Expected buffer
          </AppText>
          <AppText color="primary" style={styles.metricValue} variant="titleMd">
            KES 9,200
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: font.headerExtraBold,
  },
  copy: {
    flex: 1,
    gap: Sizes.sm,
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
    maxWidth: Sizes["18xl"],
  },
});

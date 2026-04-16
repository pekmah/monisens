import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function TransactionHeroCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard elevated style={styles.hero}>
      <View style={styles.topRow}>
        <View style={[styles.icon, { backgroundColor: theme.colors.primaryFixed }]}>
          <AppText color="onPrimaryFixed" style={styles.initials} variant="labelMd">
            JH
          </AppText>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: theme.colors.primaryFixed },
          ]}
        >
          <Feather color={theme.colors.primary} name="check-circle" size={14} />
          <AppText color="onPrimaryFixed" style={styles.statusText} variant="labelMd">
            Completed
          </AppText>
        </View>
      </View>

      <View style={styles.mainCopy}>
        <AppText color="mutedText" style={styles.overline} variant="labelMd">
          JAVA HOUSE
        </AppText>
        <AppText style={styles.amount} variant="displayLg">
          - KES 1,200.00
        </AppText>
        <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
          Dining purchase from M-PESA
        </AppText>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <AppText color="mutedText" style={styles.summaryLabel} variant="bodyMd">
            Category
          </AppText>
          <AppText style={styles.summaryValue} variant="labelMd">
            Food & Drinks
          </AppText>
        </View>
        <View style={styles.summaryItem}>
          <AppText color="mutedText" style={styles.summaryLabel} variant="bodyMd">
            Account
          </AppText>
          <AppText style={styles.summaryValue} variant="labelMd">
            M-PESA
          </AppText>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["4xl"],
    lineHeight: LineHeights["5xl"],
  },
  divider: {
    height: Sizes.hairline,
    width: "100%",
  },
  hero: {
    gap: Spacing.xl,
    padding: Sizes["3xl"],
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["11xl"],
    justifyContent: "center",
    width: Sizes["11xl"],
  },
  initials: {
    fontFamily: font.headerBold,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights.xl,
  },
  mainCopy: {
    gap: Sizes.xs,
  },
  overline: {
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: Radii.full,
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusText: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  subtitle: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  summaryItem: {
    flex: 1,
    gap: Sizes.xxs,
  },
  summaryLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  summaryRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  summaryValue: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  topRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

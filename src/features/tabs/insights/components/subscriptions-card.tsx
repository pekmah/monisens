import { StyleSheet, View, type TextStyle, type ViewStyle } from "react-native";

import { AppFlashList } from "@/components/base";
import { AppPressable } from "@/components/base/app-pressable";
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
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { InsightSubscriptionRecord } from "@/lib/finance";

export type SubscriptionsCardProps = {
  onSetUpBill?: (subscription: InsightSubscriptionRecord) => void;
  subscriptions: InsightSubscriptionRecord[];
};

export function SubscriptionsCard({
  onSetUpBill,
  subscriptions,
}: SubscriptionsCardProps) {
  const theme = useAppTheme();
  const logoTileThemeStyle = getLogoTileThemeStyle(theme);
  const setupButtonThemeStyle = getSetupButtonThemeStyle(theme);

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.titleRow}>
        <AppText style={styles.title} variant="titleMd">
          Recurring Merchants
        </AppText>
        <AppPressable disabled>
          <AppText color="secondary" style={styles.manage} variant="labelMd">
            Suggestions
          </AppText>
        </AppPressable>
      </View>
      {subscriptions.length ? (
        <AppFlashList
          data={subscriptions}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(subscription) => subscription.id}
          renderItem={({ item: subscription }) => {
            const logoTextThemeStyle = getLogoTextThemeStyle(
              subscription.accent,
            );

            return (
              <View style={styles.row}>
                <View style={[styles.logoTile, logoTileThemeStyle]}>
                  <AppText
                    style={[styles.logoText, logoTextThemeStyle]}
                    variant="labelMd"
                  >
                    {getInitials(subscription.title)}
                  </AppText>
                </View>
                <View style={styles.copy}>
                  <AppText style={styles.subscriptionTitle} variant="labelMd">
                    {subscription.title}
                  </AppText>
                  <AppText color="mutedText" style={styles.meta} variant="bodyMd">
                    {subscription.meta}
                  </AppText>
                </View>
                <AppText style={styles.amount} variant="labelMd">
                  {subscription.amount}
                </AppText>
                {onSetUpBill ? (
                  <AppPressable
                    onPress={() => onSetUpBill(subscription)}
                    style={[styles.setupButton, setupButtonThemeStyle]}
                  >
                    <AppText
                      color="onPrimary"
                      style={styles.setupText}
                      variant="labelMd"
                    >
                      Set up
                    </AppText>
                  </AppPressable>
                ) : null}
              </View>
            );
          }}
        />
      ) : (
        <AppText color="mutedText" variant="bodyMd">
          Recurring merchants will appear after repeated expense activity is detected.
        </AppText>
      )}
    </SurfaceCard>
  );
}

function getLogoTileThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainer,
    borderColor: theme.colors.outlineVariant,
  };
}

function getLogoTextThemeStyle(color: string): TextStyle {
  return {
    color,
  };
}

function getSetupButtonThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primary,
  };
}

function getInitials(title: string) {
  return title
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  card: {
    gap: Spacing.md,
    padding: Sizes["3xl"],
  },
  copy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  logoText: {
    fontFamily: font.headerBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  logoTile: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  manage: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.xs,
  },
  meta: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  row: {
    alignItems: "center",
    borderRadius: Radii.lg,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["11xl"],
    paddingVertical: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
  },
  setupButton: {
    alignItems: "center",
    borderRadius: Radii.sm,
    justifyContent: "center",
    minHeight: Sizes["7xl"],
    paddingHorizontal: Spacing.md,
  },
  setupText: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  subscriptionTitle: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

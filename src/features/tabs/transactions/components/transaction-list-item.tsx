import { router } from "expo-router";
import { StyleSheet, View, type TextStyle, type ViewStyle } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type TransactionListItemData = {
  accent: string;
  amountLabel: string;
  category: string;
  hint?: string;
  id: string;
  time: string;
  title: string;
};

export type TransactionListItemProps = {
  transaction: TransactionListItemData;
};

export function TransactionListItem({ transaction }: TransactionListItemProps) {
  const theme = useAppTheme();
  const initials = getInitials(transaction.title);
  const itemThemeStyle = getItemThemeStyle(theme);
  const accentThemeStyle = getBackgroundThemeStyle(transaction.accent);
  const iconThemeStyle = getIconThemeStyle(theme);
  const accentTextThemeStyle = getTextColorThemeStyle(transaction.accent);

  return (
    <AppPressable
      onPress={() => router.push(`/transactions/${transaction.id}`)}
      style={[styles.item, theme.elevation.ambient, itemThemeStyle]}
    >
      <View style={[styles.accent, accentThemeStyle]} />
      <View style={[styles.icon, iconThemeStyle]}>
        <AppText
          numberOfLines={1}
          style={[styles.initials, accentTextThemeStyle]}
          variant="labelMd"
        >
          {initials}
        </AppText>
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="titleMd">
          {transaction.title}
        </AppText>
        <View style={styles.metaRow}>
          <AppText
            color="mutedText"
            numberOfLines={1}
            style={styles.time}
            variant="labelMd"
          >
            {transaction.time}
          </AppText>
          <View style={styles.metaDot} />
          <AppText
            numberOfLines={1}
            style={[styles.category, accentTextThemeStyle]}
            variant="labelMd"
          >
            {transaction.category.toUpperCase()}
          </AppText>
        </View>
      </View>
      <View style={styles.amountBlock}>
        <AppText numberOfLines={1} style={styles.amount} variant="titleMd">
          {transaction.amountLabel}
        </AppText>
        {transaction.hint ? (
          <AppText
            color="mutedText"
            numberOfLines={1}
            style={styles.hint}
            variant="labelMd"
          >
            {transaction.hint.toUpperCase()}
          </AppText>
        ) : null}
      </View>
    </AppPressable>
  );
}

function getItemThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    shadowColor: theme.colors.onSurface,
  };
}

function getBackgroundThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
}

function getIconThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainer,
  };
}

function getTextColorThemeStyle(color: string): TextStyle {
  return {
    color,
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

const styles = StyleSheet.create({
  accent: {
    borderBottomRightRadius: Radii.full,
    borderTopRightRadius: Radii.full,
    bottom: Sizes["3xl"],
    left: Sizes.none,
    position: "absolute",
    top: Sizes["3xl"],
    width: Sizes.xs,
  },
  amount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes.md,
    lineHeight: Sizes["2xl"],
    textAlign: "right",
  },
  amountBlock: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: Sizes.xxs,
    maxWidth: Sizes["17xl"] - Sizes["2xl"],
  },
  category: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.xs,
    letterSpacing: 0,
    lineHeight: Sizes.lg,
  },
  copy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: Sizes.none,
  },
  hint: {
    fontFamily: font.medium,
    fontSize: FontSizes.xs,
    lineHeight: Sizes.lg,
    textAlign: "right",
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["9xl"],
    justifyContent: "center",
    width: Sizes["9xl"],
  },
  initials: {
    fontFamily: font.headerBold,
    fontSize: FontSizes.md,
    letterSpacing: 0.4,
    lineHeight: Sizes["2xl"],
  },
  item: {
    alignItems: "center",
    borderRadius: Radii.xl,
    flexDirection: "row",
    gap: Spacing.lg,
    minHeight: Sizes["13xl"],
    overflow: "hidden",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Sizes.xs,
  },
  metaDot: {
    backgroundColor: "rgba(112,122,108,0.55)",
    borderRadius: Radii.full,
    height: Sizes.xxs,
    width: Sizes.xxs,
  },
  metaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Sizes.xs,
  },
  time: {
    fontFamily: font.regular,
    fontSize: FontSizes.sm,
    lineHeight: Sizes.lg,
  },
  title: {
    fontFamily: font.medium,
    fontSize: FontSizes.md,
    lineHeight: Sizes["2xl"],
  },
});

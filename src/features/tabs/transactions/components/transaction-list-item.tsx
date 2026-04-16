import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type TransactionListItemData = {
  accent: string;
  amount: string;
  category: string;
  hint?: string;
  time: string;
  title: string;
};

export type TransactionListItemProps = {
  transaction: TransactionListItemData;
};

export function TransactionListItem({ transaction }: TransactionListItemProps) {
  const theme = useAppTheme();
  const initials = getInitials(transaction.title);

  return (
    <AppPressable
      onPress={() => router.push("/transactions/java-house")}
      style={[
        styles.item,
        theme.elevation.ambient,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
          shadowColor: theme.colors.onSurface,
        },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: transaction.accent }]} />
      <View
        style={[
          styles.icon,
          { backgroundColor: theme.colors.surfaceContainer },
        ]}
      >
        <AppText
          numberOfLines={1}
          style={[styles.initials, { color: transaction.accent }]}
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
            style={[styles.category, { color: transaction.accent }]}
            variant="labelMd"
          >
            {transaction.category.toUpperCase()}
          </AppText>
        </View>
      </View>
      <View style={styles.amountBlock}>
        <AppText numberOfLines={1} style={styles.amount} variant="titleMd">
          {transaction.amount}
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
    fontSize: FontSizes.xs,
    lineHeight: Sizes.lg,
    textAlign: "right",
    fontFamily: font.medium,
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
    fontSize: FontSizes.sm,
    lineHeight: Sizes.lg,
    fontFamily: font.regular,
  },
  title: {
    fontFamily: font.medium,
    fontSize: FontSizes.md,
    lineHeight: Sizes["2xl"],
  },
});

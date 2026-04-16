import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

export type TransactionListItemData = {
  accent: string;
  amount: string;
  category: string;
  hint?: string;
  icon: FeatherName;
  time: string;
  title: string;
};

export type TransactionListItemProps = {
  transaction: TransactionListItemData;
};

export function TransactionListItem({
  transaction,
}: TransactionListItemProps) {
  const theme = useAppTheme();

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
        <Feather
          color={theme.colors.onSurfaceVariant}
          name={transaction.icon}
          size={Sizes["2xl"]}
        />
      </View>
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="titleMd">
          {transaction.title}
        </AppText>
        <View style={styles.metaRow}>
          <AppText color="mutedText" numberOfLines={1} style={styles.time} variant="labelMd">
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
          <AppText color="mutedText" numberOfLines={1} style={styles.hint} variant="labelMd">
            {transaction.hint.toUpperCase()}
          </AppText>
        ) : null}
      </View>
    </AppPressable>
  );
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
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["9xl"],
    justifyContent: "center",
    width: Sizes["9xl"],
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
  },
  title: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.lg,
    lineHeight: Sizes["2xl"],
  },
});

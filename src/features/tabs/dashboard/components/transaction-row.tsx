import { Feather } from "@expo/vector-icons";
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

import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

export type TransactionRowProps = {
  accent: string;
  amount: string;
  bg: string;
  icon?: FeatherName;
  id: string;
  meta: string;
  title: string;
};

export function TransactionRow({
  accent,
  amount,
  bg,
  icon = "credit-card",
  id,
  meta,
  title,
}: TransactionRowProps) {
  const theme = useAppTheme();
  const isIncome = amount.startsWith("+");
  const amountColor = isIncome ? theme.colors.primary : theme.colors.text;
  const rowThemeStyle = getRowThemeStyle(theme);
  const iconWrapThemeStyle = getIconWrapThemeStyle(bg);
  const accentBarThemeStyle = getAccentBarThemeStyle(accent);
  const amountThemeStyle = getAmountThemeStyle(amountColor);

  return (
    <AppPressable
      onPress={() => router.push(`/transactions/${id}`)}
      style={[styles.row, rowThemeStyle]}
    >
      <View style={[styles.iconWrap, iconWrapThemeStyle]}>
        <Feather color={accent} name={icon} size={Sizes["2xl"]} />
      </View>
      <View style={[styles.accentBar, accentBarThemeStyle]} />
      <View style={styles.copy}>
        <View style={styles.details}>
          <View style={styles.flex}>
            <AppText numberOfLines={1} style={styles.title} variant="titleMd">
              {title}asdfasdfasdfasdfasdfasdfasd
            </AppText>
          </View>

          <View style={styles.amountWrap}>
            <AppText
              numberOfLines={1}
              style={[styles.amount, amountThemeStyle]}
              variant="labelMd"
            >
              {amount}
            </AppText>
          </View>
        </View>

        <View style={styles.flex}>
          <AppText color="mutedText" style={styles.meta} variant="labelMd">
            {meta}
          </AppText>
        </View>
      </View>
    </AppPressable>
  );
}

function getRowThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.outlineVariant,
  };
}

function getIconWrapThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
}

function getAccentBarThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
}

function getAmountThemeStyle(color: string): TextStyle {
  return {
    color,
  };
}

const styles = StyleSheet.create({
  accentBar: {
    alignSelf: "stretch",
    borderRadius: Radii.full,
    height: Sizes["6xl"],
    marginVertical: "auto",
    width: Sizes.xs,
  },
  amount: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.md,
  },
  copy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: Sizes.none,
  },
  detailDivider: {
    backgroundColor: "rgba(112,122,108,0.35)",
    borderRadius: Radii.full,
    height: Sizes.xs,
    width: Sizes.xs,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    gap: Sizes.xs,
  },
  amountWrap: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  flex: {
    flex: 1,
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["10xl"],
    justifyContent: "center",
    overflow: "hidden",
    width: Sizes["10xl"],
  },
  meta: {
    fontFamily: font.regular,
    fontSize: FontSizes.sm,
    lineHeight: Sizes.lg,
    textOverflow: "wrap",
  },
  row: {
    alignItems: "center",
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["13xl"],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.md,
    lineHeight: Sizes["2xl"],
    textOverflow: "ellipsis",
  },
});

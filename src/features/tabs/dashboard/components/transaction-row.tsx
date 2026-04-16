import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { FontSizes, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

export type TransactionRowProps = {
  accent: string;
  amount: string;
  bg: string;
  icon: FeatherName;
  meta: string;
  title: string;
};

export function TransactionRow({
  accent,
  amount,
  bg,
  icon,
  meta,
  title,
}: TransactionRowProps) {
  const theme = useAppTheme();
  const isIncome = amount.startsWith("+");

  return (
    <AppPressable style={styles.row}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Feather color={accent} name={icon} size={21} />
      </View>
      <View style={[styles.copy, { borderLeftColor: accent }]}>
        <AppText variant="titleMd">{title}</AppText>
        <AppText color="mutedText" variant="labelMd">
          {meta}
        </AppText>
      </View>
      <AppText
        style={[
          styles.amount,
          { color: isIncome ? theme.colors.primary : theme.colors.text },
        ]}
        variant="titleMd"
      >
        {amount}
      </AppText>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontSize: FontSizes.lg,
    fontWeight: "700",
  },
  copy: {
    borderLeftWidth: 4,
    flex: 1,
    gap: Sizes.xxs,
    paddingLeft: Sizes.md + Sizes.xxs,
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.md + Sizes.xxs,
    height: Sizes["9xl"],
    justifyContent: "center",
    width: Sizes["9xl"],
  },
  row: {
    alignItems: "center",
    borderRadius: Sizes.xl,
    flexDirection: "row",
    gap: Sizes.md + Sizes.xxs,
    minHeight: Sizes["13xl"] - Sizes.xs,
    paddingHorizontal: Spacing.md,
  },
});

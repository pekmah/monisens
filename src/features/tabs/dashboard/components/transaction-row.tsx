import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
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
  const amountColor = isIncome ? theme.colors.primary : theme.colors.text;

  return (
    <AppPressable
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Feather color={accent} name={icon} size={Sizes["2xl"]} />
      </View>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.copy}>
        <AppText numberOfLines={1} style={styles.title} variant="titleMd">
          {title}
        </AppText>
        <View style={styles.detailsRow}>
          <AppText
            color="mutedText"
            numberOfLines={1}
            style={styles.meta}
            variant="labelMd"
          >
            {meta}
          </AppText>
          <View style={styles.detailDivider} />
          <View
            style={{
              flex: 1,
              minWidth: Sizes.none,
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <AppText
              numberOfLines={1}
              style={[styles.amount, { color: amountColor }]}
              variant="labelMd"
            >
              {amount}
            </AppText>
          </View>
        </View>
      </View>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  accentBar: {
    alignSelf: "stretch",
    borderRadius: Radii.full,
    marginVertical: "auto",
    width: Sizes.xs,
    height: Sizes["6xl"],
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
  detailsRow: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Sizes.xs,
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
    fontSize: FontSizes.sm,
    lineHeight: Sizes.lg,
    fontFamily: font.regular,
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
  },
});

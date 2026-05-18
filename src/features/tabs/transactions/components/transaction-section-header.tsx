import { StyleSheet } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { Spacing } from "@/constants/theme";

export type TransactionSectionHeaderProps = {
  title: string;
};

export function TransactionSectionHeader({ title }: TransactionSectionHeaderProps) {
  return (
    <AppText color="mutedText" style={styles.sectionTitle} variant="labelMd">
      {title.toUpperCase()}
    </AppText>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontFamily: font.headerSemiBold,
    letterSpacing: 1.8,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
  },
});

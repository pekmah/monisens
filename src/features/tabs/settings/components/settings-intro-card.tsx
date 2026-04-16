import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";

export function SettingsIntroCard() {
  return (
    <View style={styles.header}>
      <AppText color="primary" style={styles.overline} variant="labelMd">
        CONFIGURATION
      </AppText>
      <AppText style={styles.title} variant="headlineSm">
        Settings & Privacy
      </AppText>
      <AppText color="mutedText" style={styles.description} variant="bodyMd">
        Tailor your intelligence experience and manage your financial data footprint.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  description: {
    maxWidth: Sizes["20xl"] + Sizes["10xl"],
  },
  header: {
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  title: {
    fontFamily: font.headerBold,
  },
});

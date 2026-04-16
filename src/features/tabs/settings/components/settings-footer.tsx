import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Spacing } from "@/constants/theme";

export function SettingsFooter() {
  return (
    <View style={styles.footer}>
      <AppText color="outline" style={styles.version} variant="labelMd">
        EDITORIAL INTELLIGENCE V4.2.0-STABLE
      </AppText>
      <AppText color="outline" style={styles.caption} variant="bodyMd">
        Designed for the informed minimalist.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.xl,
  },
  caption: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.lg,
  },
  version: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.6,
    lineHeight: LineHeights.xs,
  },
});

import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Spacing } from "@/constants/theme";

export function SettingsFooter() {
  return (
    <View style={styles.footer}>
      <AppText color="mutedText" variant="labelMd">
        EDITORIAL INTELLIGENCE V4.2.0-STABLE
      </AppText>
      <AppText color="mutedText" variant="bodyMd">
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
});

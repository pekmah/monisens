import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export function DetailHeader() {
  const theme = useAppTheme();

  return (
    <View style={styles.header}>
      <AppPressable
        onPress={() => router.back()}
        style={[
          styles.back,
          { backgroundColor: theme.colors.surfaceContainerLowest },
        ]}
      >
        <Feather color={theme.colors.primary} name="arrow-left" size={18} />
      </AppPressable>
      <View>
        <AppText color="mutedText" style={styles.eyebrow} variant="labelMd">
          TRANSACTION
        </AppText>
        <AppText style={styles.title} variant="titleMd">
          Local receipt details
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  eyebrow: {
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

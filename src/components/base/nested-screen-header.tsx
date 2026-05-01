import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type NestedScreenHeaderProps = {
  description?: string;
  overline?: string;
  style?: StyleProp<ViewStyle>;
  title: string;
};

export function NestedScreenHeader({
  description,
  overline,
  style,
  title,
}: NestedScreenHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <AppPressable
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={[
          styles.backButton,
          { backgroundColor: theme.colors.surfaceContainerLow },
        ]}
      >
        <Feather color={theme.colors.text} name="arrow-left" size={18} />
      </AppPressable>

      <View style={styles.copy}>
        {overline ? (
          <AppText color="primary" style={styles.overline} variant="labelMd">
            {overline}
          </AppText>
        ) : null}
        <AppText style={styles.title} variant="headlineSm">
          {title}
        </AppText>
        {description ? (
          <AppText color="mutedText" style={styles.description} variant="bodyMd">
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  container: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
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

export default NestedScreenHeader;

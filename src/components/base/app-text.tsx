import { StyleSheet, Text, type TextProps, type TextStyle } from "react-native";

import { Typography, type AppThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  getScaledTypographyStyle,
  shouldScaleVariant,
  type AppTextVariant,
} from "@/lib/font-scale";
import { useThemeController } from "@/lib/theme-controller";

export type AppTextProps = TextProps & {
  color?: keyof AppThemeColors;
  scaleBehavior?: "always" | "auto" | "never";
  variant?: AppTextVariant;
};

export function AppText({
  color = "text",
  scaleBehavior = "auto",
  style,
  variant = "bodyLg",
  ...props
}: AppTextProps) {
  const theme = useAppTheme();
  const { fontScale } = useThemeController();
  const mergedStyle = StyleSheet.flatten([
    Typography[variant],
    style,
  ]) as TextStyle | undefined;
  const resolvedColor = mergedStyle?.color ?? theme.colors[color];
  const variantStyle =
    scaleBehavior === "never"
      ? mergedStyle
      : scaleBehavior === "always" || shouldScaleVariant(variant)
        ? getScaledTypographyStyle(mergedStyle ?? Typography[variant], fontScale)
        : mergedStyle;

  return (
    <Text
      style={[
        variantStyle,
        {
          color: resolvedColor,
        },
      ]}
      {...props}
    />
  );
}

export default AppText;

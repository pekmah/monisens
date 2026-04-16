import { Text, type TextProps } from "react-native";

import { Typography, type AppThemeColors } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type AppTextVariant = keyof typeof Typography;

export type AppTextProps = TextProps & {
  color?: keyof AppThemeColors;
  variant?: AppTextVariant;
};

export function AppText({
  color = "text",
  style,
  variant = "bodyLg",
  ...props
}: AppTextProps) {
  const theme = useAppTheme();

  return (
    <Text
      style={[
        Typography[variant],
        {
          color: theme.colors[color],
        },
        style,
      ]}
      {...props}
    />
  );
}

export default AppText;

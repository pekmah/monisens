import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

type EntryMethodCardProps = {
  active?: boolean;
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  meta: string;
  onPress: () => void;
};

export function EntryMethodCard({
  active,
  icon,
  label,
  meta,
  onPress,
}: EntryMethodCardProps) {
  const theme = useAppTheme();

  return (
    <AppPressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: active
            ? theme.colors.primaryContainer
            : theme.colors.surfaceContainerLowest,
          borderColor: active
            ? theme.colors.primary
            : theme.colors.outlineVariant,
        },
      ]}
    >
      <View
        style={[
          styles.iconTile,
          {
            backgroundColor: active
              ? theme.colors.onPrimaryContainer + "16"
              : theme.colors.surfaceContainer,
          },
        ]}
      >
        <Feather
          color={
            active ? theme.colors.onPrimaryContainer : theme.colors.primary
          }
          name={icon}
          size={18}
        />
      </View>
      <View style={styles.copy}>
        <AppText
          color={active ? "onPrimaryContainer" : "text"}
          style={styles.label}
          variant="titleMd"
        >
          {label}
        </AppText>
        <AppText
          color={active ? "onPrimaryContainer" : "mutedText"}
          style={styles.meta}
          variant="bodyMd"
        >
          {meta}
        </AppText>
      </View>
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["12xl"],
    padding: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.md,
    height: Sizes["7xl"],
    justifyContent: "center",
    width: Sizes["7xl"],
  },
  label: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.lg,
  },
  meta: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
});

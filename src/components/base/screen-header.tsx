import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const DEFAULT_AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAGzqnsedRFVa_EJq5Zrq_Q1T6S2hKvKRNZJBnCAA-MgpoAZp_G94QTFmqG3nSxA99VkjQgF1Xi32XkhkrcJ1h4XloWp94qxceRzCF4dJnVIaSKwok8uZJEvAI0gVwhpvW8mywnfolEVGkAczCvWgEKLLcwoKkQRPctukQ6N-urvTFKBvoO4T9QqV5bbd8xG6i4hHIEST1hJn8Gvx9Z2xmAFlMNdr3vtW9zl_3fT81MGSbsLWgK4p6x5dkVzWDNeYrVyCrgNrfU6i3M";

export type ScreenHeaderProps = {
  avatarUri?: string;
  onNotificationsPress?: () => void;
  style?: StyleProp<ViewStyle>;
  title?: string;
};

export function ScreenHeader({
  avatarUri = DEFAULT_AVATAR,
  onNotificationsPress,
  style,
  title = "Intelligence",
}: ScreenHeaderProps) {
  const theme = useAppTheme();
  const { top } = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: top,
        backgroundColor: theme.colors.surfaceContainerLow,
      }}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
          },
          style,
        ]}
      >
        <View style={styles.brandRow}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
          <AppText
            style={[styles.title, { color: theme.colors.primary }]}
            variant="titleMd"
          >
            {title}
          </AppText>
        </View>
        <AppPressable
          accessibilityLabel="Notifications"
          onPress={onNotificationsPress}
          style={styles.actionButton}
        >
          <Feather color={theme.colors.icon} name="bell" size={20} />
        </AppPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["7xl"],
    justifyContent: "center",
    width: Sizes["7xl"],
  },
  avatar: {
    borderRadius: Radii.full,
    height: Sizes["7xl"],
    width: Sizes["7xl"],
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  container: {
    alignItems: "center",
    borderRadius: Radii.xl,
    elevation: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    shadowOpacity: 0,
  },
  title: {
    fontFamily: font.headerExtraBold,
  },
});

export default ScreenHeader;

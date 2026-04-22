import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { ScreenHeader } from "@/components/base";
import { AppText } from "@/components/base/app-text";
import { HapticTab } from "@/components/haptic-tab";
import { FontSizes, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ComponentProps } from "react";

type FeatherName = ComponentProps<typeof Feather>["name"];

export default function TabLayout() {
  const theme = useAppTheme();
  const tabIconSize = theme.sizes["2xl"];

  const renderTabLabel = ({
    children,
    color,
    focused,
  }: {
    children: string;
    color: string;
    focused: boolean;
  }) => (
    <TabLabel
      activeColor={theme.colors.primary}
      color={color}
      focused={focused}
      label={children}
    />
  );

  const renderTabIcon = ({
    color,
    focused,
    name,
  }: {
    color: string;
    focused: boolean;
    name: FeatherName;
  }) => (
    <TabIcon
      activeBackground={theme.colors.surfaceContainerHighest}
      color={color}
      focused={focused}
      name={name}
      size={tabIconSize}
    />
  );

  return (
    <Tabs
      screenOptions={{
        animation: "shift",
        header: () => <ScreenHeader />,
        headerShown: true,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: theme.colors.tabIconSelected,
        tabBarButton: HapticTab,
        tabBarHideOnKeyboard: true,
        tabBarIconStyle: styles.tabIcon,
        tabBarInactiveTintColor: theme.colors.tabIconDefault,
        tabBarItemStyle: styles.tabItem,
        tabBarLabel: renderTabLabel,
        tabBarLabelPosition: "below-icon",
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderTopColor: theme.colors.outlineVariant,
          minHeight: Sizes["13xl"],
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon({ color, focused, name: "home" }),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon({ color, focused, name: "file-text" }),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon({ color, focused, name: "credit-card" }),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon({ color, focused, name: "bar-chart-2" }),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) =>
            renderTabIcon({ color, focused, name: "settings" }),
        }}
      />
    </Tabs>
  );
}

function TabIcon({
  activeBackground,
  color,
  focused,
  name,
  size,
}: {
  activeBackground: string;
  color: string;
  focused: boolean;
  name: FeatherName;
  size: number;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [focused, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(0,0,0,0)", activeBackground],
    ),
    opacity: progress.value,
    transform: [
      { scaleX: 0.35 + progress.value * 0.65 },
      { scaleY: 0.82 + progress.value * 0.18 },
    ],
  }));

  return (
    <View style={styles.iconShell}>
      <Animated.View style={[styles.iconBackground, animatedStyle]} />
      <Feather color={color} name={name} size={size} />
    </View>
  );
}

function TabLabel({
  activeColor,
  color,
  focused,
  label,
}: {
  activeColor: string;
  color: string;
  focused: boolean;
  label: string;
}) {
  const progress = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 180 });
  }, [focused, progress]);

  const indicatorStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ["rgba(0,0,0,0)", activeColor],
    ),
    opacity: progress.value,
    transform: [{ scaleX: progress.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(focused ? -1 : 0, { duration: 180 }) }],
  }));

  return (
    <View style={styles.labelShell}>
      <Animated.View style={labelStyle}>
        <AppText
          numberOfLines={1}
          style={[styles.tabLabel, { color }]}
          variant="labelMd"
        >
          {label}
        </AppText>
      </Animated.View>
      <Animated.View style={[styles.activeIndicator, indicatorStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  activeIndicator: {
    borderRadius: Radii.full,
    height: Sizes.xs,
    marginTop: Sizes.xs,
    width: Sizes["3xl"],
  },
  iconShell: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["6xl"],
    justifyContent: "center",
    overflow: "hidden",
    width: Sizes["7xl"],
  },
  iconBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: Radii.full,
  },
  labelShell: {
    alignItems: "center",
    minWidth: Sizes["13xl"],
  },
  tabIcon: {
    marginBottom: Sizes.none,
    marginTop: Sizes.xs,
  },
  tabItem: {
    paddingHorizontal: Sizes.xxs,
  },
  tabLabel: {
    fontSize: FontSizes.sm,
    lineHeight: Sizes.lg,
    marginVertical: 1,
    marginTop: Sizes.xs,
  },
});

import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { ScreenHeader } from "@/components/base";
import { HapticTab } from "@/components/haptic-tab";
import { useAppTheme } from "@/hooks/use-app-theme";

export default function TabLayout() {
  const theme = useAppTheme();
  const tabIconSize = theme.sizes["2xl"] + theme.sizes.xxs;

  return (
    <Tabs
      screenOptions={{
        header: () => <ScreenHeader />,
        headerShown: true,
        tabBarActiveTintColor: theme.colors.tabIconSelected,
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: theme.colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.labelMd.fontFamily,
          fontSize: theme.typography.labelMd.fontSize,
          fontWeight: theme.typography.labelMd.fontWeight,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Feather size={tabIconSize} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color }) => (
            <Feather size={tabIconSize} name="file-text" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: "Budget",
          tabBarIcon: ({ color }) => (
            <Feather size={tabIconSize} name="credit-card" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color }) => (
            <Feather size={tabIconSize} name="bar-chart-2" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <Feather size={tabIconSize} name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

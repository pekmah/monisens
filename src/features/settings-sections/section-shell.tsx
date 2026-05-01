import { Stack } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { NestedScreenHeader, Screen } from "@/components/base";
import { Sizes, Spacing } from "@/constants/theme";

import type { ReactNode } from "react";

export function SettingsSectionShell({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <NestedScreenHeader description={description} overline="SETTINGS" title={title} />
          {children}
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
    paddingTop: Spacing.sm,
  },
  screen: {
    flex: 1,
  },
});

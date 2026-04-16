import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import type { ReactNode } from "react";

export type InsightCardProps = {
  accent: string;
  children: ReactNode;
};

export function InsightCard({ accent, children }: InsightCardProps) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderLeftColor: accent,
        },
      ]}
    >
      <AppText color="mutedText" variant="bodyMd">
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 1,
    borderRadius: Sizes.md,
    padding: Spacing.lg,
  },
});

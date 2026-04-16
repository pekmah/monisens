import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { IconTile, SurfaceCard } from "@/features/tabs/_components";

export function SuggestionCard() {
  return (
    <SurfaceCard style={styles.card} tone="low">
      <IconTile icon="zap" />
      <View style={styles.copy}>
        <AppText variant="titleMd">Smart Suggestion</AppText>
        <AppText color="mutedText" variant="bodyMd">
          Split KES 4,500 into Food & Drinks and Client Meetings for cleaner
          monthly reporting.
        </AppText>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: Sizes.md + Sizes.xxs,
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
});

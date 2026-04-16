import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function BudgetTipCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard style={styles.card} tone="low">
      <View style={[styles.icon, { backgroundColor: theme.colors.tertiaryFixed }]}>
        <Feather color={theme.colors.tertiary} name="zap" size={18} />
      </View>
      <View style={styles.copy}>
        <AppText variant="titleMd">Cut subscriptions to save KES 1,200</AppText>
        <AppText color="mutedText" variant="bodyMd">
          We found 3 recurring payments you have not used in 60 days.
        </AppText>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    gap: Sizes.md + Sizes.xxs,
  },
  copy: {
    flex: 1,
    gap: Spacing.xs,
  },
  icon: {
    alignItems: "center",
    borderRadius: Sizes.xl,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
});

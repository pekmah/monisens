import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function BudgetOverviewCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard elevated style={styles.card}>
      <AppText color="mutedText" variant="labelMd">
        MONTHLY OVERVIEW
      </AppText>
      <AppText variant="displayLg">KES 18,000</AppText>
      <AppText color="mutedText" variant="bodyMd">
        Remaining of KES 50,000 budget
      </AppText>
      <ProgressBar color={theme.colors.primary} progress={64} />
      <View style={styles.footer}>
        <AppText color="mutedText" variant="bodyMd">
          Spent: KES 32,000
        </AppText>
        <AppText color="mutedText" variant="bodyMd">
          Limit: KES 50,000
        </AppText>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

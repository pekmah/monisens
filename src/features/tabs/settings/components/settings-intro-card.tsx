import { StyleSheet } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";

export function SettingsIntroCard() {
  return (
    <SurfaceCard style={styles.card} tone="primary">
      <AppText color="onPrimary" variant="headlineSm">
        Settings & Privacy
      </AppText>
      <AppText color="onPrimary" variant="bodyMd">
        Tailor your intelligence experience and manage your financial data footprint.
      </AppText>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.sm,
  },
});

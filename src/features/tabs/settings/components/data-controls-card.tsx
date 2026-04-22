import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

const CLOUD_URL = "https://formal-meerkat-474.convex.cloud";
const HTTP_ACTIONS_URL = "https://formal-meerkat-474.convex.site";

export function DataControlsCard() {
  const theme = useAppTheme();
  const { snapshot, syncNow } = useFinance();

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: `${theme.colors.secondary}14` },
          ]}
        >
          <Feather color={theme.colors.secondary} name="database" size={18} />
        </View>
        <AppText style={styles.title} variant="titleMd">
          Data Management
        </AppText>
      </View>

      <View style={styles.controls}>
        <View
          style={[
            styles.control,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <AppText style={[styles.controlTitle, { color: theme.colors.primary }]} variant="labelMd">
            Local source of truth
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            {snapshot?.transactions.length ?? 0} transactions, {snapshot?.budgets.length ?? 0} budgets, {snapshot?.imports.length ?? 0} imports, and {snapshot?.attachments.length ?? 0} attachments are stored locally.
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            {snapshot?.sync.pendingOutboxCount ?? 0} record(s) are queued in the outbox.
          </AppText>
          <AppButton onPress={() => void syncNow()} title="Run sync now" variant="secondary" />
        </View>

        <View
          style={[
            styles.control,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <AppText style={[styles.controlTitle, { color: theme.colors.tertiary }]} variant="labelMd">
            Remote transport
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            Cloud URL: {CLOUD_URL}
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            HTTP Actions URL: {HTTP_ACTIONS_URL}
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            Current status: {snapshot?.sync.status ?? "idle"}
          </AppText>
          {snapshot?.sync.errorMessage ? (
            <AppText color="error" style={styles.controlMeta} variant="bodyMd">
              {snapshot.sync.errorMessage}
            </AppText>
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xl,
  },
  control: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  controlMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  controls: {
    gap: Spacing.md,
  },
  controlTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

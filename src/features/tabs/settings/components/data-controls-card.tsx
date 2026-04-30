import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";
import { getConfiguredConvexCloudUrl, getConfiguredConvexSiteUrl } from "@/lib/finance/sync-transport";

const CLOUD_URL = getConfiguredConvexCloudUrl();
const HTTP_ACTIONS_URL = getConfiguredConvexSiteUrl();

export function DataControlsCard() {
  const theme = useAppTheme();
  const { snapshot, syncNow } = useFinance();
  const sync = snapshot?.sync;
  const trackedEntityCount = sync?.trackedEntityCount ?? 0;
  const syncedEntityCount = sync?.syncedEntityCount ?? 0;
  const unsyncedEntityCount = sync?.unsyncedEntityCount ?? 0;
  const syncingEntityCount = sync?.syncingEntityCount ?? 0;
  const failedEntityCount = sync?.failedEntityCount ?? 0;
  const progress =
    trackedEntityCount > 0
      ? Math.round((syncedEntityCount / trackedEntityCount) * 100)
      : sync?.status === "idle"
        ? 100
        : 0;
  const statusTone =
    sync?.status === "error" || failedEntityCount > 0 || (sync?.openConflictCount ?? 0) > 0
      ? theme.colors.error
      : sync?.status === "syncing"
        ? theme.colors.secondary
        : sync?.status === "offline" || sync?.status === "disabled"
          ? theme.colors.tertiary
          : theme.colors.primary;
  const statusLabel = getStatusLabel(sync?.status ?? "idle", {
    failedEntityCount,
    hasRemote: sync?.hasRemote ?? false,
    isOnline: sync?.isOnline ?? true,
    openConflictCount: sync?.openConflictCount ?? 0,
    pendingOutboxCount: sync?.pendingOutboxCount ?? 0,
    syncingEntityCount,
    unsyncedEntityCount,
  });
  const transportLabel = !sync?.hasRemote
    ? "Cloud relay disabled"
    : sync.isOnline
      ? "Cloud relay available"
      : "Cloud relay waiting for connection";
  const showCurrentError = shouldShowCurrentError({
    errorMessage: sync?.errorMessage ?? null,
    lastAttemptedAt: sync?.lastAttemptedAt ?? null,
    lastSuccessfulSyncAt: sync?.lastSuccessfulSyncAt ?? null,
    status: sync?.status ?? "idle",
  });

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
          <View style={styles.syncHeaderRow}>
            <View style={styles.syncHeaderCopy}>
              <AppText style={[styles.controlTitle, { color: statusTone }]} variant="labelMd">
                Sync activity
              </AppText>
              <AppText style={styles.syncHeadline} variant="titleMd">
                {statusLabel}
              </AppText>
            </View>
            <View
              style={[
                styles.statusPill,
                { backgroundColor: `${statusTone}16`, borderColor: `${statusTone}32` },
              ]}
            >
              <AppText style={[styles.statusPillText, { color: statusTone }]} variant="labelMd">
                {progress}%
              </AppText>
            </View>
          </View>
          <ProgressBar color={statusTone} progress={progress} />
          <View style={styles.metricsRow}>
            <MetricTile label="Queued" value={String(sync?.pendingOutboxCount ?? 0)} />
            <MetricTile label="In sync" value={String(syncedEntityCount)} />
            <MetricTile label="Needs sync" value={String(unsyncedEntityCount)} />
          </View>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            {snapshot?.transactions.length ?? 0} transactions, {snapshot?.budgets.length ?? 0} budgets, {snapshot?.categories.length ?? 0} categories, {snapshot?.imports.length ?? 0} imports, and {snapshot?.attachments.length ?? 0} attachments stay local first and sync in the background.
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            {buildTimingMeta(sync?.lastSuccessfulSyncAt ?? null, sync?.lastAttemptedAt ?? null)}
          </AppText>
          {showCurrentError && sync?.errorMessage ? (
            <AppText color="error" style={styles.controlMeta} variant="bodyMd">
              {sync.errorMessage}
            </AppText>
          ) : null}
          {(sync?.openConflictCount ?? 0) > 0 ? (
            <AppText color="error" style={styles.controlMeta} variant="bodyMd">
              {sync?.openConflictCount} conflict(s) need review before all records can converge.
            </AppText>
          ) : null}
          <AppButton loading={sync?.status === "syncing"} onPress={() => void syncNow()} title="Run sync now" variant="secondary" />
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
            Cloud relay
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            {transportLabel}
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            SQLite is still the UI source of truth. The relay only pushes queued changes to Convex and pulls remote changes back into local storage.
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            Cloud URL: {CLOUD_URL}
          </AppText>
          <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
            HTTP Actions URL: {HTTP_ACTIONS_URL}
          </AppText>
        </View>
      </View>
    </SurfaceCard>
  );
}

function shouldShowCurrentError(input: {
  errorMessage: string | null;
  lastAttemptedAt: number | null;
  lastSuccessfulSyncAt: number | null;
  status: "idle" | "syncing" | "offline" | "disabled" | "error";
}) {
  if (!input.errorMessage) {
    return false;
  }

  if (input.status === "syncing") {
    return false;
  }

  if (input.status === "error") {
    return true;
  }

  if (!input.lastSuccessfulSyncAt) {
    return true;
  }

  if (!input.lastAttemptedAt) {
    return false;
  }

  return input.lastSuccessfulSyncAt < input.lastAttemptedAt;
}

function MetricTile({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metricTile,
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="titleMd">
        {value}
      </AppText>
    </View>
  );
}

function getStatusLabel(
  status: "idle" | "syncing" | "offline" | "disabled" | "error",
  input: {
    failedEntityCount: number;
    hasRemote: boolean;
    isOnline: boolean;
    openConflictCount: number;
    pendingOutboxCount: number;
    syncingEntityCount: number;
    unsyncedEntityCount: number;
  },
) {
  if (!input.hasRemote || status === "disabled") {
    return "Cloud sync is not configured";
  }

  if (!input.isOnline || status === "offline") {
    return input.pendingOutboxCount > 0
      ? `${input.pendingOutboxCount} change(s) waiting for a connection`
      : "Offline. Local data is still available";
  }

  if (input.openConflictCount > 0) {
    return `${input.openConflictCount} conflict(s) detected`;
  }

  if (status === "error" || input.failedEntityCount > 0) {
    return "Some changes failed to sync";
  }

  if (status === "syncing") {
    return input.pendingOutboxCount > 0 || input.syncingEntityCount > 0
      ? "Sync in progress"
      : "Checking for remote changes";
  }

  if (input.unsyncedEntityCount > 0) {
    return `${input.unsyncedEntityCount} item(s) still need sync`;
  }

  return "Everything is synced";
}

function buildTimingMeta(lastSuccessfulSyncAt: number | null, lastAttemptedAt: number | null) {
  if (lastSuccessfulSyncAt) {
    return `Last successful sync ${formatRelativeTime(lastSuccessfulSyncAt)}.`;
  }

  if (lastAttemptedAt) {
    return `Last sync attempt ${formatRelativeTime(lastAttemptedAt)}.`;
  }

  return "No sync has completed yet on this device.";
}

function formatRelativeTime(timestamp: number) {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.round(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "just now";
  }

  if (diffMinutes < 60) {
    return formatElapsed(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return formatElapsed(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatElapsed(diffDays, "day");
}

function formatElapsed(value: number, unit: "minute" | "hour" | "day") {
  if (value <= 1) {
    return `1 ${unit} ago`;
  }

  return `${value} ${unit}s ago`;
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
  metricLabel: {
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  metricTile: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Spacing.xs,
    minHeight: Sizes["11xl"],
    padding: Spacing.md,
  },
  metricValue: {
    fontFamily: font.headerSemiBold,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statusPill: {
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    minWidth: Sizes["11xl"],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusPillText: {
    fontFamily: font.bold,
    textAlign: "center",
  },
  syncHeaderCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  syncHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  syncHeadline: {
    fontFamily: font.headerSemiBold,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

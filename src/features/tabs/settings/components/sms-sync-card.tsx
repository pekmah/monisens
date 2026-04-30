import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, StyleSheet, Switch, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";
import {
  getSmsPermissionDiagnostics,
  isSmsSupportedPlatform,
} from "@/lib/sms-native";

export function SmsSyncCard() {
  const theme = useAppTheme();
  const {
    importSmsInbox,
    requestSmsPermission,
    refresh,
    setSmsListenerEnabled,
    snapshot,
  } = useFinance();
  const [busy, setBusy] = useState<"permission" | "import" | "listener" | null>(null);
  const [permissionDebug, setPermissionDebug] = useState<{
    readGranted: boolean;
    receiveGranted: boolean;
    supported: boolean;
  } | null>(null);
  const sms = snapshot?.sms;
  const ai = snapshot?.ai;
  const isAndroid = Platform.OS === "android";
  const supported = isSmsSupportedPlatform();
  const permissionGranted =
    permissionDebug?.readGranted ?? sms?.permissionState === "granted";
  const listenerPermissionGranted = permissionDebug?.receiveGranted ?? false;
  const readyCount = sms?.readyCandidateCount ?? 0;
  const queuedCount = sms?.queuedCandidateCount ?? 0;
  const processingCount = sms?.processingCandidateCount ?? 0;
  const failedCount = sms?.failedCandidateCount ?? 0;
  const workInFlightCount = queuedCount + processingCount;
  const readinessProgress =
    (sms?.candidateCount ?? 0) > 0
      ? Math.round((readyCount / (sms?.candidateCount ?? 1)) * 100)
      : permissionGranted
        ? 100
        : 0;
  const activeBatchProgress =
    ai?.activeBatchJob && ai.activeBatchJob.status !== "failed"
      ? ai.activeBatchJob.progress
      : null;
  const progressValue = activeBatchProgress ?? readinessProgress;
  const statusTone =
    failedCount > 0 || ai?.backend.status === "unreachable"
      ? theme.colors.error
      : workInFlightCount > 0 || ai?.runningJobCount
        ? theme.colors.secondary
        : readyCount > 0
          ? theme.colors.primary
          : theme.colors.tertiary;
  const headline = getSmsHeadline({
    aiBackendStatus: ai?.backend.status ?? "unconfigured",
    failedCount,
    permissionGranted,
    readyCount,
    supported,
    totalCount: sms?.candidateCount ?? 0,
    workInFlightCount,
  });
  const progressMeta = activeBatchProgress !== null
    ? `Import job ${activeBatchProgress}% complete`
    : (sms?.candidateCount ?? 0) > 0
      ? `${readyCount} of ${sms?.candidateCount ?? 0} message(s) are ready for review`
      : permissionGranted
        ? "New SMS will land locally and move through AI only when needed"
        : "Grant access before the app can import or watch finance SMS";

  useFocusEffect(
    useCallback(() => {
      void getSmsPermissionDiagnostics().then(setPermissionDebug);
      void refresh();
    }, [refresh]),
  );

  async function handlePermissionRequest() {
    setBusy("permission");
    try {
      await requestSmsPermission();
      const diagnostics = await getSmsPermissionDiagnostics();
      setPermissionDebug(diagnostics);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    setBusy("import");
    try {
      await importSmsInbox();
    } finally {
      setBusy(null);
    }
  }

  async function handleListenerToggle(nextValue: boolean) {
    setBusy("listener");
    try {
      await setSmsListenerEnabled(nextValue);
    } finally {
      setBusy(null);
    }
  }

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: `${theme.colors.primary}14` },
          ]}
        >
          <Feather color={theme.colors.primary} name="message-circle" size={18} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.title} variant="titleMd">
            SMS Ingestion
          </AppText>
          <AppText color="mutedText" style={styles.meta} variant="bodyMd">
            Import finance SMS locally and review them before creating transactions.
          </AppText>
        </View>
      </View>

      {!supported ? (
        <AppText color="mutedText" variant="bodyMd">
          {isAndroid
            ? "This Android runtime does not include the SMS native module. Rebuild and install the Android app or dev client after the native SMS changes. Expo Go will not work for this feature."
            : "SMS reading is only available on Android builds."}
        </AppText>
      ) : (
        <>
          <View
            style={[
              styles.statusCard,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <View style={styles.statusHeader}>
              <View style={styles.statusCopy}>
                <AppText style={[styles.statusTitle, { color: statusTone }]} variant="labelMd">
                  SMS activity
                </AppText>
                <AppText style={styles.statusHeadline} variant="titleMd">
                  {headline}
                </AppText>
                <AppText color="mutedText" style={styles.progressMeta} variant="bodyMd">
                  {progressMeta}
                </AppText>
              </View>
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: `${statusTone}14`,
                    borderColor: `${statusTone}2e`,
                  },
                ]}
              >
                <AppText style={[styles.statusPillText, { color: statusTone }]} variant="labelMd">
                  {progressValue}%
                </AppText>
              </View>
            </View>

            <ProgressBar color={statusTone} progress={progressValue} />

            <View style={styles.metricGrid}>
              <Metric label="Ready" tone="primary" value={String(readyCount)} />
              <Metric label="Working" value={String(workInFlightCount)} />
              <Metric label="Failed" tone={failedCount > 0 ? "error" : "default"} value={String(failedCount)} />
              <Metric label="Pending review" value={String(sms?.candidateCount ?? 0)} />
            </View>

            <View
              style={[
                styles.listenerRow,
                {
                  backgroundColor: theme.colors.surfaceContainerLowest,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <View style={styles.listenerCopy}>
                <AppText style={styles.listenerTitle} variant="labelMd">
                  Live listening
                </AppText>
                <AppText color="mutedText" style={styles.progressMeta} variant="bodyMd">
                  {permissionGranted
                    ? sms?.isListenerEnabled
                      ? "Enabled. New SMS can be captured while the app is active."
                      : listenerPermissionGranted
                        ? "Disabled. Import still works, but live capture is off."
                        : "Disabled. Grant live-listening permission to capture new SMS while the app is active."
                    : sms?.permissionState === "denied"
                      ? "SMS access denied"
                      : "SMS access not requested yet"}
                </AppText>
              </View>
              <Switch
                disabled={!permissionGranted || busy === "listener"}
                onValueChange={(value) => void handleListenerToggle(value)}
                thumbColor={
                  sms?.isListenerEnabled
                    ? theme.colors.primary
                    : theme.colors.surfaceContainerLowest
                }
                trackColor={{
                  false: theme.colors.surfaceContainerHighest,
                  true: theme.colors.primaryContainer,
                }}
                value={sms?.isListenerEnabled ?? false}
              />
            </View>

            {sms?.lastImportedAt || sms?.lastListenerEventAt ? (
              <View style={styles.timeline}>
                {sms?.lastImportedAt ? (
                  <AppText color="mutedText" style={styles.progressMeta} variant="bodyMd">
                    Last inbox import {formatTimestamp(sms.lastImportedAt)}{sms.lastImportCount ? ` · ${sms.lastImportCount} message(s)` : ""}.
                  </AppText>
                ) : null}
                {sms?.lastListenerEventAt ? (
                  <AppText color="mutedText" style={styles.progressMeta} variant="bodyMd">
                    Last live SMS received {formatTimestamp(sms.lastListenerEventAt)}.
                  </AppText>
                ) : null}
              </View>
            ) : null}

            {ai?.activeBatchJob ? (
              <View
                style={[
                  styles.batchCard,
                  {
                    backgroundColor: theme.colors.surfaceContainerLowest,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <AppText style={styles.listenerTitle} variant="labelMd">
                  Active AI job
                </AppText>
                <AppText color="mutedText" style={styles.progressMeta} variant="bodyMd">
                  {formatScope(ai.activeBatchJob.scope)} · {formatStatus(ai.activeBatchJob.status)}
                </AppText>
              </View>
            ) : null}

            {ai?.backend.status === "unreachable" && ai.backend.lastError ? (
              <AppText color="error" style={styles.progressMeta} variant="bodyMd">
                AI backend is currently unreachable. Messages stay local and can still be reviewed manually.
              </AppText>
            ) : null}
            {permissionGranted && !listenerPermissionGranted ? (
              <AppText color="mutedText" style={styles.progressMeta} variant="bodyMd">
                Live listening still needs Android `RECEIVE_SMS` permission. Turning the switch on should request it.
              </AppText>
            ) : null}
            {permissionDebug &&
            sms &&
            sms.permissionState !== "unknown" &&
            (permissionDebug.readGranted !==
              (sms.permissionState === "granted") ||
              permissionDebug.supported !== supported) ? (
              <AppText color="mutedText" style={styles.debugMeta} variant="bodyMd">
                Debug: runtime READ_SMS={permissionDebug.readGranted ? "granted" : "denied"}, RECEIVE_SMS={permissionDebug.receiveGranted ? "granted" : "denied"}, module={permissionDebug.supported ? "loaded" : "missing"}, snapshot={sms.permissionState}.
              </AppText>
            ) : null}
            {sms?.lastError ? (
              <AppText color="error" style={styles.progressMeta} variant="bodyMd">
                {sms.lastError}
              </AppText>
            ) : null}
          </View>

          <View style={styles.actions}>
            {!permissionGranted ? (
              <AppButton
                loading={busy === "permission"}
                onPress={() => void handlePermissionRequest()}
                title="Grant SMS access"
              />
            ) : (
              <>
                <AppButton
                  disabled={!sms?.candidateCount}
                  onPress={() => router.push("/sms/review")}
                  title={`Review queue${sms?.candidateCount ? ` (${sms.candidateCount})` : ""}`}
                />
                <AppButton
                  loading={busy === "import"}
                  onPress={() => void handleImport()}
                  title="Import inbox"
                  variant="secondary"
                />
                <AppButton
                  onPress={() => router.push("/sms/ai" as never)}
                  title="Open AI queue"
                  variant="secondary"
                />
              </>
            )}
          </View>
        </>
      )}
    </SurfaceCard>
  );
}

function Metric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "default" | "error" | "primary";
  value: string;
}) {
  const theme = useAppTheme();
  const valueColor =
    tone === "error"
      ? theme.colors.error
      : tone === "primary"
        ? theme.colors.primary
        : theme.colors.text;

  return (
    <View
      style={[
        styles.metric,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={[styles.metricValue, { color: valueColor }]} variant="titleMd">
        {value}
      </AppText>
    </View>
  );
}

function getSmsHeadline(input: {
  aiBackendStatus: "available" | "unconfigured" | "unreachable";
  failedCount: number;
  permissionGranted: boolean;
  readyCount: number;
  supported: boolean;
  totalCount: number;
  workInFlightCount: number;
}) {
  if (!input.supported) {
    return "SMS is only available on Android";
  }

  if (!input.permissionGranted) {
    return "Waiting for SMS access";
  }

  if (input.failedCount > 0) {
    return `${input.failedCount} message(s) need attention`;
  }

  if (input.workInFlightCount > 0) {
    return `${input.workInFlightCount} message(s) are being classified`;
  }

  if (input.readyCount > 0) {
    return `${input.readyCount} message(s) are ready for review`;
  }

  if (input.totalCount > 0) {
    return `${input.totalCount} message(s) waiting locally`;
  }

  if (input.aiBackendStatus === "unreachable") {
    return "AI backend is unavailable";
  }

  return "Ready to import and monitor SMS";
}

function formatScope(scope: "sms_single" | "sms_batch" | "import_batch") {
  if (scope === "import_batch") {
    return "Import batch";
  }

  if (scope === "sms_batch") {
    return "SMS batch";
  }

  return "Single message";
}

function formatStatus(status: "pending" | "running" | "completed" | "failed") {
  if (status === "running") {
    return "in progress";
  }

  if (status === "pending") {
    return "queued";
  }

  if (status === "failed") {
    return "failed";
  }

  return "completed";
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-KE", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.sm,
  },
  card: {
    gap: Spacing.lg,
  },
  debugMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
    opacity: 0.82,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  meta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  batchCard: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  listenerCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  listenerRow: {
    alignItems: "center",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  listenerTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  metric: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  metricLabel: {
    fontFamily: font.medium,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  metricRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metricValue: {
    fontFamily: font.headerSemiBold,
  },
  progressMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  statusHeadline: {
    fontFamily: font.headerSemiBold,
  },
  statusPill: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    justifyContent: "center",
    minWidth: Sizes["9xl"],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusPillText: {
    fontFamily: font.bold,
  },
  statusCard: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  statusCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  statusHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  statusTitle: {
    fontFamily: font.bold,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
  timeline: {
    gap: Sizes.xs,
  },
});

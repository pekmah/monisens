import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  exportBillsCsv,
  exportFinanceBackup,
  pickFinanceBackupForRestore,
  restoreFinanceBackup,
} from "@/lib/finance/backup";
import type {
  FinanceBackupPayload,
  FinanceBackupSummary,
} from "@/lib/finance/backup-schema";

type BackupTask = "bills-csv" | "export" | "restore" | null;

type PendingRestore = {
  payload: FinanceBackupPayload;
  summary: FinanceBackupSummary;
};

function formatBackupDate(value?: string) {
  if (!value) {
    return "No backup in this session";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

export function BackupCard() {
  const theme = useAppTheme();
  const [activeTask, setActiveTask] = useState<BackupTask>(null);
  const [lastBackup, setLastBackup] = useState<FinanceBackupSummary | null>(null);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null);

  const isBusy = activeTask !== null;

  async function handleExport() {
    if (isBusy) {
      return;
    }

    setActiveTask("export");

    try {
      const summary = await exportFinanceBackup();
      setLastBackup(summary);
      Alert.alert(
        "Backup ready",
        `${formatCount(summary.totalRows)} records were encrypted and prepared for saving.`,
      );
    } catch (error) {
      Alert.alert(
        "Backup failed",
        error instanceof Error ? error.message : "The backup could not be created.",
      );
    } finally {
      setActiveTask(null);
    }
  }

  async function handlePickRestore() {
    if (isBusy) {
      return;
    }

    setActiveTask("restore");

    try {
      const result = await pickFinanceBackupForRestore();

      if (result) {
        setPendingRestore(result);
      }
    } catch (error) {
      Alert.alert(
        "Restore unavailable",
        error instanceof Error ? error.message : "The selected backup could not be opened.",
      );
    } finally {
      setActiveTask(null);
    }
  }

  async function handleBillsCsvExport() {
    if (isBusy) {
      return;
    }

    setActiveTask("bills-csv");

    try {
      const result = await exportBillsCsv();
      Alert.alert(
        "Bills CSV ready",
        `${formatCount(result.rowCount)} bill schedule and payment row(s) were prepared for saving.`,
      );
    } catch (error) {
      Alert.alert(
        "Bills export failed",
        error instanceof Error ? error.message : "The bills CSV could not be created.",
      );
    } finally {
      setActiveTask(null);
    }
  }

  function confirmRestore() {
    if (!pendingRestore || isBusy) {
      return;
    }

    Alert.alert(
      "Replace local data?",
      "This will replace finance records on this device with the selected backup.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: () => {
            try {
              const summary = restoreFinanceBackup(pendingRestore.payload);
              setLastBackup(summary);
              setPendingRestore(null);
              Alert.alert(
                "Restore complete",
                `${formatCount(summary.totalRows)} records were restored.`,
              );
            } catch (error) {
              Alert.alert(
                "Restore failed",
                error instanceof Error
                  ? error.message
                  : "The backup could not be restored.",
              );
            }
          },
          style: "destructive",
          text: "Replace",
        },
      ],
    );
  }

  return (
    <SurfaceCard elevated style={styles.card} tone="primary">
      <View style={styles.headerRow}>
        <View style={styles.iconFrame}>
          <Feather color={theme.colors.primary} name="shield" size={20} />
        </View>
        <View style={styles.copy}>
          <AppText color="onPrimary" style={styles.title} variant="headlineSm">
            Local encrypted backups
          </AppText>
          <AppText color="onPrimaryContainer" style={styles.description} variant="bodyMd">
            Export a private backup file, then save it to your cloud drive,
            files app, or password manager.
          </AppText>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <AppText color="onPrimaryContainer" style={styles.metricLabel} variant="labelMd">
            Last backup
          </AppText>
          <AppText color="onPrimary" style={styles.metricValue} variant="labelMd">
            {formatBackupDate(lastBackup?.createdAt)}
          </AppText>
        </View>
        <View style={styles.metric}>
          <AppText color="onPrimaryContainer" style={styles.metricLabel} variant="labelMd">
            Coverage
          </AppText>
          <AppText color="onPrimary" style={styles.metricValue} variant="labelMd">
            {lastBackup ? `${formatCount(lastBackup.totalRows)} records` : "SQLite tables"}
          </AppText>
        </View>
      </View>

      {pendingRestore ? (
        <View style={styles.restorePreview}>
          <View style={styles.restorePreviewHeader}>
            <Feather color={theme.colors.onPrimary} name="file-text" size={18} />
            <View style={styles.restorePreviewCopy}>
              <AppText color="onPrimary" style={styles.restoreTitle} variant="labelMd">
                {pendingRestore.summary.fileName ?? "Selected backup"}
              </AppText>
              <AppText color="onPrimaryContainer" style={styles.restoreMeta} variant="bodyMd">
                {formatBackupDate(pendingRestore.summary.createdAt)} ·{" "}
                {formatCount(pendingRestore.summary.totalRows)} records
              </AppText>
            </View>
          </View>
          <View style={styles.previewActions}>
            <AppPressable
              onPress={() => setPendingRestore(null)}
              style={styles.previewSecondaryAction}
            >
              <AppText color="onPrimary" style={styles.secondaryActionText} variant="labelMd">
                Cancel
              </AppText>
            </AppPressable>
            <AppPressable
              onPress={confirmRestore}
              style={[
                styles.previewPrimaryAction,
                { backgroundColor: theme.colors.onPrimary },
              ]}
            >
              <Feather color={theme.colors.primary} name="rotate-ccw" size={17} />
              <AppText color="primary" style={styles.primaryActionText} variant="labelMd">
                Restore
              </AppText>
            </AppPressable>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppPressable onPress={handleBillsCsvExport} style={styles.secondaryAction}>
          {activeTask === "bills-csv" ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="small" />
          ) : (
            <Feather color={theme.colors.onPrimary} name="file-text" size={18} />
          )}
          <AppText color="onPrimary" style={styles.secondaryActionText} variant="labelMd">
            Bills CSV
          </AppText>
        </AppPressable>
        <AppPressable onPress={handlePickRestore} style={styles.secondaryAction}>
          {activeTask === "restore" ? (
            <ActivityIndicator color={theme.colors.onPrimary} size="small" />
          ) : (
            <Feather color={theme.colors.onPrimary} name="rotate-ccw" size={18} />
          )}
          <AppText color="onPrimary" style={styles.secondaryActionText} variant="labelMd">
            Restore
          </AppText>
        </AppPressable>
        <AppPressable
          onPress={handleExport}
          style={[
            styles.primaryAction,
            { backgroundColor: theme.colors.onPrimary },
          ]}
        >
          {activeTask === "export" ? (
            <ActivityIndicator color={theme.colors.primary} size="small" />
          ) : (
            <Feather color={theme.colors.primary} name="upload-cloud" size={18} />
          )}
          <AppText color="primary" style={styles.primaryActionText} variant="labelMd">
            Backup Now
          </AppText>
        </AppPressable>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  card: {
    gap: Spacing.xl,
    padding: Sizes["3xl"],
  },
  copy: {
    flex: 1,
    gap: Spacing.sm,
  },
  description: {
    opacity: 0.9,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.lg,
  },
  iconFrame: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  metric: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: Radii.lg,
    flex: 1,
    gap: Spacing.xs,
    minHeight: Sizes["10xl"],
    padding: Spacing.md,
  },
  metricLabel: {
    fontFamily: font.medium,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    opacity: 0.82,
    textTransform: "uppercase",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metricValue: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  previewActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  previewPrimaryAction: {
    alignItems: "center",
    borderRadius: Radii.full,
    flexDirection: "row",
    gap: Spacing.xs,
    justifyContent: "center",
    minHeight: Sizes["8xl"],
    paddingHorizontal: Spacing.lg,
  },
  previewSecondaryAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radii.full,
    justifyContent: "center",
    minHeight: Sizes["8xl"],
    paddingHorizontal: Spacing.lg,
  },
  primaryAction: {
    alignItems: "center",
    borderRadius: Radii.full,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    paddingHorizontal: Spacing.lg,
  },
  primaryActionText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  restoreMeta: {
    opacity: 0.86,
  },
  restorePreview: {
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: Radii.xl,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  restorePreviewCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  restorePreviewHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  restoreTitle: {
    fontFamily: font.semiBold,
  },
  secondaryAction: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: Radii.full,
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    paddingHorizontal: Spacing.lg,
  },
  secondaryActionText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerBold,
  },
});

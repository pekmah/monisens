import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { ProgressBar, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { HOT_UPDATER_BASE_URL, useOtaUpdateStatus } from "@/lib/ota-updates";

export function UpdateCard() {
  const theme = useAppTheme();
  const ota = useOtaUpdateStatus();
  const progress = Math.round(ota.progress * 100);
  const statusColor =
    ota.status === "error"
      ? theme.colors.error
      : ota.status === "disabled"
        ? theme.colors.tertiary
        : ota.status === "downloading" || ota.status === "applying"
          ? theme.colors.secondary
          : theme.colors.primary;
  const progressValue =
    ota.status === "downloading" || ota.isUpdateDownloaded ? progress : 0;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: `${theme.colors.secondary}14` },
          ]}
        >
          <Feather color={theme.colors.secondary} name="download-cloud" size={18} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.title} variant="titleMd">
            App Updates
          </AppText>
          <AppText color="mutedText" style={styles.meta} variant="bodyMd">
            Background OTA updates through Hot Updater.
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.statusPanel,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.statusHeader}>
          <View style={styles.statusCopy}>
            <AppText style={[styles.statusLabel, { color: statusColor }]} variant="labelMd">
              {getStatusEyebrow(ota.status)}
            </AppText>
            <AppText style={styles.statusTitle} variant="titleMd">
              {getStatusTitle(ota.status, ota.configured, ota.isUpdateDownloaded)}
            </AppText>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: `${statusColor}16`, borderColor: `${statusColor}32` },
            ]}
          >
            <AppText style={[styles.statusPillText, { color: statusColor }]} variant="labelMd">
              {progressValue}%
            </AppText>
          </View>
        </View>

        <ProgressBar color={statusColor} progress={progressValue} />

        <View style={styles.metricsRow}>
          <MetricTile label="Checked" value={formatTimestamp(ota.lastCheckedAt)} />
          <MetricTile label="Downloaded" value={formatTimestamp(ota.lastDownloadedAt)} />
        </View>
        <MetricTile label="Applied" value={formatTimestamp(ota.lastAppliedAt)} wide />

        {ota.lastError ? (
          <AppText color="error" style={styles.meta} variant="bodyMd">
            {ota.lastError}
          </AppText>
        ) : null}

        <AppText color="mutedText" style={styles.meta} variant="bodyMd">
          Downloaded updates are applied when the app leaves the foreground, so users do not have to manually restart.
        </AppText>
        <AppText color="mutedText" style={styles.meta} variant="bodyMd">
          Update URL: {HOT_UPDATER_BASE_URL}
        </AppText>
      </View>
    </SurfaceCard>
  );
}

function MetricTile({
  label,
  value,
  wide,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metricTile,
        wide && styles.metricTileWide,
        {
          backgroundColor: theme.colors.surfaceContainer,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="labelMd">
        {value}
      </AppText>
    </View>
  );
}

function getStatusEyebrow(status: ReturnType<typeof useOtaUpdateStatus>["status"]) {
  if (status === "downloading") {
    return "DOWNLOADING";
  }

  if (status === "applying") {
    return "APPLYING";
  }

  if (status === "error") {
    return "NEEDS ATTENTION";
  }

  if (status === "disabled") {
    return "NOT CONFIGURED";
  }

  return "UPDATE STATUS";
}

function getStatusTitle(
  status: ReturnType<typeof useOtaUpdateStatus>["status"],
  configured: boolean,
  isUpdateDownloaded: boolean,
) {
  if (!configured) {
    return "OTA updates are disabled";
  }

  if (isUpdateDownloaded || status === "downloaded") {
    return "Update downloaded in the background";
  }

  if (status === "downloading") {
    return "Downloading update";
  }

  if (status === "applying") {
    return "Applying update";
  }

  if (status === "up_to_date") {
    return "App is up to date";
  }

  if (status === "recovered") {
    return "Recovered to a stable bundle";
  }

  if (status === "error") {
    return "Update check failed";
  }

  return "Ready for background updates";
}

function formatTimestamp(value: number | null) {
  if (!value) {
    return "Not yet";
  }

  return new Date(value).toLocaleString("en-KE", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  });
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Sizes.xxs,
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
  metricLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  metricTile: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Sizes.xxs,
    padding: Spacing.md,
  },
  metricTileWide: {
    flex: 0,
  },
  metricValue: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statusCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  statusHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  statusLabel: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    lineHeight: LineHeights.xs,
  },
  statusPanel: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  statusPill: {
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  statusPillText: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.md,
  },
  statusTitle: {
    fontFamily: font.headerSemiBold,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

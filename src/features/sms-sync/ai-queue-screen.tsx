import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppButton, AppFlashList, AppText, NestedScreenHeader, Screen } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

export default function AiQueueScreen() {
  const theme = useAppTheme();
  const { approveCategoryProposal, rejectCategoryProposal, retryAiJobs, runAiQueue, snapshot } = useFinance();
  const ai = snapshot?.ai;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentContainerStyle={styles.content} scroll>
        <NestedScreenHeader
          description="Local jobs stay in SQLite and retry when the AI backend becomes reachable again."
          overline="AI QUEUE"
          title="AI classification jobs"
        />

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceContainerLowest,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <AppText style={styles.cardTitle} variant="titleMd">
            Backend status
          </AppText>
          <AppText color="mutedText" variant="bodyMd">
            {ai?.backend.status === "available"
              ? "Configured and reachable"
              : ai?.backend.status === "unconfigured"
                ? "Not configured on this build"
                : "Configured, but last call failed"}
          </AppText>
          {ai?.backend.lastError ? (
            <AppText color="error" variant="bodyMd">
              {ai.backend.lastError}
            </AppText>
          ) : null}
          <View style={styles.actionsRow}>
            <AppButton onPress={() => void runAiQueue()} title="Run queue now" variant="secondary" />
            <AppButton onPress={() => void retryAiJobs()} title="Retry failures" />
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Metric label="Pending" value={String(ai?.pendingJobCount ?? 0)} />
          <Metric label="Running" value={String(ai?.runningJobCount ?? 0)} />
          <Metric label="Failed" value={String(ai?.failedJobCount ?? 0)} />
        </View>

        {ai?.activeBatchJob ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surfaceContainerLowest,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <AppText style={styles.cardTitle} variant="titleMd">
              Active batch
            </AppText>
            <AppText color="mutedText" variant="bodyMd">
              {formatJobType(ai.activeBatchJob.jobType)} · {formatJobScope(ai.activeBatchJob.scope)}
            </AppText>
            <AppText variant="titleMd">{ai.activeBatchJob.progress}%</AppText>
            {ai.activeBatchJob.lastError ? (
              <AppText color="error" variant="bodyMd">
                {ai.activeBatchJob.lastError}
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <AppText style={styles.cardTitle} variant="titleMd">
            Pending category proposals
          </AppText>
          {ai?.pendingCategoryProposals.length ? (
            <AppFlashList
              data={ai.pendingCategoryProposals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surfaceContainerLowest,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <AppText style={styles.cardTitle} variant="titleMd">
                    {item.proposedName}
                  </AppText>
                  <AppText color="mutedText" variant="bodyMd">
                    Proposed by AI for review queue classification.
                  </AppText>
                  <View style={styles.actionsRow}>
                    <AppButton
                      onPress={() => void rejectCategoryProposal(item.id)}
                      title="Reject"
                      variant="secondary"
                    />
                    <AppButton
                      onPress={() => void approveCategoryProposal(item.id)}
                      title="Approve"
                    />
                  </View>
                </View>
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <AppText color="mutedText" variant="bodyMd">
              No pending proposals.
            </AppText>
          )}
        </View>

        <View style={styles.section}>
          <AppText style={styles.cardTitle} variant="titleMd">
            Recent jobs
          </AppText>
          {ai?.recentJobs.length ? (
            <AppFlashList
              data={ai.recentJobs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surfaceContainerLowest,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <AppText style={styles.cardTitle} variant="titleMd">
                    {formatJobType(item.jobType)}
                  </AppText>
                  <AppText color="mutedText" variant="bodyMd">
                    {formatJobScope(item.scope)} · {item.status} · {item.progress}%
                  </AppText>
                  {item.lastError ? (
                    <AppText color="error" variant="bodyMd">
                      {item.lastError}
                    </AppText>
                  ) : null}
                </View>
              )}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <AppText color="mutedText" variant="bodyMd">
              No AI jobs queued yet.
            </AppText>
          )}
        </View>
      </Screen>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

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
      <AppText style={styles.metricValue} variant="titleMd">
        {value}
      </AppText>
    </View>
  );
}

function formatJobType(value: string) {
  switch (value) {
    case "parse_sms":
      return "Parse SMS";
    case "classify_candidate":
      return "Classify candidate";
    default:
      return "Submit feedback";
  }
}

function formatJobScope(value: string) {
  switch (value) {
    case "sms_batch":
      return "SMS batch";
    case "import_batch":
      return "Import batch";
    default:
      return "Single item";
  }
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  cardTitle: {
    fontFamily: font.headerSemiBold,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  metric: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  metricLabel: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  metricValue: {
    fontFamily: font.headerSemiBold,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  section: {
    gap: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },
  title: {
    fontFamily: font.headerBold,
  },
});

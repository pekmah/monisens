import { Feather } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppPressable, AppText, NestedScreenHeader, Screen } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatMoney,
  type BillOccurrenceRecord,
  type BillTransactionMatchRecord,
  useFinance,
} from "@/lib/finance";

import { formatBillDate } from "./lib/dates";

const sectionTitles: Record<BillOccurrenceRecord["state"], string> = {
  due_soon: "Due soon",
  overdue: "Overdue",
  paid: "Paid this period",
  upcoming: "Upcoming",
};

export default function BillsScreen() {
  const theme = useAppTheme();
  const {
    linkBillOccurrenceToTransaction,
    loadBillTransactionMatches,
    refresh,
    snapshot,
  } = useFinance();
  const [matchesByOccurrence, setMatchesByOccurrence] = useState<
    Record<string, BillTransactionMatchRecord[]>
  >({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const occurrences = useMemo(
    () => snapshot?.bills.occurrences ?? [],
    [snapshot?.bills.occurrences],
  );
  const schedules = snapshot?.bills.schedules ?? [];

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    let mounted = true;

    async function loadMatches() {
      const dueOccurrences = occurrences.filter(
        (occurrence) => occurrence.state !== "paid",
      );
      const entries = await Promise.all(
        dueOccurrences.map(async (occurrence) => [
          occurrence.id,
          await loadBillTransactionMatches(occurrence.id),
        ] as const),
      );

      if (mounted) {
        setMatchesByOccurrence(Object.fromEntries(entries));
      }
    }

    void loadMatches();

    return () => {
      mounted = false;
    };
  }, [loadBillTransactionMatches, occurrences]);

  const grouped = useMemo(
    () =>
      (["overdue", "due_soon", "upcoming", "paid"] as const).map((state) => ({
        data: occurrences.filter((occurrence) => occurrence.state === state),
        state,
        title: sectionTitles[state],
      })),
    [occurrences],
  );

  async function confirmMatch(occurrenceId: string, transactionId: string) {
    setConfirmingId(occurrenceId);
    try {
      await linkBillOccurrenceToTransaction({ occurrenceId, transactionId });
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <NestedScreenHeader
            description="Plan upcoming obligations and reconcile them against transactions that already happened."
            overline="BILLS"
            title="Bills"
          />

          <View
            style={[
              styles.summary,
              { backgroundColor: theme.colors.surfaceContainerLowest },
            ]}
          >
            <Metric label="Overdue" value={String(snapshot?.bills.overdueCount ?? 0)} />
            <Metric label="Due soon" value={String(snapshot?.bills.dueSoonCount ?? 0)} />
            <Metric
              label="Monthly"
              value={formatMoney(snapshot?.bills.monthlyImpactMinor ?? 0, "KES")}
            />
          </View>

          <AppButton
            fullWidth
            onPress={() => router.push("/bills/new" as never)}
            title="Set up bill"
          />

          {schedules.length === 0 ? (
            <View
              style={[
                styles.empty,
                { backgroundColor: theme.colors.surfaceContainerLow },
              ]}
            >
              <Feather color={theme.colors.primary} name="calendar" size={24} />
              <AppText style={styles.emptyTitle} variant="titleMd">
                No bills yet
              </AppText>
              <AppText color="mutedText" style={styles.emptyMeta} variant="bodyMd">
                Add rent, utilities, subscriptions, and one-off obligations so they appear before they are due.
              </AppText>
            </View>
          ) : null}

          {grouped.map((section) =>
            section.data.length ? (
              <View key={section.state} style={styles.section}>
                <AppText style={styles.sectionTitle} variant="titleMd">
                  {section.title}
                </AppText>
                {section.data.map((occurrence) => {
                  const bestMatch = matchesByOccurrence[occurrence.id]?.[0];

                  return (
                    <OccurrenceRow
                      confirming={confirmingId === occurrence.id}
                      key={occurrence.id}
                      match={bestMatch}
                      occurrence={occurrence}
                      onConfirm={
                        bestMatch
                          ? () => void confirmMatch(occurrence.id, bestMatch.id)
                          : undefined
                      }
                    />
                  );
                })}
              </View>
            ) : null,
          )}
        </ScrollView>
      </Screen>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="labelMd">
        {value}
      </AppText>
    </View>
  );
}

function OccurrenceRow({
  confirming,
  match,
  occurrence,
  onConfirm,
}: {
  confirming: boolean;
  match?: BillTransactionMatchRecord;
  occurrence: BillOccurrenceRecord;
  onConfirm?: () => void;
}) {
  const theme = useAppTheme();
  const isPaid = occurrence.state === "paid";

  return (
    <AppPressable
      onPress={() => router.push(`/bills/${occurrence.billId}` as never)}
      style={[
        styles.occurrence,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderColor:
            occurrence.state === "overdue"
              ? theme.colors.error
              : theme.colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.occurrenceHeader}>
        <View style={styles.billCopy}>
          <AppText numberOfLines={1} style={styles.billTitle} variant="labelMd">
            {occurrence.billName}
          </AppText>
          <AppText color="mutedText" style={styles.billMeta} variant="bodyMd">
            {formatBillDate(occurrence.dueAt)} · {occurrence.categoryLabel}
          </AppText>
        </View>
        <AppText style={styles.amount} variant="labelMd">
          {formatMoney(occurrence.amountMinor, occurrence.currency)}
        </AppText>
      </View>

      {isPaid ? (
        <AppText color="primary" style={styles.matchMeta} variant="bodyMd">
          Paid by {occurrence.linkedTransactionMerchant ?? "linked transaction"}
        </AppText>
      ) : match ? (
        <View style={styles.matchRow}>
          <View style={styles.matchCopy}>
            <AppText color="mutedText" style={styles.matchMeta} variant="bodyMd">
              Suggested: {match.merchant} · {match.confidence}%
            </AppText>
            <AppText color="mutedText" style={styles.matchReason} variant="bodyMd">
              {match.reason}
            </AppText>
          </View>
          <AppPressable
            onPress={(event) => {
              event.stopPropagation();
              onConfirm?.();
            }}
            style={[
              styles.confirmButton,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            {confirming ? (
              <ActivityIndicator color={theme.colors.onPrimary} size="small" />
            ) : (
              <AppText color="onPrimary" style={styles.confirmText} variant="labelMd">
                Confirm
              </AppText>
            )}
          </AppPressable>
        </View>
      ) : (
        <AppText color="mutedText" style={styles.matchMeta} variant="bodyMd">
          No transaction match found yet.
        </AppText>
      )}
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  billCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  billMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  billTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  confirmButton: {
    alignItems: "center",
    borderRadius: Radii.sm,
    justifyContent: "center",
    minHeight: Sizes["8xl"],
    paddingHorizontal: Spacing.lg,
  },
  confirmText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  content: {
    gap: Spacing.lg,
    padding: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  empty: {
    alignItems: "flex-start",
    borderRadius: Radii.lg,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  emptyMeta: {
    lineHeight: LineHeights.md,
  },
  emptyTitle: {
    fontFamily: font.headerSemiBold,
  },
  matchCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  matchMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  matchReason: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  matchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  metric: {
    flex: 1,
    gap: Sizes.xxs,
  },
  metricLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  metricValue: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  occurrence: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  occurrenceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  screen: {
    flex: 1,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
  },
  summary: {
    borderRadius: Radii.lg,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
});

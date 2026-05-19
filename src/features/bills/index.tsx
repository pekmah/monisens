import { Feather } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import {
  AppButton,
  AppPressable,
  AppText,
  NestedScreenHeader,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatMoney,
  type BillOccurrenceRecord,
  type BillRecord,
  type BillTransactionMatchRecord,
  useFinance,
} from "@/lib/finance";

import { formatBillDate, formatCadence } from "./lib/dates";

import type { ComponentProps } from "react";

type BillsTab = "due" | "upcoming" | "schedules" | "paid";
type FeatherName = ComponentProps<typeof Feather>["name"];

const tabs: { icon: FeatherName; label: string; value: BillsTab }[] = [
  { icon: "alert-circle", label: "Due", value: "due" },
  { icon: "calendar", label: "Upcoming", value: "upcoming" },
  { icon: "repeat", label: "Schedules", value: "schedules" },
  { icon: "check-circle", label: "Paid", value: "paid" },
];

export default function BillsScreen() {
  const theme = useAppTheme();
  const {
    linkBillOccurrenceToTransaction,
    loadBillTransactionMatches,
    refresh,
    snapshot,
  } = useFinance();
  const [activeTab, setActiveTab] = useState<BillsTab>("due");
  const [matchesByOccurrence, setMatchesByOccurrence] = useState<
    Record<string, BillTransactionMatchRecord[]>
  >({});
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const occurrences = useMemo(
    () => snapshot?.bills.occurrences ?? [],
    [snapshot?.bills.occurrences],
  );
  const schedules = snapshot?.bills.schedules ?? [];
  const dueOccurrences = useMemo(
    () =>
      occurrences.filter(
        (occurrence) =>
          occurrence.state === "overdue" || occurrence.state === "due_soon",
      ),
    [occurrences],
  );
  const upcomingOccurrences = useMemo(
    () => occurrences.filter((occurrence) => occurrence.state === "upcoming"),
    [occurrences],
  );
  const paidOccurrences = useMemo(
    () => occurrences.filter((occurrence) => occurrence.state === "paid"),
    [occurrences],
  );
  const nextOccurrences = useMemo(
    () =>
      occurrences
        .filter((occurrence) => occurrence.state !== "paid")
        .sort((first, second) => first.dueAt - second.dueAt)
        .slice(0, 3),
    [occurrences],
  );
  const visibleOccurrences =
    activeTab === "due"
      ? dueOccurrences
      : activeTab === "upcoming"
        ? upcomingOccurrences
        : paidOccurrences;
  const nextDue = nextOccurrences[0] ?? null;
  const heroThemeStyle = getHeroThemeStyle(theme);
  const panelThemeStyle = getPanelThemeStyle(theme);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  useEffect(() => {
    let mounted = true;

    async function loadMatches() {
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
  }, [dueOccurrences, loadBillTransactionMatches]);

  async function confirmMatch(occurrenceId: string, transactionId: string) {
    setConfirmingId(occurrenceId);
    try {
      await linkBillOccurrenceToTransaction({ occurrenceId, transactionId });
      await refresh();
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false} style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <NestedScreenHeader
            description="Plan upcoming obligations and reconcile them against transactions that already happened."
            overline="BILLS"
            title="Bills"
          />

          <View style={[styles.hero, heroThemeStyle]}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroCopy}>
                <AppText color="mutedText" style={styles.overline} variant="labelMd">
                  MONTHLY COMMITMENT
                </AppText>
                <AppText style={styles.heroAmount} variant="titleMd">
                  {formatMoney(snapshot?.bills.monthlyImpactMinor ?? 0, "KES")}
                </AppText>
                <AppText color="mutedText" style={styles.heroMeta} variant="bodyMd">
                  {schedules.length} active schedule{schedules.length === 1 ? "" : "s"}
                </AppText>
              </View>
              <AppButton
                onPress={() => router.push("/bills/new" as never)}
                title="Add bill"
              />
            </View>

            <View style={styles.metricGrid}>
              <MetricTile
                icon="alert-triangle"
                label="Overdue"
                tone="danger"
                value={String(snapshot?.bills.overdueCount ?? 0)}
              />
              <MetricTile
                icon="clock"
                label="Due soon"
                tone="primary"
                value={String(snapshot?.bills.dueSoonCount ?? 0)}
              />
              <MetricTile
                icon="check"
                label="Paid"
                tone="success"
                value={String(snapshot?.bills.paidThisPeriodCount ?? 0)}
              />
            </View>
          </View>

          <UpcomingStrip nextDue={nextDue} occurrences={nextOccurrences} />

          <View style={[styles.panel, panelThemeStyle]}>
            <ScrollView
              contentContainerStyle={styles.tabs}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {tabs.map((tab) => (
                <TabButton
                  active={activeTab === tab.value}
                  icon={tab.icon}
                  key={tab.value}
                  label={tab.label}
                  onPress={() => setActiveTab(tab.value)}
                />
              ))}
            </ScrollView>

            {activeTab === "schedules" ? (
              schedules.length ? (
                <View style={styles.list}>
                  {schedules.map((bill) => (
                    <ScheduleRow bill={bill} key={bill.id} />
                  ))}
                </View>
              ) : (
                <EmptyState
                  description="Add rent, utilities, subscriptions, and one-off obligations so they appear before they are due."
                  icon="calendar"
                  title="No schedules yet"
                />
              )
            ) : visibleOccurrences.length ? (
              <View style={styles.list}>
                {visibleOccurrences.map((occurrence) => {
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
            ) : (
              <EmptyState
                description={getEmptyDescription(activeTab)}
                icon={activeTab === "paid" ? "check-circle" : "calendar"}
                title={getEmptyTitle(activeTab)}
              />
            )}
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

function UpcomingStrip({
  nextDue,
  occurrences,
}: {
  nextDue: BillOccurrenceRecord | null;
  occurrences: BillOccurrenceRecord[];
}) {
  const theme = useAppTheme();
  const panelThemeStyle = getPanelThemeStyle(theme);

  return (
    <View style={[styles.panel, panelThemeStyle]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <AppText style={styles.sectionTitle} variant="titleMd">
            Upcoming bills
          </AppText>
          <AppText color="mutedText" style={styles.sectionMeta} variant="bodyMd">
            {nextDue
              ? `Next: ${nextDue.billName} on ${formatBillDate(nextDue.dueAt)}`
              : "No upcoming obligations generated yet."}
          </AppText>
        </View>
        <Feather color={theme.colors.primary} name="calendar" size={Sizes["2xl"]} />
      </View>

      {occurrences.length ? (
        <View style={styles.timeline}>
          {occurrences.map((occurrence) => (
            <UpcomingItem key={occurrence.id} occurrence={occurrence} />
          ))}
        </View>
      ) : (
        <EmptyState
          description="Create a schedule to populate the upcoming bill timeline."
          icon="plus-circle"
          title="Nothing due yet"
        />
      )}
    </View>
  );
}

function UpcomingItem({ occurrence }: { occurrence: BillOccurrenceRecord }) {
  const theme = useAppTheme();
  const accentThemeStyle = getAccentThemeStyle(occurrence.categoryColor);
  const statusThemeStyle = getStatusPillThemeStyle(theme, occurrence.state);

  return (
    <AppPressable
      onPress={() => router.push(`/bills/${occurrence.billId}` as never)}
      style={styles.upcomingItem}
    >
      <View style={[styles.accent, accentThemeStyle]} />
      <View style={styles.upcomingCopy}>
        <AppText numberOfLines={1} style={styles.rowTitle} variant="labelMd">
          {occurrence.billName}
        </AppText>
        <AppText color="mutedText" style={styles.rowMeta} variant="bodyMd">
          {formatBillDate(occurrence.dueAt)} · {occurrence.categoryLabel}
        </AppText>
      </View>
      <View style={styles.upcomingAmount}>
        <AppText style={styles.amount} variant="labelMd">
          {formatMoney(occurrence.amountMinor, occurrence.currency)}
        </AppText>
        <View style={[styles.statusPill, statusThemeStyle]}>
          <AppText style={styles.statusText} variant="labelMd">
            {formatStateLabel(occurrence.state)}
          </AppText>
        </View>
      </View>
    </AppPressable>
  );
}

function MetricTile({
  icon,
  label,
  tone,
  value,
}: {
  icon: FeatherName;
  label: string;
  tone: "danger" | "primary" | "success";
  value: string;
}) {
  const theme = useAppTheme();
  const tileThemeStyle = getMetricTileThemeStyle(theme, tone);

  return (
    <View style={[styles.metric, tileThemeStyle]}>
      <Feather color={getMetricIconColor(theme, tone)} name={icon} size={Sizes.lg} />
      <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="titleMd">
        {value}
      </AppText>
    </View>
  );
}

function TabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: FeatherName;
  label: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const tabThemeStyle = getTabThemeStyle(theme, active);

  return (
    <AppPressable onPress={onPress} style={[styles.tab, tabThemeStyle]}>
      <Feather
        color={active ? theme.colors.onPrimary : theme.colors.mutedText}
        name={icon}
        size={Sizes.md}
      />
      <AppText
        color={active ? "onPrimary" : "mutedText"}
        style={styles.tabText}
        variant="labelMd"
      >
        {label}
      </AppText>
    </AppPressable>
  );
}

function ScheduleRow({ bill }: { bill: BillRecord }) {
  const theme = useAppTheme();
  const rowThemeStyle = getRowThemeStyle(theme);
  const accentThemeStyle = getAccentThemeStyle(bill.categoryColor);

  return (
    <AppPressable
      onPress={() => router.push(`/bills/${bill.id}` as never)}
      style={[styles.scheduleRow, rowThemeStyle]}
    >
      <View style={[styles.accent, accentThemeStyle]} />
      <View style={styles.rowCopy}>
        <AppText numberOfLines={1} style={styles.rowTitle} variant="labelMd">
          {bill.name}
        </AppText>
        <AppText color="mutedText" style={styles.rowMeta} variant="bodyMd">
          {formatCadence(bill.cadence)} · {bill.categoryLabel} · {bill.accountLabel}
        </AppText>
      </View>
      <View style={styles.scheduleAmount}>
        <AppText style={styles.amount} variant="labelMd">
          {formatMoney(bill.amountMinor, bill.currency)}
        </AppText>
        <AppText color="mutedText" style={styles.rowMeta} variant="bodyMd">
          From {formatBillDate(bill.startAt)}
        </AppText>
      </View>
    </AppPressable>
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
  const occurrenceThemeStyle = getOccurrenceThemeStyle(theme, occurrence.state);
  const accentThemeStyle = getAccentThemeStyle(occurrence.categoryColor);
  const confirmButtonThemeStyle = getConfirmButtonThemeStyle(theme);
  const isPaid = occurrence.state === "paid";

  return (
    <AppPressable
      onPress={() => router.push(`/bills/${occurrence.billId}` as never)}
      style={[styles.occurrence, occurrenceThemeStyle]}
    >
      <View style={styles.occurrenceHeader}>
        <View style={[styles.accent, accentThemeStyle]} />
        <View style={styles.rowCopy}>
          <AppText numberOfLines={1} style={styles.rowTitle} variant="labelMd">
            {occurrence.billName}
          </AppText>
          <AppText color="mutedText" style={styles.rowMeta} variant="bodyMd">
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
            style={[styles.confirmButton, confirmButtonThemeStyle]}
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

function EmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: FeatherName;
  title: string;
}) {
  const theme = useAppTheme();
  const emptyThemeStyle = getEmptyThemeStyle(theme);

  return (
    <View style={[styles.empty, emptyThemeStyle]}>
      <Feather color={theme.colors.primary} name={icon} size={Sizes["2xl"]} />
      <AppText style={styles.emptyTitle} variant="titleMd">
        {title}
      </AppText>
      <AppText color="mutedText" style={styles.emptyMeta} variant="bodyMd">
        {description}
      </AppText>
    </View>
  );
}

function getEmptyTitle(tab: BillsTab) {
  if (tab === "due") {
    return "Nothing due right now";
  }

  if (tab === "paid") {
    return "No paid bills yet";
  }

  return "No upcoming bills";
}

function getEmptyDescription(tab: BillsTab) {
  if (tab === "due") {
    return "Overdue and due-soon obligations will appear here when they need attention.";
  }

  if (tab === "paid") {
    return "Linked bill payments will show here for the current generated period.";
  }

  return "Future generated occurrences will appear here once schedules are active.";
}

function formatStateLabel(state: BillOccurrenceRecord["state"]) {
  if (state === "due_soon") {
    return "Due soon";
  }

  return `${state[0].toUpperCase()}${state.slice(1)}`;
}

function getHeroThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.outlineVariant,
  };
}

function getPanelThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.outlineVariant,
  };
}

function getEmptyThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
  };
}

function getRowThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.outlineVariant,
  };
}

function getOccurrenceThemeStyle(
  theme: AppTheme,
  state: BillOccurrenceRecord["state"],
): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: state === "overdue" ? theme.colors.error : theme.colors.outlineVariant,
  };
}

function getAccentThemeStyle(color: string): ViewStyle {
  return {
    backgroundColor: color,
  };
}

function getConfirmButtonThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primary,
  };
}

function getMetricTileThemeStyle(
  theme: AppTheme,
  tone: "danger" | "primary" | "success",
): ViewStyle {
  const color =
    tone === "danger"
      ? theme.colors.errorContainer
      : tone === "success"
        ? theme.colors.tertiaryContainer
        : theme.colors.primaryContainer;

  return {
    backgroundColor: color,
  };
}

function getMetricIconColor(
  theme: AppTheme,
  tone: "danger" | "primary" | "success",
) {
  if (tone === "danger") {
    return theme.colors.error;
  }

  if (tone === "success") {
    return theme.colors.tertiary;
  }

  return theme.colors.primary;
}

function getTabThemeStyle(theme: AppTheme, active: boolean): ViewStyle {
  return {
    backgroundColor: active ? theme.colors.primary : theme.colors.surfaceContainerLow,
    borderColor: active ? theme.colors.primary : theme.colors.outlineVariant,
  };
}

function getStatusPillThemeStyle(
  theme: AppTheme,
  state: BillOccurrenceRecord["state"],
): ViewStyle {
  return {
    backgroundColor:
      state === "overdue"
        ? theme.colors.errorContainer
        : state === "due_soon"
          ? theme.colors.primaryContainer
          : theme.colors.surfaceContainerHighest,
  };
}

const styles = StyleSheet.create({
  accent: {
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    width: Sizes.xs,
  },
  amount: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  confirmButton: {
    alignItems: "center",
    borderRadius: Radii.md,
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
  hero: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  heroAmount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["4xl"],
    lineHeight: LineHeights["4xl"],
  },
  heroCopy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: 0,
  },
  heroMeta: {
    lineHeight: LineHeights.md,
  },
  heroTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  list: {
    gap: Spacing.md,
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
    borderRadius: Radii.lg,
    flex: 1,
    gap: Sizes.xs,
    minWidth: Sizes["20xl"],
    padding: Spacing.md,
  },
  metricGrid: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metricLabel: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  metricValue: {
    fontFamily: font.headerBold,
  },
  occurrence: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  occurrenceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 0,
    lineHeight: LineHeights.xs,
  },
  panel: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  rowCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  rowMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  rowTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  scheduleAmount: {
    alignItems: "flex-end",
    gap: Sizes.xxs,
  },
  scheduleRow: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  screen: {
    flex: 1,
  },
  sectionCopy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: 0,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  sectionMeta: {
    lineHeight: LineHeights.md,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
  },
  statusPill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Sizes.xs,
  },
  statusText: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  tab: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.xs,
    minHeight: Sizes["8xl"],
    paddingHorizontal: Spacing.md,
  },
  tabText: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  tabs: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  timeline: {
    gap: Spacing.sm,
  },
  upcomingAmount: {
    alignItems: "flex-end",
    gap: Sizes.xs,
  },
  upcomingCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  upcomingItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["12xl"],
  },
});

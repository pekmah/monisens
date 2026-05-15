import { Feather } from "@expo/vector-icons";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";

import { AppButton, AppPressable, AppText, NestedScreenHeader, Screen } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatMoney,
  type BillRecord,
  type BillTransactionMatchRecord,
  useFinance,
} from "@/lib/finance";

import { formatBillDate, formatCadence } from "./lib/dates";

export default function BillDetailScreen() {
  const theme = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    archiveBill,
    linkBillOccurrenceToTransaction,
    loadBillById,
    loadBillTransactionMatches,
    refresh,
    snapshot,
    unlinkBillOccurrencePayment,
  } = useFinance();
  const [bill, setBill] = useState<BillRecord | null>(null);
  const [matches, setMatches] = useState<Record<string, BillTransactionMatchRecord[]>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const occurrences = (snapshot?.bills.occurrences ?? [])
    .filter((occurrence) => occurrence.billId === id);

  const reload = useCallback(async () => {
    await refresh();
    if (id) {
      setBill(await loadBillById(id));
    }
  }, [id, loadBillById, refresh]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  useEffect(() => {
    let mounted = true;

    async function loadMatches() {
      const entries = await Promise.all(
        occurrences
          .filter((occurrence) => occurrence.state !== "paid")
          .map(async (occurrence) => [
            occurrence.id,
            await loadBillTransactionMatches(occurrence.id),
          ] as const),
      );

      if (mounted) {
        setMatches(Object.fromEntries(entries));
      }
    }

    void loadMatches();

    return () => {
      mounted = false;
    };
  }, [loadBillTransactionMatches, occurrences]);

  async function handleConfirm(occurrenceId: string, transactionId: string) {
    setBusyId(occurrenceId);
    try {
      await linkBillOccurrenceToTransaction({ occurrenceId, transactionId });
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnlink(occurrenceId: string) {
    setBusyId(occurrenceId);
    try {
      await unlinkBillOccurrencePayment(occurrenceId);
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  function confirmArchive() {
    if (!id) {
      return;
    }

    Alert.alert(
      "Archive bill?",
      "The schedule will stop showing future due items. Existing transactions stay untouched.",
      [
        { style: "cancel", text: "Cancel" },
        {
          onPress: async () => {
            await archiveBill(id);
            router.replace("/bills" as never);
          },
          style: "destructive",
          text: "Archive",
        },
      ],
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false} style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <NestedScreenHeader
            description="Confirm payments by linking this schedule to real transactions."
            overline="BILL DETAIL"
            title={bill?.name ?? "Bill"}
          />

          {bill ? (
            <View
              style={[
                styles.hero,
                { backgroundColor: theme.colors.surfaceContainerLowest },
              ]}
            >
              <View style={styles.heroHeader}>
                <View style={[styles.iconTile, { backgroundColor: `${bill.categoryColor}20` }]}>
                  <Feather color={bill.categoryColor} name="calendar" size={20} />
                </View>
                <View style={styles.heroCopy}>
                  <AppText style={styles.heroTitle} variant="titleMd">
                    {formatMoney(bill.amountMinor, bill.currency)}
                  </AppText>
                  <AppText color="mutedText" variant="bodyMd">
                    {formatCadence(bill.cadence)} from {formatBillDate(bill.startAt)}
                  </AppText>
                </View>
              </View>
              <View style={styles.metaGrid}>
                <Meta label="Merchant" value={bill.expectedMerchant} />
                <Meta label="Category" value={bill.categoryLabel} />
                <Meta label="Account" value={bill.accountLabel} />
                <Meta label="Ends" value={bill.endAt ? formatBillDate(bill.endAt) : "Open"} />
              </View>
              <View style={styles.actions}>
                <AppButton
                  onPress={() => router.push(`/bills/${bill.id}/edit` as never)}
                  title="Edit"
                  variant="secondary"
                />
                <AppButton onPress={confirmArchive} title="Archive" variant="danger" />
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText style={styles.sectionTitle} variant="titleMd">
              Payment reconciliation
            </AppText>
            {occurrences.length ? (
              occurrences.map((occurrence) => (
                <View
                  key={occurrence.id}
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
                    <View style={styles.occurrenceCopy}>
                      <AppText style={styles.occurrenceTitle} variant="labelMd">
                        {formatBillDate(occurrence.dueAt)}
                      </AppText>
                      <AppText color="mutedText" style={styles.occurrenceMeta} variant="bodyMd">
                        {occurrence.state.replace("_", " ")}
                      </AppText>
                    </View>
                    <AppText style={styles.amount} variant="labelMd">
                      {formatMoney(occurrence.amountMinor, occurrence.currency)}
                    </AppText>
                  </View>

                  {occurrence.state === "paid" ? (
                    <View style={styles.linkedPayment}>
                      <View style={styles.occurrenceCopy}>
                        <AppText color="primary" style={styles.occurrenceMeta} variant="bodyMd">
                          Linked to {occurrence.linkedTransactionMerchant ?? "transaction"}
                        </AppText>
                        <AppText color="mutedText" style={styles.occurrenceMeta} variant="bodyMd">
                          {occurrence.paidAt ? formatBillDate(occurrence.paidAt) : "Paid"}
                        </AppText>
                      </View>
                      <AppPressable
                        onPress={() => void handleUnlink(occurrence.id)}
                        style={styles.textButton}
                      >
                        {busyId === occurrence.id ? (
                          <ActivityIndicator color={theme.colors.primary} size="small" />
                        ) : (
                          <AppText color="primary" style={styles.textButtonLabel} variant="labelMd">
                            Unlink
                          </AppText>
                        )}
                      </AppPressable>
                    </View>
                  ) : matches[occurrence.id]?.length ? (
                    <View style={styles.matches}>
                      {matches[occurrence.id].map((match) => (
                        <View key={match.id} style={styles.matchRow}>
                          <View style={styles.occurrenceCopy}>
                            <AppText style={styles.matchTitle} variant="labelMd">
                              {match.merchant}
                            </AppText>
                            <AppText color="mutedText" style={styles.occurrenceMeta} variant="bodyMd">
                              {match.meta} · {match.reason} · {match.confidence}%
                            </AppText>
                          </View>
                          <AppPressable
                            onPress={() => void handleConfirm(occurrence.id, match.id)}
                            style={[
                              styles.confirmButton,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          >
                            {busyId === occurrence.id ? (
                              <ActivityIndicator color={theme.colors.onPrimary} size="small" />
                            ) : (
                              <AppText color="onPrimary" style={styles.confirmText} variant="labelMd">
                                Link
                              </AppText>
                            )}
                          </AppPressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <AppText color="mutedText" style={styles.occurrenceMeta} variant="bodyMd">
                      No matching expense transaction found in the due window.
                    </AppText>
                  )}
                </View>
              ))
            ) : (
              <AppText color="mutedText" variant="bodyMd">
                Future occurrences will appear after the schedule is generated.
              </AppText>
            )}
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <AppText color="mutedText" style={styles.metaLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={styles.metaValue} variant="labelMd">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  amount: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
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
  hero: {
    borderRadius: Radii.lg,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  heroCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  heroHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  heroTitle: {
    fontFamily: font.headerBold,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  linkedPayment: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  matchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  matchTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  matches: {
    gap: Spacing.md,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: {
    gap: Sizes.xxs,
    minWidth: "45%",
  },
  metaLabel: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  metaValue: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  occurrence: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  occurrenceCopy: {
    flex: 1,
    gap: Sizes.xxs,
    minWidth: 0,
  },
  occurrenceHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  occurrenceMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    textTransform: "capitalize",
  },
  occurrenceTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
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
  textButton: {
    alignItems: "center",
    minHeight: Sizes["8xl"],
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  textButtonLabel: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
});

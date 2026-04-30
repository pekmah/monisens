import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import {
  AppButton,
  AppFlashList,
  AppText,
  OptionSelectField,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SmsTransactionCandidateRecord } from "@/lib/finance";
import { formatMoney, useFinance } from "@/lib/finance";

const PAGE_SIZE = 20;

export default function SmsReviewScreen() {
  const theme = useAppTheme();
  const {
    acceptSmsCandidate,
    approveCategoryProposal,
    dismissSmsCandidate,
    loadPendingSmsCandidatesPage,
    refresh,
    snapshot,
    updateSmsCandidateCategory,
  } = useFinance();
  const [candidates, setCandidates] = useState<SmsTransactionCandidateRecord[]>(
    [],
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const candidateCount = snapshot?.sms.candidateCount ?? 0;
  const categories = snapshot?.categories ?? [];
  const categoryOptions = categories.map((category) => ({
    accentColor: category.color,
    label: category.label,
    value: category.id,
  }));

  const loadPage = useCallback(
    async (mode: "reset" | "append") => {
      if (mode === "append" && (!hasMore || loadingMore)) {
        return;
      }

      if (mode === "reset") {
        setInitialLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const page = await loadPendingSmsCandidatesPage({
          limit: PAGE_SIZE,
          offset: mode === "reset" ? 0 : nextOffset,
        });

        setCandidates((current) =>
          mode === "reset" ? page.items : [...current, ...page.items],
        );
        setHasMore(page.hasMore);
        setNextOffset(page.nextOffset);
      } finally {
        if (mode === "reset") {
          setInitialLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [hasMore, loadPendingSmsCandidatesPage, loadingMore, nextOffset],
  );

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void loadPage("reset");
    }, [loadPage, refresh]),
  );

  useEffect(() => {
    if (!initialLoading) {
      void loadPage("reset");
    }
  }, [candidateCount]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false} style={styles.screen}>
        {initialLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
            <AppText color="mutedText" variant="bodyMd">
              Loading review queue...
            </AppText>
          </View>
        ) : candidates.length ? (
          <AppFlashList
            contentContainerStyle={styles.listContent}
            data={candidates}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            keyExtractor={(item) => item.id}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator
                    color={theme.colors.primary}
                    size="small"
                  />
                </View>
              ) : null
            }
            ListHeaderComponent={
              <View style={styles.header}>
                <AppText
                  color="primary"
                  style={styles.overline}
                  variant="labelMd"
                >
                  SMS REVIEW
                </AppText>
                <AppText style={styles.title} variant="headlineSm">
                  Review imported SMS
                </AppText>
                <AppText color="mutedText" variant="bodyMd">
                  Confirm parsed bank and payment messages before they become
                  transactions.
                </AppText>
              </View>
            }
            onEndReached={() => void loadPage("append")}
            onEndReachedThreshold={0.35}
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
                <View style={styles.cardHeader}>
                  <View style={styles.cardCopy}>
                    <AppText style={styles.cardTitle} variant="titleMd">
                      {item.merchant}
                    </AppText>
                    <AppText color="mutedText" variant="bodyMd">
                      {item.smsSender} · {formatTimestamp(item.occurredAt)}
                    </AppText>
                  </View>
                  <AppText
                    color={item.direction === "income" ? "primary" : "text"}
                    style={styles.amount}
                    variant="titleMd"
                  >
                    {item.direction === "income" ? "+ " : "- "}
                    {formatMoney(item.amountMinor, item.currency)}
                  </AppText>
                </View>

                <View style={styles.metaRow}>
                  <Meta label="Category" value={item.categoryLabel} />
                  <Meta
                    label={
                      item.classificationConfidence !== null
                        ? "AI confidence"
                        : "Parser confidence"
                    }
                    value={formatConfidence(
                      item.classificationConfidence ?? item.confidence,
                    )}
                  />
                </View>

                <View style={styles.metaRow}>
                  <Meta
                    label="AI status"
                    value={formatAiStatus(item.classificationStatus)}
                  />
                  <Meta
                    label="Source"
                    value={formatAiSource(item.classificationSource)}
                  />
                </View>

                {item.classificationReason ? (
                  <Meta label="Reason" value={item.classificationReason} />
                ) : null}

                {item.suggestedCategoryLabel &&
                normalizeTextKey(item.suggestedCategoryLabel) !==
                  normalizeTextKey(item.categoryLabel) ? (
                  <Meta
                    label="AI suggestion"
                    value={item.suggestedCategoryLabel}
                  />
                ) : null}

                <OptionSelectField
                  label="Final category"
                  onSelect={(value) =>
                    void updateSmsCandidateCategory(item.id, value)
                  }
                  options={categoryOptions}
                  selectedValue={item.categoryId}
                />

                {item.categoryProposalId && item.suggestedCategoryLabel ? (
                  <View
                    style={[
                      styles.proposalCard,
                      {
                        backgroundColor: theme.colors.surfaceContainer,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <AppText style={styles.cardTitle} variant="titleMd">
                      New category proposed
                    </AppText>
                    <AppText color="mutedText" variant="bodyMd">
                      {item.suggestedCategoryLabel}
                    </AppText>
                    <AppButton
                      onPress={() =>
                        void approveCategoryProposal(item.categoryProposalId!)
                      }
                      title="Approve category"
                      variant="secondary"
                    />
                  </View>
                ) : null}

                {item.reference ? (
                  <Meta label="Reference" value={item.reference} />
                ) : null}
                {item.notes ? <Meta label="Notes" value={item.notes} /> : null}
                <Meta label="SMS" value={item.smsBody} />

                <View style={styles.actions}>
                  <AppButton
                    onPress={() => void dismissSmsCandidate(item.id)}
                    title="Dismiss"
                    variant="secondary"
                  />
                  <AppButton
                    onPress={async () => {
                      const transactionId = await acceptSmsCandidate(item.id);
                      router.replace(`/transactions/${transactionId}`);
                    }}
                    title="Accept"
                  />
                </View>
              </View>
            )}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.listContent}>
            <View style={styles.header}>
              <AppText
                color="primary"
                style={styles.overline}
                variant="labelMd"
              >
                SMS REVIEW
              </AppText>
              <AppText style={styles.title} variant="headlineSm">
                Review imported SMS
              </AppText>
              <AppText color="mutedText" variant="bodyMd">
                Confirm parsed bank and payment messages before they become
                transactions.
              </AppText>
            </View>
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: theme.colors.surfaceContainerLowest,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <AppText style={styles.cardTitle} variant="titleMd">
                No pending SMS
              </AppText>
              <AppText color="mutedText" variant="bodyMd">
                Import your inbox or wait for a new finance SMS to arrive while
                the listener is enabled.
              </AppText>
            </View>
          </View>
        )}
      </Screen>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaBlock}>
      <AppText color="mutedText" style={styles.metaLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText variant="bodyMd">{value}</AppText>
    </View>
  );
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-KE", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
}

function formatAiStatus(
  status: "not_needed" | "queued" | "processing" | "classified" | "failed",
) {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "classified":
      return "Classified";
    case "failed":
      return "Failed";
    default:
      return "Rule-based";
  }
}

function formatAiSource(source: "rule" | "merchant_memory" | "ai" | "user") {
  switch (source) {
    case "merchant_memory":
      return "Merchant memory";
    case "ai":
      return "AI";
    case "user":
      return "User";
    default:
      return "Rule";
  }
}

function formatConfidence(value: number | null) {
  return value === null ? "Unknown" : `${value}%`;
}

function normalizeTextKey(value: string) {
  return value.trim().toLowerCase();
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  amount: {
    fontFamily: font.headerSemiBold,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  cardCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  cardHeader: {
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: font.headerSemiBold,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  footerLoader: {
    alignItems: "center",
    paddingBottom: Sizes["6xl"],
    paddingTop: Spacing.md,
  },
  emptyState: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  loadingState: {
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  metaBlock: {
    gap: Sizes.xxs,
  },
  metaLabel: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  metaRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  proposalCard: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  separator: {
    height: Spacing.md,
  },
  screen: {
    flex: 1,
  },
  title: {
    fontFamily: font.headerBold,
  },
});

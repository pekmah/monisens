import { Feather } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetFlashList,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import {
  AppButton,
  AppFlashList,
  NestedScreenHeader,
  AppPressable,
  AppText,
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
  const [candidates, setCandidates] = useState<SmsTransactionCandidateRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [pickerCandidateId, setPickerCandidateId] = useState<string | null>(null);
  const pickerModalRef = useRef<BottomSheetModal>(null);
  const candidateCount = snapshot?.sms.candidateCount ?? 0;
  const categories = snapshot?.categories ?? [];
  const categoryOptions = categories.map((category) => ({
    accentColor: category.color,
    label: category.label,
    value: category.id,
  }));
  const categoryLabelById = new Map(categories.map((category) => [category.id, category.label]));
  const categoryColorById = new Map(categories.map((category) => [category.id, category.color]));
  const pickerCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === pickerCandidateId) ?? null,
    [candidates, pickerCandidateId],
  );

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

  useEffect(() => {
    return () => {
      pickerModalRef.current?.dismiss();
    };
  }, []);

  const handleCategorySelect = useCallback(
    async (candidateId: string, categoryId: string) => {
      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === candidateId
            ? {
                ...candidate,
                categoryId,
                categoryLabel:
                  categoryLabelById.get(categoryId) ?? candidate.categoryLabel,
                suggestedCategoryLabel:
                  categoryLabelById.get(categoryId) ?? candidate.suggestedCategoryLabel,
                classificationSource:
                  candidate.classificationSource === "user"
                    ? candidate.classificationSource
                    : "user",
              }
            : candidate,
        ),
      );

      await updateSmsCandidateCategory(candidateId, categoryId);
      await loadPage("reset");
    },
    [categoryLabelById, loadPage, updateSmsCandidateCategory],
  );

  const openCategoryPicker = useCallback((candidateId: string) => {
    setPickerCandidateId(candidateId);
    pickerModalRef.current?.present();
  }, []);

  const closeCategoryPicker = useCallback(() => {
    pickerModalRef.current?.dismiss();
    setPickerCandidateId(null);
  }, []);

  const renderPickerBackdrop = useCallback(
    (
      props: Parameters<
        NonNullable<React.ComponentProps<typeof BottomSheetModal>["backdropComponent"]>
      >[0],
    ) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.42}
        pressBehavior="close"
      />
    ),
    [],
  );

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
                  <ActivityIndicator color={theme.colors.primary} size="small" />
                </View>
              ) : null
            }
            ListHeaderComponent={
              <NestedScreenHeader
                description="Confirm parsed bank and payment messages before they become transactions."
                overline="SMS REVIEW"
                title="Review imported SMS"
              />
            }
            onEndReached={() => void loadPage("append")}
            onEndReachedThreshold={0.35}
            renderItem={({ item }) => {
              const resolvedCategoryLabel =
                (item.categoryId ? categoryLabelById.get(item.categoryId) : null) ??
                item.categoryLabel;

              return (
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
                    <Meta label="Category" value={resolvedCategoryLabel} />
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
                    normalizeTextKey(resolvedCategoryLabel) ? (
                    <Meta label="AI suggestion" value={item.suggestedCategoryLabel} />
                  ) : null}

                  <View style={styles.fieldWrap}>
                    <AppText style={styles.fieldLabel} variant="labelMd">
                      Final category
                    </AppText>
                    <AppPressable
                      onPress={() => openCategoryPicker(item.id)}
                      style={[
                        styles.field,
                        {
                          backgroundColor: theme.colors.surfaceContainerLow,
                          borderColor: theme.colors.outlineVariant,
                        },
                      ]}
                    >
                      <View style={styles.fieldValueRow}>
                        {item.categoryId && categoryColorById.get(item.categoryId) ? (
                          <>
                            <View
                              style={[
                                styles.dot,
                                {
                                  backgroundColor:
                                    categoryColorById.get(item.categoryId) ??
                                    theme.colors.outlineVariant,
                                },
                              ]}
                            />
                            <AppText style={styles.fieldValue} variant="bodyMd">
                              {resolvedCategoryLabel}
                            </AppText>
                          </>
                        ) : (
                          <AppText color="mutedText" style={styles.fieldValue} variant="bodyMd">
                            Choose a category
                          </AppText>
                        )}
                      </View>
                      <Feather color={theme.colors.mutedText} name="chevron-down" size={18} />
                    </AppPressable>
                  </View>

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
                      disabled={!item.categoryId}
                      onPress={async () => {
                        const transactionId = await acceptSmsCandidate(item.id);
                        router.replace(`/transactions/${transactionId}`);
                      }}
                      title="Accept"
                    />
                  </View>
                </View>
              );
            }}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.listContent}>
            <NestedScreenHeader
              description="Confirm parsed bank and payment messages before they become transactions."
              overline="SMS REVIEW"
              title="Review imported SMS"
            />
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

        <BottomSheetModal
          ref={pickerModalRef}
          backdropComponent={renderPickerBackdrop}
          backgroundStyle={{ backgroundColor: theme.colors.surfaceContainerLowest }}
          enableDismissOnClose
          handleIndicatorStyle={{ backgroundColor: theme.colors.outline }}
          onDismiss={() => setPickerCandidateId(null)}
          snapPoints={categoryOptions.length > 6 ? ["78%"] : ["64%"]}
        >
          <BottomSheetView style={styles.sheetContent}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetCopy}>
                <AppText style={styles.sheetTitle} variant="titleMd">
                  Choose category
                </AppText>
                <AppText color="mutedText" style={styles.sheetSubtitle} variant="bodyMd">
                  {pickerCandidate?.merchant ?? "Select one option."}
                </AppText>
              </View>
              <AppPressable onPress={closeCategoryPicker} style={styles.closeButton}>
                <Feather color={theme.colors.mutedText} name="x" size={18} />
              </AppPressable>
            </View>

            <BottomSheetFlashList
              contentContainerStyle={styles.pickerListContent}
              data={categoryOptions}
              estimatedItemSize={56}
              keyExtractor={(item) => item.value}
              ListFooterComponent={
                <View style={styles.footer}>
                  <AppButton onPress={closeCategoryPicker} title="Close" variant="secondary" />
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = item.value === pickerCandidate?.categoryId;

                return (
                  <AppPressable
                    onPress={async () => {
                      if (!pickerCandidate) {
                        return;
                      }

                      closeCategoryPicker();
                      await handleCategorySelect(pickerCandidate.id, item.value);
                    }}
                    style={[
                      styles.optionRow,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primaryContainer
                          : theme.colors.surfaceContainerLow,
                        borderColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.optionCopy}>
                      <View style={styles.optionLabelRow}>
                        {item.accentColor ? (
                          <View style={[styles.dot, { backgroundColor: item.accentColor }]} />
                        ) : null}
                        <AppText style={styles.optionLabel} variant="bodyMd">
                          {item.label}
                        </AppText>
                      </View>
                    </View>
                    {isSelected ? (
                      <Feather color={theme.colors.primary} name="check" size={18} />
                    ) : null}
                  </AppPressable>
                );
              }}
              ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
              showsVerticalScrollIndicator={false}
              style={styles.pickerList}
            />
          </BottomSheetView>
        </BottomSheetModal>
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
  closeButton: {
    padding: Spacing.sm,
  },
  emptyState: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  field: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  fieldLabel: {
    fontFamily: font.semiBold,
  },
  fieldValue: {
    lineHeight: LineHeights.md,
  },
  fieldValueRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fieldWrap: {
    gap: Spacing.sm,
  },
  footer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  footerLoader: {
    alignItems: "center",
    paddingBottom: Sizes["6xl"],
    paddingTop: Spacing.md,
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
  optionCopy: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontFamily: font.medium,
  },
  optionLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  optionRow: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["10xl"],
    paddingHorizontal: Spacing.md + Spacing.xs,
    paddingVertical: Spacing.sm + Sizes.xs / 2,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  pickerList: {
    flex: 1,
  },
  pickerListContent: {
    paddingBottom: Spacing.xl,
  },
  pickerSeparator: {
    height: Spacing.xs + Sizes.xs / 2,
  },
  proposalCard: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  screen: {
    flex: 1,
  },
  separator: {
    height: Spacing.md,
  },
  sheetContent: {
    flex: 1,
    gap: Spacing.lg,
    paddingBottom: Sizes["4xl"],
    paddingHorizontal: Spacing.xl,
  },
  sheetCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  sheetHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  sheetSubtitle: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  sheetTitle: {
    fontFamily: font.headerSemiBold,
  },
  title: {
    fontFamily: font.headerBold,
  },
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
});

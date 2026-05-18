import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";

import { AppFlashList, Screen } from "@/components/base";
import { Sizes, Spacing } from "@/constants/theme";
import {
  EmptyReviewState,
  ListSeparator,
  LoadingFooter,
  LoadingState,
  ReviewHeader,
  SmsCandidateCard,
} from "@/features/sms-sync/components";
import type { SmsTransactionCandidateRecord } from "@/lib/finance";
import { useFinance } from "@/lib/finance";

const PAGE_SIZE = 20;

export default function SmsReviewScreen() {
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
  const previousCandidateCountRef = useRef(candidateCount);
  // Keep a cheap lookup for category labels because each pending SMS row may
  // need to display the latest local category name after review edits.
  const categoryLabelById = useMemo(
    () =>
      new Map(
        (snapshot?.categories ?? []).map((category) => [
          category.id,
          category.label,
        ]),
      ),
    [snapshot?.categories],
  );

  // Reset pagination whenever the review queue is loaded from the top.
  const loadFirstPage = useCallback(async () => {
    setInitialLoading(true);

    try {
      const page = await loadPendingSmsCandidatesPage({
        limit: PAGE_SIZE,
        offset: 0,
      });

      setCandidates(page.items);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } finally {
      setInitialLoading(false);
    }
  }, [loadPendingSmsCandidatesPage]);

  // Append the next page without disturbing already reviewed rows on screen.
  const loadNextPage = useCallback(async () => {
    if (!hasMore || loadingMore) {
      return;
    }

    setLoadingMore(true);

    try {
      const page = await loadPendingSmsCandidatesPage({
        limit: PAGE_SIZE,
        offset: nextOffset,
      });

      setCandidates((current) => [...current, ...page.items]);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadPendingSmsCandidatesPage, loadingMore, nextOffset]);

  useFocusEffect(
    useCallback(() => {
      // Refresh the global finance snapshot before reading the local review page.
      void refresh();
      void loadFirstPage();
    }, [loadFirstPage, refresh]),
  );

  useEffect(() => {
    // The snapshot count changes when SMS import/listener work adds or removes
    // pending candidates, so the visible queue needs to be reloaded.
    if (previousCandidateCountRef.current === candidateCount) {
      return;
    }

    previousCandidateCountRef.current = candidateCount;

    if (!initialLoading) {
      void loadFirstPage();
    }
  }, [candidateCount, initialLoading, loadFirstPage]);

  const handleCategorySelect = useCallback(
    async (candidateId: string, categoryId: string) => {
      // Update the row optimistically so the selected category is visible before
      // the database write completes. Reloading the page here remounts the row
      // while the sheet is dismissing, which can make the modal present again.
      setCandidates((current) =>
        current.map((candidate) =>
          candidate.id === candidateId
            ? {
                ...candidate,
                categoryId,
                categoryLabel:
                  categoryLabelById.get(categoryId) ?? candidate.categoryLabel,
                suggestedCategoryLabel:
                  categoryLabelById.get(categoryId) ??
                  candidate.suggestedCategoryLabel,
                classificationSource:
                  candidate.classificationSource === "user"
                    ? candidate.classificationSource
                    : "user",
              }
            : candidate,
        ),
      );

      await updateSmsCandidateCategory(candidateId, categoryId);
    },
    [categoryLabelById, updateSmsCandidateCategory],
  );

  const renderCandidate = useCallback(
    // The row component owns review-specific UI; the screen only passes actions
    // and the small lookup it needs to resolve category labels.
    ({ item }: { item: SmsTransactionCandidateRecord }) => (
      <SmsCandidateCard
        candidate={item}
        categoryLabelById={categoryLabelById}
        onAcceptCandidate={acceptSmsCandidate}
        onApproveCategoryProposal={approveCategoryProposal}
        onCategorySelect={handleCategorySelect}
        onDismissCandidate={dismissSmsCandidate}
      />
    ),
    [
      acceptSmsCandidate,
      approveCategoryProposal,
      categoryLabelById,
      dismissSmsCandidate,
      handleCategorySelect,
    ],
  );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen padded={false} style={styles.screen}>
        {initialLoading ? (
          <LoadingState />
        ) : candidates.length ? (
          <AppFlashList
            contentContainerStyle={styles.listContent}
            data={candidates}
            ItemSeparatorComponent={ListSeparator}
            keyExtractor={(item) => item.id}
            ListFooterComponent={loadingMore ? <LoadingFooter /> : null}
            ListHeaderComponent={<ReviewHeader />}
            onEndReached={() => void loadNextPage()}
            onEndReachedThreshold={0.35}
            renderItem={renderCandidate}
            scrollEnabled
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyReviewState />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  screen: {
    flex: 1,
  },
});

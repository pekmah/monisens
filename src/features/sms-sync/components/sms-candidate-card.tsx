import { router } from "expo-router";
import { useCallback } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, AppText, CategorySelectField } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SmsTransactionCandidateRecord } from "@/lib/finance";
import { formatMoney } from "@/lib/finance";

export function SmsCandidateCard({
  candidate,
  categoryLabelById,
  onAcceptCandidate,
  onApproveCategoryProposal,
  onCategorySelect,
  onDismissCandidate,
}: {
  candidate: SmsTransactionCandidateRecord;
  categoryLabelById: Map<string, string>;
  onAcceptCandidate: (id: string) => Promise<string>;
  onApproveCategoryProposal: (id: string) => Promise<void>;
  onCategorySelect: (candidateId: string, categoryId: string) => Promise<void>;
  onDismissCandidate: (id: string) => Promise<void>;
}) {
  const theme = useAppTheme();
  // Prefer the current category table label over the stale label stored on the
  // parsed candidate, because users can rename categories while SMS remain pending.
  const resolvedCategoryLabel =
    (candidate.categoryId ? categoryLabelById.get(candidate.categoryId) : null) ??
    candidate.categoryLabel;

  // Bind row-level actions to the candidate id so the reusable field only needs
  // to emit the selected category id.
  const handleCategorySelect = useCallback(
    (categoryId: string) => onCategorySelect(candidate.id, categoryId),
    [candidate.id, onCategorySelect],
  );

  const handleApproveCategoryProposal = useCallback(() => {
    if (!candidate.categoryProposalId) {
      return;
    }

    void onApproveCategoryProposal(candidate.categoryProposalId);
  }, [candidate.categoryProposalId, onApproveCategoryProposal]);

  const handleDismiss = useCallback(() => {
    void onDismissCandidate(candidate.id);
  }, [candidate.id, onDismissCandidate]);

  const handleAccept = useCallback(async () => {
    // Accepting creates a real transaction, so take the user directly to the
    // transaction detail screen once the review candidate is converted.
    const transactionId = await onAcceptCandidate(candidate.id);
    router.replace(`/transactions/${transactionId}`);
  }, [candidate.id, onAcceptCandidate]);

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
            {candidate.merchant}
          </AppText>
          <AppText color="mutedText" variant="bodyMd">
            {candidate.smsSender} · {formatTimestamp(candidate.occurredAt)}
          </AppText>
        </View>
        <AppText
          color={candidate.direction === "income" ? "primary" : "text"}
          style={styles.amount}
          variant="titleMd"
        >
          {candidate.direction === "income" ? "+ " : "- "}
          {formatMoney(candidate.amountMinor, candidate.currency)}
        </AppText>
      </View>

      <View style={styles.metaRow}>
        <Meta label="Category" value={resolvedCategoryLabel} />
        <Meta
          label={
            candidate.classificationConfidence !== null
              ? "AI confidence"
              : "Parser confidence"
          }
          value={formatConfidence(
            candidate.classificationConfidence ?? candidate.confidence,
          )}
        />
      </View>

      <View style={styles.metaRow}>
        <Meta
          label="AI status"
          value={formatAiStatus(candidate.classificationStatus)}
        />
        <Meta
          label="Source"
          value={formatAiSource(candidate.classificationSource)}
        />
      </View>

      {candidate.classificationReason ? (
        <Meta label="Reason" value={candidate.classificationReason} />
      ) : null}

      {candidate.suggestedCategoryLabel &&
      normalizeTextKey(candidate.suggestedCategoryLabel) !==
        normalizeTextKey(resolvedCategoryLabel) ? (
        // Show the AI suggestion only when it disagrees with the current final category.
        <Meta label="AI suggestion" value={candidate.suggestedCategoryLabel} />
      ) : null}

      <CategorySelectField
        label="Final category"
        onSelect={handleCategorySelect}
        selectedValue={candidate.categoryId}
        sheetSubtitle={candidate.merchant}
        title="Choose category"
      />

      {candidate.categoryProposalId && candidate.suggestedCategoryLabel ? (
        // Proposed categories are reviewed inline so the user can add them
        // before accepting the parsed transaction.
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
            {candidate.suggestedCategoryLabel}
          </AppText>
          <AppButton
            onPress={handleApproveCategoryProposal}
            title="Approve category"
            variant="secondary"
          />
        </View>
      ) : null}

      {candidate.reference ? (
        <Meta label="Reference" value={candidate.reference} />
      ) : null}
      {candidate.notes ? <Meta label="Notes" value={candidate.notes} /> : null}
      <Meta label="SMS" value={candidate.smsBody} />

      <View style={styles.actions}>
        <AppButton
          onPress={handleDismiss}
          title="Dismiss"
          variant="secondary"
        />
        <AppButton
          disabled={!candidate.categoryId}
          onPress={() => void handleAccept()}
          title="Accept"
        />
      </View>
    </View>
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
});

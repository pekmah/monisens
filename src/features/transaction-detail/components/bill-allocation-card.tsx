import { router } from "expo-router";
import { ActivityIndicator, StyleSheet, View, type ViewStyle } from "react-native";

import { AppPressable, AppText } from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney, type BillAllocationCandidateRecord } from "@/lib/finance";

export function BillAllocationCard({
  busyOccurrenceId,
  linkedOccurrence,
  loading,
  matches,
  onAllocate,
  onUnlink,
}: {
  busyOccurrenceId: string | null;
  linkedOccurrence: BillAllocationCandidateRecord | null;
  loading: boolean;
  matches: BillAllocationCandidateRecord[];
  onAllocate: (occurrenceId: string) => void;
  onUnlink: (occurrenceId: string) => void;
}) {
  const theme = useAppTheme();
  const hasSuggestions = matches.length > 0;

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <AppText style={styles.title} variant="titleMd">
            Bill allocation
          </AppText>
          <AppText color="mutedText" style={styles.subtitle} variant="bodyMd">
            {linkedOccurrence
              ? "This transaction is already linked to a bill occurrence."
              : hasSuggestions
                ? "Choose a matching bill occurrence to mark it paid."
                : "No unpaid bill occurrence matches this transaction right now."}
          </AppText>
        </View>
      </View>

      {linkedOccurrence ? (
        <AllocationRow
          actionLabel="Unlink"
          actionTone="secondary"
          busy={busyOccurrenceId === linkedOccurrence.id}
          candidate={linkedOccurrence}
          onAction={() => onUnlink(linkedOccurrence.id)}
        />
      ) : null}

      {!linkedOccurrence && loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={theme.colors.primary} size="small" />
          <AppText color="mutedText" variant="bodyMd">
            Loading bill matches...
          </AppText>
        </View>
      ) : null}

      {!linkedOccurrence && !loading && hasSuggestions ? (
        <View style={styles.matches}>
          {matches.map((candidate) => (
            <AllocationRow
              actionLabel="Allocate"
              actionTone="primary"
              busy={busyOccurrenceId === candidate.id}
              candidate={candidate}
              key={candidate.id}
              onAction={() => onAllocate(candidate.id)}
            />
          ))}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

function AllocationRow({
  actionLabel,
  actionTone,
  busy,
  candidate,
  onAction,
}: {
  actionLabel: string;
  actionTone: "primary" | "secondary";
  busy: boolean;
  candidate: BillAllocationCandidateRecord;
  onAction: () => void;
}) {
  const theme = useAppTheme();
  const rowThemeStyle = getRowThemeStyle(theme);
  const dotThemeStyle = getDotThemeStyle(candidate.categoryColor);
  const actionThemeStyle = getActionThemeStyle(theme, actionTone);

  return (
    <View
      style={[
        styles.row,
        rowThemeStyle,
      ]}
    >
      <View style={styles.rowHeader}>
        <View style={styles.billCopy}>
          <View style={styles.billTitleRow}>
            <View
              style={[
                styles.dot,
                dotThemeStyle,
              ]}
            />
            <AppPressable onPress={() => router.push(`/bills/${candidate.billId}`)}>
              <AppText style={styles.billTitle} variant="labelMd">
                {candidate.billName}
              </AppText>
            </AppPressable>
          </View>
          <AppText color="mutedText" style={styles.meta} variant="bodyMd">
            Due {formatBillDate(candidate.dueAt)} · {candidate.categoryLabel}
          </AppText>
          <AppText color="mutedText" style={styles.meta} variant="bodyMd">
            {candidate.reason} · {candidate.confidence}%
          </AppText>
        </View>
        <AppText style={styles.amount} variant="labelMd">
          {formatMoney(candidate.amountMinor, candidate.currency)}
        </AppText>
      </View>

      <AppPressable
        onPress={onAction}
        style={[
          styles.action,
          actionThemeStyle,
        ]}
      >
        {busy ? (
          <ActivityIndicator
            color={
              actionTone === "primary"
                ? theme.colors.onPrimary
                : theme.colors.primary
            }
            size="small"
          />
        ) : (
          <AppText
            color={actionTone === "primary" ? "onPrimary" : "primary"}
            style={styles.actionLabel}
            variant="labelMd"
          >
            {actionLabel}
          </AppText>
        )}
      </AppPressable>
    </View>
  );
}

function getRowThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.outlineVariant,
  };
}

function getDotThemeStyle(backgroundColor: string): ViewStyle {
  return {
    backgroundColor,
  };
}

function getActionThemeStyle(
  theme: AppTheme,
  actionTone: "primary" | "secondary",
): ViewStyle {
  return {
    backgroundColor:
      actionTone === "primary"
        ? theme.colors.primary
        : theme.colors.surfaceContainerHighest,
  };
}

function formatBillDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    borderRadius: Radii.full,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    paddingHorizontal: Spacing.lg,
  },
  actionLabel: {
    fontFamily: font.bold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  amount: {
    fontFamily: font.headerSemiBold,
  },
  billCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  billTitle: {
    fontFamily: font.semiBold,
  },
  billTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  card: {
    gap: Spacing.md,
  },
  copy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  loading: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  matches: {
    gap: Spacing.sm,
  },
  meta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  row: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  rowHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  subtitle: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

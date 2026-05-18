import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText } from "@/components/base";
import { font } from "@/constants/fonts";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

import { ReviewHeader } from "./review-header";

export function LoadingState() {
  const theme = useAppTheme();

  // Initial load blocks the whole review surface until the first page exists.
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={theme.colors.primary} size="small" />
      <AppText color="mutedText" variant="bodyMd">
        Loading review queue...
      </AppText>
    </View>
  );
}

export function LoadingFooter() {
  const theme = useAppTheme();

  // Pagination keeps the existing rows visible and only shows progress at the end.
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator color={theme.colors.primary} size="small" />
    </View>
  );
}

export function EmptyReviewState() {
  const theme = useAppTheme();

  // The empty state keeps the same header context as the populated review queue.
  return (
    <View style={styles.listContent}>
      <ReviewHeader />
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
          Import your inbox or wait for a new finance SMS to arrive while the
          listener is enabled.
        </AppText>
      </View>
    </View>
  );
}

export function ListSeparator() {
  // FlashList uses a component here so row spacing stays stable during recycling.
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  cardTitle: {
    fontFamily: font.headerSemiBold,
  },
  emptyState: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  footerLoader: {
    alignItems: "center",
    paddingBottom: Sizes["6xl"],
    paddingTop: Spacing.md,
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
  separator: {
    height: Spacing.md,
  },
});

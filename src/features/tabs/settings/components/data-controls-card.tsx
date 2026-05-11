import { Feather } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { useToast } from "@/components/toast";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

export function DataControlsCard() {
  const theme = useAppTheme();
  const { seedDemoTransactions, snapshot } = useFinance();
  const { showToast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);

  const transactionCount = snapshot?.transactions.length ?? 0;
  const budgetCount = snapshot?.budgets.length ?? 0;
  const categoryCount = snapshot?.categories.length ?? 0;
  const importCount = snapshot?.imports.length ?? 0;
  const attachmentCount = snapshot?.attachments.length ?? 0;
  const totalFinanceRows =
    transactionCount + budgetCount + categoryCount + importCount + attachmentCount;

  const handleSeedDemoTransactions = useCallback(async () => {
    setIsSeeding(true);

    try {
      const result = await seedDemoTransactions();
      showToast({
        description: `${result.count} local transactions were saved to SQLite.`,
        title: "Demo data saved",
        variant: "success",
      });
    } catch (seedError) {
      showToast({
        description:
          seedError instanceof Error
            ? seedError.message
            : "Demo transactions could not be saved locally.",
        title: "Seed failed",
        variant: "error",
      });
    } finally {
      setIsSeeding(false);
    }
  }, [seedDemoTransactions, showToast]);

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconTile,
            { backgroundColor: `${theme.colors.secondary}14` },
          ]}
        >
          <Feather color={theme.colors.secondary} name="database" size={18} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.title} variant="titleMd">
            Data Management
          </AppText>
          <AppText color="mutedText" style={styles.headerMeta} variant="bodyMd">
            SQLite is the local source of truth. Backups are handled through encrypted export files.
          </AppText>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <MetricTile label="Records" value={formatCount(totalFinanceRows)} />
        <MetricTile label="Transactions" value={formatCount(transactionCount)} />
        <MetricTile label="Budgets" value={formatCount(budgetCount)} />
      </View>

      <View
        style={[
          styles.control,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.controlHeader}>
          <View
            style={[
              styles.controlIcon,
              { backgroundColor: `${theme.colors.primary}12` },
            ]}
          >
            <Feather color={theme.colors.primary} name="hard-drive" size={18} />
          </View>
          <View style={styles.controlCopy}>
            <AppText style={styles.controlTitle} variant="labelMd">
              Local database
            </AppText>
            <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
              {formatCount(transactionCount)} transactions, {formatCount(budgetCount)} budgets,{" "}
              {formatCount(categoryCount)} categories, {formatCount(importCount)} imports, and{" "}
              {formatCount(attachmentCount)} attachments are stored on this device.
            </AppText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.control,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.controlHeader}>
          <View
            style={[
              styles.controlIcon,
              { backgroundColor: `${theme.colors.tertiary}12` },
            ]}
          >
            <Feather color={theme.colors.tertiary} name="archive" size={18} />
          </View>
          <View style={styles.controlCopy}>
            <AppText style={styles.controlTitle} variant="labelMd">
              Backup mode
            </AppText>
            <AppText color="mutedText" style={styles.controlMeta} variant="bodyMd">
              Cloud sync is removed. Use Backups to export or restore an encrypted local file.
            </AppText>
          </View>
        </View>
      </View>

      <AppButton
        loading={isSeeding}
        onPress={() => void handleSeedDemoTransactions()}
        title="Seed phone demo data"
        variant="ghost"
      />
    </SurfaceCard>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.metricTile,
        {
          backgroundColor: theme.colors.surfaceContainer,
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

function formatCount(value: number) {
  return new Intl.NumberFormat().format(value);
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.xl,
  },
  control: {
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  controlCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  controlHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  controlIcon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["7xl"],
    justifyContent: "center",
    width: Sizes["7xl"],
  },
  controlMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  controlTitle: {
    fontFamily: font.bold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  headerMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["7xl"],
    justifyContent: "center",
    width: Sizes["7xl"],
  },
  metricLabel: {
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  metricTile: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Spacing.xs,
    minHeight: Sizes["10xl"],
    padding: Spacing.md,
  },
  metricValue: {
    fontFamily: font.headerSemiBold,
  },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppButton, AppText } from "@/components/base";
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
import { useFinance } from "@/lib/finance";

export function CategoriesCard() {
  const theme = useAppTheme();
  const { snapshot } = useFinance();
  const categories = snapshot?.categories ?? [];
  const defaultCount = categories.filter((category) => category.isDefault).length;
  const iconTileThemeStyle = getIconTileThemeStyle(theme);
  const statusCardThemeStyle = getStatusCardThemeStyle(theme);

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconTile, iconTileThemeStyle]}>
          <Feather color={theme.colors.tertiary} name="tag" size={Sizes.xl} />
        </View>
        <View style={styles.headerCopy}>
          <AppText style={styles.title} variant="titleMd">
            Categories
          </AppText>
          <AppText color="mutedText" style={styles.meta} variant="bodyMd">
            Rename, recolor, create, and safely delete categories from one place.
          </AppText>
        </View>
      </View>

      <View
        style={[styles.statusCard, statusCardThemeStyle]}
      >
        <View style={styles.metricRow}>
          <Metric label="Total" value={String(categories.length)} />
          <Metric label="Default" value={String(defaultCount)} />
        </View>
        <AppText color="mutedText" variant="bodyMd">
          Default categories can be edited, but deletion is limited to custom categories with no active usage.
        </AppText>
      </View>

      <AppButton onPress={() => router.push("/settings/categories" as never)} title="Manage categories" />
    </SurfaceCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const theme = useAppTheme();
  const metricThemeStyle = getMetricThemeStyle(theme);

  return (
    <View style={[styles.metric, metricThemeStyle]}>
      <AppText color="mutedText" style={styles.metricLabel} variant="labelMd">
        {label}
      </AppText>
      <AppText style={styles.metricValue} variant="titleMd">
        {value}
      </AppText>
    </View>
  );
}

function getIconTileThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: `${theme.colors.tertiary}14`,
  };
}

function getStatusCardThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderColor: theme.colors.outlineVariant,
  };
}

function getMetricThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderColor: theme.colors.outlineVariant,
  };
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  meta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  metric: {
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flex: 1,
    gap: Spacing.xs,
    padding: Spacing.md,
  },
  metricLabel: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  metricRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metricValue: {
    fontFamily: font.headerSemiBold,
  },
  statusCard: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

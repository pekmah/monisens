import { StyleSheet, View, type ViewStyle } from "react-native";

import { AppFlashList } from "@/components/base";
import { AppText } from "@/components/base/app-text";
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

export type MetaRow = {
  label: string;
  tone?: "success";
  value: string;
};

export type MetaRowsCardProps = {
  rows: MetaRow[];
};

export function MetaRowsCard({ rows }: MetaRowsCardProps) {
  const theme = useAppTheme();
  const rowThemeStyle = getRowThemeStyle(theme);
  const valuePillThemeStyle = getValuePillThemeStyle(theme);

  return (
    <SurfaceCard style={styles.card}>
      <AppText style={styles.title} variant="titleMd">
        Receipt metadata
      </AppText>
      <AppFlashList
        data={rows}
        keyExtractor={(row) => row.label}
        renderItem={({ item: row }) => (
          <View
            style={[
              styles.row,
              rowThemeStyle,
            ]}
          >
            <AppText color="mutedText" style={styles.label} variant="labelMd">
              {row.label}
            </AppText>
            <View
              style={
                row.tone === "success"
                  ? [
                      styles.valuePill,
                      valuePillThemeStyle,
                    ]
                  : styles.valueWrap
              }
            >
              <AppText
                color={row.tone === "success" ? "onPrimaryFixed" : "text"}
                style={styles.value}
                variant="bodyLg"
              >
                {row.value}
              </AppText>
            </View>
          </View>
        )}
      />
    </SurfaceCard>
  );
}

function getRowThemeStyle(theme: AppTheme): ViewStyle {
  return {
    borderBottomColor: theme.colors.outlineVariant,
  };
}

function getValuePillThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.primaryFixed,
  };
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  label: {
    fontSize: FontSizes.xs,
    letterSpacing: 0.8,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  row: {
    alignItems: "center",
    borderBottomWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    minHeight: Sizes["9xl"],
    paddingBottom: Spacing.md,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
  value: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
    textAlign: "right",
  },
  valuePill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  valueWrap: {
    alignItems: "flex-end",
    flex: 1,
  },
});

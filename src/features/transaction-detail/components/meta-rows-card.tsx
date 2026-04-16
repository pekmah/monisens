import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";

export type MetaRow = {
  label: string;
  value: string;
};

export type MetaRowsCardProps = {
  rows: MetaRow[];
};

export function MetaRowsCard({ rows }: MetaRowsCardProps) {
  return (
    <SurfaceCard style={styles.card}>
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <AppText color="mutedText" variant="labelMd">
            {row.label}
          </AppText>
          <AppText variant="bodyLg">{row.value}</AppText>
        </View>
      ))}
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Sizes.md + Sizes.xxs,
  },
  row: {
    gap: Spacing.xs,
    minHeight: Sizes["10xl"] - Sizes.xxs,
  },
});

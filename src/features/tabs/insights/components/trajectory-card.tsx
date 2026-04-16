import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Radii, Sizes } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

const chartBars = [38, 58, 44, 72, 63, 86];

export function TrajectoryCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard elevated style={styles.card}>
      <AppText color="mutedText" variant="labelMd">
        FINANCIAL TRAJECTORY
      </AppText>
      <View style={styles.metricRow}>
        <View>
          <AppText color="mutedText" variant="bodyMd">
            Monthly Spend
          </AppText>
          <AppText variant="headlineSm">KES 142,500</AppText>
        </View>
        <AppText color="mutedText" variant="labelMd">
          July 2024
        </AppText>
      </View>
      <View style={styles.chart}>
        {chartBars.map((height, index) => (
          <View
            key={index}
            style={[
              styles.chartBar,
              {
                backgroundColor:
                  index === chartBars.length - 1
                    ? theme.colors.primary
                    : theme.colors.surfaceContainerHighest,
                height,
              },
            ]}
          />
        ))}
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Sizes.xl,
  },
  chart: {
    alignItems: "flex-end",
    flexDirection: "row",
    gap: Sizes.sm + Sizes.xxs,
    height: Sizes["14xl"] + Sizes.xs,
    justifyContent: "space-between",
  },
  chartBar: {
    borderRadius: Radii.full,
    flex: 1,
  },
  metricRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

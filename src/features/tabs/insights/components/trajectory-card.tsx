import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { AppFlashList, AppText } from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney, type TrajectoryRecord } from "@/lib/finance";

export function TrajectoryCard({
  trajectory,
}: {
  trajectory: TrajectoryRecord | null;
}) {
  const theme = useAppTheme();

  if (!trajectory) {
    return (
      <SurfaceCard style={styles.card}>
        <AppText style={styles.cardTitle} variant="titleMd">
          Monthly Spend
        </AppText>
        <AppText color="mutedText" style={styles.month} variant="bodyMd">
          Add transactions to see your monthly trajectory.
        </AppText>
      </SurfaceCard>
    );
  }

  const labels = trajectory.points.map((point) => point.label);
  const values = trajectory.points.map((point) => point.valueMinor);
  const { areaPath, linePath, lastPoint } = buildChartPaths(values);
  const deltaColor =
    trajectory.trend === "up"
      ? theme.colors.error
      : trajectory.trend === "down"
        ? theme.colors.primary
        : theme.colors.mutedText;
  const deltaIcon =
    trajectory.trend === "up"
      ? "trending-up"
      : trajectory.trend === "down"
        ? "trending-down"
        : "minus";
  const deltaLabel =
    trajectory.changePercentage == null
      ? "No prior month comparison"
      : `${Math.abs(trajectory.changePercentage).toFixed(1)}% vs last month`;

  return (
    <SurfaceCard elevated style={styles.card}>
      <View style={styles.metricRow}>
        <View>
          <AppText style={styles.cardTitle} variant="titleMd">
            Monthly Spend
          </AppText>
          <AppText color="mutedText" style={styles.month} variant="bodyMd">
            {trajectory.monthLabel}
          </AppText>
        </View>
        <View style={styles.amountBlock}>
          <AppText color="primary" style={styles.amount} variant="headlineSm">
            {formatMoney(trajectory.totalMinor, "KES")}
          </AppText>
          <View style={styles.deltaRow}>
            <Feather color={deltaColor} name={deltaIcon} size={12} />
            <AppText
              color={
                trajectory.trend === "up"
                  ? "error"
                  : trajectory.trend === "down"
                    ? "primary"
                    : "mutedText"
              }
              style={styles.delta}
              variant="labelMd"
            >
              {deltaLabel}
            </AppText>
          </View>
        </View>
      </View>
      <View style={styles.chart}>
        <Svg height="100%" viewBox="0 0 100 40" width="100%">
          <Defs>
            <LinearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <Stop
                offset="0%"
                stopColor={theme.colors.secondary}
                stopOpacity="0.22"
              />
              <Stop
                offset="100%"
                stopColor={theme.colors.secondary}
                stopOpacity="0"
              />
            </LinearGradient>
          </Defs>
          <Line
            opacity={0.24}
            stroke={theme.colors.outline}
            strokeWidth={0.18}
            x1="0"
            x2="100"
            y1="10"
            y2="10"
          />
          <Line
            opacity={0.24}
            stroke={theme.colors.outline}
            strokeWidth={0.18}
            x1="0"
            x2="100"
            y1="20"
            y2="20"
          />
          <Line
            opacity={0.24}
            stroke={theme.colors.outline}
            strokeWidth={0.18}
            x1="0"
            x2="100"
            y1="30"
            y2="30"
          />
          <Path d={areaPath} fill="url(#chartGradient)" />
          <Path
            d={linePath}
            fill="none"
            stroke={theme.colors.secondary}
            strokeLinecap="round"
            strokeWidth={0.8}
          />
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            fill={theme.colors.secondary}
            r="1.25"
          />
          <Circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            fill={theme.colors.secondary}
            opacity={0.18}
            r="2.7"
          />
        </Svg>
      </View>
      <AppFlashList
        data={labels}
        horizontal
        keyExtractor={(label) => label}
        renderItem={({ item: label }) => (
          <View style={styles.weekLabelItem}>
            <AppText color="outline" style={styles.weekLabel} variant="labelMd">
              {label}
            </AppText>
          </View>
        )}
        scrollEnabled={false}
      />
    </SurfaceCard>
  );
}

function buildChartPaths(values: number[]) {
  const safeValues = values.length ? values : [0];
  const maxValue = Math.max(...safeValues, 1);
  const step = safeValues.length > 1 ? 100 / (safeValues.length - 1) : 100;

  const points = safeValues.map((value, index) => {
    const x = safeValues.length === 1 ? 100 : Number((index * step).toFixed(2));
    const y = Number((35 - (value / maxValue) * 30).toFixed(2));
    return { x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const lastPoint = points[points.length - 1];
  const areaPath = `${linePath} L ${lastPoint.x} 35 L ${points[0].x} 35 Z`;

  return { areaPath, lastPoint, linePath };
}

const styles = StyleSheet.create({
  amount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["2xl"],
    lineHeight: LineHeights["4xl"],
  },
  amountBlock: {
    alignItems: "flex-end",
    flexShrink: 0,
    gap: Sizes.xs,
  },
  card: {
    gap: Spacing.xl,
    padding: Sizes["3xl"],
    borderWidth: Sizes.xxs - 1,
    borderColor: "rgba(0,0,0,0.07)",
  },
  cardTitle: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
  },
  chart: {
    height: Sizes["17xl"],
  },
  delta: {
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
    textTransform: "uppercase",
  },
  deltaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Sizes.xs,
  },
  metricRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  month: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  weekLabel: {
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  weekLabelItem: {
    alignItems: "center",
    width: Sizes["12xl"],
  },
});

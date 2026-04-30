import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

import { AppText } from "@/components/base/app-text";
import { Sizes } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type SpendingDonutChartItem = {
  amount: number;
  color: string;
  id: string;
  label: string;
};

export type SpendingDonutChartProps = {
  data: SpendingDonutChartItem[];
  totalLabel: string;
};

const DONUT_SIZE = Sizes["20xl"];
const DONUT_STROKE = Sizes.lg;
const DONUT_RADIUS = Sizes["13xl"];
const DONUT_CENTER = DONUT_SIZE / 2;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
const DONUT_GAP = Sizes.xs;

export function SpendingDonutChart({
  data,
  totalLabel,
}: SpendingDonutChartProps) {
  const theme = useAppTheme();
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  let offset = Sizes.none;

  return (
    <View style={styles.chart}>
      <Svg
        height={DONUT_SIZE}
        viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
        width={DONUT_SIZE}
      >
        <Circle
          cx={DONUT_CENTER}
          cy={DONUT_CENTER}
          fill="transparent"
          r={DONUT_RADIUS}
          stroke={theme.colors.surfaceContainer}
          strokeWidth={DONUT_STROKE}
        />
        <G originX={DONUT_CENTER} originY={DONUT_CENTER} rotation="-90">
          {data.map((item) => {
            const arcLength = (item.amount / total) * DONUT_CIRCUMFERENCE;
            const visibleArc = Math.max(arcLength - DONUT_GAP, Sizes.none);
            const dashOffset = -offset;

            offset += arcLength;

            return (
              <Circle
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                fill="transparent"
                key={item.id}
                r={DONUT_RADIUS}
                stroke={item.color}
                strokeDasharray={`${visibleArc} ${DONUT_CIRCUMFERENCE - visibleArc}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                strokeWidth={DONUT_STROKE}
              />
            );
          })}
        </G>
      </Svg>
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.surfaceContainerLow },
        ]}
      >
        <AppText style={styles.amount} variant="titleMd">
          {totalLabel}
        </AppText>
        <AppText color="mutedText" variant="labelMd">
          TOTAL
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontWeight: "700",
  },
  center: {
    alignItems: "center",
    borderRadius: Sizes["12xl"] - Sizes.xxs,
    height: Sizes["16xl"],
    justifyContent: "center",
    position: "absolute",
    width: Sizes["16xl"],
  },
  chart: {
    alignItems: "center",
    height: DONUT_SIZE,
    justifyContent: "center",
    width: DONUT_SIZE,
  },
});

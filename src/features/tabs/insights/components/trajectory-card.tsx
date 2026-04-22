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

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { formatMoney } from "@/lib/finance";

const weekLabels = ["W1", "W2", "W3", "W4"];

export function TrajectoryCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard elevated style={styles.card}>
      <View style={styles.metricRow}>
        <View>
          <AppText style={styles.cardTitle} variant="titleMd">
            Monthly Spend
          </AppText>
          <AppText color="mutedText" style={styles.month} variant="bodyMd">
            July 2024
          </AppText>
        </View>
        <View style={styles.amountBlock}>
          <AppText color="primary" style={styles.amount} variant="headlineSm">
            {formatMoney(14250000, "KES")}
          </AppText>
          <View style={styles.deltaRow}>
            <Feather color={theme.colors.error} name="trending-up" size={12} />
            <AppText color="error" style={styles.delta} variant="labelMd">
              12.4% vs last month
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
          <Path
            d="M0 35 L0 25 Q 15 28, 25 18 T 50 22 T 75 12 T 100 5 L 100 35 Z"
            fill="url(#chartGradient)"
          />
          <Path
            d="M0 25 Q 15 28, 25 18 T 50 22 T 75 12 T 100 5"
            fill="none"
            stroke={theme.colors.secondary}
            strokeLinecap="round"
            strokeWidth={0.8}
          />
          <Circle cx="100" cy="5" fill={theme.colors.secondary} r="1.25" />
          <Circle
            cx="100"
            cy="5"
            fill={theme.colors.secondary}
            opacity={0.18}
            r="2.7"
          />
        </Svg>
      </View>
      <View style={styles.weekLabels}>
        {weekLabels.map((label) => (
          <AppText
            color="outline"
            key={label}
            style={styles.weekLabel}
            variant="labelMd"
          >
            {label}
          </AppText>
        ))}
      </View>
    </SurfaceCard>
  );
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
  weekLabels: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

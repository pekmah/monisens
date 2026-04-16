import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

export function TransactionHeroCard() {
  const theme = useAppTheme();

  return (
    <SurfaceCard elevated style={styles.hero}>
      <View style={[styles.icon, { backgroundColor: theme.colors.primaryFixed }]}>
        <Feather color={theme.colors.primary} name="coffee" size={26} />
      </View>
      <AppText style={styles.amount} variant="displayLg">
        KES 1,200
      </AppText>
      <AppText color="mutedText" variant="titleMd">
        Java House
      </AppText>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  amount: {
    fontSize: FontSizes["4xl"],
    lineHeight: LineHeights["5xl"],
  },
  hero: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Sizes["4xl"],
  },
  icon: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["11xl"],
    justifyContent: "center",
    width: Sizes["11xl"],
  },
});

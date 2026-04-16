import { StyleSheet } from "react-native";

import { AppButton } from "@/components/base";
import { Sizes } from "@/constants/theme";
import { SurfaceCard } from "@/features/tabs/_components";

export function TransactionsToolbar() {
  return (
    <SurfaceCard style={styles.toolbar}>
      <AppButton title="Search" variant="ghost" />
      <AppButton title="Calendar" variant="secondary" />
      <AppButton title="Payments" />
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    gap: Sizes.sm,
  },
});

import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppPressable, AppText } from "@/components/base";
import { Radii, Sizes, Spacing, type AppTheme } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  TransactionList,
  TransactionsToolbar,
} from "@/features/tabs/transactions/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

export default function TransactionsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { error, ready, setTransactionQuery, snapshot, transactionQuery } =
    useFinance();
  const contentBottomPadding =
    Sizes["15xl"] + Math.max(insets.bottom, Spacing.lg);
  const transactionSections = snapshot?.transactionSections ?? [];
  const totalCount = snapshot?.transactions.length ?? 0;
  const categories = snapshot?.categories ?? [];
  const footerMessage = !ready
    ? "Preparing local ledger..."
    : error
      ? error
      : "No transactions match this search.";
  const footerTone = error ? "error" : "mutedText";
  const fabStyle = getFabThemeStyle(theme, insets.bottom);
  // Keeping the search input inside the list header gives FlashList one scroll
  // owner and keeps keyboard tap handling attached to that owner.
  const listHeader = (
    <TransactionsToolbar
      categories={categories}
      onQueryChange={setTransactionQuery}
      query={transactionQuery}
      totalCount={totalCount}
    />
  );

  return (
    <TabScreen style={styles.screen}>
      <TransactionList
        contentBottomPadding={contentBottomPadding}
        footer={
          <AppText color={footerTone} variant="bodyMd">
            {footerMessage}
          </AppText>
        }
        header={listHeader}
        sections={ready && !error ? transactionSections : []}
      />

      <AppPressable
        accessibilityLabel="Add transaction"
        onPress={() => router.push("/transactions/new")}
        style={[styles.fab, fabStyle]}
      >
        <Feather
          color={theme.colors.onPrimary}
          name="plus"
          size={Sizes["3xl"]}
        />
      </AppPressable>
    </TabScreen>
  );
}

function getFabThemeStyle(theme: AppTheme, bottomInset: number): ViewStyle {
  return {
    backgroundColor: theme.colors.primary,
    bottom: Math.max(bottomInset, Spacing.lg) + Sizes["6xl"],
  };
}

const styles = StyleSheet.create({
  fab: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["11xl"],
    justifyContent: "center",
    position: "absolute",
    right: Spacing.xl,
    width: Sizes["11xl"],
    zIndex: 2,
  },
  screen: {
    paddingHorizontal: Spacing.md,
  },
});

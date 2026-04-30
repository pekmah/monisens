import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppFlashList, AppPressable, AppText } from "@/components/base";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  TransactionSection,
  TransactionsToolbar,
} from "@/features/tabs/transactions/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

export default function TransactionsScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const { error, ready, searchText, setSearchText, snapshot } = useFinance();

  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Sizes["15xl"] + Math.max(insets.bottom, Spacing.lg) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <TransactionsToolbar
          onSearchTextChange={setSearchText}
          searchText={searchText}
          totalCount={snapshot?.transactions.length ?? 0}
        />

        {!ready ? (
          <AppText color="mutedText" variant="bodyMd">
            Preparing local ledger...
          </AppText>
        ) : error ? (
          <AppText color="error" variant="bodyMd">
            {error}
          </AppText>
        ) : snapshot?.transactionSections.length ? (
          <AppFlashList
            data={snapshot.transactionSections}
            ItemSeparatorComponent={() => <View style={styles.sectionSeparator} />}
            keyExtractor={(section) => section.title}
            renderItem={({ item }) => <TransactionSection section={item} />}
          />
        ) : (
          <AppText color="mutedText" variant="bodyMd">
            No transactions match this search.
          </AppText>
        )}
      </ScrollView>

      <AppPressable
        accessibilityLabel="Add transaction"
        onPress={() => router.push("/transactions/new")}
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.primary,
            bottom: Math.max(insets.bottom, Spacing.lg) + Sizes["6xl"],
          },
        ]}
      >
        <Feather color={theme.colors.onPrimary} name="plus" size={Sizes["3xl"]} />
      </AppPressable>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Sizes.xl,
    paddingBottom: Sizes["xl"],
  },
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
  sectionSeparator: {
    height: Sizes.xl,
  },
});

import { ScrollView, StyleSheet, View } from "react-native";

import { AppFlashList, AppText } from "@/components/base";
import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  TransactionSection,
  TransactionsToolbar,
} from "@/features/tabs/transactions/components";
import { useFinance } from "@/lib/finance";

export default function TransactionsScreen() {
  const { error, ready, searchText, setSearchText, snapshot } = useFinance();

  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
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
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Sizes.xl,
    paddingBottom: Sizes["xl"],
  },
  sectionSeparator: {
    height: Sizes.xl,
  },
});

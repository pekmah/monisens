import { ScrollView, StyleSheet } from "react-native";

import { AppText } from "@/components/base";
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
          pendingCount={snapshot?.sync.pendingOutboxCount ?? 0}
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
          snapshot.transactionSections.map((section) => (
            <TransactionSection key={section.title} section={section} />
          ))
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
});

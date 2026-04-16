import { Tabs } from "expo-router";
import { ScrollView, StyleSheet } from "react-native";

import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  CategoryCard,
  DetailHeader,
  MetaRowsCard,
  SuggestionCard,
  TransactionHeroCard,
  type MetaRow,
} from "@/features/transaction-detail/components";

const metaRows: MetaRow[] = [
  { label: "Status", tone: "success", value: "Completed" },
  { label: "Source", value: "SMS (M-PESA)" },
  { label: "Timestamp", value: "Oct 24, 2023, 2:32 PM" },
  { label: "Location", value: "Nairobi, Kenya" },
  { label: "Reference", value: "MPESA QK72XK9J4" },
];

export default function TransactionDetailScreen() {
  return (
    <TabScreen>
      <Tabs.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DetailHeader />
        <TransactionHeroCard />
        <MetaRowsCard rows={metaRows} />
        <CategoryCard />
        <SuggestionCard />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["13xl"],
  },
});

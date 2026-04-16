import { ScrollView, StyleSheet } from "react-native";

import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  TransactionSection,
  TransactionsToolbar,
  type TransactionSectionData,
} from "@/features/tabs/transactions/components";

const sections: TransactionSectionData[] = [
  {
    title: "Today",
    data: [
      { amount: "KES 2,450.00", icon: "coffee" as const, meta: "Dining", title: "Java House" },
      { amount: "KES 5,200.00", icon: "zap" as const, meta: "Utilities", title: "Kenya Power" },
    ],
  },
  {
    title: "Yesterday",
    data: [
      { amount: "KES 12,180.00", icon: "shopping-bag" as const, meta: "Groceries", title: "Carrefour" },
    ],
  },
  {
    title: "Earlier This Week",
    data: [
      { amount: "KES 850.00", icon: "truck" as const, meta: "Transport", title: "Uber Trip" },
      { amount: "KES 2,500.00", icon: "cpu" as const, meta: "Intelligence", title: "AI Subscription" },
    ],
  },
];

export default function TransactionsScreen() {
  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TransactionsToolbar />
        {sections.map((section) => (
          <TransactionSection key={section.title} section={section} />
        ))}
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Sizes.xl,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
});

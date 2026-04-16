import { ScrollView, StyleSheet } from "react-native";

import { Sizes } from "@/constants/theme";
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
      {
        accent: "#fb923c",
        amount: "KES 2,450.00",
        category: "Dining",
        hint: "Swipe to recategorize",
        time: "12:45 PM",
        title: "Java House",
      },
      {
        accent: "#60a5fa",
        amount: "KES 5,200.00",
        category: "Utilities",
        time: "09:12 AM",
        title: "Kenya Power",
      },
    ],
  },
  {
    title: "Yesterday",
    data: [
      {
        accent: "#4ade80",
        amount: "KES 12,180.00",
        category: "Groceries",
        time: "06:30 PM",
        title: "Carrefour",
      },
    ],
  },
  {
    title: "Earlier This Week",
    data: [
      {
        accent: "#a855f7",
        amount: "KES 850.00",
        category: "Transport",
        time: "Monday",
        title: "Uber Trip",
      },
      {
        accent: "#7a2faa",
        amount: "KES 2,500.00",
        category: "Intelligence",
        time: "Sunday",
        title: "AI Subscription",
      },
    ],
  },
];

export default function TransactionsScreen() {
  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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
    paddingBottom: Sizes["xl"],
  },
});

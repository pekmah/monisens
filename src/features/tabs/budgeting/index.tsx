import { ScrollView, StyleSheet } from "react-native";

import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  BudgetOverviewCard,
  BudgetTipCard,
  CategoryAllocationsCard,
} from "@/features/tabs/budgeting/components";

const categories = [
  {
    accent: "#0d631b",
    budget: "KES 20,000",
    label: "Housing & Rent",
    meta: "Fixed expense",
    remaining: "Settled",
    spent: "KES 20,000",
    status: "Paid",
    value: 100,
  },
  {
    accent: "#ff9800",
    budget: "KES 12,000",
    label: "Food & Dining",
    meta: "Variable spend",
    remaining: "KES 4,600 left",
    spent: "KES 7,400",
    status: "On track",
    value: 61,
  },
  {
    accent: "#005db7",
    budget: "KES 5,000",
    label: "Transport",
    meta: "Commute",
    remaining: "KES 400 left",
    spent: "KES 4,600",
    status: "Watch",
    value: 92,
  },
  {
    accent: "#7a2faa",
    budget: "KES 8,000",
    label: "Utilities",
    meta: "Bills and tokens",
    remaining: "KES 3,200 left",
    spent: "KES 4,800",
    status: "Healthy",
    value: 60,
  },
];

export default function BudgetingScreen() {
  return (
    <TabScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BudgetOverviewCard />
        <BudgetTipCard />
        <CategoryAllocationsCard categories={categories} />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes['15xl'] + Spacing.sm,
  },
});

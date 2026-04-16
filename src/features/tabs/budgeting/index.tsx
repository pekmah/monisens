import { ScrollView, StyleSheet } from "react-native";

import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  BudgetOverviewCard,
  BudgetTipCard,
  CategoryAllocationsCard,
} from "@/features/tabs/budgeting/components";

const categories = [
  { label: 'Housing & Rent', meta: 'Fixed Expense', spent: 'KES 20,000 / KES 20,000', status: 'Paid', value: 100 },
  { label: 'Food & Dining', meta: 'Variable', spent: 'KES 7,400 / KES 12,000', status: 'KES 4,600 left', value: 61 },
  { label: 'Transport', meta: 'Commute', spent: 'KES 4,600 / KES 5,000', status: 'KES 400 left', value: 92 },
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

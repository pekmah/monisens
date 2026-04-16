import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { Sizes, Spacing } from "@/constants/theme";
import { RowItem, SurfaceCard } from "@/features/tabs/_components";
import { useAppTheme } from "@/hooks/use-app-theme";

type RowItemProps = Parameters<typeof RowItem>[0];

export type TransactionItem = Pick<RowItemProps, "amount" | "icon" | "meta" | "title">;

export type TransactionSectionData = {
  data: TransactionItem[];
  title: string;
};

export type TransactionSectionProps = {
  section: TransactionSectionData;
};

export function TransactionSection({ section }: TransactionSectionProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.section}>
      <AppText color="mutedText" style={styles.sectionTitle} variant="labelMd">
        {section.title.toUpperCase()}
      </AppText>
      <SurfaceCard style={styles.list}>
        {section.data.map((transaction) => (
          <RowItem
            amount={transaction.amount}
            icon={transaction.icon}
            key={transaction.title}
            meta={transaction.meta}
            onPress={() => router.push("/transactions/java-house")}
            title={transaction.title}
            tone={
              transaction.meta === "Intelligence"
                ? theme.colors.tertiaryFixed
                : transaction.meta === "Utilities"
                  ? theme.colors.secondaryFixed
                  : undefined
            }
          />
        ))}
      </SurfaceCard>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Sizes.xxs,
    paddingVertical: Spacing.sm,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 1.6,
  },
});

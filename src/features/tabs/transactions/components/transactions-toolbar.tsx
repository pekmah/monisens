import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, TextInput, View } from "react-native";

import { AppText } from "@/components/base/app-text";
import { AppButton } from "@/components/base/button";
import { font } from "@/constants/fonts";
import { FontSizes, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

export type TransactionsToolbarProps = {
  searchText: string;
  totalCount: number;
  onSearchTextChange: (value: string) => void;
};

export function TransactionsToolbar({
  searchText,
  totalCount,
  onSearchTextChange,
}: TransactionsToolbarProps) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <AppText color="primary" variant="labelMd">
            TRANSACTIONS
          </AppText>
          <AppText style={styles.title} variant="titleMd">
            {totalCount} transactions
          </AppText>
        </View>
      </View>

      <View
        style={[
          styles.search,
          { backgroundColor: theme.colors.surfaceContainerLow },
        ]}
      >
        <Feather color={theme.colors.outline} name="search" size={Sizes["2xl"]} />
        <TextInput
          onChangeText={onSearchTextChange}
          placeholder="Search merchant or note"
          placeholderTextColor={theme.colors.outline}
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: font.regular,
            },
          ]}
          value={searchText}
        />
      </View>

      <AppButton
        fullWidth
        onPress={() => router.push("/transactions/new")}
        title="Add transaction"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    minWidth: Sizes.none,
    padding: Sizes.none,
  },
  search: {
    alignItems: "center",
    borderRadius: Radii.xl,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
  titleWrap: {
    flex: 1,
    gap: Sizes.xs,
  },
});

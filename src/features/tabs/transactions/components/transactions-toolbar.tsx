import { Feather } from "@expo/vector-icons";
import { StyleSheet, TextInput, View, type TextStyle, type ViewStyle } from "react-native";

import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
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
  const searchThemeStyle = getSearchThemeStyle(theme);
  const inputThemeStyle = getInputThemeStyle(theme);

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

      <View style={[styles.search, searchThemeStyle]}>
        <Feather color={theme.colors.outline} name="search" size={Sizes["2xl"]} />
        <TextInput
          onChangeText={onSearchTextChange}
          placeholder="Search merchant or note"
          placeholderTextColor={theme.colors.outline}
          selectionColor={theme.colors.primary}
          style={[styles.input, inputThemeStyle]}
          value={searchText}
        />
      </View>
    </View>
  );
}

function getSearchThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
  };
}

function getInputThemeStyle(theme: AppTheme): TextStyle {
  return {
    color: theme.colors.text,
    fontFamily: font.regular,
  };
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

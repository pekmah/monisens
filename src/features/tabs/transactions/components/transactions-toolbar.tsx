import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";

import { AppButton } from "@/components/base/button";
import { AppPressable } from "@/components/base/app-pressable";
import { AppText } from "@/components/base/app-text";
import { font } from "@/constants/fonts";
import { FontSizes, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

const filters = [
  { active: true, icon: "chevron-down" as const, title: "Category" },
  { active: false, icon: "calendar" as const, title: "Date" },
  { active: false, icon: "credit-card" as const, title: "Amount" },
];

export function TransactionsToolbar() {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.search,
          { backgroundColor: theme.colors.surfaceContainerLow },
        ]}
      >
        <Feather color={theme.colors.outline} name="search" size={Sizes["2xl"]} />
        <TextInput
          placeholder="Search transactions..."
          placeholderTextColor={theme.colors.outline}
          selectionColor={theme.colors.primary}
          style={[
            styles.input,
            {
              color: theme.colors.text,
              fontFamily: font.regular,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.filters}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => (
          <AppPressable
            key={filter.title}
            style={[
              styles.filter,
              {
                backgroundColor: filter.active
                  ? theme.colors.primaryContainer
                  : theme.colors.surfaceContainerLow,
              },
            ]}
          >
            <AppText
              style={{
                color: filter.active
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant,
              }}
              variant="labelMd"
            >
              {filter.title}
            </AppText>
            <Feather
              color={
                filter.active
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant
              }
              name={filter.icon}
              size={Sizes.lg}
            />
          </AppPressable>
        ))}
      </ScrollView>

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
  filter: {
    alignItems: "center",
    borderRadius: Radii.full,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Sizes["2xl"],
    paddingVertical: Sizes.sm + Sizes.xxs,
  },
  filters: {
    gap: Spacing.md,
    paddingBottom: Sizes.xs,
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
});

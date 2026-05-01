import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppPressable, AppText } from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
} from "@/constants/theme";
import { SurfaceCard, TabScreen } from "@/features/tabs/_components";
import {
  SettingsFooter,
  SettingsIntroCard,
} from "@/features/tabs/settings/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

const sections = [
  {
    description: "Theme mode, text sizing, and display preferences.",
    icon: "monitor",
    route: "/settings/appearance",
    title: "Appearance",
  },
  {
    description: "App lock, privacy posture, and connectivity controls.",
    icon: "shield",
    route: "/settings/security",
    title: "Security & Privacy",
  },
  {
    description: "Category management and custom classification structure.",
    icon: "tag",
    route: "/settings/categories",
    title: "Categories",
  },
  {
    description: "Inbox import, live SMS listening, and AI review queue.",
    icon: "message-circle",
    route: "/settings/sms",
    title: "SMS Ingestion",
  },
  {
    description: "Sync state, relay health, and local-first storage activity.",
    icon: "database",
    route: "/settings/data",
    title: "Data Management",
  },
  {
    description: "Backup and restore controls for this device.",
    icon: "archive",
    route: "/settings/backups",
    title: "Backups",
  },
] as const;

export default function SettingsHomeScreen() {
  const theme = useAppTheme();
  const { snapshot } = useFinance();
  const smsCount = snapshot?.sms.candidateCount ?? 0;
  const categoryCount = snapshot?.categories.length ?? 0;
  const unsyncedCount = snapshot?.sync.unsyncedEntityCount ?? 0;

  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsIntroCard />
        <SurfaceCard style={styles.navCard}>
          <View style={styles.list}>
            {sections.map((section) => {
              const meta =
                section.title === "SMS Ingestion"
                  ? smsCount > 0
                    ? `${smsCount} message(s) pending review`
                    : section.description
                  : section.title === "Categories"
                    ? `${categoryCount} categories configured`
                    : section.title === "Data Management" && unsyncedCount > 0
                      ? `${unsyncedCount} item(s) still need sync`
                      : section.description;

              return (
                <AppPressable
                  key={section.title}
                  onPress={() => router.push(section.route as never)}
                  style={[
                    styles.row,
                    {
                      backgroundColor: theme.colors.surfaceContainerLow,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.iconTile,
                      { backgroundColor: `${theme.colors.primary}14` },
                    ]}
                  >
                    <Feather
                      color={theme.colors.primary}
                      name={section.icon}
                      size={18}
                    />
                  </View>
                  <View style={styles.rowCopy}>
                    <AppText style={styles.rowTitle} variant="labelMd">
                      {section.title}
                    </AppText>
                    <AppText
                      color="mutedText"
                      style={styles.rowMeta}
                      variant="bodyMd"
                    >
                      {meta}
                    </AppText>
                  </View>
                  <Feather
                    color={theme.colors.outline}
                    name="chevron-right"
                    size={18}
                  />
                </AppPressable>
              );
            })}
          </View>
        </SurfaceCard>

        <SettingsFooter />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.xl,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
  },
  list: {
    gap: Spacing.md,
  },
  navCard: {
    gap: Spacing.lg,
    padding: 0,
  },
  navHeader: {
    gap: Spacing.xs,
  },
  navMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  navTitle: {
    fontFamily: font.headerSemiBold,
  },
  row: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowCopy: {
    flex: 1,
    gap: Sizes.xxs,
  },
  rowMeta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  rowTitle: {
    fontFamily: font.semiBold,
    fontSize: FontSizes.md,
    lineHeight: LineHeights.md,
  },
});

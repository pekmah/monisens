import { ScrollView, StyleSheet } from "react-native";

import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  SettingsFooter,
  SettingsGroupCard,
  SettingsIntroCard,
  type SettingsGroup,
} from "@/features/tabs/settings/components";

const groups: SettingsGroup[] = [
  {
    icon: "shield" as const,
    title: "Security",
    rows: [
      { meta: "Require PIN or Biometrics", title: "App Lock", toggle: true },
      { meta: "Change Access PIN", title: "Access PIN" },
    ],
  },
  {
    icon: "refresh-cw" as const,
    title: "Connectivity",
    rows: [
      { meta: "Auto-parse bank messages", title: "Sync SMS", toggle: true },
      {
        meta: "Disable cloud processing",
        title: "Local-only Mode",
        toggle: false,
      },
    ],
  },
  {
    icon: "database" as const,
    title: "Data Management",
    rows: [
      {
        meta: "Remove historical data to save space or protect privacy.",
        title: "Storage Cleanup",
      },
      {
        meta: "Help us improve by flagging errors in AI categorization.",
        title: "Quality Control",
      },
      {
        meta: "Last backup today at 04:12 AM. Data is encrypted end-to-end.",
        title: "Secure Backups",
      },
    ],
  },
];

export default function SettingsScreen() {
  return (
    <TabScreen>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <SettingsIntroCard />
        {groups.map((group) => (
          <SettingsGroupCard group={group} key={group.title} />
        ))}
        <SettingsFooter />
      </ScrollView>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"] + Spacing.sm,
  },
});

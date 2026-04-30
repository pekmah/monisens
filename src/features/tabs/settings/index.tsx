import { ScrollView, StyleSheet, View } from "react-native";

import { AppFlashList } from "@/components/base";
import { Sizes, Spacing } from "@/constants/theme";
import { TabScreen } from "@/features/tabs/_components";
import {
  AppearanceCard,
  BackupCard,
  CategoriesCard,
  DataControlsCard,
  SettingsFooter,
  SettingsGroupCard,
  SettingsIntroCard,
  SmsSyncCard,
  type SettingsGroup,
} from "@/features/tabs/settings/components";

const groups: SettingsGroup[] = [
  {
    icon: "shield" as const,
    tone: "tertiary" as const,
    title: "Security",
    rows: [
      { meta: "Require PIN or Biometrics", title: "App Lock", toggle: true },
      { actionLabel: "Change Access PIN", meta: "Update your private access code", title: "Access PIN" },
    ],
  },
  {
    icon: "refresh-cw" as const,
    tone: "primary" as const,
    title: "Connectivity",
    rows: [
      {
        meta: "Disable cloud processing",
        title: "Local-only Mode",
        toggle: false,
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
        <AppearanceCard />
        <AppFlashList
          data={groups}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(group) => group.title}
          renderItem={({ item }) => <SettingsGroupCard group={item} />}
        />
        <CategoriesCard />
        <SmsSyncCard />
        <DataControlsCard />
        <BackupCard />
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
  separator: {
    height: Spacing.xl,
  },
});

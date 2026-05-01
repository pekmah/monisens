import { View } from "react-native";

import { Spacing } from "@/constants/theme";
import { securitySettingsGroups } from "@/features/settings-sections/lib/groups";
import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { SettingsGroupCard } from "@/features/tabs/settings/components";

export default function SecuritySettingsScreen() {
  return (
    <SettingsSectionShell
      description="Manage access controls, local privacy, and connectivity preferences."
      title="Security & Privacy"
    >
      <View style={{ gap: Spacing.xl }}>
        {securitySettingsGroups.map((group) => (
          <SettingsGroupCard group={group} key={group.title} />
        ))}
      </View>
    </SettingsSectionShell>
  );
}

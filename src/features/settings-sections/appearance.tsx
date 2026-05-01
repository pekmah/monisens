import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { AppearanceCard } from "@/features/tabs/settings/components";

export default function AppearanceSettingsScreen() {
  return (
    <SettingsSectionShell
      description="Adjust the app appearance, theme mode, and text size preferences."
      title="Appearance"
    >
      <AppearanceCard />
    </SettingsSectionShell>
  );
}

import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { UpdateCard } from "@/features/tabs/settings/components";

export default function UpdateSettingsScreen() {
  return (
    <SettingsSectionShell
      description="Track Hot Updater background downloads and the last applied bundle."
      title="App Updates"
    >
      <UpdateCard />
    </SettingsSectionShell>
  );
}

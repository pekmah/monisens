import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { DataControlsCard } from "@/features/tabs/settings/components";

export default function DataSettingsScreen() {
  return (
    <SettingsSectionShell
      description="Track sync health, local-first storage state, and cloud relay activity."
      title="Data Management"
    >
      <DataControlsCard />
    </SettingsSectionShell>
  );
}

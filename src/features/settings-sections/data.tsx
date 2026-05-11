import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { DataControlsCard } from "@/features/tabs/settings/components";

export default function DataSettingsScreen() {
  return (
    <SettingsSectionShell
      description="Track local-first storage state and data controls."
      title="Data Management"
    >
      <DataControlsCard />
    </SettingsSectionShell>
  );
}

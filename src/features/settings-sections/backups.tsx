import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { BackupCard } from "@/features/tabs/settings/components";

export default function BackupSettingsScreen() {
  return (
    <SettingsSectionShell
      description="Review encrypted backup posture and trigger restore or backup actions."
      title="Backups"
    >
      <BackupCard />
    </SettingsSectionShell>
  );
}

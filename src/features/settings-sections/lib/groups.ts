import type { SettingsGroup } from "@/features/tabs/settings/components";

export const securitySettingsGroups: SettingsGroup[] = [
  {
    icon: "shield",
    tone: "tertiary",
    title: "Security",
    rows: [
      { meta: "Require PIN or Biometrics", title: "App Lock", toggle: true },
      {
        actionLabel: "Change Access PIN",
        meta: "Update your private access code",
        title: "Access PIN",
      },
    ],
  },
  {
    icon: "refresh-cw",
    tone: "primary",
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

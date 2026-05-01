import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, AppPressable, AppText, AppTextInput } from "@/components/base";
import { font } from "@/constants/fonts";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { SettingsSectionShell } from "@/features/settings-sections/section-shell";
import { SmsSyncCard } from "@/features/tabs/settings/components";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";

export default function SmsSettingsScreen() {
  const theme = useAppTheme();
  const { snapshot, updateSmsImportLimit } = useFinance();
  const [importLimitInput, setImportLimitInput] = useState(
    String(snapshot?.sms.importLimit ?? ""),
  );
  const [savingLimit, setSavingLimit] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  useEffect(() => {
    setImportLimitInput(String(snapshot?.sms.importLimit ?? ""));
  }, [snapshot?.sms.importLimit]);

  async function handleSaveImportLimit() {
    const parsedLimit = Number.parseInt(importLimitInput.trim(), 10);

    if (!Number.isFinite(parsedLimit) || parsedLimit < 1) {
      setLimitError("Import limit must be a whole number greater than 0.");
      return;
    }

    setSavingLimit(true);
    setLimitError(null);
    try {
      const nextLimit = await updateSmsImportLimit(parsedLimit);
      setImportLimitInput(String(nextLimit));
    } catch (error) {
      setLimitError(
        error instanceof Error ? error.message : "Failed to update import limit.",
      );
    } finally {
      setSavingLimit(false);
    }
  }

  return (
    <SettingsSectionShell
      description="Control inbox import, live listening, and AI review for finance SMS ingestion."
      title="SMS Ingestion"
    >
      <SmsSyncCard />
      <View
        style={[
          styles.settingsCard,
          {
            backgroundColor: theme.colors.surfaceContainerLowest,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <AppText style={styles.rowTitle} variant="labelMd">
          Inbox import limit
        </AppText>
        <AppText color="mutedText" variant="bodyMd">
          Control how many SMS messages are pulled from the device inbox each time you run import.
        </AppText>
        <AppTextInput
          keyboardType="number-pad"
          label="Import limit"
          onChangeText={setImportLimitInput}
          placeholder="e.g. 250"
          value={importLimitInput}
        />
        {limitError ? (
          <AppText color="error" variant="bodyMd">
            {limitError}
          </AppText>
        ) : null}
        <AppButton
          loading={savingLimit}
          onPress={() => void handleSaveImportLimit()}
          title="Save import limit"
        />
      </View>
      <View style={styles.section}>
        <SettingsRow
          description="Manage dynamic sender/body rules for processed and excluded SMS sources."
          icon="sliders"
          onPress={() => router.push("/settings/sms-sources")}
          title="Sources & Filters"
        />
        <SettingsRow
          description="Review ignored messages and create new source profiles from them."
          icon="inbox"
          onPress={() => router.push("/settings/sms-ignored")}
          title="Ignored Messages"
        />
      </View>
    </SettingsSectionShell>
  );
}

function SettingsRow({
  description,
  icon,
  onPress,
  title,
}: {
  description: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
  title: string;
}) {
  const theme = useAppTheme();

  return (
    <AppPressable
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surfaceContainerLowest,
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
        <Feather color={theme.colors.primary} name={icon} size={18} />
      </View>
      <View style={styles.rowCopy}>
        <AppText style={styles.rowTitle} variant="labelMd">
          {title}
        </AppText>
        <AppText color="mutedText" variant="bodyMd">
          {description}
        </AppText>
      </View>
      <Feather color={theme.colors.outline} name="chevron-right" size={18} />
    </AppPressable>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    alignItems: "center",
    borderRadius: Radii.lg,
    height: Sizes["6xl"],
    justifyContent: "center",
    width: Sizes["6xl"],
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
    gap: Spacing.xs,
  },
  rowTitle: {
    fontFamily: font.semiBold,
  },
  settingsCard: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
});

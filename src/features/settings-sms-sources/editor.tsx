import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppPressable,
  AppText,
  AppTextInput,
  NestedScreenHeader,
  OptionSelectField,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import { Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SmsSourceMatcherRecord, SmsSourceProfileRecord } from "@/lib/finance";
import { useFinance } from "@/lib/finance";

import type { Dispatch, SetStateAction } from "react";

type DraftMatcher = {
  caseSensitive: boolean;
  enabled: boolean;
  field: "sender" | "body";
  id?: string;
  matchType: "exact" | "contains" | "regex";
  pattern: string;
};

const parserOptions = [
  { label: "M-PESA", value: "mpesa" },
  { label: "Bank debit/credit", value: "bank-credit-debit" },
  { label: "No parser", value: "none" },
] satisfies { label: string; value: "mpesa" | "bank-credit-debit" | "none" }[];

const actionOptions = [
  { label: "Process", value: "process" },
  { label: "Exclude", value: "exclude" },
] satisfies { label: string; value: "process" | "exclude" }[];

const fieldOptions = [
  { label: "Sender", value: "sender" },
  { label: "Body", value: "body" },
] satisfies { label: string; value: "sender" | "body" }[];

const matchTypeOptions = [
  { label: "Exact", value: "exact" },
  { label: "Contains", value: "contains" },
  { label: "Regex", value: "regex" },
] satisfies { label: string; value: "exact" | "contains" | "regex" }[];

export default function SmsSourceEditorScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{
    profileId?: string;
    templateBody?: string;
    templateSender?: string;
  }>();
  const {
    createSmsSourceProfile,
    loadSmsSourceProfileGroups,
    updateSmsSourceProfile,
  } = useFinance();
  const [existing, setExisting] = useState<SmsSourceProfileRecord | null>(null);
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [parserKey, setParserKey] = useState<"mpesa" | "bank-credit-debit" | "none">("mpesa");
  const [action, setAction] = useState<"process" | "exclude">("process");
  const [enabled, setEnabled] = useState(true);
  const [matchers, setMatchers] = useState<DraftMatcher[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditing = Boolean(params.profileId);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadSmsSourceProfileGroups().then((groups) => {
        if (!active) {
          return;
        }

        const all = [...groups.processing, ...groups.exclusions, ...groups.disabled];
        const matched = params.profileId
          ? all.find((profile) => profile.id === params.profileId) ?? null
          : null;
        setExisting(matched);

        if (matched) {
          setLabel(matched.label);
          setDescription(matched.description ?? "");
          setParserKey(matched.parserKey);
          setAction(matched.action);
          setEnabled(matched.enabled);
          setMatchers(matched.matchers.map(toDraftMatcher));
          return;
        }

        setLabel("");
        setDescription("");
        setParserKey("mpesa");
        setAction("process");
        setEnabled(true);
        setMatchers(buildInitialMatchers(params.templateSender, params.templateBody));
      });

      return () => {
        active = false;
      };
    }, [loadSmsSourceProfileGroups, params.profileId, params.templateBody, params.templateSender]),
  );

  const normalizedMatchers = useMemo(
    () => matchers.filter((matcher) => matcher.pattern.trim().length > 0),
    [matchers],
  );

  async function handleSave() {
    if (!label.trim()) {
      setError("Label is required.");
      return;
    }

    if (normalizedMatchers.length === 0) {
      setError("Add at least one matcher.");
      return;
    }

    if (action === "exclude" && parserKey !== "none") {
      setError("Excluded profiles must use the No parser option.");
      return;
    }

    if (action === "process" && parserKey === "none") {
      setError("Processing profiles must use a real parser.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await updateSmsSourceProfile({
          action,
          description,
          enabled,
          id: existing.id,
          label,
          matchers: normalizedMatchers,
          parserKey,
          sortOrder: existing.sortOrder,
        });
      } else {
        await createSmsSourceProfile({
          action,
          description,
          enabled,
          label,
          matchers: normalizedMatchers,
          parserKey,
        });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <NestedScreenHeader
        description="Define which SMS content should be processed into finance candidates and which content should be ignored."
        overline="SMS SETTINGS"
        title={isEditing ? "Edit source profile" : "New source profile"}
      />

      <View style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLowest, borderColor: theme.colors.outlineVariant }]}> 
        <AppTextInput label="Label" onChangeText={setLabel} placeholder="M-PESA payments" value={label} />
        <AppTextInput label="Description" onChangeText={setDescription} placeholder="Optional context for this profile" value={description} />
        <OptionSelectField label="Action" onSelect={(value) => setAction(value as "process" | "exclude")} options={actionOptions} selectedValue={action} title="Choose action" />
        <OptionSelectField label="Parser" onSelect={(value) => setParserKey(value as "mpesa" | "bank-credit-debit" | "none")} options={parserOptions} selectedValue={parserKey} title="Choose parser" />
        <View style={styles.toggleRow}>
          <AppText style={styles.toggleLabel} variant="labelMd">Enabled</AppText>
          <AppPressable onPress={() => setEnabled((current) => !current)} style={[styles.togglePill, { backgroundColor: enabled ? theme.colors.primaryContainer : theme.colors.surfaceContainerLow }]}>
            <AppText variant="labelMd">{enabled ? "On" : "Off"}</AppText>
          </AppPressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText style={styles.sectionTitle} variant="titleMd">Matchers</AppText>
          <AppButton onPress={() => setMatchers((current) => [...current, emptyMatcher()])} title="Add matcher" variant="secondary" />
        </View>
        {matchers.map((matcher, index) => (
          <View key={matcher.id ?? `draft-${index}`} style={[styles.card, { backgroundColor: theme.colors.surfaceContainerLowest, borderColor: theme.colors.outlineVariant }]}> 
            <OptionSelectField label="Field" onSelect={(value) => updateMatcher(index, { field: value as DraftMatcher["field"] }, setMatchers)} options={fieldOptions} selectedValue={matcher.field} title="Choose field" />
            <OptionSelectField label="Match type" onSelect={(value) => updateMatcher(index, { matchType: value as DraftMatcher["matchType"] }, setMatchers)} options={matchTypeOptions} selectedValue={matcher.matchType} title="Choose match type" />
            <AppTextInput label="Pattern" onChangeText={(value) => updateMatcher(index, { pattern: value }, setMatchers)} placeholder={matcher.matchType === "regex" ? "fuliza|access fee" : "MPESA"} value={matcher.pattern} />
            <View style={styles.matcherFlags}>
              <AppPressable onPress={() => updateMatcher(index, { caseSensitive: !matcher.caseSensitive }, setMatchers)} style={[styles.flag, { backgroundColor: matcher.caseSensitive ? theme.colors.primaryContainer : theme.colors.surfaceContainerLow }]}>
                <AppText variant="labelMd">Case sensitive: {matcher.caseSensitive ? "Yes" : "No"}</AppText>
              </AppPressable>
              <AppPressable onPress={() => updateMatcher(index, { enabled: !matcher.enabled }, setMatchers)} style={[styles.flag, { backgroundColor: matcher.enabled ? theme.colors.primaryContainer : theme.colors.surfaceContainerLow }]}>
                <AppText variant="labelMd">Enabled: {matcher.enabled ? "Yes" : "No"}</AppText>
              </AppPressable>
            </View>
            <AppButton onPress={() => setMatchers((current) => current.filter((_, itemIndex) => itemIndex !== index))} title="Remove matcher" variant="danger" />
          </View>
        ))}
      </View>

      {error ? (
        <AppText color="error" variant="bodyMd">{error}</AppText>
      ) : null}

      <AppButton loading={saving} onPress={() => void handleSave()} title={isEditing ? "Save profile" : "Create profile"} />
    </Screen>
  );
}

function buildInitialMatchers(sender?: string | string[], body?: string | string[]) {
  const senderValue = typeof sender === "string" ? sender : undefined;
  const bodyValue = typeof body === "string" ? body : undefined;
  const initial = [] as DraftMatcher[];

  if (senderValue) {
    initial.push({
      caseSensitive: false,
      enabled: true,
      field: "sender",
      matchType: "contains",
      pattern: senderValue,
    });
  }

  if (bodyValue) {
    initial.push({
      caseSensitive: false,
      enabled: true,
      field: "body",
      matchType: "contains",
      pattern: bodyValue.slice(0, 60),
    });
  }

  return initial.length ? initial : [emptyMatcher()];
}

function emptyMatcher(): DraftMatcher {
  return {
    caseSensitive: false,
    enabled: true,
    field: "sender",
    matchType: "contains",
    pattern: "",
  };
}

function toDraftMatcher(matcher: SmsSourceMatcherRecord): DraftMatcher {
  return {
    caseSensitive: matcher.caseSensitive,
    enabled: matcher.enabled,
    field: matcher.field,
    id: matcher.id,
    matchType: matcher.matchType,
    pattern: matcher.pattern,
  };
}

function updateMatcher(
  index: number,
  patch: Partial<DraftMatcher>,
  setMatchers: Dispatch<SetStateAction<DraftMatcher[]>>,
) {
  setMatchers((current) =>
    current.map((matcher, matcherIndex) =>
      matcherIndex === index ? { ...matcher, ...patch } : matcher,
    ),
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  flag: {
    borderRadius: Radii.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  matcherFlags: {
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
  },
  toggleLabel: {
    fontFamily: font.semiBold,
  },
  togglePill: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  toggleRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

import { Feather } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, StyleSheet, View } from "react-native";

import {
  AppButton,
  AppPressable,
  AppText,
  AppTextInput,
  NestedScreenHeader,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance } from "@/lib/finance";
import {
  getSmsPermissionDiagnostics,
  isSmsSupportedPlatform,
} from "@/lib/sms-native";

type ImportRange = "today" | "seven-days" | "thirty-days" | "custom" | "all";

const IMPORT_RANGES: {
  description: string;
  label: string;
  value: ImportRange;
}[] = [
  {
    description: "Messages received since midnight today.",
    label: "Today",
    value: "today",
  },
  {
    description: "The safest default for recent transactions.",
    label: "Last 7 days",
    value: "seven-days",
  },
  {
    description: "Use when you have not imported in a while.",
    label: "Last 30 days",
    value: "thirty-days",
  },
  {
    description: "Enter an exact start date.",
    label: "Custom date",
    value: "custom",
  },
  {
    description: "Reads from the newest SMS down to the import limit.",
    label: "No date filter",
    value: "all",
  },
];

export default function SmsImportScreen() {
  const theme = useAppTheme();
  const { importSmsInbox, requestSmsPermission, refresh, snapshot } = useFinance();
  const [busy, setBusy] = useState<"permission" | "import" | null>(null);
  const [range, setRange] = useState<ImportRange>("seven-days");
  const [customDate, setCustomDate] = useState(formatDateInput(Date.now()));
  const [limitInput, setLimitInput] = useState(
    String(snapshot?.sms.importLimit ?? 250),
  );
  const [dateError, setDateError] = useState<string | null>(null);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [permissionDebug, setPermissionDebug] = useState<{
    readGranted: boolean;
    receiveGranted: boolean;
    supported: boolean;
  } | null>(null);

  const isAndroid = Platform.OS === "android";
  const supported = isSmsSupportedPlatform();
  const permissionGranted =
    permissionDebug?.readGranted ?? snapshot?.sms.permissionState === "granted";
  const selectedTimestamp = useMemo(
    () => resolveRangeTimestamp(range, customDate),
    [customDate, range],
  );
  const summaryText =
    selectedTimestamp === null
      ? "Import will scan newest messages until the limit is reached."
      : selectedTimestamp === undefined
        ? "Enter a valid custom date to preview the import window."
        : `Import will scan messages from ${formatReadableDate(selectedTimestamp)} onward.`;

  useFocusEffect(
    useCallback(() => {
      void getSmsPermissionDiagnostics().then(setPermissionDebug);
      void refresh();
    }, [refresh]),
  );

  async function handlePermissionRequest() {
    setBusy("permission");
    try {
      await requestSmsPermission();
      const diagnostics = await getSmsPermissionDiagnostics();
      setPermissionDebug(diagnostics);
    } finally {
      setBusy(null);
    }
  }

  async function handleImport() {
    const parsedLimit = Number.parseInt(limitInput.trim(), 10);
    const nextTimestamp = resolveRangeTimestamp(range, customDate);

    setDateError(null);
    setLimitError(null);

    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      setLimitError("Enter a whole number greater than 0.");
      return;
    }

    if (range === "custom" && nextTimestamp === undefined) {
      setDateError("Use YYYY-MM-DD, for example 2026-05-12.");
      return;
    }

    setBusy("import");
    try {
      const result = await importSmsInbox({
        limit: parsedLimit,
        sinceTimestamp: nextTimestamp ?? null,
      });

      Alert.alert(
        "Import complete",
        `${result.importedCount} message(s) imported. ${result.matchedCount} matched your SMS source rules.`,
        [
          {
            text: "Review queue",
            onPress: () => router.replace("/sms/review" as never),
          },
          { text: "Stay here" },
        ],
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentContainerStyle={styles.content} scroll>
        <NestedScreenHeader
          description="Choose the inbox window before importing finance SMS into the local review queue."
          overline="SMS IMPORT"
          title="Import messages"
        />

        {!supported ? (
          <View
            style={[
              styles.notice,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <Feather color={theme.colors.tertiary} name="alert-circle" size={20} />
            <AppText color="mutedText" style={styles.noticeText} variant="bodyMd">
              {isAndroid
                ? "This Android build does not include the SMS native module. Rebuild and install the Android app before importing SMS."
                : "SMS import is only available on Android builds."}
            </AppText>
          </View>
        ) : (
          <>
            {!permissionGranted ? (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor: theme.colors.surfaceContainerLow,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <Feather color={theme.colors.primary} name="shield" size={20} />
                <View style={styles.noticeCopy}>
                  <AppText style={styles.noticeTitle} variant="labelMd">
                    SMS access required
                  </AppText>
                  <AppText color="mutedText" style={styles.noticeText} variant="bodyMd">
                    Grant read access before choosing an import window.
                  </AppText>
                </View>
                <AppButton
                  loading={busy === "permission"}
                  onPress={() => void handlePermissionRequest()}
                  title="Grant access"
                />
              </View>
            ) : null}

            <View style={styles.section}>
              <AppText style={styles.sectionTitle} variant="titleMd">
                Start date
              </AppText>
              <View style={styles.rangeList}>
                {IMPORT_RANGES.map((item) => (
                  <RangeOption
                    description={item.description}
                    key={item.value}
                    label={item.label}
                    onPress={() => setRange(item.value)}
                    selected={range === item.value}
                  />
                ))}
              </View>
            </View>

            {range === "custom" ? (
              <AppTextInput
                autoCapitalize="none"
                error={dateError ?? undefined}
                keyboardType="numbers-and-punctuation"
                label="Custom start date"
                onChangeText={setCustomDate}
                placeholder="YYYY-MM-DD"
                value={customDate}
              />
            ) : null}

            <AppTextInput
              error={limitError ?? undefined}
              helperText="Higher limits scan more inbox messages and may take longer."
              keyboardType="number-pad"
              label="Import limit"
              onChangeText={setLimitInput}
              value={limitInput}
            />

            <View
              style={[
                styles.summary,
                {
                  backgroundColor: theme.colors.surfaceContainerLow,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Feather color={theme.colors.primary} name="calendar" size={18} />
              <View style={styles.summaryCopy}>
                <AppText style={styles.summaryTitle} variant="labelMd">
                  Import window
                </AppText>
                <AppText color="mutedText" style={styles.summaryText} variant="bodyMd">
                  {summaryText}
                </AppText>
              </View>
            </View>

            <View style={styles.actions}>
              <AppButton
                disabled={!permissionGranted}
                loading={busy === "import"}
                onPress={() => void handleImport()}
                title="Import messages"
              />
              <AppButton
                onPress={() => router.push("/sms/review" as never)}
                title={`Review queue${snapshot?.sms.candidateCount ? ` (${snapshot.sms.candidateCount})` : ""}`}
                variant="secondary"
              />
            </View>

            {busy === "import" ? (
              <View style={styles.importing}>
                <ActivityIndicator color={theme.colors.primary} />
                <AppText color="mutedText" variant="bodyMd">
                  Reading inbox and applying SMS source rules...
                </AppText>
              </View>
            ) : null}
          </>
        )}
      </Screen>
    </>
  );
}

function RangeOption({
  description,
  label,
  onPress,
  selected,
}: {
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const theme = useAppTheme();

  return (
    <AppPressable
      onPress={onPress}
      style={[
        styles.rangeOption,
        {
          backgroundColor: selected
            ? theme.colors.primaryContainer
            : theme.colors.surfaceContainerLowest,
          borderColor: selected ? theme.colors.primary : theme.colors.outlineVariant,
        },
      ]}
    >
      <View
        style={[
          styles.radio,
          {
            borderColor: selected ? theme.colors.primary : theme.colors.outline,
          },
        ]}
      >
        {selected ? (
          <View
            style={[styles.radioDot, { backgroundColor: theme.colors.primary }]}
          />
        ) : null}
      </View>
      <View style={styles.rangeCopy}>
        <AppText style={styles.rangeLabel} variant="labelMd">
          {label}
        </AppText>
        <AppText color="mutedText" style={styles.rangeDescription} variant="bodyMd">
          {description}
        </AppText>
      </View>
    </AppPressable>
  );
}

function resolveRangeTimestamp(range: ImportRange, customDate: string) {
  const now = new Date();

  if (range === "all") {
    return null;
  }

  if (range === "today") {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  if (range === "seven-days") {
    return startOfRelativeDay(7);
  }

  if (range === "thirty-days") {
    return startOfRelativeDay(30);
  }

  return parseDateInput(customDate);
}

function startOfRelativeDay(daysBack: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return undefined;
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return undefined;
  }

  return date.getTime();
}

function formatDateInput(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatReadableDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.sm,
  },
  content: {
    gap: Spacing.lg,
  },
  importing: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  notice: {
    alignItems: "center",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  noticeCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  noticeText: {
    flex: 1,
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  noticeTitle: {
    fontFamily: font.bold,
  },
  radio: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline * 2,
    height: Sizes.xl,
    justifyContent: "center",
    marginTop: Sizes.xs,
    width: Sizes.xl,
  },
  radioDot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  rangeCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  rangeDescription: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  rangeLabel: {
    fontFamily: font.bold,
  },
  rangeList: {
    gap: Spacing.sm,
  },
  rangeOption: {
    alignItems: "flex-start",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: font.bold,
  },
  summary: {
    alignItems: "flex-start",
    borderRadius: Radii.md,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  summaryCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  summaryText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  summaryTitle: {
    fontFamily: font.bold,
  },
});

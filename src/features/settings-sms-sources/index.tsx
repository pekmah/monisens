import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppFlashList,
  AppPressable,
  AppText,
  NestedScreenHeader,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { SmsSourceProfileGroup, SmsSourceProfileRecord } from "@/lib/finance";
import { useFinance } from "@/lib/finance";

export default function SmsSourcesScreen() {
  const theme = useAppTheme();
  const {
    deleteSmsSourceProfile,
    duplicateSmsSourceProfile,
    loadSmsSourceProfileGroups,
    reorderSmsSourceProfiles,
    updateSmsSourceProfile,
  } = useFinance();
  const [groups, setGroups] = useState<SmsSourceProfileGroup | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    const nextGroups = await loadSmsSourceProfileGroups();
    setGroups(nextGroups);
  }, [loadSmsSourceProfileGroups]);

  useFocusEffect(
    useCallback(() => {
      void loadGroups();
    }, [loadGroups]),
  );

  async function handleToggle(profile: SmsSourceProfileRecord) {
    setBusyId(profile.id);
    try {
      await updateSmsSourceProfile({
        action: profile.action,
        description: profile.description,
        enabled: !profile.enabled,
        id: profile.id,
        label: profile.label,
        matchers: profile.matchers,
        parserKey: profile.parserKey,
        sortOrder: profile.sortOrder,
      });
      await loadGroups();
    } finally {
      setBusyId(null);
    }
  }

  async function handleMove(profile: SmsSourceProfileRecord, direction: "up" | "down") {
    const current = groups
      ? [...groups.processing, ...groups.exclusions, ...groups.disabled].sort(
          (left, right) => left.sortOrder - right.sortOrder,
        )
      : [];
    const index = current.findIndex((item) => item.id === profile.id);
    if (index === -1) {
      return;
    }

    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= current.length) {
      return;
    }

    const next = [...current];
    const [item] = next.splice(index, 1);
    next.splice(swapIndex, 0, item);
    setBusyId(profile.id);
    try {
      await reorderSmsSourceProfiles(next.map((entry) => entry.id));
      await loadGroups();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDuplicate(id: string) {
    setBusyId(id);
    try {
      const nextId = await duplicateSmsSourceProfile(id);
      await loadGroups();
      router.push({ pathname: "/settings/sms-source-editor", params: { profileId: nextId } });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteSmsSourceProfile(id);
      await loadGroups();
    } finally {
      setBusyId(null);
    }
  }

  const sections = [
    { key: "processing", title: "Enabled processing", data: groups?.processing ?? [] },
    { key: "exclusions", title: "Enabled exclusions", data: groups?.exclusions ?? [] },
    { key: "disabled", title: "Disabled", data: groups?.disabled ?? [] },
  ].filter((section) => section.data.length > 0 || section.key !== "disabled");

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <NestedScreenHeader
        description="Manage which SMS sources are processed into candidates and which are excluded locally."
        overline="SMS SETTINGS"
        title="Sources & Filters"
      />

      <AppButton
        onPress={() => router.push("/settings/sms-source-editor")}
        title="Add source profile"
      />

      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <AppText style={styles.sectionTitle} variant="titleMd">
            {section.title}
          </AppText>
          {section.data.length ? (
            <AppFlashList
              data={section.data}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: theme.colors.surfaceContainerLowest,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardCopy}>
                      <AppText style={styles.cardTitle} variant="titleMd">
                        {item.label}
                      </AppText>
                      <AppText color="mutedText" style={styles.meta} variant="bodyMd">
                        {formatParser(item.parserKey)} · {item.action} · {item.matcherCount} matcher{item.matcherCount === 1 ? "" : "s"}
                      </AppText>
                      {item.description ? (
                        <AppText color="mutedText" style={styles.meta} variant="bodyMd">
                          {item.description}
                        </AppText>
                      ) : null}
                    </View>
                    <AppPressable
                      onPress={() =>
                        router.push({
                          pathname: "/settings/sms-source-editor",
                          params: { profileId: item.id },
                        })
                      }
                      style={styles.editButton}
                    >
                      <Feather color={theme.colors.primary} name="edit-2" size={16} />
                    </AppPressable>
                  </View>

                  <View style={styles.actionsRow}>
                    <AppButton
                      disabled={busyId === item.id}
                      onPress={() => void handleToggle(item)}
                      title={item.enabled ? "Disable" : "Enable"}
                      variant="secondary"
                    />
                    <AppButton
                      disabled={busyId === item.id}
                      onPress={() => void handleDuplicate(item.id)}
                      title="Duplicate"
                      variant="secondary"
                    />
                  </View>

                  <View style={styles.actionsRow}>
                    <AppButton
                      disabled={busyId === item.id}
                      onPress={() => void handleMove(item, "up")}
                      title="Move up"
                      variant="secondary"
                    />
                    <AppButton
                      disabled={busyId === item.id}
                      onPress={() => void handleMove(item, "down")}
                      title="Move down"
                      variant="secondary"
                    />
                  </View>

                  {!item.enabled ? (
                    <AppButton
                      disabled={busyId === item.id}
                      onPress={() => void handleDelete(item.id)}
                      title="Delete"
                      variant="danger"
                    />
                  ) : null}
                </View>
              )}
              scrollEnabled={false}
            />
          ) : (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surfaceContainerLowest,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <AppText color="mutedText" variant="bodyMd">
                No profiles in this group.
              </AppText>
            </View>
          )}
        </View>
      ))}
    </Screen>
  );
}

function formatParser(value: SmsSourceProfileRecord["parserKey"]) {
  switch (value) {
    case "bank-credit-debit":
      return "Bank debit/credit parser";
    case "mpesa":
      return "M-PESA parser";
    default:
      return "No parser";
  }
}

const styles = StyleSheet.create({
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  card: {
    borderRadius: Radii.xl,
    borderWidth: Sizes.hairline,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  cardCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  cardHeader: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cardTitle: {
    fontFamily: font.headerSemiBold,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  editButton: {
    padding: Spacing.sm,
  },
  meta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
  },
  separator: {
    height: Spacing.md,
  },
});

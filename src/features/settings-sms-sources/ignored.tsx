import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppFlashList,
  AppText,
  NestedScreenHeader,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { IgnoredSmsMessageRecord } from "@/lib/finance";
import { useFinance } from "@/lib/finance";

export default function IgnoredSmsMessagesScreen() {
  const theme = useAppTheme();
  const { loadIgnoredSmsMessages, reprocessIgnoredSmsMessage } = useFinance();
  const [items, setItems] = useState<IgnoredSmsMessageRecord[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    const next = await loadIgnoredSmsMessages(120);
    setItems(next);
  }, [loadIgnoredSmsMessages]);

  useFocusEffect(
    useCallback(() => {
      void loadItems();
    }, [loadItems]),
  );

  async function handleReprocess(id: string) {
    setBusyId(id);
    try {
      await reprocessIgnoredSmsMessage(id);
      await loadItems();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Screen contentContainerStyle={styles.content} scroll>
      <NestedScreenHeader
        description="Audit ignored or excluded SMS and create new profiles when the current rules are too broad or too narrow."
        overline="SMS SETTINGS"
        title="Ignored messages"
      />

      {items.length ? (
        <AppFlashList
          data={items}
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
              <AppText style={styles.cardTitle} variant="titleMd">{item.sender}</AppText>
              <AppText color="mutedText" style={styles.meta} variant="bodyMd">
                {formatTimestamp(item.receivedAt)} · {item.sourceProfileLabel ?? "No profile matched"}
              </AppText>
              <AppText color="mutedText" style={styles.meta} variant="bodyMd">
                {item.body}
              </AppText>
              <View style={styles.actionsRow}>
                <AppButton
                  disabled={busyId === item.id}
                  onPress={() => void handleReprocess(item.id)}
                  title="Reprocess"
                  variant="secondary"
                />
                <AppButton
                  disabled={busyId === item.id}
                  onPress={() =>
                    router.push({
                      pathname: "/settings/sms-source-editor",
                      params: {
                        templateBody: item.body.slice(0, 80),
                        templateSender: item.sender,
                      },
                    })
                  }
                  title="Create profile"
                />
              </View>
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
            No ignored messages recorded yet.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-KE", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  });
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
  cardTitle: {
    fontFamily: font.headerSemiBold,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  meta: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.md,
  },
  separator: {
    height: Spacing.md,
  },
});

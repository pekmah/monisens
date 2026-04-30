import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppFlashList,
  AppText,
  AppTextInput,
  ConfirmationDialog,
  OptionSelectField,
  Screen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import { FontSizes, LineHeights, Radii, Sizes, Spacing } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance, type CategoryRecord } from "@/lib/finance";
import { CATEGORY_COLOR_OPTIONS } from "@/lib/finance/constants";

const DEFAULT_NEW_COLOR = CATEGORY_COLOR_OPTIONS[0];

export default function SettingsCategoriesScreen() {
  const theme = useAppTheme();
  const { createCategory, deleteCategory, snapshot, updateCategory } = useFinance();
  const categories = snapshot?.categories ?? [];
  const [draftLabel, setDraftLabel] = useState("");
  const [draftColor, setDraftColor] = useState<string>(DEFAULT_NEW_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingColor, setEditingColor] = useState<string>(DEFAULT_NEW_COLOR);
  const [pendingDelete, setPendingDelete] = useState<CategoryRecord | null>(null);
  const [busy, setBusy] = useState<"create" | "update" | "delete" | null>(null);

  const colorOptions = useMemo(
    () => CATEGORY_COLOR_OPTIONS.map((color) => ({ accentColor: color, label: color.toUpperCase(), value: color })),
    [],
  );

  async function handleCreate() {
    if (!draftLabel.trim()) {
      return;
    }

    setBusy("create");
    try {
      await createCategory({ color: draftColor, label: draftLabel });
      setDraftLabel("");
      setDraftColor(DEFAULT_NEW_COLOR);
    } finally {
      setBusy(null);
    }
  }

  async function handleUpdate() {
    if (!editingId || !editingLabel.trim()) {
      return;
    }

    setBusy("update");
    try {
      await updateCategory({ color: editingColor, id: editingId, label: editingLabel });
      setEditingId(null);
      setEditingLabel("");
      setEditingColor(DEFAULT_NEW_COLOR);
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setBusy("delete");
    try {
      await deleteCategory(pendingDelete.id);
      setPendingDelete(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen contentContainerStyle={styles.content} scroll>
        <View style={styles.header}>
          <AppText color="primary" style={styles.overline} variant="labelMd">
            SETTINGS
          </AppText>
          <AppText style={styles.title} variant="headlineSm">
            Manage categories
          </AppText>
          <AppText color="mutedText" variant="bodyMd">
            Categories live in SQLite first and sync through the same outbox path as other finance records.
          </AppText>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceContainerLowest,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <AppText style={styles.cardTitle} variant="titleMd">
            Create category
          </AppText>
          <AppTextInput
            label="Label"
            onChangeText={setDraftLabel}
            placeholder="e.g. School Fees"
            value={draftLabel}
          />
          <OptionSelectField
            label="Color"
            onSelect={setDraftColor}
            options={colorOptions}
            selectedValue={draftColor}
            title="Choose category color"
          />
          <AppButton
            loading={busy === "create"}
            onPress={() => void handleCreate()}
            title="Create category"
          />
        </View>

        <View style={styles.section}>
          <AppText style={styles.cardTitle} variant="titleMd">
            Existing categories
          </AppText>
          {categories.length ? (
            <AppFlashList
              data={categories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const editing = editingId === item.id;

                return (
                  <View
                    style={[
                      styles.card,
                      {
                        backgroundColor: theme.colors.surfaceContainerLowest,
                        borderColor: theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    {editing ? (
                      <>
                        <AppTextInput
                          label="Label"
                          onChangeText={setEditingLabel}
                          value={editingLabel}
                        />
                        <OptionSelectField
                          label="Color"
                          onSelect={setEditingColor}
                          options={colorOptions}
                          selectedValue={editingColor}
                          title="Update category color"
                        />
                        <View style={styles.actionsRow}>
                          <AppButton
                            onPress={() => {
                              setEditingId(null);
                              setEditingLabel("");
                              setEditingColor(DEFAULT_NEW_COLOR);
                            }}
                            title="Cancel"
                            variant="secondary"
                          />
                          <AppButton
                            loading={busy === "update"}
                            onPress={() => void handleUpdate()}
                            title="Save"
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.categoryRow}>
                          <View style={styles.categoryCopy}>
                            <View style={styles.categoryTitleRow}>
                              <View style={[styles.dot, { backgroundColor: item.color }]} />
                              <AppText style={styles.cardTitle} variant="titleMd">
                                {item.label}
                              </AppText>
                            </View>
                            <AppText color="mutedText" variant="bodyMd">
                              {item.isDefault ? "Default category" : "Custom category"} · {item.usageCount} linked record{item.usageCount === 1 ? "" : "s"}
                            </AppText>
                          </View>
                        </View>
                        <View style={styles.actionsRow}>
                          <AppButton
                            onPress={() => {
                              setEditingId(item.id);
                              setEditingLabel(item.label);
                              setEditingColor(item.color);
                            }}
                            title="Edit"
                            variant="secondary"
                          />
                          <AppButton
                            disabled={item.isDefault || item.usageCount > 0}
                            onPress={() => setPendingDelete(item)}
                            title="Delete"
                            variant="danger"
                          />
                        </View>
                        {item.isDefault ? (
                          <AppText color="mutedText" variant="bodyMd">
                            Default categories can be renamed and recolored, but they stay available for parser and budget defaults.
                          </AppText>
                        ) : item.usageCount > 0 ? (
                          <AppText color="mutedText" variant="bodyMd">
                            Reassign linked transactions, budgets, and pending SMS candidates before deleting this category.
                          </AppText>
                        ) : null}
                      </>
                    )}
                  </View>
                );
              }}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <AppText color="mutedText" variant="bodyMd">
              No categories are stored in the database yet.
            </AppText>
          )}
        </View>
      </Screen>

      <ConfirmationDialog
        confirmLabel="Delete category"
        description={
          pendingDelete
            ? `Delete ${pendingDelete.label}? This only works when the category is not in use.`
            : ""
        }
        loading={busy === "delete"}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title="Delete category"
        visible={Boolean(pendingDelete)}
      />
    </>
  );
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
  categoryCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  categoryRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  categoryTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  dot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  header: {
    gap: Spacing.sm,
  },
  overline: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    letterSpacing: 1.2,
    lineHeight: LineHeights.xs,
  },
  section: {
    gap: Spacing.md,
  },
  separator: {
    height: Spacing.md,
  },
  title: {
    fontFamily: font.headerBold,
  },
});

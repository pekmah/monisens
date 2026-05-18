import { Feather } from "@expo/vector-icons";
import { BottomSheetFlatList, BottomSheetModal } from "@gorhom/bottom-sheet";
import { Stack } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppBottomSheetModal,
  AppFlashList,
  AppPressable,
  AppText,
  AppTextInput,
  ConfirmationDialog,
  NestedScreenHeader,
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
  const colorPickerModalRef = useRef<BottomSheetModal>(null);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftColor, setDraftColor] = useState<string>(DEFAULT_NEW_COLOR);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [editingColor, setEditingColor] = useState<string>(DEFAULT_NEW_COLOR);
  const [pendingDelete, setPendingDelete] = useState<CategoryRecord | null>(null);
  const [busy, setBusy] = useState<"create" | "update" | "delete" | null>(null);
  const [colorPickerTarget, setColorPickerTarget] = useState<"create" | "edit" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const colorOptions = useMemo(
    () =>
      [...new Set(CATEGORY_COLOR_OPTIONS)].map((color) => ({
        accentColor: color,
        label: color.toUpperCase(),
        value: color,
      })),
    [],
  );
  const activeColorValue = colorPickerTarget === "edit" ? editingColor : draftColor;
  const activeColorTitle =
    colorPickerTarget === "edit" ? "Update category color" : "Choose category color";

  const closeColorPicker = useCallback(() => {
    colorPickerModalRef.current?.dismiss();
  }, []);

  const openColorPicker = useCallback((target: "create" | "edit") => {
    setColorPickerTarget(target);
    colorPickerModalRef.current?.present();
  }, []);

  const handleColorSelect = useCallback(
    (value: string) => {
      if (colorPickerTarget === "edit") {
        setEditingColor(value);
      } else {
        setDraftColor(value);
      }
      closeColorPicker();
    },
    [closeColorPicker, colorPickerTarget],
  );

  async function handleCreate() {
    if (!draftLabel.trim()) {
      setError("Category label is required.");
      return;
    }

    setBusy("create");
    setError(null);
    try {
      await createCategory({ color: draftColor, label: draftLabel });
      setDraftLabel("");
      setDraftColor(DEFAULT_NEW_COLOR);
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create category.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleUpdate() {
    if (!editingId || !editingLabel.trim()) {
      setError("Category label is required.");
      return;
    }

    setBusy("update");
    setError(null);
    try {
      await updateCategory({ color: editingColor, id: editingId, label: editingLabel });
      setEditingId(null);
      setEditingLabel("");
      setEditingColor(DEFAULT_NEW_COLOR);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update category.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    setBusy("delete");
    setError(null);
    try {
      await deleteCategory(pendingDelete.id);
      setPendingDelete(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete category.",
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
          description="Categories live in SQLite first and are included in local backups."
          overline="SETTINGS"
          title="Manage categories"
        />

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
          <CategoryColorField
            color={draftColor}
            helperText="Pick a color accent for this category."
            onPress={() => openColorPicker("create")}
          />
          <View style={styles.colorPreviewRow}>
            <View style={[styles.dotLarge, { backgroundColor: draftColor }]} />
            <AppText color="mutedText" variant="bodyMd">
              Selected color {draftColor.toUpperCase()}
            </AppText>
          </View>
          {error ? (
            <AppText color="error" variant="bodyMd">
              {error}
            </AppText>
          ) : null}
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
                        <CategoryColorField
                          color={editingColor}
                          helperText="Choose a new color accent."
                          onPress={() => openColorPicker("edit")}
                        />
                        <View style={styles.colorPreviewRow}>
                          <View style={[styles.dotLarge, { backgroundColor: editingColor }]} />
                          <AppText color="mutedText" variant="bodyMd">
                            Selected color {editingColor.toUpperCase()}
                          </AppText>
                        </View>
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

      <AppBottomSheetModal
        ref={colorPickerModalRef}
        enableDynamicSizing={false}
        onDismiss={() => setColorPickerTarget(null)}
        onClosePress={closeColorPicker}
        snapPoints={["82%"]}
        subtitle="Choose a color accent from the full palette."
        title={activeColorTitle}
      >
        <BottomSheetFlatList
          contentContainerStyle={styles.pickerListContent}
          data={colorOptions}
          keyExtractor={(item) => item.value}
          ListFooterComponent={
            <View style={styles.footer}>
              <AppButton onPress={closeColorPicker} title="Close" variant="secondary" />
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = item.value === activeColorValue;

            return (
              <AppPressable
                onPress={() => handleColorSelect(item.value)}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primaryContainer
                      : theme.colors.surfaceContainerLow,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.optionCopy}>
                  <View style={styles.optionLabelRow}>
                    <View style={[styles.dot, { backgroundColor: item.value }]} />
                    <AppText style={styles.optionLabel} variant="bodyMd">
                      {item.label}
                    </AppText>
                  </View>
                </View>
                {isSelected ? (
                  <Feather color={theme.colors.primary} name="check" size={18} />
                ) : null}
              </AppPressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.pickerSeparator} />}
          showsVerticalScrollIndicator={false}
          style={styles.pickerList}
        />
      </AppBottomSheetModal>
    </>
  );
}

function CategoryColorField({
  color,
  helperText,
  onPress,
}: {
  color: string;
  helperText: string;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.fieldWrap}>
      <AppText style={styles.fieldLabel} variant="labelMd">
        Color
      </AppText>
      <AppPressable
        onPress={onPress}
        style={[
          styles.field,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <View style={styles.fieldValueRow}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <View style={styles.fieldCopy}>
            <AppText style={styles.fieldValue} variant="bodyMd">
              {color.toUpperCase()}
            </AppText>
            <AppText color="mutedText" style={styles.helperText} variant="bodyMd">
              {helperText}
            </AppText>
          </View>
        </View>
        <Feather color={theme.colors.mutedText} name="chevron-down" size={18} />
      </AppPressable>
    </View>
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
  dotLarge: {
    borderRadius: Radii.full,
    height: Sizes.lg,
    width: Sizes.lg,
  },
  colorPreviewRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  section: {
    gap: Spacing.md,
  },
  field: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    justifyContent: "space-between",
    minHeight: Sizes["11xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  fieldCopy: {
    flex: 1,
    gap: Sizes.xs,
    minWidth: 0,
  },
  fieldLabel: {
    fontFamily: font.semiBold,
  },
  fieldValue: {
    lineHeight: LineHeights.md,
  },
  fieldValueRow: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fieldWrap: {
    gap: Spacing.sm,
  },
  footer: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  helperText: {
    fontSize: FontSizes.sm,
    lineHeight: LineHeights.sm,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontFamily: font.medium,
  },
  optionLabelRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: Spacing.sm,
  },
  optionRow: {
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.md,
    minHeight: Sizes["10xl"],
    paddingHorizontal: Spacing.md + Spacing.xs,
    paddingVertical: Spacing.sm + Sizes.xs / 2,
  },
  pickerList: {
    flex: 1,
  },
  pickerListContent: {
    paddingBottom: Spacing.xl,
    paddingTop: Sizes.xs,
  },
  pickerSeparator: {
    height: Spacing.xs + Sizes.xs / 2,
  },
  separator: {
    height: Spacing.md,
  },
});

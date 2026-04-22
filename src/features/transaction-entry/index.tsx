import { Stack, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
  AppFlashList,
  AppPressable,
  AppText,
  AppTextInput,
  KeyboardScreen,
} from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { useFinance, formatMoney, type TransactionDirection } from "@/lib/finance";

const directionOptions: { key: TransactionDirection; label: string }[] = [
  { key: "expense", label: "Expense" },
  { key: "income", label: "Income" },
];

export default function TransactionEntryScreen() {
  const theme = useAppTheme();
  const { createTransaction, snapshot } = useFinance();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [accountLabel, setAccountLabel] = useState("Primary Wallet");
  const [direction, setDirection] = useState<TransactionDirection>("expense");
  const [categoryId, setCategoryId] = useState<string>(snapshot?.categories[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory =
    snapshot?.categories.find((category) => category.id === categoryId) ??
    snapshot?.categories[0] ??
    null;

  useEffect(() => {
    if (!categoryId && snapshot?.categories[0]) {
      setCategoryId(snapshot.categories[0].id);
    }
  }, [categoryId, snapshot?.categories]);

  const isReady = merchant.trim().length > 0 && amount.trim().length > 0 && categoryId.length > 0;

  const previewAmount = useMemo(() => {
    const normalized = Number(amount.replace(/[^0-9.]/g, ""));
    return Number.isFinite(normalized) && normalized > 0
      ? formatMoney(Math.round(normalized * 100), "KES")
      : formatMoney(0, "KES");
  }, [amount]);

  async function handleSubmit() {
    if (!isReady) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const id = await createTransaction({
        accountLabel,
        amount,
        categoryId,
        direction,
        merchant,
        notes,
        reference,
      });
      router.replace(`/transactions/${id}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save the transaction locally.",
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardScreen
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[styles.header, { backgroundColor: theme.colors.background }]}
        >
          <AppPressable
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surfaceContainerLow },
            ]}
          >
            <AppText style={{ color: theme.colors.text }} variant="titleMd">
              ←
            </AppText>
          </AppPressable>
          <View style={styles.headerCopy}>
            <AppText color="primary" style={styles.overline} variant="labelMd">
              TRANSACTION ENTRY
            </AppText>
            <AppText style={styles.title} variant="titleMd">
              New transaction
            </AppText>
            <AppText
              color="mutedText"
              style={styles.description}
              variant="bodyMd"
            >
              Capture the transaction details and save them to your ledger.
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfaceContainerLowest },
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            Direction
          </AppText>
          <AppFlashList
            data={directionOptions}
            horizontal
            keyExtractor={(option) => option.key}
            renderItem={({ item: option }) => {
              const isActive = option.key === direction;

              return (
                <AppPressable
                  onPress={() => setDirection(option.key)}
                  style={[
                    styles.segment,
                    {
                      backgroundColor: isActive
                        ? theme.colors.primaryContainer
                        : theme.colors.surfaceContainerLow,
                    },
                  ]}
                >
                  <AppText
                    color={isActive ? "onPrimaryContainer" : "mutedText"}
                    style={styles.segmentText}
                    variant="labelMd"
                  >
                    {option.label}
                  </AppText>
                </AppPressable>
              );
            }}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.segmentSeparator} />}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfaceContainerLowest },
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            Transaction details
          </AppText>
          <View style={styles.form}>
            <AppTextInput
              label="Merchant"
              onChangeText={setMerchant}
              placeholder="Java House, KPLC, Salary Deposit"
              value={merchant}
            />
            <AppTextInput
              keyboardType="decimal-pad"
              label="Amount"
              onChangeText={setAmount}
              placeholder="2450"
              value={amount}
            />
            <AppTextInput
              label="Reference"
              onChangeText={setReference}
              placeholder="Optional confirmation code"
              value={reference}
            />
            <AppTextInput
              label="Account label"
              onChangeText={setAccountLabel}
              placeholder="Primary Wallet"
              value={accountLabel}
            />
            <AppTextInput
              helperText="Optional context shown on the transaction detail screen."
              label="Notes"
              multiline
              numberOfLines={4}
              onChangeText={setNotes}
              placeholder="Coffee meeting, salary run, utility top-up"
              style={styles.multilineInput}
              value={notes}
            />
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfaceContainerLowest },
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            Category
          </AppText>
          {snapshot?.categories.length ? (
            <AppFlashList
              data={snapshot.categories}
              horizontal
              keyExtractor={(category) => category.id}
              renderItem={({ item: category }) => {
                const isActive = category.id === categoryId;

                return (
                  <AppPressable
                    onPress={() => setCategoryId(category.id)}
                    style={[
                      styles.categoryPill,
                      {
                        backgroundColor: isActive
                          ? `${category.color}20`
                          : theme.colors.surfaceContainerLow,
                        borderColor: isActive
                          ? category.color
                          : theme.colors.outlineVariant,
                      },
                    ]}
                  >
                    <View
                      style={[styles.categoryDot, { backgroundColor: category.color }]}
                    />
                    <AppText
                      style={[
                        styles.categoryText,
                        {
                          color: isActive ? category.color : theme.colors.text,
                        },
                      ]}
                      variant="labelMd"
                    >
                      {category.label}
                    </AppText>
                  </AppPressable>
                );
              }}
              scrollEnabled
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
            />
          ) : (
            <AppText color="mutedText" variant="bodyMd">
              No categories are stored in the database yet.
            </AppText>
          )}
        </View>

        <View
          style={[
            styles.previewCard,
            { backgroundColor: theme.colors.surfaceContainerLow },
          ]}
        >
          <AppText color="mutedText" style={styles.previewEyebrow} variant="labelMd">
            PREVIEW
          </AppText>
          <AppText style={styles.previewTitle} variant="titleMd">
            {merchant.trim() || "New transaction"}
          </AppText>
          <AppText style={styles.previewAmount} variant="displayLg">
            {direction === "income" ? "+ " : "- "}
            {previewAmount}
          </AppText>
          <AppText color="mutedText" variant="bodyMd">
            {selectedCategory?.label || "Choose a category"}
          </AppText>
          {error ? (
            <AppText color="error" variant="bodyMd">
              {error}
            </AppText>
          ) : null}
        </View>

        <AppButton
          disabled={!isReady}
          fullWidth
          loading={submitting}
          onPress={handleSubmit}
          title="Save transaction"
        />
      </KeyboardScreen>
    </>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  card: {
    borderRadius: Radii.xl,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  categoryDot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    width: Sizes.sm,
  },
  categoryPill: {
    alignItems: "center",
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  categorySeparator: {
    width: Spacing.sm,
  },
  categoryText: {
    fontFamily: font.medium,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  description: {
    lineHeight: LineHeights.md,
  },
  form: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Sizes.xs,
  },
  multilineInput: {
    minHeight: Sizes["15xl"],
    textAlignVertical: "top",
  },
  overline: {
    letterSpacing: 1.1,
  },
  previewAmount: {
    fontFamily: font.headerBold,
    fontSize: FontSizes["3xl"],
    lineHeight: LineHeights["4xl"],
  },
  previewCard: {
    borderRadius: Radii.xl,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  previewEyebrow: {
    letterSpacing: 1.1,
  },
  previewTitle: {
    fontFamily: font.headerSemiBold,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
  },
  segment: {
    borderRadius: Radii.full,
    justifyContent: "center",
    minHeight: Sizes["9xl"],
    minWidth: Sizes["15xl"],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  segmentSeparator: {
    width: Spacing.sm,
  },
  segmentText: {
    textAlign: "center",
  },
  title: {
    fontFamily: font.headerSemiBold,
  },
});

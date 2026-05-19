import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

import {
  AppButton,
  CategorySelectField,
  AppText,
  AppTextInput,
  KeyboardScreen,
  NestedScreenHeader,
  OptionSelectField,
} from "@/components/base";
import { font } from "@/constants/fonts";
import {
  FontSizes,
  LineHeights,
  Radii,
  Sizes,
  Spacing,
  type AppTheme,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import {
  formatMoney,
  type BillCadence,
  type BillRecord,
  useFinance,
} from "@/lib/finance";

import {
  formatBillDate,
  formatCadence,
  getBillPreviewDates,
  getMonthlyImpactMinor,
  parseDateInput,
  toDateInput,
} from "./lib/dates";

const cadenceOptions: { label: string; value: BillCadence }[] = [
  { label: "One-time", value: "once" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

export default function BillEditorScreen() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{
    amount?: string;
    categoryId?: string;
    id?: string;
    merchant?: string;
  }>();
  const { createBill, loadBillById, snapshot, updateBill } = useFinance();
  const [loadedBill, setLoadedBill] = useState<BillRecord | null>(null);
  const [name, setName] = useState("");
  const [expectedMerchant, setExpectedMerchant] = useState(params.merchant ?? "");
  const [merchantPattern, setMerchantPattern] = useState(params.merchant ?? "");
  const [amount, setAmount] = useState(params.amount ?? "");
  const [categoryId, setCategoryId] = useState(params.categoryId ?? "");
  const [accountLabel, setAccountLabel] = useState("Primary Wallet");
  const [cadence, setCadence] = useState<BillCadence>("monthly");
  const [startDate, setStartDate] = useState(toDateInput(Date.now()));
  const [endDate, setEndDate] = useState("");
  const [occurrenceCount, setOccurrenceCount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const billId = params.id;
  const isEditing = Boolean(billId);
  const cardThemeStyle = getCardThemeStyle(theme);
  const previewThemeStyle = getPreviewThemeStyle(theme);

  useEffect(() => {
    if (!billId) {
      return;
    }

    let mounted = true;
    void loadBillById(billId).then((bill) => {
      if (!mounted || !bill) {
        return;
      }

      setLoadedBill(bill);
      setName(bill.name);
      setExpectedMerchant(bill.expectedMerchant);
      setMerchantPattern(bill.merchantPattern ?? bill.expectedMerchant);
      setAmount(String(bill.amountMinor / 100));
      setCategoryId(bill.categoryId ?? "");
      setAccountLabel(bill.accountLabel);
      setCadence(bill.cadence);
      setStartDate(toDateInput(bill.startAt));
      setEndDate(bill.endAt ? toDateInput(bill.endAt) : "");
      setOccurrenceCount(bill.occurrenceCount ? String(bill.occurrenceCount) : "");
      setNotes(bill.notes ?? "");
    });

    return () => {
      mounted = false;
    };
  }, [billId, loadBillById]);

  useEffect(() => {
    if (!categoryId && snapshot?.categories[0]) {
      setCategoryId(snapshot.categories[0].id);
    }
  }, [categoryId, snapshot?.categories]);

  useEffect(() => {
    if (!name && expectedMerchant) {
      setName(expectedMerchant);
    }
  }, [expectedMerchant, name]);

  const parsedAmountMinor = useMemo(() => {
    const numeric = Number(amount.replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? Math.round(numeric * 100) : 0;
  }, [amount]);
  const startAt = parseDateInput(startDate);
  const endAt = endDate.trim() ? parseDateInput(endDate) : null;
  const parsedOccurrenceCount = occurrenceCount.trim()
    ? Math.max(Number.parseInt(occurrenceCount, 10), 1)
    : null;
  const previewDates = getBillPreviewDates({
    cadence,
    endAt,
    occurrenceCount: parsedOccurrenceCount,
    startAt,
  });
  const monthlyImpactMinor = getMonthlyImpactMinor({
    amountMinor: parsedAmountMinor,
    cadence,
  });
  const isReady =
    name.trim().length > 0
    && expectedMerchant.trim().length > 0
    && amount.trim().length > 0
    && startDate.trim().length > 0;

  async function handleSubmit() {
    if (!isReady) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const input = {
        accountLabel,
        amount,
        cadence,
        categoryId: categoryId || null,
        endAt,
        expectedMerchant,
        merchantPattern,
        name,
        notes,
        occurrenceCount: parsedOccurrenceCount,
        startAt,
      };

      if (billId) {
        await updateBill(billId, input);
        router.replace(`/bills/${billId}` as never);
      } else {
        const id = await createBill(input);
        router.replace(`/bills/${id}` as never);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save this bill.",
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardScreen contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <NestedScreenHeader
          description="Create a planned obligation. Payment is confirmed later by linking a real transaction."
          overline="BILL SETUP"
          title={isEditing ? "Edit bill" : "Set up bill"}
        />

        <View
          style={[
            styles.card,
            cardThemeStyle,
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            Bill details
          </AppText>
          <AppTextInput label="Name" onChangeText={setName} placeholder="Rent, KPLC, Netflix" value={name} />
          <AppTextInput
            label="Expected merchant"
            onChangeText={setExpectedMerchant}
            placeholder="KPLC, Safaricom, Landlord"
            value={expectedMerchant}
          />
          <AppTextInput
            helperText="Used for transaction matching. Leave close to the SMS or merchant text."
            label="Merchant match text"
            onChangeText={setMerchantPattern}
            placeholder="KPLC"
            value={merchantPattern}
          />
          <AppTextInput
            keyboardType="decimal-pad"
            label="Expected amount"
            onChangeText={setAmount}
            placeholder="2500"
            value={amount}
          />
          <CategorySelectField
            onSelect={(value) => setCategoryId(value)}
            selectedValue={categoryId}
            title="Choose bill category"
          />
          <AppTextInput
            label="Account label"
            onChangeText={setAccountLabel}
            placeholder="Primary Wallet"
            value={accountLabel}
          />
          <AppTextInput
            label="Notes"
            multiline
            numberOfLines={3}
            onChangeText={setNotes}
            placeholder="Optional context"
            value={notes}
          />
        </View>

        <View
          style={[
            styles.card,
            cardThemeStyle,
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            Schedule
          </AppText>
          <OptionSelectField
            label="Repeats"
            onSelect={(value) => setCadence(value as BillCadence)}
            options={cadenceOptions}
            placeholder="Choose recurrence"
            selectedValue={cadence}
            title="Choose recurrence"
          />
          <AppTextInput
            helperText="Use YYYY-MM-DD."
            label="Start date"
            onChangeText={setStartDate}
            placeholder="2026-05-30"
            value={startDate}
          />
          <AppTextInput
            helperText="Optional. Use YYYY-MM-DD."
            label="End date"
            onChangeText={setEndDate}
            placeholder="Leave blank"
            value={endDate}
          />
          <AppTextInput
            helperText="Optional limit for recurring bills."
            keyboardType="number-pad"
            label="Occurrence count"
            onChangeText={setOccurrenceCount}
            placeholder="Leave blank"
            value={occurrenceCount}
          />
        </View>

        <View
          style={[
            styles.preview,
            previewThemeStyle,
          ]}
        >
          <AppText color="mutedText" style={styles.previewLabel} variant="labelMd">
            PREVIEW
          </AppText>
          <AppText style={styles.previewTitle} variant="titleMd">
            {formatCadence(cadence)} · {formatMoney(monthlyImpactMinor, "KES")} monthly impact
          </AppText>
          <AppText color="mutedText" variant="bodyMd">
            Next: {previewDates.map(formatBillDate).join(", ") || "No dates"}
          </AppText>
          {loadedBill ? (
            <AppText color="mutedText" variant="bodyMd">
              Existing unpaid occurrences update to the new amount and schedule details.
            </AppText>
          ) : null}
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
          title={isEditing ? "Save bill" : "Create bill"}
        />
      </KeyboardScreen>
    </>
  );
}

function getCardThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLowest,
  };
}

function getPreviewThemeStyle(theme: AppTheme): ViewStyle {
  return {
    backgroundColor: theme.colors.surfaceContainerLow,
  };
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.lg,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["15xl"],
  },
  preview: {
    borderRadius: Radii.lg,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  previewLabel: {
    fontFamily: font.bold,
    fontSize: FontSizes.xs,
    lineHeight: LineHeights.xs,
  },
  previewTitle: {
    fontFamily: font.headerSemiBold,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
  },
});

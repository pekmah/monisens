import { Feather } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppButton,
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

import { EntryMethodCard } from "./components";

type EntryMethod = "file" | "manual" | "statement";
type ImportFormat = "csv" | "pdf" | "xlsx";
[];
const methodCards: {
  icon: React.ComponentProps<typeof Feather>["name"];
  key: EntryMethod;
  label: string;
  meta: string;
}[] = [
  {
    key: "manual",
    icon: "message-square",
    label: "Paste message",
    meta: "Drop in an SMS or bank alert and we will map amount, merchant, and reference.",
  },
  {
    key: "statement",
    icon: "file-text",
    label: "Import statement",
    meta: "Bring in monthly PDF, CSV, or spreadsheet exports and review the extracted rows.",
  },
  {
    key: "file",
    icon: "upload-cloud",
    label: "Upload file",
    meta: "Queue receipts, screenshots, or forwarded exports that need a manual review pass.",
  },
];

const formatOptions: {
  key: ImportFormat;
  label: string;
}[] = [
  { key: "pdf", label: "PDF" },
  { key: "csv", label: "CSV" },
  { key: "xlsx", label: "XLSX" },
];

const extractionBullets = {
  manual: [
    "Merchant or sender name",
    "Amount and currency",
    "Timestamp and channel",
    "Reference code",
  ],
  statement: [
    "Statement period",
    "Debit and credit rows",
    "Narration or memo",
    "Balance checkpoints",
  ],
  file: [
    "File source and format",
    "Rows that need review",
    "Attachment provenance",
    "Ambiguous fields to verify",
  ],
} satisfies Record<EntryMethod, string[]>;

export default function TransactionEntryScreen() {
  const theme = useAppTheme();
  const [method, setMethod] = useState<EntryMethod>("manual");
  const [selectedFormat, setSelectedFormat] = useState<ImportFormat>("pdf");
  const [messageBody, setMessageBody] = useState("");
  const [messageSource, setMessageSource] = useState("");
  const [messageDate, setMessageDate] = useState("");
  const [statementInstitution, setStatementInstitution] = useState("");
  const [statementPeriod, setStatementPeriod] = useState("");
  const [statementFileName, setStatementFileName] = useState("");
  const [uploadName, setUploadName] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [prepared, setPrepared] = useState(false);

  const primaryActionTitle =
    method === "manual"
      ? "Prepare message import"
      : method === "statement"
        ? "Prepare statement import"
        : "Prepare file review";

  const isReady =
    method === "manual"
      ? messageBody.trim().length > 0
      : method === "statement"
        ? statementInstitution.trim().length > 0 &&
          statementPeriod.trim().length > 0 &&
          statementFileName.trim().length > 0
        : uploadName.trim().length > 0;

  const summary = useMemo(() => {
    if (method === "manual") {
      return {
        detail: messageSource.trim() || "Manual SMS paste",
        title: "Message draft ready",
      };
    }

    if (method === "statement") {
      return {
        detail: `${statementInstitution || "Statement"} · ${selectedFormat.toUpperCase()}`,
        title: "Statement import ready",
      };
    }

    return {
      detail: uploadName.trim() || "File review queue",
      title: "File review draft ready",
    };
  }, [method, messageSource, selectedFormat, statementInstitution, uploadName]);

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
            <Feather color={theme.colors.text} name="arrow-left" size={18} />
          </AppPressable>
          <View style={styles.headerCopy}>
            <AppText color="primary" style={styles.overline} variant="labelMd">
              Transaction Intake
            </AppText>
            <AppText style={styles.title} variant="titleMd">
              Add or import transactions
            </AppText>
            <AppText
              color="mutedText"
              style={styles.description}
              variant="bodyMd"
            >
              Capture a single message, load a statement, or queue a file that
              needs manual review.
            </AppText>
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfaceContainerLow },
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            Choose source
          </AppText>
          <View style={styles.methodList}>
            {methodCards.map((card) => (
              <EntryMethodCard
                key={card.key}
                active={card.key === method}
                icon={card.icon}
                label={card.label}
                meta={card.meta}
                onPress={() => {
                  setMethod(card.key);
                  setPrepared(false);
                }}
              />
            ))}
          </View>
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfaceContainerLowest },
          ]}
        >
          <AppText style={styles.sectionTitle} variant="titleMd">
            {method === "manual"
              ? "Message details"
              : method === "statement"
                ? "Statement details"
                : "File details"}
          </AppText>

          {method === "manual" ? (
            <View style={styles.form}>
              <AppTextInput
                helperText="Paste the full bank or wallet alert exactly as received."
                label="Message body"
                multiline
                numberOfLines={6}
                onChangeText={setMessageBody}
                placeholder="Confirmed. Ksh2,450 sent to Java House on 19 Apr at 12:45 PM..."
                style={styles.multilineInput}
                value={messageBody}
              />
              <AppTextInput
                label="Source label"
                onChangeText={setMessageSource}
                placeholder="M-PESA SMS, Equity alert, forwarded WhatsApp"
                value={messageSource}
              />
              <AppTextInput
                label="Received at"
                onChangeText={setMessageDate}
                placeholder="19 Apr 2026, 12:45 PM"
                value={messageDate}
              />
            </View>
          ) : null}

          {method === "statement" ? (
            <View style={styles.form}>
              <AppTextInput
                label="Institution"
                onChangeText={setStatementInstitution}
                placeholder="NCBA, M-PESA, KCB, Cooperative"
                value={statementInstitution}
              />
              <AppTextInput
                label="Statement period"
                onChangeText={setStatementPeriod}
                placeholder="Apr 1 - Apr 19, 2026"
                value={statementPeriod}
              />
              <AppTextInput
                helperText="Enter the file name you received or want to review."
                label="Statement file"
                onChangeText={setStatementFileName}
                placeholder="april-wallet-statement.pdf"
                value={statementFileName}
              />

              <View style={styles.formatsSection}>
                <AppText
                  color="mutedText"
                  style={styles.formatsLabel}
                  variant="labelMd"
                >
                  Expected format
                </AppText>
                <View style={styles.formatList}>
                  {formatOptions.map((option) => {
                    const active = selectedFormat === option.key;

                    return (
                      <AppPressable
                        key={option.key}
                        onPress={() => setSelectedFormat(option.key)}
                        style={[
                          styles.formatChip,
                          {
                            backgroundColor: active
                              ? theme.colors.primaryContainer
                              : theme.colors.surfaceContainer,
                            borderColor: active
                              ? theme.colors.primary
                              : theme.colors.outlineVariant,
                          },
                        ]}
                      >
                        <AppText
                          color={active ? "onPrimaryContainer" : "mutedText"}
                          variant="labelMd"
                        >
                          {option.label}
                        </AppText>
                      </AppPressable>
                    );
                  })}
                </View>
              </View>
            </View>
          ) : null}

          {method === "file" ? (
            <View style={styles.form}>
              <AppTextInput
                helperText="Use this for receipts, forwarded exports, screenshots, or mixed bundles."
                label="File or bundle name"
                onChangeText={setUploadName}
                placeholder="household-spend-apr.zip"
                value={uploadName}
              />
              <AppTextInput
                helperText="Add context for rows that are likely to need manual verification."
                label="Review notes"
                multiline
                numberOfLines={5}
                onChangeText={setUploadNotes}
                placeholder="Contains receipt images and two screenshots from mobile banking."
                style={styles.multilineInput}
                value={uploadNotes}
              />
            </View>
          ) : null}
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surfaceContainerLow },
          ]}
        >
          <View style={styles.sectionHeader}>
            <AppText style={styles.sectionTitle} variant="titleMd">
              Extraction checklist
            </AppText>
            <AppText color="primary" variant="labelMd">
              {method === "manual"
                ? "Single message"
                : method === "statement"
                  ? "Batch import"
                  : "Manual review"}
            </AppText>
          </View>
          <View style={styles.bulletList}>
            {extractionBullets[method].map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <AppText style={styles.bulletText} variant="bodyMd">
                  {bullet}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {prepared ? (
          <View
            style={[
              styles.card,
              styles.readyCard,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <AppText
              color="onPrimary"
              style={styles.readyOverline}
              variant="labelMd"
            >
              Ready For Review
            </AppText>
            <AppText
              color="onPrimary"
              style={styles.readyTitle}
              variant="titleMd"
            >
              {summary.title}
            </AppText>
            <AppText
              color="onPrimary"
              style={styles.readyDescription}
              variant="bodyMd"
            >
              {summary.detail}
            </AppText>
          </View>
        ) : null}

        <View style={styles.actions}>
          <AppButton
            fullWidth
            onPress={() => router.back()}
            title="Cancel"
            variant="secondary"
          />
          <AppButton
            disabled={!isReady}
            fullWidth
            onPress={() => setPrepared(true)}
            title={primaryActionTitle}
          />
        </View>
      </KeyboardScreen>
    </>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: Spacing.md,
    paddingBottom: Sizes["12xl"],
  },
  backButton: {
    alignItems: "center",
    borderRadius: Radii.full,
    height: Sizes["8xl"],
    justifyContent: "center",
    width: Sizes["8xl"],
  },
  bulletDot: {
    borderRadius: Radii.full,
    height: Sizes.sm,
    marginTop: Sizes.xs,
    width: Sizes.sm,
  },
  bulletList: {
    gap: Spacing.sm,
  },
  bulletRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  bulletText: {
    flex: 1,
    minWidth: 0,
  },
  card: {
    borderRadius: Radii.lg,
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  content: {
    gap: Spacing.lg,
    paddingBottom: Sizes["8xl"],
  },
  description: {
    fontSize: FontSizes.md,
    lineHeight: LineHeights.lg,
  },
  form: {
    gap: Spacing.md,
  },
  formatChip: {
    borderRadius: Radii.full,
    borderWidth: Sizes.hairline,
    minHeight: Sizes["8xl"],
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  formatList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  formatsLabel: {
    fontFamily: font.semiBold,
  },
  formatsSection: {
    gap: Spacing.sm,
  },
  header: {
    gap: Spacing.md,
  },
  headerCopy: {
    gap: Spacing.xs,
  },
  methodList: {
    gap: Spacing.sm,
  },
  multilineInput: {
    minHeight: Sizes["16xl"],
    textAlignVertical: "top",
  },
  overline: {
    fontFamily: font.semiBold,
  },
  readyCard: {
    gap: Spacing.sm,
  },
  readyDescription: {
    color: "rgba(255,255,255,0.82)",
  },
  readyOverline: {
    fontFamily: font.semiBold,
  },
  readyTitle: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights["2xl"],
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.lg,
    lineHeight: LineHeights.lg,
  },
  title: {
    fontFamily: font.headerSemiBold,
    fontSize: FontSizes.xl,
    lineHeight: LineHeights["2xl"],
  },
});

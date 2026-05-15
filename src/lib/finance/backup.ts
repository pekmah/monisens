import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import {
  decryptFinanceBackupPayload,
  encryptFinanceBackupPayload,
} from "@/lib/finance/backup-crypto";
import {
  assertEncryptedFinanceBackup,
  assertFinanceBackupPayload,
  FINANCE_BACKUP_TABLES,
  type FinanceBackupPayload,
  type FinanceBackupSummary,
  type FinanceBackupTable,
  MONISENS_BACKUP_FORMAT,
  MONISENS_BACKUP_FORMAT_VERSION,
  summarizeFinanceBackup,
} from "@/lib/finance/backup-schema";
import { DEFAULT_USER_ID } from "@/lib/finance/constants";
import { sqliteDatabase } from "@/lib/finance/database";

const RESTORE_DELETE_ORDER: FinanceBackupTable[] = [
  "ai_feedback_events",
  "sms_transaction_candidates",
  "sms_messages",
  "sms_source_matchers",
  "sms_source_profiles",
  "attachments",
  "imports",
  "bill_occurrences",
  "bills",
  "budgets",
  "transactions",
  "categories",
  "ignored_sms_messages",
];

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function getAppVersion() {
  return Constants.expoConfig?.version ?? "development";
}

function formatBackupFileName(date = new Date()) {
  const stamp = date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");

  return `monisens-backup-${stamp}.monisensbackup`;
}

function getBackupDirectory() {
  return new Directory(Paths.document, "backups");
}

function formatBillsCsvFileName(date = new Date()) {
  const stamp = date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replace(/\.\d{3}Z$/, "Z");

  return `monisens-bills-${stamp}.csv`;
}

function selectTableRows(table: FinanceBackupTable) {
  try {
    return sqliteDatabase.getAllSync<Record<string, unknown>>(
      `SELECT * FROM ${quoteIdentifier(table)}`,
    );
  } catch {
    return [];
  }
}

function buildBackupPayload(): FinanceBackupPayload {
  const createdAt = new Date().toISOString();
  const tables = FINANCE_BACKUP_TABLES.reduce(
    (snapshot, table) => {
      snapshot[table] = selectTableRows(table);
      return snapshot;
    },
    {} as FinanceBackupPayload["tables"],
  );

  return {
    appVersion: getAppVersion(),
    createdAt,
    format: MONISENS_BACKUP_FORMAT,
    formatVersion: MONISENS_BACKUP_FORMAT_VERSION,
    source: "local-sqlite",
    tables,
  };
}

async function ensureBackupDirectory() {
  const backupDirectory = getBackupDirectory();

  try {
    backupDirectory.create({ idempotent: true, intermediates: true });
  } catch {
    backupDirectory.create({ intermediates: true });
  }
}

async function readJsonFile(uri: string) {
  return JSON.parse(new File(uri).textSync());
}

function insertRows(table: FinanceBackupTable, rows: Record<string, unknown>[]) {
  for (const row of rows) {
    const columns = Object.keys(row);

    if (columns.length === 0) {
      continue;
    }

    sqliteDatabase.runSync(
      `INSERT OR REPLACE INTO ${quoteIdentifier(table)} (${columns
        .map(quoteIdentifier)
        .join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
      columns.map((column) => row[column] as string | number | null),
    );
  }
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toIsoDate(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value).toISOString()
    : "";
}

function buildBillsCsv() {
  const schedules = sqliteDatabase.getAllSync<Record<string, unknown>>(
    `SELECT
      'schedule' AS row_type,
      b.id AS bill_id,
      '' AS occurrence_id,
      b.name AS bill_name,
      b.expected_merchant AS merchant,
      b.amount_minor AS amount_minor,
      b.currency AS currency,
      COALESCE(c.label, '') AS category,
      b.account_label AS account_label,
      b.cadence AS cadence,
      b.start_at AS due_or_start_at,
      b.end_at AS end_at,
      b.occurrence_count AS occurrence_count,
      b.status AS status,
      '' AS linked_transaction_id,
      '' AS linked_transaction_merchant,
      '' AS linked_transaction_amount_minor,
      '' AS paid_at,
      b.notes AS notes
     FROM bills b
     LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.user_id = ?
       AND b.deleted_at IS NULL
     ORDER BY b.start_at ASC, b.name ASC`,
    [DEFAULT_USER_ID],
  );
  const occurrences = sqliteDatabase.getAllSync<Record<string, unknown>>(
    `SELECT
      'occurrence' AS row_type,
      b.id AS bill_id,
      o.id AS occurrence_id,
      b.name AS bill_name,
      b.expected_merchant AS merchant,
      o.amount_minor AS amount_minor,
      o.currency AS currency,
      COALESCE(c.label, '') AS category,
      b.account_label AS account_label,
      b.cadence AS cadence,
      o.due_at AS due_or_start_at,
      b.end_at AS end_at,
      b.occurrence_count AS occurrence_count,
      o.status AS status,
      o.linked_transaction_id AS linked_transaction_id,
      t.merchant AS linked_transaction_merchant,
      t.amount_minor AS linked_transaction_amount_minor,
      o.paid_at AS paid_at,
      o.match_reason AS notes
     FROM bill_occurrences o
     INNER JOIN bills b ON b.id = o.bill_id
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN transactions t ON t.id = o.linked_transaction_id
     WHERE o.user_id = ?
       AND b.deleted_at IS NULL
     ORDER BY o.due_at ASC, b.name ASC`,
    [DEFAULT_USER_ID],
  );
  const rows = [...schedules, ...occurrences];
  const columns = [
    "row_type",
    "bill_id",
    "occurrence_id",
    "bill_name",
    "merchant",
    "amount_minor",
    "currency",
    "category",
    "account_label",
    "cadence",
    "due_or_start_at",
    "end_at",
    "occurrence_count",
    "status",
    "linked_transaction_id",
    "linked_transaction_merchant",
    "linked_transaction_amount_minor",
    "paid_at",
    "notes",
  ];

  return [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) =>
          csvCell(
            ["due_or_start_at", "end_at", "paid_at"].includes(column)
              ? toIsoDate(row[column])
              : row[column],
          ),
        )
        .join(","),
    ),
  ].join("\n");
}

function restorePayload(payload: FinanceBackupPayload) {
  sqliteDatabase.withTransactionSync(() => {
    for (const table of RESTORE_DELETE_ORDER) {
      try {
        sqliteDatabase.runSync(`DELETE FROM ${quoteIdentifier(table)}`);
      } catch {
        // Older app versions may not have every table in the backup contract.
      }
    }

    for (const table of FINANCE_BACKUP_TABLES) {
      insertRows(table, payload.tables[table]);
    }

    try {
      sqliteDatabase.runSync("DELETE FROM monthly_totals");
      sqliteDatabase.runSync("DELETE FROM category_summary");
    } catch {
      // Derived summary tables are rebuilt by normal app flows when present.
    }
  });
}

export async function exportFinanceBackup(): Promise<FinanceBackupSummary> {
  const payload = buildBackupPayload();
  const encryptedBackup = await encryptFinanceBackupPayload(payload);
  const fileName = formatBackupFileName(new Date(payload.createdAt));
  const file = new File(getBackupDirectory(), fileName);

  await ensureBackupDirectory();
  file.create({ overwrite: true });
  file.write(JSON.stringify(encryptedBackup));

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: "Save Monisens backup",
      mimeType: "application/json",
      UTI: "public.json",
    });
  }

  return summarizeFinanceBackup(payload, fileName);
}

export async function exportBillsCsv(): Promise<{ fileName: string; rowCount: number }> {
  const csv = buildBillsCsv();
  const fileName = formatBillsCsvFileName();
  const file = new File(getBackupDirectory(), fileName);

  await ensureBackupDirectory();
  file.create({ overwrite: true });
  file.write(csv);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      dialogTitle: "Export Monisens bills CSV",
      mimeType: "text/csv",
      UTI: "public.comma-separated-values-text",
    });
  }

  return {
    fileName,
    rowCount: Math.max(csv.split("\n").length - 1, 0),
  };
}

export async function pickFinanceBackupForRestore(): Promise<{
  payload: FinanceBackupPayload;
  summary: FinanceBackupSummary;
} | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/json", "application/octet-stream", "*/*"],
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  const encryptedBackup = await readJsonFile(asset.uri);

  assertEncryptedFinanceBackup(encryptedBackup);

  const decryptedPayload = await decryptFinanceBackupPayload(encryptedBackup);
  assertFinanceBackupPayload(decryptedPayload);

  return {
    payload: decryptedPayload,
    summary: summarizeFinanceBackup(decryptedPayload, asset.name),
  };
}

export function restoreFinanceBackup(payload: FinanceBackupPayload) {
  assertFinanceBackupPayload(payload);
  restorePayload(payload);
  return summarizeFinanceBackup(payload);
}

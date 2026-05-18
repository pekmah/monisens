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
const BACKUP_LOG_TAG = "[MonisensBackup]";

type BackupLogDetails = Record<string, boolean | number | string | null | undefined>;

function getDurationMs(startedAt: number) {
  return Date.now() - startedAt;
}

function getUriScheme(uri: string) {
  return uri.split(":", 1)[0] || "unknown";
}

function getErrorDetails(error: unknown): BackupLogDetails {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorName: error.name,
    };
  }

  return {
    errorMessage: String(error),
    errorName: "UnknownError",
  };
}

function logBackupDebug(message: string, details?: BackupLogDetails) {
  console.info(BACKUP_LOG_TAG, message, details ?? {});
}

function logBackupError(
  message: string,
  error: unknown,
  details?: BackupLogDetails,
) {
  console.error(BACKUP_LOG_TAG, message, {
    ...details,
    ...getErrorDetails(error),
  });
}

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
  // DocumentPicker copies selected files into cache; read asynchronously so a
  // large backup cannot block the UI thread while the restore preview loads.
  return JSON.parse(await new File(uri).text());
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
  const tableCounts = FINANCE_BACKUP_TABLES.reduce(
    (counts, table) => {
      counts[table] = payload.tables[table].length;
      return counts;
    },
    {} as Record<FinanceBackupTable, number>,
  );

  logBackupDebug("restore-sqlite-transaction-start", {
    createdAt: payload.createdAt,
    formatVersion: payload.formatVersion,
    totalRows: Object.values(tableCounts).reduce((total, count) => total + count, 0),
  });

  sqliteDatabase.withTransactionSync(() => {
    for (const table of RESTORE_DELETE_ORDER) {
      try {
        sqliteDatabase.runSync(`DELETE FROM ${quoteIdentifier(table)}`);
      } catch {
        // Older app versions may not have every table in the backup contract.
      }
    }

    for (const table of FINANCE_BACKUP_TABLES) {
      logBackupDebug("restore-table-insert-start", {
        rowCount: tableCounts[table],
        table,
      });
      insertRows(table, payload.tables[table]);
      logBackupDebug("restore-table-insert-complete", {
        rowCount: tableCounts[table],
        table,
      });
    }

    try {
      sqliteDatabase.runSync("DELETE FROM monthly_totals");
      sqliteDatabase.runSync("DELETE FROM category_summary");
    } catch {
      // Derived summary tables are rebuilt by normal app flows when present.
    }
  });

  logBackupDebug("restore-sqlite-transaction-complete", {
    createdAt: payload.createdAt,
    totalRows: Object.values(tableCounts).reduce((total, count) => total + count, 0),
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
  const startedAt = Date.now();

  logBackupDebug("restore-import-picker-opened");

  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ["application/json", "application/octet-stream", "*/*"],
    });

    if (result.canceled) {
      logBackupDebug("restore-import-picker-canceled", {
        durationMs: getDurationMs(startedAt),
      });
      return null;
    }

    const asset = result.assets[0];

    if (!asset) {
      throw new Error("No backup file was returned by the document picker.");
    }

    logBackupDebug("restore-import-file-selected", {
      fileName: asset.name,
      fileSize: asset.size,
      mimeType: asset.mimeType,
      uriScheme: getUriScheme(asset.uri),
    });

    const readStartedAt = Date.now();
    const encryptedBackup = await readJsonFile(asset.uri);

    logBackupDebug("restore-import-file-read-complete", {
      durationMs: getDurationMs(readStartedAt),
      fileName: asset.name,
    });

    assertEncryptedFinanceBackup(encryptedBackup);
    logBackupDebug("restore-import-envelope-valid", {
      createdAt: encryptedBackup.createdAt,
      formatVersion: encryptedBackup.formatVersion,
      keyVersion: encryptedBackup.keyVersion,
    });

    const decryptStartedAt = Date.now();

    logBackupDebug("restore-import-decrypt-start", {
      fileName: asset.name,
    });

    const decryptedPayload = await decryptFinanceBackupPayload(encryptedBackup);

    logBackupDebug("restore-import-decrypt-complete", {
      durationMs: getDurationMs(decryptStartedAt),
      fileName: asset.name,
    });

    assertFinanceBackupPayload(decryptedPayload);

    const summary = summarizeFinanceBackup(decryptedPayload, asset.name);

    logBackupDebug("restore-import-payload-valid", {
      createdAt: summary.createdAt,
      durationMs: getDurationMs(startedAt),
      fileName: summary.fileName,
      totalRows: summary.totalRows,
    });

    return {
      payload: decryptedPayload,
      summary,
    };
  } catch (error) {
    logBackupError("restore-import-failed", error, {
      durationMs: getDurationMs(startedAt),
    });
    throw error;
  }
}

export function restoreFinanceBackup(payload: FinanceBackupPayload) {
  const startedAt = Date.now();

  logBackupDebug("restore-confirm-start", {
    createdAt: payload.createdAt,
    formatVersion: payload.formatVersion,
  });

  assertFinanceBackupPayload(payload);

  try {
    restorePayload(payload);
    const summary = summarizeFinanceBackup(payload);

    logBackupDebug("restore-confirm-complete", {
      durationMs: getDurationMs(startedAt),
      totalRows: summary.totalRows,
    });

    return summary;
  } catch (error) {
    logBackupError("restore-confirm-failed", error, {
      durationMs: getDurationMs(startedAt),
    });
    throw error;
  }
}

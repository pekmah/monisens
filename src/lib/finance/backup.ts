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
import { sqliteDatabase } from "@/lib/finance/database";

const BACKUP_DIRECTORY = new Directory(Paths.document, "backups");

const RESTORE_DELETE_ORDER: FinanceBackupTable[] = [
  "sms_transaction_candidates",
  "sms_messages",
  "sms_source_matchers",
  "sms_source_profiles",
  "attachments",
  "imports",
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
  try {
    BACKUP_DIRECTORY.create({ idempotent: true, intermediates: true });
  } catch {
    BACKUP_DIRECTORY.create({ intermediates: true });
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
  const file = new File(BACKUP_DIRECTORY, fileName);

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

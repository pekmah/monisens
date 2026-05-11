export const MONISENS_BACKUP_FORMAT = "monisens.backup";
export const MONISENS_BACKUP_FORMAT_VERSION = 1;

export const FINANCE_BACKUP_TABLES = [
  "categories",
  "transactions",
  "budgets",
  "imports",
  "attachments",
  "sms_source_profiles",
  "sms_source_matchers",
  "sms_messages",
  "sms_transaction_candidates",
  "ignored_sms_messages",
] as const;

export type FinanceBackupTable = (typeof FINANCE_BACKUP_TABLES)[number];

export type FinanceBackupPayload = {
  appVersion: string;
  createdAt: string;
  format: typeof MONISENS_BACKUP_FORMAT;
  formatVersion: typeof MONISENS_BACKUP_FORMAT_VERSION;
  source: "local-sqlite";
  tables: Record<FinanceBackupTable, Record<string, unknown>[]>;
};

export type EncryptedFinanceBackup = {
  algorithm: "AES-GCM";
  createdAt: string;
  format: typeof MONISENS_BACKUP_FORMAT;
  formatVersion: typeof MONISENS_BACKUP_FORMAT_VERSION;
  keyRef: "device";
  keyVersion: 1;
  payloadEncoding: "utf8-json";
  sealedData: string;
};

export type FinanceBackupSummary = {
  createdAt: string;
  fileName?: string;
  tableCounts: Record<FinanceBackupTable, number>;
  totalRows: number;
};

export function assertEncryptedFinanceBackup(
  value: unknown,
): asserts value is EncryptedFinanceBackup {
  if (!value || typeof value !== "object") {
    throw new Error("The selected file is not a Monisens backup.");
  }

  const backup = value as Partial<EncryptedFinanceBackup>;

  if (
    backup.format !== MONISENS_BACKUP_FORMAT
    || backup.formatVersion !== MONISENS_BACKUP_FORMAT_VERSION
    || backup.algorithm !== "AES-GCM"
    || backup.keyRef !== "device"
    || typeof backup.sealedData !== "string"
  ) {
    throw new Error("This backup format is not supported by this app version.");
  }
}

export function assertFinanceBackupPayload(
  value: unknown,
): asserts value is FinanceBackupPayload {
  if (!value || typeof value !== "object") {
    throw new Error("The backup payload is invalid.");
  }

  const payload = value as Partial<FinanceBackupPayload>;

  if (
    payload.format !== MONISENS_BACKUP_FORMAT
    || payload.formatVersion !== MONISENS_BACKUP_FORMAT_VERSION
    || payload.source !== "local-sqlite"
    || !payload.tables
  ) {
    throw new Error("The backup payload is not compatible with this app.");
  }

  for (const table of FINANCE_BACKUP_TABLES) {
    if (!Array.isArray(payload.tables[table])) {
      throw new Error(`The backup is missing ${table}.`);
    }
  }
}

export function summarizeFinanceBackup(
  payload: FinanceBackupPayload,
  fileName?: string,
): FinanceBackupSummary {
  const tableCounts = FINANCE_BACKUP_TABLES.reduce(
    (counts, table) => {
      counts[table] = payload.tables[table].length;
      return counts;
    },
    {} as Record<FinanceBackupTable, number>,
  );

  return {
    createdAt: payload.createdAt,
    fileName,
    tableCounts,
    totalRows: Object.values(tableCounts).reduce((total, count) => total + count, 0),
  };
}

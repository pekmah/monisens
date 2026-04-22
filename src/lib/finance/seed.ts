import { DEFAULT_ACCOUNT_LABEL, DEFAULT_CURRENCY, DEFAULT_TRANSACTION_SOURCE, DEFAULT_USER_ID } from "@/lib/finance/constants";
import { sqliteDatabase } from "@/lib/finance/database";
import {
  ensureSyncStateRow,
  queueOutboxChange,
  rebuildSummaryTables,
  writeSyncMetadata,
} from "@/lib/finance/repository";
import { createId, monthKeyFromTimestamp } from "@/lib/finance/utils";

const CATEGORY_SEEDS = [
  { color: "#fb923c", id: "cat-food", label: "Food & Dining" },
  { color: "#005db7", id: "cat-transport", label: "Transport" },
  { color: "#7a2faa", id: "cat-bills", label: "Utilities" },
  { color: "#0d631b", id: "cat-income", label: "Income" },
  { color: "#4b5563", id: "cat-other", label: "Other" },
] as const;

const SAMPLE_TRANSACTIONS = [
  {
    amountMinor: 245000,
    categoryId: "cat-food",
    direction: "expense",
    merchant: "Java House",
    notes: "Coffee meeting in Westlands",
    offsetHours: 4,
    reference: "MONI-JH-001",
  },
  {
    amountMinor: 520000,
    categoryId: "cat-bills",
    direction: "expense",
    merchant: "Kenya Power",
    notes: "Prepaid electricity tokens",
    offsetHours: 10,
    reference: "MONI-KPLC-002",
  },
  {
    amountMinor: 1218000,
    categoryId: "cat-other",
    direction: "expense",
    merchant: "Carrefour",
    notes: "Household shopping",
    offsetHours: 28,
    reference: "MONI-CRF-003",
  },
  {
    amountMinor: 85000,
    categoryId: "cat-transport",
    direction: "expense",
    merchant: "Uber Trip",
    notes: "Airport transfer",
    offsetHours: 52,
    reference: "MONI-UBR-004",
  },
  {
    amountMinor: 14500000,
    categoryId: "cat-income",
    direction: "income",
    merchant: "Salary Deposit",
    notes: "Monthly salary",
    offsetHours: 76,
    reference: "MONI-SAL-005",
  },
] as const;

const SAMPLE_BUDGETS = [
  {
    amountMinor: 1200000,
    categoryId: "cat-food",
    notes: "Dining and groceries envelope",
  },
  {
    amountMinor: 500000,
    categoryId: "cat-transport",
    notes: "Commute and ride-hailing",
  },
  {
    amountMinor: 800000,
    categoryId: "cat-bills",
    notes: "Utilities and recurring bills",
  },
] as const;

const SAMPLE_IMPORTS = [
  {
    fileName: "april-wallet-statement.csv",
    rowCount: 24,
    source: "statement",
    status: "reviewed",
  },
  {
    fileName: "mpesa-forwarded-alerts.txt",
    rowCount: 8,
    source: "sms",
    status: "draft",
  },
] as const;

const SAMPLE_ATTACHMENTS = [
  {
    localUri: "file:///local/receipts/java-house-apr19.jpg",
    mimeType: "image/jpeg",
    status: "local",
  },
  {
    localUri: "file:///local/statements/april-wallet-statement.csv",
    mimeType: "text/csv",
    status: "uploaded",
  },
] as const;

let seeded = false;

export function ensureFinanceSeedData() {
  if (seeded) {
    return;
  }

  const categoryCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM categories",
    )?.count ?? 0;

  if (categoryCount === 0) {
    const now = Date.now();
    sqliteDatabase.withTransactionSync(() => {
      for (const category of CATEGORY_SEEDS) {
        sqliteDatabase.runSync(
          `INSERT INTO categories (id, label, color, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [category.id, category.label, category.color, now, now],
        );
      }
    });
  }

  ensureSyncStateRow();

  const transactionCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM transactions",
    )?.count ?? 0;

  if (transactionCount === 0) {
    const now = Date.now();

    sqliteDatabase.withTransactionSync(() => {
      for (const [index, seed] of SAMPLE_TRANSACTIONS.entries()) {
        const transactionAt = now - seed.offsetHours * 60 * 60 * 1000;
        const id = createId(`seed_${index}`);
        const monthKey = monthKeyFromTimestamp(transactionAt);

        sqliteDatabase.runSync(
          `INSERT INTO transactions (
            id, user_id, merchant, amount_minor, currency, direction, category_id,
            account_label, source, notes, reference, transaction_at,
            created_at, updated_at, deleted_at, version, server_updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)` ,
          [
            id,
            DEFAULT_USER_ID,
            seed.merchant,
            seed.amountMinor,
            DEFAULT_CURRENCY,
            seed.direction,
            seed.categoryId,
            DEFAULT_ACCOUNT_LABEL,
            DEFAULT_TRANSACTION_SOURCE,
            seed.notes,
            seed.reference,
            transactionAt,
            transactionAt,
            transactionAt,
            1,
            transactionAt,
          ],
        );

        writeSyncMetadata({
          entityId: id,
          entityType: "transaction",
          lastSyncedAt: transactionAt,
          syncStatus: "synced",
          updatedAt: transactionAt,
        });

        sqliteDatabase.runSync(
          `UPDATE transactions
           SET server_updated_at = ?, version = ?
           WHERE id = ?`,
          [transactionAt, 1, id],
        );

        void monthKey;
      }
    });

    rebuildSummaryTables();
    sqliteDatabase.runSync(
      `UPDATE sync_state
       SET last_successful_sync_at = ?, last_attempted_sync_at = ?, last_error = NULL
       WHERE scope = ?`,
      [now, now, "default"],
    );
  }

  const budgetCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM budgets",
    )?.count ?? 0;

  if (budgetCount === 0) {
    const now = Date.now();
    const currentMonth = monthKeyFromTimestamp(now);

    sqliteDatabase.withTransactionSync(() => {
      for (const [index, seed] of SAMPLE_BUDGETS.entries()) {
        const id = createId(`budget_${index}`);

        sqliteDatabase.runSync(
          `INSERT INTO budgets (
            id, user_id, category_id, month_key, amount_minor, notes,
            created_at, updated_at, deleted_at, version, server_updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?)`,
          [
            id,
            DEFAULT_USER_ID,
            seed.categoryId,
            currentMonth,
            seed.amountMinor,
            seed.notes,
            now,
            now,
            now,
          ],
        );

        writeSyncMetadata({
          entityId: id,
          entityType: "budget",
          lastSyncedAt: now,
          syncStatus: "synced",
          updatedAt: now,
        });
      }
    });
  }

  const importCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM imports",
    )?.count ?? 0;

  if (importCount === 0) {
    const now = Date.now();

    sqliteDatabase.withTransactionSync(() => {
      for (const [index, seed] of SAMPLE_IMPORTS.entries()) {
        const id = createId(`import_${index}`);
        const isPending = seed.status === "draft";

        sqliteDatabase.runSync(
          `INSERT INTO imports (
            id, user_id, file_name, source, row_count, status,
            created_at, updated_at, deleted_at, version, server_updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, ?)`,
          [
            id,
            DEFAULT_USER_ID,
            seed.fileName,
            seed.source,
            seed.rowCount,
            seed.status,
            now,
            now,
            isPending ? null : now,
          ],
        );

        writeSyncMetadata({
          entityId: id,
          entityType: "import",
          lastSyncedAt: isPending ? null : now,
          syncStatus: isPending ? "pending" : "synced",
          updatedAt: now,
        });

        if (isPending) {
          queueOutboxChange({
            baseVersion: 0,
            entityId: id,
            entityType: "import",
            operation: "upsert",
            payload: {
              createdAt: now,
              fileName: seed.fileName,
              id,
              rowCount: seed.rowCount,
              source: seed.source,
              status: seed.status,
              updatedAt: now,
              userId: DEFAULT_USER_ID,
              version: 1,
            },
          });
        }
      }
    });
  }

  const attachmentCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM attachments",
    )?.count ?? 0;

  if (attachmentCount === 0) {
    const now = Date.now();

    sqliteDatabase.withTransactionSync(() => {
      for (const [index, seed] of SAMPLE_ATTACHMENTS.entries()) {
        const id = createId(`attachment_${index}`);
        const isPending = seed.status !== "uploaded";

        sqliteDatabase.runSync(
          `INSERT INTO attachments (
            id, user_id, linked_entity_type, linked_entity_id, local_uri, mime_type, status,
            created_at, updated_at, deleted_at, version, server_updated_at
          ) VALUES (?, ?, NULL, NULL, ?, ?, ?, ?, ?, NULL, 1, ?)`,
          [
            id,
            DEFAULT_USER_ID,
            seed.localUri,
            seed.mimeType,
            seed.status,
            now,
            now,
            isPending ? null : now,
          ],
        );

        writeSyncMetadata({
          entityId: id,
          entityType: "attachment",
          lastSyncedAt: isPending ? null : now,
          syncStatus: isPending ? "pending" : "synced",
          updatedAt: now,
        });

        if (isPending) {
          queueOutboxChange({
            baseVersion: 0,
            entityId: id,
            entityType: "attachment",
            operation: "upsert",
            payload: {
              createdAt: now,
              id,
              linkedEntityId: null,
              linkedEntityType: null,
              localUri: seed.localUri,
              mimeType: seed.mimeType,
              status: seed.status,
              updatedAt: now,
              userId: DEFAULT_USER_ID,
              version: 1,
            },
          });
        }
      }
    });
  }

  seeded = true;
}

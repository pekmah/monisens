import { DEFAULT_SYNC_SCOPE, DEFAULT_USER_ID } from "@/lib/finance/constants";
import { sqliteDatabase } from "@/lib/finance/database";
import type {
  AttachmentRecord,
  BreakdownRecord,
  BudgetAllocationRecord,
  BudgetOverviewRecord,
  BudgetRecord,
  CategoryRecord,
  CreateTransactionInput,
  DashboardTransactionRecord,
  FinanceSnapshot,
  ImportRecord,
  MonthlyTotalsRecord,
  OutboxOperation,
  OutboxStatus,
  SyncEntityType,
  SyncSnapshot,
  SyncStatus,
  TransactionRecord,
  UpdateTransactionInput,
} from "@/lib/finance/types";
import {
  accentBackground,
  buildTransactionSections,
  createId,
  formatMoney,
  formatSignedMoney,
  formatTransactionMetaDate,
  monthKeyFromTimestamp,
  toAmountMinor,
} from "@/lib/finance/utils";

export type MetadataWrite = {
  entityId: string;
  entityType: SyncEntityType;
  lastError?: string | null;
  lastSyncedAt?: number | null;
  syncStatus: SyncStatus;
  updatedAt: number;
};

export type OutboxEntry = {
  attemptCount: number;
  baseVersion: number;
  createdAt: number;
  dedupeKey: string;
  entityId: string;
  entityType: SyncEntityType;
  id: string;
  lastError: string | null;
  nextRetryAt: number | null;
  operation: OutboxOperation;
  payloadJson: string;
  status: OutboxStatus;
  updatedAt: number;
};

export function ensureSyncStateRow() {
  const existing = sqliteDatabase.getFirstSync<{ scope: string }>(
    "SELECT scope FROM sync_state WHERE scope = ?",
    [DEFAULT_SYNC_SCOPE],
  );

  if (!existing) {
    sqliteDatabase.runSync(
      `INSERT INTO sync_state (
        scope,
        last_pull_cursor,
        last_successful_sync_at,
        last_attempted_sync_at,
        locked_at,
        lock_owner,
        last_error
      ) VALUES (?, NULL, NULL, NULL, NULL, NULL, NULL)`,
      [DEFAULT_SYNC_SCOPE],
    );
  }
}

export function writeSyncMetadata(input: MetadataWrite) {
  sqliteDatabase.runSync(
    `INSERT INTO sync_metadata (
      entity_type, entity_id, sync_status, last_synced_at, last_error, conflict_payload_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, NULL, ?)
    ON CONFLICT(entity_type, entity_id) DO UPDATE SET
      sync_status = excluded.sync_status,
      last_synced_at = excluded.last_synced_at,
      last_error = excluded.last_error,
      updated_at = excluded.updated_at`,
    [
      input.entityType,
      input.entityId,
      input.syncStatus,
      input.lastSyncedAt ?? null,
      input.lastError ?? null,
      input.updatedAt,
    ],
  );
}

export function queueOutboxChange(input: {
  baseVersion: number;
  entityId: string;
  entityType: SyncEntityType;
  operation: OutboxOperation;
  payload: Record<string, unknown>;
}) {
  const now = Date.now();
  const existing = sqliteDatabase.getFirstSync<OutboxEntry>(
    `SELECT * FROM sync_outbox
     WHERE entity_type = ?
       AND entity_id = ?
       AND status IN ('pending', 'failed', 'syncing')
     ORDER BY updated_at DESC
     LIMIT 1`,
    [input.entityType, input.entityId],
  );

  const payloadJson = JSON.stringify(input.payload);

  if (!existing) {
    sqliteDatabase.runSync(
      `INSERT INTO sync_outbox (
        id, entity_type, entity_id, operation, payload_json, base_version,
        dedupe_key, status, attempt_count, next_retry_at, last_error, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 0, NULL, NULL, ?, ?)`,
      [
        createId("outbox"),
        input.entityType,
        input.entityId,
        input.operation,
        payloadJson,
        input.baseVersion,
        createId("dedupe"),
        now,
        now,
      ],
    );
    return;
  }

  const nextOperation =
    existing.operation === "delete" || input.operation === "delete"
      ? "delete"
      : "upsert";

  const nextPayload =
    nextOperation === "delete"
      ? payloadJson
      : JSON.stringify({
          ...safeParseJson<Record<string, unknown>>(existing.payloadJson, {}),
          ...input.payload,
        });

  sqliteDatabase.runSync(
    `UPDATE sync_outbox
     SET operation = ?,
         payload_json = ?,
         base_version = ?,
         dedupe_key = ?,
         status = 'pending',
         next_retry_at = NULL,
         last_error = NULL,
         updated_at = ?
     WHERE id = ?`,
    [
      nextOperation,
      nextPayload,
      input.baseVersion,
      createId("dedupe"),
      now,
      existing.id,
    ],
  );
}

export function rebuildSummaryTables() {
  const now = Date.now();

  sqliteDatabase.runSync("DELETE FROM monthly_totals");
  sqliteDatabase.runSync("DELETE FROM category_summary");

  sqliteDatabase.runSync(
    `INSERT INTO monthly_totals (month_key, income_minor, expense_minor, net_minor, transaction_count, updated_at)
     SELECT
       strftime('%Y-%m', transaction_at / 1000, 'unixepoch') AS month_key,
       COALESCE(SUM(CASE WHEN direction = 'income' THEN amount_minor ELSE 0 END), 0) AS income_minor,
       COALESCE(SUM(CASE WHEN direction = 'expense' THEN amount_minor ELSE 0 END), 0) AS expense_minor,
       COALESCE(SUM(CASE WHEN direction = 'income' THEN amount_minor ELSE -amount_minor END), 0) AS net_minor,
       COUNT(*) AS transaction_count,
       ?
     FROM transactions
     WHERE deleted_at IS NULL
     GROUP BY month_key`,
    [now],
  );

  sqliteDatabase.runSync(
    `INSERT INTO category_summary (month_key, category_id, amount_minor, transaction_count, updated_at)
     SELECT
       strftime('%Y-%m', transaction_at / 1000, 'unixepoch') AS month_key,
       category_id,
       COALESCE(SUM(CASE WHEN direction = 'expense' THEN amount_minor ELSE 0 END), 0) AS amount_minor,
       COUNT(*) AS transaction_count,
       ?
     FROM transactions
     WHERE deleted_at IS NULL
       AND direction = 'expense'
     GROUP BY month_key, category_id`,
    [now],
  );
}

export function listCategories(): CategoryRecord[] {
  const rows = sqliteDatabase.getAllSync<CategoryRecord>(
    "SELECT id, label, color FROM categories ORDER BY label ASC",
  );
  return rows;
}

export function listTransactions(searchText?: string): TransactionRecord[] {
  const query = `
    SELECT
      t.id,
      t.account_label AS accountLabel,
      t.amount_minor AS amountMinor,
      t.category_id AS categoryId,
      COALESCE(c.color, '#4b5563') AS categoryColor,
      COALESCE(c.label, 'Other') AS categoryLabel,
      t.created_at AS createdAt,
      t.currency,
      t.deleted_at AS deletedAt,
      t.direction,
      t.merchant,
      t.notes,
      t.reference,
      t.source,
      COALESCE(sm.sync_status, 'synced') AS syncStatus,
      t.transaction_at AS transactionAt,
      t.updated_at AS updatedAt,
      t.version
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN sync_metadata sm
      ON sm.entity_type = 'transaction'
     AND sm.entity_id = t.id
    WHERE t.deleted_at IS NULL
      AND t.user_id = ?
      AND (? = '' OR LOWER(t.merchant) LIKE '%' || LOWER(?) || '%' OR LOWER(COALESCE(t.notes, '')) LIKE '%' || LOWER(?) || '%')
    ORDER BY t.transaction_at DESC, t.updated_at DESC
  `;

  return sqliteDatabase.getAllSync<TransactionRecord>(query, [
    DEFAULT_USER_ID,
    searchText?.trim() ?? "",
    searchText?.trim() ?? "",
    searchText?.trim() ?? "",
  ]);
}

export function getTransactionById(id: string) {
  return (
    sqliteDatabase.getFirstSync<TransactionRecord>(
      `SELECT
        t.id,
        t.account_label AS accountLabel,
        t.amount_minor AS amountMinor,
        t.category_id AS categoryId,
        COALESCE(c.color, '#4b5563') AS categoryColor,
        COALESCE(c.label, 'Other') AS categoryLabel,
        t.created_at AS createdAt,
        t.currency,
        t.deleted_at AS deletedAt,
        t.direction,
        t.merchant,
        t.notes,
        t.reference,
        t.source,
        COALESCE(sm.sync_status, 'synced') AS syncStatus,
        t.transaction_at AS transactionAt,
        t.updated_at AS updatedAt,
        t.version
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      LEFT JOIN sync_metadata sm
        ON sm.entity_type = 'transaction'
       AND sm.entity_id = t.id
      WHERE t.id = ?
      LIMIT 1`,
      [id],
    ) ?? null
  );
}

export function getCurrentMonthTotals(): MonthlyTotalsRecord | null {
  const currentMonth = monthKeyFromTimestamp(Date.now());
  return (
    sqliteDatabase.getFirstSync<MonthlyTotalsRecord>(
      `SELECT
        month_key AS monthKey,
        income_minor AS incomeMinor,
        expense_minor AS expenseMinor,
        net_minor AS netMinor,
        transaction_count AS transactionCount
       FROM monthly_totals
       WHERE month_key = ?`,
      [currentMonth],
    ) ?? null
  );
}

export function getBreakdown(): BreakdownRecord[] {
  const currentMonth = monthKeyFromTimestamp(Date.now());
  const rows = sqliteDatabase.getAllSync<{
    amountMinor: number;
    categoryColor: string;
    categoryId: string | null;
    categoryLabel: string;
  }>(
    `SELECT
      cs.amount_minor AS amountMinor,
      cs.category_id AS categoryId,
      COALESCE(c.color, '#4b5563') AS categoryColor,
      COALESCE(c.label, 'Other') AS categoryLabel
     FROM category_summary cs
     LEFT JOIN categories c ON c.id = cs.category_id
     WHERE cs.month_key = ?
     ORDER BY cs.amount_minor DESC
     LIMIT 5`,
    [currentMonth],
  );

  return rows.map((row) => ({
    amount: row.amountMinor / 100,
    color: row.categoryColor,
    label: row.categoryLabel,
    value: formatMoney(row.amountMinor, "KES"),
  }));
}

export function getDashboardTransactions(): DashboardTransactionRecord[] {
  return listTransactions()
    .slice(0, 5)
    .map((transaction) => ({
      accent: transaction.categoryColor,
      amount: formatSignedMoney(
        transaction.amountMinor,
        transaction.currency,
        transaction.direction,
      ),
      bg: accentBackground(transaction.categoryColor),
      id: transaction.id,
      meta: formatTransactionMetaDate(transaction.transactionAt),
      title: transaction.merchant,
    }));
}

export function listBudgets(): BudgetRecord[] {
  const currentMonth = monthKeyFromTimestamp(Date.now());
  return sqliteDatabase.getAllSync<BudgetRecord>(
    `SELECT
      b.id,
      b.amount_minor AS amountMinor,
      COALESCE(c.color, '#4b5563') AS categoryColor,
      b.category_id AS categoryId,
      COALESCE(c.label, 'Other') AS categoryLabel,
      b.created_at AS createdAt,
      b.deleted_at AS deletedAt,
      b.month_key AS monthKey,
      b.notes,
      COALESCE(cs.amount_minor, 0) AS spentMinor,
      COALESCE(sm.sync_status, 'synced') AS syncStatus,
      b.updated_at AS updatedAt,
      b.version
     FROM budgets b
     LEFT JOIN categories c ON c.id = b.category_id
     LEFT JOIN category_summary cs
       ON cs.month_key = b.month_key
      AND cs.category_id = b.category_id
     LEFT JOIN sync_metadata sm
       ON sm.entity_type = 'budget'
      AND sm.entity_id = b.id
     WHERE b.deleted_at IS NULL
       AND b.user_id = ?
       AND b.month_key = ?
     ORDER BY c.label ASC`,
    [DEFAULT_USER_ID, currentMonth],
  );
}

export function getBudgetOverview(): BudgetOverviewRecord | null {
  const budgets = listBudgets();

  if (budgets.length === 0) {
    return null;
  }

  const allocatedMinor = budgets.reduce((sum, budget) => sum + budget.amountMinor, 0);
  const spentMinor = budgets.reduce((sum, budget) => sum + budget.spentMinor, 0);
  const remainingMinor = Math.max(allocatedMinor - spentMinor, 0);
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = Math.max(lastDay - today.getDate(), 0);
  const safePerDayMinor =
    daysLeft > 0 ? Math.floor(remainingMinor / daysLeft) : remainingMinor;

  return {
    allocatedMinor,
    bufferMinor: remainingMinor,
    daysLeft,
    limitMinor: allocatedMinor,
    remainingMinor,
    runwayStatus: spentMinor > allocatedMinor ? "Over plan" : "On pace",
    safePerDayMinor,
    spentMinor,
  };
}

export function getBudgetAllocations(): BudgetAllocationRecord[] {
  return listBudgets().map((budget) => {
    const remainingMinor = Math.max(budget.amountMinor - budget.spentMinor, 0);
    const percentage =
      budget.amountMinor > 0
        ? Math.min(Math.round((budget.spentMinor / budget.amountMinor) * 100), 999)
        : 0;

    return {
      accent: budget.categoryColor,
      budget: formatMoney(budget.amountMinor, "KES"),
      id: budget.id,
      label: budget.categoryLabel,
      meta: budget.notes || "Local-first budget envelope",
      remaining:
        remainingMinor === 0
          ? "Settled"
          : `${formatMoney(remainingMinor, "KES")} left`,
      spent: formatMoney(budget.spentMinor, "KES"),
      status:
        percentage >= 100 ? "Over budget" : percentage > 85 ? "Watch" : "On track",
      value: percentage,
    };
  });
}

export function listImports(): ImportRecord[] {
  return sqliteDatabase.getAllSync<ImportRecord>(
    `SELECT
      imports.id AS id,
      imports.created_at AS createdAt,
      imports.deleted_at AS deletedAt,
      imports.file_name AS fileName,
      imports.row_count AS rowCount,
      imports.source AS source,
      imports.status AS status,
      COALESCE(sm.sync_status, 'synced') AS syncStatus,
      imports.updated_at AS updatedAt,
      imports.version AS version
     FROM imports
     LEFT JOIN sync_metadata sm
       ON sm.entity_type = 'import'
      AND sm.entity_id = imports.id
     WHERE user_id = ?
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [DEFAULT_USER_ID],
  );
}

export function listAttachments(): AttachmentRecord[] {
  return sqliteDatabase.getAllSync<AttachmentRecord>(
    `SELECT
      attachments.id AS id,
      attachments.created_at AS createdAt,
      attachments.deleted_at AS deletedAt,
      attachments.linked_entity_id AS linkedEntityId,
      attachments.linked_entity_type AS linkedEntityType,
      attachments.local_uri AS localUri,
      attachments.mime_type AS mimeType,
      attachments.status AS status,
      COALESCE(sm.sync_status, 'synced') AS syncStatus,
      attachments.updated_at AS updatedAt,
      attachments.version AS version
     FROM attachments
     LEFT JOIN sync_metadata sm
       ON sm.entity_type = 'attachment'
      AND sm.entity_id = attachments.id
     WHERE user_id = ?
       AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [DEFAULT_USER_ID],
  );
}

export function createBudget(input: {
  amount: string;
  categoryId: string;
  monthKey?: string;
  notes?: string;
}) {
  const id = createId("budget");
  const now = Date.now();
  const amountMinor = toAmountMinor(input.amount);
  const monthKey = input.monthKey ?? monthKeyFromTimestamp(now);

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `INSERT INTO budgets (
        id, user_id, category_id, month_key, amount_minor, notes,
        created_at, updated_at, deleted_at, version, server_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, NULL)`,
      [
        id,
        DEFAULT_USER_ID,
        input.categoryId,
        monthKey,
        amountMinor,
        input.notes?.trim() || null,
        now,
        now,
      ],
    );

    writeSyncMetadata({
      entityId: id,
      entityType: "budget",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: 0,
      entityId: id,
      entityType: "budget",
      operation: "upsert",
      payload: serializeBudgetForSync(id),
    });
  });

  return id;
}

export function serializeBudgetForSync(id: string) {
  const budget = sqliteDatabase.getFirstSync<Record<string, unknown>>(
    `SELECT
      id,
      user_id AS userId,
      category_id AS categoryId,
      month_key AS monthKey,
      amount_minor AS amountMinor,
      notes,
      created_at AS createdAt,
      updated_at AS updatedAt,
      deleted_at AS deletedAt,
      version,
      server_updated_at AS serverUpdatedAt
     FROM budgets
     WHERE id = ?`,
    [id],
  );

  if (!budget) {
    throw new Error("Budget not found for sync serialization.");
  }

  return budget;
}

export function getSyncSnapshot(args: {
  hasRemote: boolean;
  isOnline: boolean;
  status: SyncSnapshot["status"];
}): SyncSnapshot {
  const outboxPending =
    sqliteDatabase.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM sync_outbox
       WHERE status IN ('pending', 'failed')`,
    )?.count ?? 0;

  const conflicts =
    sqliteDatabase.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM sync_conflicts
       WHERE status = 'open'`,
    )?.count ?? 0;

  const state = sqliteDatabase.getFirstSync<{
    lastAttemptedSyncAt: number | null;
    lastError: string | null;
    lastSuccessfulSyncAt: number | null;
  }>(
    `SELECT
      last_attempted_sync_at AS lastAttemptedSyncAt,
      last_error AS lastError,
      last_successful_sync_at AS lastSuccessfulSyncAt
     FROM sync_state
     WHERE scope = ?`,
    [DEFAULT_SYNC_SCOPE],
  );

  return {
    errorMessage: state?.lastError ?? null,
    hasRemote: args.hasRemote,
    isOnline: args.isOnline,
    lastAttemptedAt: state?.lastAttemptedSyncAt ?? null,
    lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null,
    openConflictCount: conflicts,
    pendingOutboxCount: outboxPending,
    status: args.status,
  };
}

export function getFinanceSnapshot(args: {
  hasRemote: boolean;
  isOnline: boolean;
  searchText?: string;
  status: SyncSnapshot["status"];
}): FinanceSnapshot {
  const transactions = listTransactions(args.searchText);

  return {
    attachments: listAttachments(),
    budgetAllocations: getBudgetAllocations(),
    budgetOverview: getBudgetOverview(),
    budgets: listBudgets(),
    breakdown: getBreakdown(),
    categories: listCategories(),
    currentMonthTotals: getCurrentMonthTotals(),
    dashboardTransactions: getDashboardTransactions(),
    imports: listImports(),
    sync: getSyncSnapshot(args),
    transactionSections: buildTransactionSections(transactions),
    transactions,
  };
}

export function createTransaction(input: CreateTransactionInput) {
  const id = createId("txn");
  const now = Date.now();
  const amountMinor = toAmountMinor(input.amount);

  if (amountMinor <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `INSERT INTO transactions (
        id, user_id, merchant, amount_minor, currency, direction, category_id,
        account_label, source, notes, reference, transaction_at,
        created_at, updated_at, deleted_at, version, server_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 1, NULL)`,
      [
        id,
        DEFAULT_USER_ID,
        input.merchant.trim(),
        amountMinor,
        input.currency ?? "KES",
        input.direction,
        input.categoryId,
        input.accountLabel?.trim() || "Primary Wallet",
        input.source ?? "manual",
        input.notes?.trim() || null,
        input.reference?.trim() || null,
        input.transactionAt ?? now,
        now,
        now,
      ],
    );

    writeSyncMetadata({
      entityId: id,
      entityType: "transaction",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: 0,
      entityId: id,
      entityType: "transaction",
      operation: "upsert",
      payload: serializeTransactionForSync(id),
    });

    rebuildSummaryTables();
  });

  return id;
}

export function updateTransaction(id: string, input: UpdateTransactionInput) {
  const current = getTransactionById(id);

  if (!current) {
    throw new Error("Transaction not found.");
  }

  const now = Date.now();
  const nextAmountMinor = input.amount
    ? toAmountMinor(input.amount)
    : current.amountMinor;

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `UPDATE transactions
       SET merchant = ?,
           amount_minor = ?,
           currency = ?,
           direction = ?,
           category_id = ?,
           account_label = ?,
           source = ?,
           notes = ?,
           reference = ?,
           transaction_at = ?,
           updated_at = ?,
           version = version + 1
       WHERE id = ?`,
      [
        input.merchant?.trim() || current.merchant,
        nextAmountMinor,
        input.currency || current.currency,
        input.direction || current.direction,
        input.categoryId ?? current.categoryId,
        input.accountLabel?.trim() || current.accountLabel,
        input.source || current.source,
        input.notes?.trim() || current.notes,
        input.reference?.trim() || current.reference,
        input.transactionAt ?? current.transactionAt,
        now,
        id,
      ],
    );

    writeSyncMetadata({
      entityId: id,
      entityType: "transaction",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: current.version,
      entityId: id,
      entityType: "transaction",
      operation: "upsert",
      payload: serializeTransactionForSync(id),
    });

    rebuildSummaryTables();
  });
}

export function softDeleteTransaction(id: string) {
  const current = getTransactionById(id);

  if (!current) {
    return;
  }

  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `UPDATE transactions
       SET deleted_at = ?,
           updated_at = ?,
           version = version + 1
       WHERE id = ?`,
      [now, now, id],
    );

    writeSyncMetadata({
      entityId: id,
      entityType: "transaction",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: current.version,
      entityId: id,
      entityType: "transaction",
      operation: "delete",
      payload: {
        deletedAt: now,
        entityId: id,
      },
    });

    rebuildSummaryTables();
  });
}

export function serializeTransactionForSync(id: string) {
  const transaction = sqliteDatabase.getFirstSync<Record<string, unknown>>(
    `SELECT
      id,
      user_id AS userId,
      merchant,
      amount_minor AS amountMinor,
      currency,
      direction,
      category_id AS categoryId,
      account_label AS accountLabel,
      source,
      notes,
      reference,
      transaction_at AS transactionAt,
      created_at AS createdAt,
      updated_at AS updatedAt,
      deleted_at AS deletedAt,
      version,
      server_updated_at AS serverUpdatedAt
     FROM transactions
     WHERE id = ?`,
    [id],
  );

  if (!transaction) {
    throw new Error("Transaction not found for sync serialization.");
  }

  return transaction;
}

export function getDueOutboxEntries(limit: number): OutboxEntry[] {
  const now = Date.now();
  return sqliteDatabase.getAllSync<OutboxEntry>(
    `SELECT *
     FROM sync_outbox
     WHERE status IN ('pending', 'failed')
       AND (next_retry_at IS NULL OR next_retry_at <= ?)
     ORDER BY created_at ASC
     LIMIT ?`,
    [now, limit],
  );
}

export function markOutboxSyncing(id: string) {
  sqliteDatabase.runSync(
    `UPDATE sync_outbox
     SET status = 'syncing', updated_at = ?
     WHERE id = ?`,
    [Date.now(), id],
  );
}

export function markOutboxDone(id: string) {
  sqliteDatabase.runSync("DELETE FROM sync_outbox WHERE id = ?", [id]);
}

export function markOutboxFailed(input: {
  attemptCount: number;
  error: string;
  id: string;
  nextRetryAt: number;
}) {
  sqliteDatabase.runSync(
    `UPDATE sync_outbox
     SET status = 'failed',
         attempt_count = ?,
         next_retry_at = ?,
         last_error = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      input.attemptCount,
      input.nextRetryAt,
      input.error,
      Date.now(),
      input.id,
    ],
  );
}

export function markEntitySynced(input: {
  entityType: SyncEntityType;
  entityId: string;
  lastSyncedAt: number;
  version: number;
}) {
  const now = Date.now();
  if (input.entityType === "transaction") {
    sqliteDatabase.runSync(
      `UPDATE transactions
       SET server_updated_at = ?, version = ?
       WHERE id = ?`,
      [input.lastSyncedAt, input.version, input.entityId],
    );
  } else if (input.entityType === "budget") {
    sqliteDatabase.runSync(
      `UPDATE budgets
       SET server_updated_at = ?, version = ?
       WHERE id = ?`,
      [input.lastSyncedAt, input.version, input.entityId],
    );
  } else if (input.entityType === "import") {
    sqliteDatabase.runSync(
      `UPDATE imports
       SET server_updated_at = ?, version = ?
       WHERE id = ?`,
      [input.lastSyncedAt, input.version, input.entityId],
    );
  } else if (input.entityType === "attachment") {
    sqliteDatabase.runSync(
      `UPDATE attachments
       SET server_updated_at = ?, version = ?
       WHERE id = ?`,
      [input.lastSyncedAt, input.version, input.entityId],
    );
  }

  writeSyncMetadata({
    entityId: input.entityId,
    entityType: input.entityType,
    lastSyncedAt: input.lastSyncedAt,
    syncStatus: "synced",
    updatedAt: now,
  });
}

export function upsertRemoteBudget(input: {
  row: Record<string, unknown>;
  serverUpdatedAt: number;
  version: number;
}) {
  const row = input.row;
  sqliteDatabase.runSync(
    `INSERT INTO budgets (
      id, user_id, category_id, month_key, amount_minor, notes,
      created_at, updated_at, deleted_at, version, server_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      category_id = excluded.category_id,
      month_key = excluded.month_key,
      amount_minor = excluded.amount_minor,
      notes = excluded.notes,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      version = excluded.version,
      server_updated_at = excluded.server_updated_at`,
    [
      String(row.id),
      String(row.userId ?? DEFAULT_USER_ID),
      String(row.categoryId),
      String(row.monthKey),
      Number(row.amountMinor ?? 0),
      row.notes ? String(row.notes) : null,
      Number(row.createdAt ?? Date.now()),
      Number(row.updatedAt ?? Date.now()),
      row.deletedAt ? Number(row.deletedAt) : null,
      input.version,
      input.serverUpdatedAt,
    ],
  );

  writeSyncMetadata({
    entityId: String(row.id),
    entityType: "budget",
    lastSyncedAt: input.serverUpdatedAt,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
}

export function upsertRemoteImport(input: {
  row: Record<string, unknown>;
  serverUpdatedAt: number;
  version: number;
}) {
  const row = input.row;
  sqliteDatabase.runSync(
    `INSERT INTO imports (
      id, user_id, file_name, source, row_count, status,
      created_at, updated_at, deleted_at, version, server_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      file_name = excluded.file_name,
      source = excluded.source,
      row_count = excluded.row_count,
      status = excluded.status,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      version = excluded.version,
      server_updated_at = excluded.server_updated_at`,
    [
      String(row.id),
      String(row.userId ?? DEFAULT_USER_ID),
      String(row.fileName ?? "import"),
      String(row.source ?? "statement"),
      Number(row.rowCount ?? 0),
      String(row.status ?? "draft"),
      Number(row.createdAt ?? Date.now()),
      Number(row.updatedAt ?? Date.now()),
      row.deletedAt ? Number(row.deletedAt) : null,
      input.version,
      input.serverUpdatedAt,
    ],
  );

  writeSyncMetadata({
    entityId: String(row.id),
    entityType: "import",
    lastSyncedAt: input.serverUpdatedAt,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
}

export function upsertRemoteAttachment(input: {
  row: Record<string, unknown>;
  serverUpdatedAt: number;
  version: number;
}) {
  const row = input.row;
  sqliteDatabase.runSync(
    `INSERT INTO attachments (
      id, user_id, linked_entity_type, linked_entity_id, local_uri, mime_type, status,
      created_at, updated_at, deleted_at, version, server_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      linked_entity_type = excluded.linked_entity_type,
      linked_entity_id = excluded.linked_entity_id,
      local_uri = excluded.local_uri,
      mime_type = excluded.mime_type,
      status = excluded.status,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      version = excluded.version,
      server_updated_at = excluded.server_updated_at`,
    [
      String(row.id),
      String(row.userId ?? DEFAULT_USER_ID),
      row.linkedEntityType ? String(row.linkedEntityType) : null,
      row.linkedEntityId ? String(row.linkedEntityId) : null,
      String(row.localUri ?? ""),
      String(row.mimeType ?? "application/octet-stream"),
      String(row.status ?? "local"),
      Number(row.createdAt ?? Date.now()),
      Number(row.updatedAt ?? Date.now()),
      row.deletedAt ? Number(row.deletedAt) : null,
      input.version,
      input.serverUpdatedAt,
    ],
  );

  writeSyncMetadata({
    entityId: String(row.id),
    entityType: "attachment",
    lastSyncedAt: input.serverUpdatedAt,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
}

export function upsertRemoteTransaction(input: {
  row: Record<string, unknown>;
  serverUpdatedAt: number;
  version: number;
}) {
  const row = input.row;
  const entityId = String(row.id);
  const existing = getTransactionById(entityId);
  const remoteUpdatedAt = Number(row.updatedAt ?? row.updated_at ?? input.serverUpdatedAt);
  const localIsPending = existing
    ? ["pending", "syncing", "failed"].includes(existing.syncStatus)
    : false;

  if (existing && localIsPending && existing.updatedAt > remoteUpdatedAt) {
    sqliteDatabase.runSync(
      `INSERT INTO sync_conflicts (
        id, entity_type, entity_id, local_payload_json, remote_payload_json,
        base_version, server_version, status, created_at
      ) VALUES (?, 'transaction', ?, ?, ?, ?, ?, 'open', ?)`,
      [
        createId("conflict"),
        entityId,
        JSON.stringify(serializeTransactionForSync(entityId)),
        JSON.stringify(row),
        existing.version,
        input.version,
        Date.now(),
      ],
    );

    writeSyncMetadata({
      entityId,
      entityType: "transaction",
      lastError: "Remote conflict detected.",
      syncStatus: "conflict",
      updatedAt: Date.now(),
    });
    return;
  }

  sqliteDatabase.runSync(
    `INSERT INTO transactions (
      id, user_id, merchant, amount_minor, currency, direction, category_id,
      account_label, source, notes, reference, transaction_at,
      created_at, updated_at, deleted_at, version, server_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      merchant = excluded.merchant,
      amount_minor = excluded.amount_minor,
      currency = excluded.currency,
      direction = excluded.direction,
      category_id = excluded.category_id,
      account_label = excluded.account_label,
      source = excluded.source,
      notes = excluded.notes,
      reference = excluded.reference,
      transaction_at = excluded.transaction_at,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      version = excluded.version,
      server_updated_at = excluded.server_updated_at`,
    [
      entityId,
      String(row.userId ?? DEFAULT_USER_ID),
      String(row.merchant ?? "Unknown"),
      Number(row.amountMinor ?? 0),
      String(row.currency ?? "KES"),
      String(row.direction ?? "expense"),
      row.categoryId ? String(row.categoryId) : null,
      String(row.accountLabel ?? "Primary Wallet"),
      String(row.source ?? "manual"),
      row.notes ? String(row.notes) : null,
      row.reference ? String(row.reference) : null,
      Number(row.transactionAt ?? Date.now()),
      Number(row.createdAt ?? Date.now()),
      Number(row.updatedAt ?? Date.now()),
      row.deletedAt ? Number(row.deletedAt) : null,
      input.version,
      input.serverUpdatedAt,
    ],
  );

  writeSyncMetadata({
    entityId,
    entityType: "transaction",
    lastSyncedAt: input.serverUpdatedAt,
    syncStatus: row.deletedAt ? "synced" : "synced",
    updatedAt: Date.now(),
  });
}

export function applyRemoteDelete(input: {
  entityType: SyncEntityType;
  entityId: string;
  serverUpdatedAt: number;
  version: number;
}) {
  const params = [
    input.serverUpdatedAt,
    input.serverUpdatedAt,
    input.version,
    input.serverUpdatedAt,
    input.entityId,
  ];

  if (input.entityType === "transaction") {
    sqliteDatabase.runSync(
      `UPDATE transactions
       SET deleted_at = ?, updated_at = ?, version = ?, server_updated_at = ?
       WHERE id = ?`,
      params,
    );
  } else if (input.entityType === "budget") {
    sqliteDatabase.runSync(
      `UPDATE budgets
       SET deleted_at = ?, updated_at = ?, version = ?, server_updated_at = ?
       WHERE id = ?`,
      params,
    );
  } else if (input.entityType === "import") {
    sqliteDatabase.runSync(
      `UPDATE imports
       SET deleted_at = ?, updated_at = ?, version = ?, server_updated_at = ?
       WHERE id = ?`,
      params,
    );
  } else if (input.entityType === "attachment") {
    sqliteDatabase.runSync(
      `UPDATE attachments
       SET deleted_at = ?, updated_at = ?, version = ?, server_updated_at = ?
       WHERE id = ?`,
      params,
    );
  }

  writeSyncMetadata({
    entityId: input.entityId,
    entityType: input.entityType,
    lastSyncedAt: input.serverUpdatedAt,
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
}

export function updateSyncState(input: {
  lastAttemptedSyncAt?: number | null;
  lastError?: string | null;
  lastPullCursor?: string | null;
  lastSuccessfulSyncAt?: number | null;
  lockedAt?: number | null;
  lockOwner?: string | null;
}) {
  ensureSyncStateRow();
  const current = sqliteDatabase.getFirstSync<{
    lastAttemptedSyncAt: number | null;
    lastError: string | null;
    lastPullCursor: string | null;
    lastSuccessfulSyncAt: number | null;
    lockedAt: number | null;
    lockOwner: string | null;
  }>(
    `SELECT
      last_attempted_sync_at AS lastAttemptedSyncAt,
      last_error AS lastError,
      last_pull_cursor AS lastPullCursor,
      last_successful_sync_at AS lastSuccessfulSyncAt,
      locked_at AS lockedAt,
      lock_owner AS lockOwner
     FROM sync_state
     WHERE scope = ?`,
    [DEFAULT_SYNC_SCOPE],
  );

  sqliteDatabase.runSync(
    `UPDATE sync_state
     SET last_pull_cursor = ?,
         last_successful_sync_at = ?,
         last_attempted_sync_at = ?,
         locked_at = ?,
         lock_owner = ?,
         last_error = ?
     WHERE scope = ?`,
    [
      input.lastPullCursor ?? current?.lastPullCursor ?? null,
      input.lastSuccessfulSyncAt ?? current?.lastSuccessfulSyncAt ?? null,
      input.lastAttemptedSyncAt ?? current?.lastAttemptedSyncAt ?? null,
      input.lockedAt ?? current?.lockedAt ?? null,
      input.lockOwner ?? current?.lockOwner ?? null,
      input.lastError ?? current?.lastError ?? null,
      DEFAULT_SYNC_SCOPE,
    ],
  );
}

export function getSyncState() {
  ensureSyncStateRow();
  return sqliteDatabase.getFirstSync<{
    lastAttemptedSyncAt: number | null;
    lastError: string | null;
    lastPullCursor: string | null;
    lastSuccessfulSyncAt: number | null;
    lockedAt: number | null;
    lockOwner: string | null;
  }>(
    `SELECT
      last_attempted_sync_at AS lastAttemptedSyncAt,
      last_error AS lastError,
      last_pull_cursor AS lastPullCursor,
      last_successful_sync_at AS lastSuccessfulSyncAt,
      locked_at AS lockedAt,
      lock_owner AS lockOwner
     FROM sync_state
     WHERE scope = ?`,
    [DEFAULT_SYNC_SCOPE],
  );
}

function safeParseJson<T>(value: string, fallback: T) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

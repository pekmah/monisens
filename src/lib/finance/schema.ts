import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const categoriesTable = sqliteTable("categories", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  color: text("color").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const transactionsTable = sqliteTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    merchant: text("merchant").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    direction: text("direction", { enum: ["expense", "income"] }).notNull(),
    categoryId: text("category_id"),
    accountLabel: text("account_label").notNull(),
    source: text("source", {
      enum: ["manual", "sms", "statement", "import"],
    }).notNull(),
    notes: text("notes"),
    reference: text("reference"),
    transactionAt: integer("transaction_at").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("transactions_user_transaction_at_idx").on(
      table.userId,
      table.transactionAt,
    ),
  ],
);

export const budgetsTable = sqliteTable(
  "budgets",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    categoryId: text("category_id").notNull(),
    monthKey: text("month_key").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    notes: text("notes"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("budgets_user_month_idx").on(table.userId, table.monthKey),
  ],
);

export const importsTable = sqliteTable(
  "imports",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    fileName: text("file_name").notNull(),
    source: text("source").notNull(),
    rowCount: integer("row_count").notNull(),
    status: text("status", {
      enum: ["draft", "reviewed", "synced"],
    }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("imports_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const attachmentsTable = sqliteTable(
  "attachments",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    linkedEntityType: text("linked_entity_type"),
    linkedEntityId: text("linked_entity_id"),
    localUri: text("local_uri").notNull(),
    mimeType: text("mime_type").notNull(),
    status: text("status", {
      enum: ["local", "uploaded", "failed"],
    }).notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
    version: integer("version").notNull(),
    serverUpdatedAt: integer("server_updated_at"),
  },
  (table) => [
    index("attachments_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const syncMetadataTable = sqliteTable(
  "sync_metadata",
  {
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    syncStatus: text("sync_status", {
      enum: ["pending", "syncing", "synced", "failed", "conflict"],
    }).notNull(),
    lastSyncedAt: integer("last_synced_at"),
    lastError: text("last_error"),
    conflictPayloadJson: text("conflict_payload_json"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.entityType, table.entityId] })],
);

export const syncOutboxTable = sqliteTable(
  "sync_outbox",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    operation: text("operation", { enum: ["upsert", "delete"] }).notNull(),
    payloadJson: text("payload_json").notNull(),
    baseVersion: integer("base_version").notNull(),
    dedupeKey: text("dedupe_key").notNull(),
    status: text("status", {
      enum: ["pending", "syncing", "done", "failed"],
    }).notNull(),
    attemptCount: integer("attempt_count").notNull(),
    nextRetryAt: integer("next_retry_at"),
    lastError: text("last_error"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [index("sync_outbox_entity_idx").on(table.entityType, table.entityId)],
);

export const syncStateTable = sqliteTable("sync_state", {
  scope: text("scope").primaryKey(),
  lastPullCursor: text("last_pull_cursor"),
  lastSuccessfulSyncAt: integer("last_successful_sync_at"),
  lastAttemptedSyncAt: integer("last_attempted_sync_at"),
  lockedAt: integer("locked_at"),
  lockOwner: text("lock_owner"),
  lastError: text("last_error"),
});

export const syncConflictsTable = sqliteTable("sync_conflicts", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  localPayloadJson: text("local_payload_json").notNull(),
  remotePayloadJson: text("remote_payload_json").notNull(),
  baseVersion: integer("base_version"),
  serverVersion: integer("server_version").notNull(),
  status: text("status", {
    enum: ["open", "resolved_local", "resolved_remote"],
  }).notNull(),
  createdAt: integer("created_at").notNull(),
});

export const monthlyTotalsTable = sqliteTable("monthly_totals", {
  monthKey: text("month_key").primaryKey(),
  incomeMinor: integer("income_minor").notNull(),
  expenseMinor: integer("expense_minor").notNull(),
  netMinor: integer("net_minor").notNull(),
  transactionCount: integer("transaction_count").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const categorySummaryTable = sqliteTable(
  "category_summary",
  {
    monthKey: text("month_key").notNull(),
    categoryId: text("category_id"),
    amountMinor: integer("amount_minor").notNull(),
    transactionCount: integer("transaction_count").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.monthKey, table.categoryId] })],
);

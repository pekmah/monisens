import { sqliteDatabase } from "@/lib/finance/database";

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  merchant TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  direction TEXT NOT NULL,
  category_id TEXT,
  account_label TEXT NOT NULL,
  source TEXT NOT NULL,
  notes TEXT,
  reference TEXT,
  transaction_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  version INTEGER NOT NULL,
  server_updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS transactions_user_transaction_at_idx
  ON transactions(user_id, transaction_at DESC);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  version INTEGER NOT NULL,
  server_updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS budgets_user_month_idx
  ON budgets(user_id, month_key);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  source TEXT NOT NULL,
  row_count INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  version INTEGER NOT NULL,
  server_updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS imports_user_created_idx
  ON imports(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  local_uri TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  version INTEGER NOT NULL,
  server_updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS attachments_user_created_idx
  ON attachments(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS sync_metadata (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  last_synced_at INTEGER,
  last_error TEXT,
  conflict_payload_json TEXT,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  base_version INTEGER NOT NULL,
  dedupe_key TEXT NOT NULL,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  next_retry_at INTEGER,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sync_outbox_entity_idx
  ON sync_outbox(entity_type, entity_id);

CREATE TABLE IF NOT EXISTS sync_state (
  scope TEXT PRIMARY KEY NOT NULL,
  last_pull_cursor TEXT,
  last_successful_sync_at INTEGER,
  last_attempted_sync_at INTEGER,
  locked_at INTEGER,
  lock_owner TEXT,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  local_payload_json TEXT NOT NULL,
  remote_payload_json TEXT NOT NULL,
  base_version INTEGER,
  server_version INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_totals (
  month_key TEXT PRIMARY KEY NOT NULL,
  income_minor INTEGER NOT NULL,
  expense_minor INTEGER NOT NULL,
  net_minor INTEGER NOT NULL,
  transaction_count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS category_summary (
  month_key TEXT NOT NULL,
  category_id TEXT,
  amount_minor INTEGER NOT NULL,
  transaction_count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (month_key, category_id)
);
`;

let migrated = false;

export function applyFinanceMigrations() {
  if (migrated) {
    return;
  }

  sqliteDatabase.execSync(MIGRATIONS);
  sqliteDatabase.execSync(`
    UPDATE sync_outbox
    SET attempt_count = COALESCE(attempt_count, 0)
    WHERE attempt_count IS NULL;
  `);
  migrated = true;
}

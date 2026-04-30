import { DEFAULT_USER_ID } from "@/lib/finance/constants";
import { sqliteDatabase } from "@/lib/finance/database";

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER,
  version INTEGER NOT NULL,
  server_updated_at INTEGER
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

CREATE TABLE IF NOT EXISTS sms_messages (
  id TEXT PRIMARY KEY NOT NULL,
  sender TEXT NOT NULL,
  body TEXT NOT NULL,
  received_at INTEGER NOT NULL,
  read_at INTEGER,
  fingerprint TEXT NOT NULL,
  parser_key TEXT,
  parse_status TEXT NOT NULL,
  metadata_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sms_messages_fingerprint_idx
  ON sms_messages(fingerprint);
CREATE INDEX IF NOT EXISTS sms_messages_received_at_idx
  ON sms_messages(received_at DESC);

CREATE TABLE IF NOT EXISTS sms_transaction_candidates (
  id TEXT PRIMARY KEY NOT NULL,
  sms_message_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  currency TEXT NOT NULL,
  direction TEXT NOT NULL,
  merchant TEXT NOT NULL,
  reference TEXT,
  occurred_at INTEGER NOT NULL,
  category_id TEXT,
  confidence INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL,
  transaction_id TEXT,
  parser_key TEXT,
  classification_status TEXT NOT NULL DEFAULT 'not_needed',
  classification_source TEXT NOT NULL DEFAULT 'rule',
  classification_confidence INTEGER,
  classification_reason TEXT,
  merchant_key TEXT,
  ai_job_id TEXT,
  category_proposal_id TEXT,
  suggested_category_label TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sms_candidates_status_idx
  ON sms_transaction_candidates(status, occurred_at DESC);
CREATE INDEX IF NOT EXISTS sms_candidates_message_idx
  ON sms_transaction_candidates(sms_message_id);
CREATE INDEX IF NOT EXISTS sms_candidates_ai_status_idx
  ON sms_transaction_candidates(classification_status, occurred_at DESC);

CREATE TABLE IF NOT EXISTS sms_sync_state (
  scope TEXT PRIMARY KEY NOT NULL,
  listener_enabled INTEGER NOT NULL,
  last_imported_at INTEGER,
  last_import_count INTEGER,
  last_listener_event_at INTEGER,
  last_error TEXT
);

CREATE TABLE IF NOT EXISTS ai_jobs (
  id TEXT PRIMARY KEY NOT NULL,
  job_type TEXT NOT NULL,
  scope TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  attempt_count INTEGER NOT NULL,
  next_retry_at INTEGER,
  last_error TEXT,
  backend_job_id TEXT,
  progress INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS ai_jobs_due_idx
  ON ai_jobs(status, next_retry_at, created_at);

CREATE TABLE IF NOT EXISTS ai_job_items (
  id TEXT PRIMARY KEY NOT NULL,
  job_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT NOT NULL,
  status TEXT NOT NULL,
  result_json TEXT,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS ai_job_items_job_idx
  ON ai_job_items(job_id, status);
CREATE INDEX IF NOT EXISTS ai_job_items_target_idx
  ON ai_job_items(item_type, item_id);

CREATE TABLE IF NOT EXISTS category_proposals (
  id TEXT PRIMARY KEY NOT NULL,
  proposed_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  linked_candidate_id TEXT,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS category_proposals_status_idx
  ON category_proposals(status, created_at);

CREATE TABLE IF NOT EXISTS merchant_memory (
  merchant_key TEXT PRIMARY KEY NOT NULL,
  merchant_name TEXT NOT NULL,
  category_id TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  source TEXT NOT NULL,
  use_count INTEGER NOT NULL,
  last_used_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

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
  ensureCategorySyncColumns();
  ensureSmsCandidateAiColumns();
  sqliteDatabase.execSync(`
    UPDATE sync_outbox
    SET attempt_count = COALESCE(attempt_count, 0)
    WHERE attempt_count IS NULL;
  `);
  migrated = true;
}

function ensureCategorySyncColumns() {
  const columns = sqliteDatabase.getAllSync<{ name: string }>(
    "PRAGMA table_info(categories)",
  );
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("user_id")) {
    sqliteDatabase.execSync(
      `ALTER TABLE categories
       ADD COLUMN user_id TEXT NOT NULL DEFAULT '${DEFAULT_USER_ID}'`,
    );
  }

  if (!columnNames.has("deleted_at")) {
    sqliteDatabase.execSync("ALTER TABLE categories ADD COLUMN deleted_at INTEGER");
  }

  if (!columnNames.has("version")) {
    sqliteDatabase.execSync("ALTER TABLE categories ADD COLUMN version INTEGER NOT NULL DEFAULT 1");
  }

  if (!columnNames.has("server_updated_at")) {
    sqliteDatabase.execSync("ALTER TABLE categories ADD COLUMN server_updated_at INTEGER");
  }
}

function ensureSmsCandidateAiColumns() {
  const columns = sqliteDatabase.getAllSync<{ name: string }>(
    "PRAGMA table_info(sms_transaction_candidates)",
  );
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("classification_status")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN classification_status TEXT NOT NULL DEFAULT 'not_needed'",
    );
  }

  if (!columnNames.has("classification_source")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN classification_source TEXT NOT NULL DEFAULT 'rule'",
    );
  }

  if (!columnNames.has("classification_confidence")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN classification_confidence INTEGER",
    );
  }

  if (!columnNames.has("classification_reason")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN classification_reason TEXT",
    );
  }

  if (!columnNames.has("merchant_key")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN merchant_key TEXT",
    );
  }

  if (!columnNames.has("ai_job_id")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN ai_job_id TEXT",
    );
  }

  if (!columnNames.has("category_proposal_id")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN category_proposal_id TEXT",
    );
  }

  if (!columnNames.has("suggested_category_label")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_transaction_candidates ADD COLUMN suggested_category_label TEXT",
    );
  }
}

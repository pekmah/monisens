import { getAiSnapshot } from "@/lib/ai/repository";
import { normalizeMerchantKey } from "@/lib/ai/utils";
import {
  DEFAULT_FINANCE_CATEGORIES,
  DEFAULT_SMS_IMPORT_LIMIT,
  DEFAULT_SMS_SOURCE_PROFILES,
  DEFAULT_SYNC_SCOPE,
  DEFAULT_USER_ID,
} from "@/lib/finance/constants";
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
  InsightAllocationRecord,
  InsightSubscriptionRecord,
  ImportRecord,
  MonthlyTotalsRecord,
  OutboxOperation,
  OutboxStatus,
  ParsedSmsCandidate,
  IgnoredSmsMessageRecord,
  SpendingAlertRecord,
  SmsSourceAction,
  SmsSourceMatcherRecord,
  SmsSourceMatchField,
  SmsSourceMatchType,
  SmsSourceParserKey,
  SmsSourceProfileGroup,
  SmsSourceProfileRecord,
  SyncEntityType,
  SmsImportResult,
  SmsMessageRecord,
  SmsPermissionState,
  SmsReviewSnapshot,
  SmsTransactionCandidateRecord,
  SmsCandidatePage,
  SyncSnapshot,
  SyncStatus,
  TransactionRecord,
  TrajectoryPointRecord,
  TrajectoryRecord,
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

export function ensureSmsSyncStateRow() {
  ensureSmsSyncStateColumns();
  const existing = sqliteDatabase.getFirstSync<{ scope: string }>(
    "SELECT scope FROM sms_sync_state WHERE scope = 'default'",
  );

  if (!existing) {
    sqliteDatabase.runSync(
      `INSERT INTO sms_sync_state (
        scope,
        listener_enabled,
        import_limit,
        last_imported_at,
        last_import_count,
        last_listener_event_at,
        last_error
      ) VALUES ('default', 0, ?, NULL, NULL, NULL, NULL)`,
      [DEFAULT_SMS_IMPORT_LIMIT],
    );
  }
}

let smsCandidateColumnsEnsured = false;
let smsMessageSourceColumnsEnsured = false;
let smsSyncStateColumnsEnsured = false;
let smsSourceTablesEnsured = false;

function ensureSmsSyncStateColumns() {
  if (smsSyncStateColumnsEnsured) {
    return;
  }

  const columns = sqliteDatabase.getAllSync<{ name: string }>(
    "PRAGMA table_info(sms_sync_state)",
  );
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("import_limit")) {
    sqliteDatabase.execSync(
      `ALTER TABLE sms_sync_state
       ADD COLUMN import_limit INTEGER NOT NULL DEFAULT ${DEFAULT_SMS_IMPORT_LIMIT}`,
    );
  }

  smsSyncStateColumnsEnsured = true;
}

function ensureSmsMessageSourceColumns() {
  if (smsMessageSourceColumnsEnsured) {
    return;
  }

  const columns = sqliteDatabase.getAllSync<{ name: string }>(
    "PRAGMA table_info(sms_messages)",
  );
  const columnNames = new Set(columns.map((column) => column.name));

  if (!columnNames.has("source_profile_id")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_messages ADD COLUMN source_profile_id TEXT",
    );
  }

  if (!columnNames.has("source_action")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_messages ADD COLUMN source_action TEXT",
    );
  }

  if (!columnNames.has("match_score")) {
    sqliteDatabase.execSync(
      "ALTER TABLE sms_messages ADD COLUMN match_score INTEGER",
    );
  }

  sqliteDatabase.execSync(`
    CREATE INDEX IF NOT EXISTS sms_messages_source_profile_idx
      ON sms_messages(source_profile_id, received_at DESC);
  `);

  smsMessageSourceColumnsEnsured = true;
}

function ensureSmsSourceTables() {
  if (smsSourceTablesEnsured) {
    return;
  }

  sqliteDatabase.execSync(`
    CREATE TABLE IF NOT EXISTS sms_source_profiles (
      id TEXT PRIMARY KEY NOT NULL,
      label TEXT NOT NULL,
      description TEXT,
      parser_key TEXT NOT NULL,
      action TEXT NOT NULL,
      enabled INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sms_source_profiles_sort_idx
      ON sms_source_profiles(enabled, sort_order);

    CREATE TABLE IF NOT EXISTS sms_source_matchers (
      id TEXT PRIMARY KEY NOT NULL,
      profile_id TEXT NOT NULL,
      field TEXT NOT NULL,
      match_type TEXT NOT NULL,
      pattern TEXT NOT NULL,
      case_sensitive INTEGER NOT NULL,
      enabled INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sms_source_matchers_profile_idx
      ON sms_source_matchers(profile_id, enabled);
  `);

  smsSourceTablesEnsured = true;
}

function ensureSmsCandidateAiColumns() {
  if (smsCandidateColumnsEnsured) {
    return;
  }

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

  sqliteDatabase.execSync(`
    CREATE INDEX IF NOT EXISTS sms_candidates_ai_status_idx
      ON sms_transaction_candidates(classification_status, occurred_at DESC);
  `);

  smsCandidateColumnsEnsured = true;
}

export function ensureDefaultCategories() {
  const existingCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM categories
       WHERE user_id = ?
         AND deleted_at IS NULL`,
      [DEFAULT_USER_ID],
    )?.count ?? 0;

  if (existingCount > 0) {
    return;
  }

  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    for (const category of DEFAULT_FINANCE_CATEGORIES) {
      sqliteDatabase.runSync(
        `INSERT INTO categories (
          id, user_id, label, color, created_at, updated_at, deleted_at, version, server_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, NULL)
        ON CONFLICT(id) DO UPDATE SET
          user_id = excluded.user_id,
          label = excluded.label,
          color = excluded.color,
          deleted_at = NULL,
          updated_at = excluded.updated_at`,
        [
          category.id,
          DEFAULT_USER_ID,
          category.label,
          category.color,
          now,
          now,
        ],
      );
    }
  });
}

export function ensureDefaultSmsSourceProfiles() {
  ensureSmsSourceTables();
  const existingCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM sms_source_profiles`,
    )?.count ?? 0;

  if (existingCount > 0) {
    return;
  }

  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    for (const profile of DEFAULT_SMS_SOURCE_PROFILES) {
      sqliteDatabase.runSync(
        `INSERT INTO sms_source_profiles (
          id, label, description, parser_key, action, enabled, sort_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          profile.id,
          profile.label,
          profile.description,
          profile.parserKey,
          profile.action,
          profile.sortOrder,
          now,
          now,
        ],
      );

      for (const matcher of profile.matchers) {
        sqliteDatabase.runSync(
          `INSERT INTO sms_source_matchers (
            id, profile_id, field, match_type, pattern, case_sensitive, enabled, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            matcher.id,
            profile.id,
            matcher.field,
            matcher.matchType,
            matcher.pattern,
            matcher.caseSensitive ? 1 : 0,
            now,
            now,
          ],
        );
      }
    }
  });
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
         attempt_count = 0,
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
    `SELECT
      c.id,
      c.label,
      c.color,
      CASE
        WHEN c.id IN ('cat-food', 'cat-transport', 'cat-shopping', 'cat-income', 'cat-bills', 'cat-entertainment', 'cat-health', 'cat-personal', 'cat-savings', 'cat-other')
          THEN 1
        ELSE 0
      END AS isDefault,
      (
        SELECT COUNT(*)
        FROM transactions t
        WHERE t.category_id = c.id
          AND t.deleted_at IS NULL
      ) + (
        SELECT COUNT(*)
        FROM budgets b
        WHERE b.category_id = c.id
          AND b.deleted_at IS NULL
      ) + (
        SELECT COUNT(*)
        FROM sms_transaction_candidates sc
        WHERE sc.category_id = c.id
          AND sc.status = 'pending'
      ) AS usageCount
     FROM categories c
     WHERE user_id = ?
       AND deleted_at IS NULL
     ORDER BY label ASC`,
    [DEFAULT_USER_ID],
  );
  return rows.map((row) => ({
    ...row,
    isDefault: Boolean((row as CategoryRecord & { isDefault: number | boolean }).isDefault),
  }));
}

export function listSmsSourceProfiles(): SmsSourceProfileRecord[] {
  ensureSmsSourceTables();
  const profiles = sqliteDatabase.getAllSync<{
    action: SmsSourceAction;
    description: string | null;
    enabled: number;
    id: string;
    label: string;
    matcherCount: number;
    parserKey: SmsSourceParserKey;
    sortOrder: number;
    updatedAt: number;
  }>(
    `SELECT
      p.id,
      p.label,
      p.description,
      p.parser_key AS parserKey,
      p.action AS action,
      p.enabled AS enabled,
      p.sort_order AS sortOrder,
      p.updated_at AS updatedAt,
      (
        SELECT COUNT(*)
        FROM sms_source_matchers m
        WHERE m.profile_id = p.id
          AND m.enabled = 1
      ) AS matcherCount
     FROM sms_source_profiles p
     ORDER BY p.enabled DESC, p.sort_order ASC, p.label ASC`,
  );

  const matchers = sqliteDatabase.getAllSync<{
    caseSensitive: number;
    createdAt: number;
    enabled: number;
    field: SmsSourceMatchField;
    id: string;
    matchType: SmsSourceMatchType;
    pattern: string;
    profileId: string;
    updatedAt: number;
  }>(
    `SELECT
      id,
      profile_id AS profileId,
      field,
      match_type AS matchType,
      pattern,
      case_sensitive AS caseSensitive,
      enabled,
      created_at AS createdAt,
      updated_at AS updatedAt
     FROM sms_source_matchers
     ORDER BY created_at ASC`,
  );

  const matchersByProfile = new Map<string, SmsSourceMatcherRecord[]>();
  for (const matcher of matchers) {
    const current = matchersByProfile.get(matcher.profileId) ?? [];
    current.push({
      ...matcher,
      caseSensitive: Boolean(matcher.caseSensitive),
      enabled: Boolean(matcher.enabled),
    });
    matchersByProfile.set(matcher.profileId, current);
  }

  return profiles.map((profile) => ({
    ...profile,
    enabled: Boolean(profile.enabled),
    matchers: matchersByProfile.get(profile.id) ?? [],
  }));
}

export function getSmsSourceProfileGroups(): SmsSourceProfileGroup {
  const profiles = listSmsSourceProfiles();
  return {
    disabled: profiles.filter((profile) => !profile.enabled),
    exclusions: profiles.filter(
      (profile) => profile.enabled && profile.action === "exclude",
    ),
    processing: profiles.filter(
      (profile) => profile.enabled && profile.action === "process",
    ),
  };
}

export function listIgnoredSmsMessages(limit = 100): IgnoredSmsMessageRecord[] {
  ensureSmsMessageSourceColumns();
  ensureSmsSourceTables();
  return sqliteDatabase.getAllSync<IgnoredSmsMessageRecord>(
    `SELECT
      m.id,
      m.sender,
      m.body,
      m.received_at AS receivedAt,
      m.parser_key AS parserKey,
      m.parse_status AS parseStatus,
      m.source_profile_id AS sourceProfileId,
      m.source_action AS sourceAction,
      m.match_score AS matchScore,
      p.label AS sourceProfileLabel
     FROM sms_messages m
     LEFT JOIN sms_source_profiles p
       ON p.id = m.source_profile_id
     WHERE m.parse_status = 'ignored'
     ORDER BY m.received_at DESC
     LIMIT ?`,
    [Math.max(limit, 1)],
  );
}

export function createSmsSourceProfile(input: {
  action: SmsSourceAction;
  description?: string | null;
  enabled: boolean;
  label: string;
  matchers: Array<{
    caseSensitive: boolean;
    enabled: boolean;
    field: SmsSourceMatchField;
    matchType: SmsSourceMatchType;
    pattern: string;
  }>;
  parserKey: SmsSourceParserKey;
}): string {
  ensureSmsSourceTables();
  const now = Date.now();
  const id = createId("sms-source");
  const nextSortOrder =
    (sqliteDatabase.getFirstSync<{ value: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) + 100 AS value
       FROM sms_source_profiles`,
    )?.value ?? 100);

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `INSERT INTO sms_source_profiles (
        id, label, description, parser_key, action, enabled, sort_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.label.trim(),
        input.description?.trim() || null,
        input.parserKey,
        input.action,
        input.enabled ? 1 : 0,
        nextSortOrder,
        now,
        now,
      ],
    );

    for (const matcher of input.matchers) {
      sqliteDatabase.runSync(
        `INSERT INTO sms_source_matchers (
          id, profile_id, field, match_type, pattern, case_sensitive, enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          createId("sms-source-matcher"),
          id,
          matcher.field,
          matcher.matchType,
          matcher.pattern.trim(),
          matcher.caseSensitive ? 1 : 0,
          matcher.enabled ? 1 : 0,
          now,
          now,
        ],
      );
    }
  });

  return id;
}

export function updateSmsSourceProfile(input: {
  action: SmsSourceAction;
  description?: string | null;
  enabled: boolean;
  id: string;
  label: string;
  matchers: Array<{
    caseSensitive: boolean;
    enabled: boolean;
    field: SmsSourceMatchField;
    id?: string;
    matchType: SmsSourceMatchType;
    pattern: string;
  }>;
  parserKey: SmsSourceParserKey;
  sortOrder: number;
}) {
  ensureSmsSourceTables();
  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `UPDATE sms_source_profiles
       SET label = ?,
           description = ?,
           parser_key = ?,
           action = ?,
           enabled = ?,
           sort_order = ?,
           updated_at = ?
       WHERE id = ?`,
      [
        input.label.trim(),
        input.description?.trim() || null,
        input.parserKey,
        input.action,
        input.enabled ? 1 : 0,
        input.sortOrder,
        now,
        input.id,
      ],
    );

    sqliteDatabase.runSync(
      `DELETE FROM sms_source_matchers
       WHERE profile_id = ?`,
      [input.id],
    );

    for (const matcher of input.matchers) {
      sqliteDatabase.runSync(
        `INSERT INTO sms_source_matchers (
          id, profile_id, field, match_type, pattern, case_sensitive, enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          matcher.id ?? createId("sms-source-matcher"),
          input.id,
          matcher.field,
          matcher.matchType,
          matcher.pattern.trim(),
          matcher.caseSensitive ? 1 : 0,
          matcher.enabled ? 1 : 0,
          now,
          now,
        ],
      );
    }
  });
}

export function deleteSmsSourceProfile(id: string) {
  ensureSmsSourceTables();
  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `DELETE FROM sms_source_matchers
       WHERE profile_id = ?`,
      [id],
    );
    sqliteDatabase.runSync(
      `DELETE FROM sms_source_profiles
       WHERE id = ?`,
      [id],
    );
  });
}

export function duplicateSmsSourceProfile(id: string): string {
  const profile = listSmsSourceProfiles().find((item) => item.id === id);
  if (!profile) {
    throw new Error("SMS source profile not found.");
  }

  return createSmsSourceProfile({
    action: profile.action,
    description: profile.description,
    enabled: false,
    label: `${profile.label} Copy`,
    matchers: profile.matchers.map((matcher) => ({
      caseSensitive: matcher.caseSensitive,
      enabled: matcher.enabled,
      field: matcher.field,
      matchType: matcher.matchType,
      pattern: matcher.pattern,
    })),
    parserKey: profile.parserKey,
  });
}

export function reorderSmsSourceProfiles(profileIds: string[]) {
  ensureSmsSourceTables();
  const ids = profileIds.filter(Boolean);
  if (ids.length === 0) {
    return;
  }

  const now = Date.now();
  sqliteDatabase.withTransactionSync(() => {
    ids.forEach((id, index) => {
      sqliteDatabase.runSync(
        `UPDATE sms_source_profiles
         SET sort_order = ?,
             updated_at = ?
         WHERE id = ?`,
        [(index + 1) * 100, now, id],
      );
    });
  });
}

export function listPendingSmsCandidatesPage(input: {
  limit: number;
  offset: number;
}): SmsCandidatePage {
  ensureSmsCandidateAiColumns();
  const totalCount =
    sqliteDatabase.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM sms_transaction_candidates
       WHERE status = 'pending'`,
    )?.count ?? 0;

  const items = sqliteDatabase.getAllSync<SmsTransactionCandidateRecord>(
    `SELECT
      c.id AS id,
      c.amount_minor AS amountMinor,
      c.ai_job_id AS aiJobId,
      c.category_id AS categoryId,
      COALESCE(cat.label, 'Other') AS categoryLabel,
      c.category_proposal_id AS categoryProposalId,
      c.classification_confidence AS classificationConfidence,
      c.classification_reason AS classificationReason,
      c.classification_source AS classificationSource,
      c.classification_status AS classificationStatus,
      c.confidence AS confidence,
      c.created_at AS createdAt,
      c.currency AS currency,
      c.direction AS direction,
      c.merchant_key AS merchantKey,
      c.merchant AS merchant,
      c.notes AS notes,
      c.occurred_at AS occurredAt,
      c.parser_key AS parserKey,
      c.reference AS reference,
      m.body AS smsBody,
      c.sms_message_id AS smsMessageId,
      m.received_at AS smsReceivedAt,
      m.sender AS smsSender,
      c.suggested_category_label AS suggestedCategoryLabel,
      c.status AS status,
      c.transaction_id AS transactionId,
      c.updated_at AS updatedAt
     FROM sms_transaction_candidates c
     INNER JOIN sms_messages m
       ON m.id = c.sms_message_id
     LEFT JOIN categories cat
       ON cat.id = c.category_id
     WHERE c.status = 'pending'
     ORDER BY c.occurred_at DESC, c.created_at DESC
     LIMIT ?
     OFFSET ?`,
    [Math.max(input.limit, 1), Math.max(input.offset, 0)],
  );

  return {
    hasMore: input.offset + items.length < totalCount,
    items,
    nextOffset: input.offset + items.length,
    totalCount,
  };
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
    id: row.categoryId ?? "uncategorized",
    label: row.categoryLabel,
    value: formatMoney(row.amountMinor, "KES"),
  }));
}

export function getInsightAllocations(): InsightAllocationRecord[] {
  const currentMonth = monthKeyFromTimestamp(Date.now());
  const rows = sqliteDatabase.getAllSync<{
    amountMinor: number;
    categoryColor: string;
    categoryLabel: string;
  }>(
    `SELECT
      cs.amount_minor AS amountMinor,
      COALESCE(c.color, '#4b5563') AS categoryColor,
      COALESCE(c.label, 'Other') AS categoryLabel
     FROM category_summary cs
     LEFT JOIN categories c ON c.id = cs.category_id
     WHERE cs.month_key = ?
     ORDER BY cs.amount_minor DESC`,
    [currentMonth],
  );

  const total = rows.reduce((sum, row) => sum + row.amountMinor, 0);

  return rows.map((row) => ({
    amountLabel: formatMoney(row.amountMinor, "KES"),
    color: row.categoryColor,
    label: row.categoryLabel,
    percentage: total > 0 ? Math.round((row.amountMinor / total) * 100) : 0,
  }));
}

export function getTrajectory(): TrajectoryRecord | null {
  const now = new Date();
  const currentMonth = monthKeyFromTimestamp(now.getTime());
  const monthRows = sqliteDatabase.getAllSync<{ day: number; amountMinor: number }>(
    `SELECT
      CAST(strftime('%d', transaction_at / 1000, 'unixepoch') AS INTEGER) AS day,
      amount_minor AS amountMinor
     FROM transactions
     WHERE deleted_at IS NULL
       AND user_id = ?
       AND direction = 'expense'
       AND strftime('%Y-%m', transaction_at / 1000, 'unixepoch') = ?
     ORDER BY transaction_at ASC`,
    [DEFAULT_USER_ID, currentMonth],
  );

  const currentTotals = getCurrentMonthTotals();
  const totalMinor = currentTotals?.expenseMinor ?? 0;

  if (monthRows.length === 0 && totalMinor === 0) {
    return null;
  }

  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const weekCount = Math.max(Math.ceil(lastDay / 7), 1);
  const weeklyTotals = Array.from({ length: weekCount }, () => 0);

  for (const row of monthRows) {
    const weekIndex = Math.min(Math.floor((row.day - 1) / 7), weekCount - 1);
    weeklyTotals[weekIndex] += row.amountMinor;
  }

  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = monthKeyFromTimestamp(previousMonthDate.getTime());
  const previousExpenseMinor =
    sqliteDatabase.getFirstSync<{ expenseMinor: number }>(
      `SELECT expense_minor AS expenseMinor
       FROM monthly_totals
       WHERE month_key = ?`,
      [previousMonthKey],
    )?.expenseMinor ?? 0;

  const changePercentage =
    previousExpenseMinor > 0
      ? Number((((totalMinor - previousExpenseMinor) / previousExpenseMinor) * 100).toFixed(1))
      : null;
  const trend =
    changePercentage == null
      ? "flat"
      : changePercentage > 0
        ? "up"
        : changePercentage < 0
          ? "down"
          : "flat";

  const monthLabel = now.toLocaleString("en-KE", {
    month: "long",
    year: "numeric",
  });

  const points: TrajectoryPointRecord[] = weeklyTotals.map((valueMinor, index) => ({
    label: `W${index + 1}`,
    valueMinor,
  }));

  return {
    changePercentage,
    monthLabel,
    points,
    totalMinor,
    trend,
  };
}

export function getSpendingAlert(): SpendingAlertRecord | null {
  const budgets = listBudgets();
  const currentMonthTotals = getCurrentMonthTotals();

  if (budgets.length === 0 && !currentMonthTotals) {
    return null;
  }

  const worstBudget = budgets
    .map((budget) => ({
      categoryLabel: budget.categoryLabel,
      overByMinor: budget.spentMinor - budget.amountMinor,
    }))
    .filter((budget) => budget.overByMinor > 0)
    .sort((left, right) => right.overByMinor - left.overByMinor)[0];

  const today = Math.max(new Date().getDate(), 1);
  const burnRateMinor = currentMonthTotals
    ? Math.round(currentMonthTotals.expenseMinor / today)
    : 0;

  if (worstBudget) {
    return {
      alertAmountMinor: worstBudget.overByMinor,
      alertDescription: `${worstBudget.categoryLabel} is above budget this month.`,
      alertTitle: `You overspent on ${worstBudget.categoryLabel}`,
      burnRateMinor,
      status: "over_budget",
    };
  }

  return {
    alertAmountMinor: null,
    alertDescription: "No categories are above budget this month.",
    alertTitle: "Spending is on track",
    burnRateMinor,
    status: "on_track",
  };
}

export function getInsightSubscriptions(): InsightSubscriptionRecord[] {
  const rows = sqliteDatabase.getAllSync<{
    amountMinor: number;
    count: number;
    lastTransactionAt: number;
    merchant: string;
    categoryColor: string;
  }>(
    `SELECT
      t.merchant AS merchant,
      ROUND(AVG(t.amount_minor)) AS amountMinor,
      COUNT(*) AS count,
      MAX(t.transaction_at) AS lastTransactionAt,
      COALESCE(c.color, '#4b5563') AS categoryColor
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.deleted_at IS NULL
       AND t.user_id = ?
       AND t.direction = 'expense'
       AND t.transaction_at >= ?
     GROUP BY LOWER(t.merchant), COALESCE(c.color, '#4b5563')
     HAVING COUNT(*) >= 2
     ORDER BY MAX(t.transaction_at) DESC, COUNT(*) DESC
     LIMIT 5`,
    [DEFAULT_USER_ID, Date.now() - 180 * 24 * 60 * 60 * 1000],
  );

  return rows.map((row, index) => ({
    accent: row.categoryColor,
    amount: formatMoney(row.amountMinor, "KES"),
    id: `${row.merchant}-${index}`,
    meta: `${row.count} payments in the last 180 days`,
    title: row.merchant,
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

export function createCategory(input: {
  color: string;
  id?: string;
  label: string;
}) {
  const normalizedLabel = normalizeCategoryLabel(input.label);
  ensureUniqueCategoryLabel(normalizedLabel);
  const id = input.id ?? createId("cat");
  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `INSERT INTO categories (
        id, user_id, label, color, created_at, updated_at, deleted_at, version, server_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, NULL)`,
      [id, DEFAULT_USER_ID, normalizedLabel, input.color, now, now],
    );

    writeSyncMetadata({
      entityId: id,
      entityType: "category",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: 0,
      entityId: id,
      entityType: "category",
      operation: "upsert",
      payload: serializeCategoryForSync(id),
    });
  });

  return id;
}

export function updateCategory(input: {
  color: string;
  id: string;
  label: string;
}) {
  const current = sqliteDatabase.getFirstSync<{
    color: string;
    id: string;
    label: string;
    version: number;
  }>(
    `SELECT id, label, color, version
     FROM categories
     WHERE id = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [input.id],
  );

  if (!current) {
    throw new Error("Category not found.");
  }

  const normalizedLabel = normalizeCategoryLabel(input.label);
  ensureUniqueCategoryLabel(normalizedLabel, input.id);
  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `UPDATE categories
       SET label = ?,
           color = ?,
           updated_at = ?,
           version = version + 1
       WHERE id = ?`,
      [normalizedLabel, input.color, now, input.id],
    );

    writeSyncMetadata({
      entityId: input.id,
      entityType: "category",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: current.version,
      entityId: input.id,
      entityType: "category",
      operation: "upsert",
      payload: serializeCategoryForSync(input.id),
    });
  });
}

export function deleteCategory(id: string) {
  const category = sqliteDatabase.getFirstSync<{
    id: string;
    label: string;
    version: number;
  }>(
    `SELECT id, label, version
     FROM categories
     WHERE id = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [id],
  );

  if (!category) {
    throw new Error("Category not found.");
  }

  if (DEFAULT_FINANCE_CATEGORIES.some((entry) => entry.id === id)) {
    throw new Error("Default categories can be edited, but not deleted.");
  }

  const usage = sqliteDatabase.getFirstSync<{ count: number }>(
    `SELECT
      (
        SELECT COUNT(*)
        FROM transactions
        WHERE category_id = ?
          AND deleted_at IS NULL
      ) + (
        SELECT COUNT(*)
        FROM budgets
        WHERE category_id = ?
          AND deleted_at IS NULL
      ) + (
        SELECT COUNT(*)
        FROM sms_transaction_candidates
        WHERE category_id = ?
          AND status = 'pending'
      ) AS count`,
    [id, id, id],
  )?.count ?? 0;

  if (usage > 0) {
    throw new Error("This category is still in use. Reassign related records before deleting it.");
  }

  const now = Date.now();
  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `UPDATE categories
       SET deleted_at = ?,
           updated_at = ?,
           version = version + 1
       WHERE id = ?`,
      [now, now, id],
    );

    writeSyncMetadata({
      entityId: id,
      entityType: "category",
      syncStatus: "pending",
      updatedAt: now,
    });

    queueOutboxChange({
      baseVersion: category.version,
      entityId: id,
      entityType: "category",
      operation: "delete",
      payload: {
        deletedAt: now,
        id,
        label: category.label,
        userId: DEFAULT_USER_ID,
      },
    });
  });
}

export function approvePendingCategoryProposal(id: string) {
  const proposal = sqliteDatabase.getFirstSync<{
    linkedCandidateId: string | null;
    normalizedName: string;
    proposedName: string;
  }>(
    `SELECT
      linked_candidate_id AS linkedCandidateId,
      normalized_name AS normalizedName,
      proposed_name AS proposedName
     FROM category_proposals
     WHERE id = ?
       AND status = 'pending'
     LIMIT 1`,
    [id],
  );

  if (!proposal) {
    throw new Error("Category proposal not found.");
  }

  const existingCategory = sqliteDatabase.getFirstSync<{ id: string }>(
    `SELECT id
     FROM categories
     WHERE user_id = ?
       AND deleted_at IS NULL
       AND LOWER(TRIM(label)) = ?
     LIMIT 1`,
    [DEFAULT_USER_ID, proposal.normalizedName],
  );

  const categoryId = existingCategory?.id ?? createCategory({
    color: "#6366f1",
    label: proposal.proposedName,
  });
  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `UPDATE category_proposals
       SET status = 'approved',
           updated_at = ?
       WHERE id = ?`,
      [now, id],
    );

    if (proposal.linkedCandidateId) {
      sqliteDatabase.runSync(
        `UPDATE sms_transaction_candidates
         SET category_id = ?,
             category_proposal_id = NULL,
             classification_source = 'user',
             classification_status = 'classified',
             updated_at = ?
         WHERE id = ?`,
        [categoryId, now, proposal.linkedCandidateId],
      );
    }
  });

  return categoryId;
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

export function serializeCategoryForSync(id: string) {
  const category = sqliteDatabase.getFirstSync<Record<string, unknown>>(
    `SELECT
      id,
      user_id AS userId,
      label,
      color,
      created_at AS createdAt,
      updated_at AS updatedAt,
      deleted_at AS deletedAt,
      version,
      server_updated_at AS serverUpdatedAt
     FROM categories
     WHERE id = ?`,
    [id],
  );

  if (!category) {
    throw new Error("Category not found for sync serialization.");
  }

  return category;
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

  const metadataCounts =
    sqliteDatabase.getFirstSync<{
      failedEntityCount: number;
      syncedEntityCount: number;
      syncingEntityCount: number;
      trackedEntityCount: number;
      unsyncedEntityCount: number;
    }>(
      `SELECT
        COUNT(*) AS trackedEntityCount,
        COALESCE(SUM(CASE WHEN sync_status = 'synced' THEN 1 ELSE 0 END), 0) AS syncedEntityCount,
        COALESCE(SUM(CASE WHEN sync_status = 'syncing' THEN 1 ELSE 0 END), 0) AS syncingEntityCount,
        COALESCE(SUM(CASE WHEN sync_status IN ('pending', 'failed', 'conflict') THEN 1 ELSE 0 END), 0) AS unsyncedEntityCount,
        COALESCE(SUM(CASE WHEN sync_status = 'failed' THEN 1 ELSE 0 END), 0) AS failedEntityCount
       FROM sync_metadata`,
    ) ?? {
      failedEntityCount: 0,
      syncedEntityCount: 0,
      syncingEntityCount: 0,
      trackedEntityCount: 0,
      unsyncedEntityCount: 0,
    };

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
    failedEntityCount: metadataCounts.failedEntityCount,
    hasRemote: args.hasRemote,
    isOnline: args.isOnline,
    lastAttemptedAt: state?.lastAttemptedSyncAt ?? null,
    lastSuccessfulSyncAt: state?.lastSuccessfulSyncAt ?? null,
    openConflictCount: conflicts,
    pendingOutboxCount: outboxPending,
    syncedEntityCount: metadataCounts.syncedEntityCount,
    syncingEntityCount: metadataCounts.syncingEntityCount,
    status: args.status,
    trackedEntityCount: metadataCounts.trackedEntityCount,
    unsyncedEntityCount: metadataCounts.unsyncedEntityCount,
  };
}

export function getSmsReviewSnapshot(permissionState: SmsPermissionState): SmsReviewSnapshot {
  ensureSmsSyncStateRow();
  const state = sqliteDatabase.getFirstSync<{
    importLimit: number | null;
    isListenerEnabled: number;
    lastError: string | null;
    lastImportedAt: number | null;
    lastImportCount: number | null;
    lastListenerEventAt: number | null;
  }>(
    `SELECT
      import_limit AS importLimit,
      listener_enabled AS isListenerEnabled,
      last_error AS lastError,
      last_imported_at AS lastImportedAt,
      last_import_count AS lastImportCount,
      last_listener_event_at AS lastListenerEventAt
     FROM sms_sync_state
     WHERE scope = 'default'`,
  );
  ensureSmsCandidateAiColumns();
  const counts = sqliteDatabase.getFirstSync<{
    candidateCount: number;
    failedCandidateCount: number;
    processingCandidateCount: number;
    queuedCandidateCount: number;
    readyCandidateCount: number;
  }>(
    `SELECT
      COUNT(*) AS candidateCount,
      COALESCE(SUM(CASE WHEN classification_status = 'failed' THEN 1 ELSE 0 END), 0) AS failedCandidateCount,
      COALESCE(SUM(CASE WHEN classification_status = 'processing' THEN 1 ELSE 0 END), 0) AS processingCandidateCount,
      COALESCE(SUM(CASE WHEN classification_status = 'queued' THEN 1 ELSE 0 END), 0) AS queuedCandidateCount,
      COALESCE(SUM(CASE WHEN classification_status IN ('classified', 'not_needed') THEN 1 ELSE 0 END), 0) AS readyCandidateCount
     FROM sms_transaction_candidates
     WHERE status = 'pending'`,
  ) ?? {
    candidateCount: 0,
    failedCandidateCount: 0,
    processingCandidateCount: 0,
    queuedCandidateCount: 0,
    readyCandidateCount: 0,
  };

  return {
    candidateCount: counts.candidateCount,
    failedCandidateCount: counts.failedCandidateCount,
    importLimit: state?.importLimit ?? DEFAULT_SMS_IMPORT_LIMIT,
    isListenerEnabled: Boolean(state?.isListenerEnabled),
    processingCandidateCount: counts.processingCandidateCount,
    queuedCandidateCount: counts.queuedCandidateCount,
    readyCandidateCount: counts.readyCandidateCount,
    lastError: state?.lastError ?? null,
    lastImportedAt: state?.lastImportedAt ?? null,
    lastImportCount: state?.lastImportCount ?? 0,
    lastListenerEventAt: state?.lastListenerEventAt ?? null,
    permissionState,
    supported: true,
  };
}

export function getFinanceSnapshot(args: {
  aiConfigured: boolean;
  aiSupportsStreaming: boolean;
  hasRemote: boolean;
  isOnline: boolean;
  smsPermissionState: SmsPermissionState;
  searchText?: string;
  status: SyncSnapshot["status"];
}): FinanceSnapshot {
  const transactions = listTransactions(args.searchText);

  return {
    ai: getAiSnapshot({
      isConfigured: args.aiConfigured,
      supportsStreaming: args.aiSupportsStreaming,
    }),
    attachments: listAttachments(),
    budgetAllocations: getBudgetAllocations(),
    budgetOverview: getBudgetOverview(),
    budgets: listBudgets(),
    breakdown: getBreakdown(),
    categories: listCategories(),
    currentMonthTotals: getCurrentMonthTotals(),
    dashboardTransactions: getDashboardTransactions(),
    imports: listImports(),
    insightAllocations: getInsightAllocations(),
    insightSubscriptions: getInsightSubscriptions(),
    sms: getSmsReviewSnapshot(args.smsPermissionState),
    spendingAlert: getSpendingAlert(),
    sync: getSyncSnapshot(args),
    trajectory: getTrajectory(),
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

export function upsertSmsMessage(input: {
  body: string;
  fingerprint: string;
  id: string;
  matchScore?: number | null;
  metadata?: Record<string, unknown>;
  parseStatus: "matched" | "ignored" | "failed";
  parserKey?: string | null;
  readAt?: number | null;
  receivedAt: number;
  sender: string;
  sourceAction?: SmsSourceAction | null;
  sourceProfileId?: string | null;
}) {
  ensureSmsMessageSourceColumns();
  const now = Date.now();
  sqliteDatabase.runSync(
    `INSERT INTO sms_messages (
      id, sender, body, received_at, read_at, fingerprint, source_profile_id, source_action, match_score, parser_key, parse_status, metadata_json, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      sender = excluded.sender,
      body = excluded.body,
      received_at = excluded.received_at,
      read_at = excluded.read_at,
      fingerprint = excluded.fingerprint,
      source_profile_id = excluded.source_profile_id,
      source_action = excluded.source_action,
      match_score = excluded.match_score,
      parser_key = excluded.parser_key,
      parse_status = excluded.parse_status,
      metadata_json = excluded.metadata_json,
      updated_at = excluded.updated_at`,
    [
      input.id,
      input.sender,
      input.body,
      input.receivedAt,
      input.readAt ?? null,
      input.fingerprint,
      input.sourceProfileId ?? null,
      input.sourceAction ?? null,
      input.matchScore ?? null,
      input.parserKey ?? null,
      input.parseStatus,
      input.metadata ? JSON.stringify(input.metadata) : null,
      now,
      now,
    ],
  );
}

export function getSmsMessageById(id: string) {
  ensureSmsMessageSourceColumns();
  return (
    sqliteDatabase.getFirstSync<SmsMessageRecord>(
      `SELECT
        id,
        sender,
        body,
        received_at AS receivedAt,
        read_at AS readAt,
        fingerprint,
        source_profile_id AS sourceProfileId,
        source_action AS sourceAction,
        match_score AS matchScore,
        parser_key AS parserKey,
        parse_status AS parseStatus,
        created_at AS createdAt,
        updated_at AS updatedAt
       FROM sms_messages
       WHERE id = ?
       LIMIT 1`,
      [id],
    ) ?? null
  );
}

export function getActiveSmsSourceProfilesForMatching() {
  return listSmsSourceProfiles().filter((profile) => profile.enabled);
}

export function upsertSmsCandidate(input: {
  amountMinor: number;
  categoryId: string | null;
  confidence: number;
  currency: string;
  direction: "expense" | "income";
  merchantKey?: string | null;
  merchant: string;
  notes?: string;
  occurredAt: number;
  parserKey: string;
  reference?: string;
  smsMessageId: string;
}) {
  ensureSmsCandidateAiColumns();
  const existing = sqliteDatabase.getFirstSync<{ id: string; status: string }>(
    `SELECT id, status
     FROM sms_transaction_candidates
     WHERE sms_message_id = ?
     LIMIT 1`,
    [input.smsMessageId],
  );
  const now = Date.now();
  const id = existing?.id ?? createId("sms-candidate");

  sqliteDatabase.runSync(
    `INSERT INTO sms_transaction_candidates (
      id, sms_message_id, amount_minor, currency, direction, merchant, reference,
      occurred_at, category_id, confidence, notes, status, transaction_id, parser_key,
      classification_status, classification_source, classification_confidence, classification_reason,
      merchant_key, ai_job_id, category_proposal_id, suggested_category_label, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      amount_minor = excluded.amount_minor,
      currency = excluded.currency,
      direction = excluded.direction,
      merchant = excluded.merchant,
      reference = excluded.reference,
      occurred_at = excluded.occurred_at,
      category_id = excluded.category_id,
      confidence = excluded.confidence,
      notes = excluded.notes,
      parser_key = excluded.parser_key,
      classification_status = excluded.classification_status,
      classification_source = excluded.classification_source,
      classification_confidence = excluded.classification_confidence,
      classification_reason = excluded.classification_reason,
      merchant_key = excluded.merchant_key,
      updated_at = excluded.updated_at`,
    [
      id,
      input.smsMessageId,
      input.amountMinor,
      input.currency,
      input.direction,
      input.merchant,
      input.reference ?? null,
      input.occurredAt,
      input.categoryId,
      input.confidence,
      input.notes ?? null,
      existing?.status === "dismissed" ? "dismissed" : "pending",
      null,
      input.parserKey,
      input.categoryId && input.confidence >= 85 ? "not_needed" : "not_needed",
      "rule",
      input.confidence,
      null,
      input.merchantKey ?? null,
      null,
      null,
      null,
      now,
      now,
    ],
  );

  return {
    categoryId: input.categoryId,
    confidence: input.confidence,
    id,
    status: existing?.status === "dismissed" ? "dismissed" : "pending",
  };
}

export function listSmsMessagesForAiParse(messageIds?: string[]) {
  ensureSmsMessageSourceColumns();
  const ids = messageIds?.filter(Boolean) ?? [];
  if (ids.length === 0) {
    return [] as Array<{
      body: string;
      id: string;
      receivedAt: number;
      sender: string;
    }>;
  }

  const placeholders = ids.map(() => "?").join(", ");
  return sqliteDatabase.getAllSync<{
    body: string;
    id: string;
    receivedAt: number;
    sender: string;
  }>(
    `SELECT
      id,
      sender,
      body,
      received_at AS receivedAt
     FROM sms_messages
     WHERE id IN (${placeholders})`,
    ids,
  );
}

export function clearSmsCandidateForMessage(messageId: string) {
  ensureSmsCandidateAiColumns();
  sqliteDatabase.runSync(
    `DELETE FROM sms_transaction_candidates
     WHERE sms_message_id = ?
       AND status = 'pending'`,
    [messageId],
  );
}

export function listSmsCandidatesForClassification(candidateIds?: string[]) {
  ensureSmsCandidateAiColumns();
  const ids = candidateIds?.filter(Boolean) ?? [];
  if (ids.length === 0) {
    return [] as Array<{
      amountMinor: number;
      categoryId: string | null;
      classificationStatus: "not_needed" | "queued" | "processing" | "classified" | "failed";
      confidence: number;
      currency: string;
      direction: "expense" | "income";
      id: string;
      merchant: string;
      merchantKey: string | null;
      notes: string | null;
      occurredAt: number;
      reference: string | null;
      suggestedCategoryLabel: string | null;
    }>;
  }

  const placeholders = ids.map(() => "?").join(", ");
  return sqliteDatabase.getAllSync<{
    amountMinor: number;
    categoryId: string | null;
    classificationStatus: "not_needed" | "queued" | "processing" | "classified" | "failed";
    confidence: number;
    currency: string;
    direction: "expense" | "income";
    id: string;
    merchant: string;
    merchantKey: string | null;
    notes: string | null;
    occurredAt: number;
    reference: string | null;
    suggestedCategoryLabel: string | null;
  }>(
    `SELECT
      id,
      amount_minor AS amountMinor,
      confidence,
      currency,
      direction,
      merchant,
      merchant_key AS merchantKey,
      notes,
      occurred_at AS occurredAt,
      reference,
      category_id AS categoryId,
      classification_status AS classificationStatus,
      suggested_category_label AS suggestedCategoryLabel
     FROM sms_transaction_candidates
     WHERE id IN (${placeholders})`,
    ids,
  );
}

export function listSmsCandidateIdsNeedingAi() {
  ensureSmsCandidateAiColumns();
  return sqliteDatabase.getAllSync<{ id: string }>(
    `SELECT id
     FROM sms_transaction_candidates
     WHERE status = 'pending'
       AND (
         classification_status IN ('queued', 'failed')
         OR (
           classification_source != 'user'
           AND classification_status IN ('not_needed', 'classified')
         )
       )`,
  ).map((row) => row.id);
}

export function listSmsCandidateIdsForMessageIds(messageIds: string[]) {
  ensureSmsCandidateAiColumns();
  const ids = messageIds.filter(Boolean);
  if (ids.length === 0) {
    return [] as string[];
  }

  const placeholders = ids.map(() => "?").join(", ");
  return sqliteDatabase.getAllSync<{ id: string }>(
    `SELECT id
     FROM sms_transaction_candidates
     WHERE sms_message_id IN (${placeholders})`,
    ids,
  ).map((row) => row.id);
}

export function listSmsMessageIdsForCandidateIds(candidateIds: string[]) {
  ensureSmsCandidateAiColumns();
  const ids = candidateIds.filter(Boolean);
  if (ids.length === 0) {
    return [] as string[];
  }

  const placeholders = ids.map(() => "?").join(", ");
  return sqliteDatabase.getAllSync<{ smsMessageId: string }>(
    `SELECT sms_message_id AS smsMessageId
     FROM sms_transaction_candidates
     WHERE id IN (${placeholders})`,
    ids,
  ).map((row) => row.smsMessageId);
}

export function listSmsMessageIdsNeedingAiParse() {
  ensureSmsMessageSourceColumns();
  return sqliteDatabase.getAllSync<{ id: string }>(
    `SELECT m.id
     FROM sms_messages m
     LEFT JOIN sms_transaction_candidates c
       ON c.sms_message_id = m.id
     WHERE c.id IS NULL
       AND m.source_action = 'process'
       AND m.parse_status = 'failed'
     ORDER BY m.received_at DESC`,
  ).map((row) => row.id);
}

export function markSmsCandidateAiQueued(input: {
  candidateIds: string[];
  classificationStatus?: "queued" | "processing" | "failed" | "classified";
  jobId: string;
}) {
  ensureSmsCandidateAiColumns();
  if (input.candidateIds.length === 0) {
    return;
  }

  const placeholders = input.candidateIds.map(() => "?").join(", ");
  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET ai_job_id = ?,
         classification_status = ?,
         updated_at = ?
     WHERE id IN (${placeholders})`,
    [input.jobId, input.classificationStatus ?? "queued", Date.now(), ...input.candidateIds],
  );
}

export function applyMerchantMemorySuggestion(input: {
  candidateId: string;
  categoryId: string;
  confidence: number;
  merchantKey: string | null;
}) {
  ensureSmsCandidateAiColumns();
  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET category_id = ?,
         merchant_key = COALESCE(?, merchant_key),
         classification_source = 'merchant_memory',
         classification_status = 'classified',
         classification_confidence = ?,
         classification_reason = 'Matched from local merchant memory.',
         updated_at = ?
     WHERE id = ?`,
    [input.categoryId, input.merchantKey, input.confidence, Date.now(), input.candidateId],
  );
}

export function applyAiClassificationResult(input: {
  candidateId: string;
  categoryId: string | null;
  categoryProposalId: string | null;
  confidence: number | null;
  merchantKey: string | null;
  reason: string | null;
  suggestedCategoryLabel: string | null;
}) {
  ensureSmsCandidateAiColumns();
  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET category_id = ?,
         category_proposal_id = ?,
         merchant_key = COALESCE(?, merchant_key),
         classification_source = 'ai',
         classification_status = 'classified',
         classification_confidence = ?,
         classification_reason = ?,
         suggested_category_label = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      input.categoryId,
      input.categoryProposalId,
      input.merchantKey,
      input.confidence,
      input.reason,
      input.suggestedCategoryLabel,
      Date.now(),
      input.candidateId,
    ],
  );
}

export function markSmsCandidateAiFailed(input: {
  candidateId: string;
  error: string;
  jobId: string;
}) {
  ensureSmsCandidateAiColumns();
  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET ai_job_id = ?,
         classification_status = 'failed',
         classification_reason = ?,
         updated_at = ?
     WHERE id = ?`,
    [input.jobId, input.error, Date.now(), input.candidateId],
  );
}

export function updateSmsCandidateCategory(input: {
  categoryId: string | null;
  candidateId: string;
}) {
  ensureSmsCandidateAiColumns();
  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET category_id = ?,
         category_proposal_id = CASE WHEN ? IS NULL THEN category_proposal_id ELSE NULL END,
         classification_source = 'user',
         classification_status = CASE
           WHEN ? IS NULL THEN classification_status
           ELSE 'classified'
         END,
         updated_at = ?
     WHERE id = ?`,
    [input.categoryId, input.categoryId, input.categoryId, Date.now(), input.candidateId],
  );
}

export function applyAiParsedSmsResult(input: {
  amountMinor: number;
  cleanDescription: string;
  confidence: number;
  currency: string;
  direction: "expense" | "income";
  merchant: string;
  messageId: string;
  notes?: string;
  occurredAt: number;
  parserKey: string;
  reference?: string | null;
}) {
  sqliteDatabase.runSync(
    `UPDATE sms_messages
     SET parse_status = 'matched',
         parser_key = ?,
         metadata_json = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      input.parserKey,
      JSON.stringify({
        amountMinor: input.amountMinor,
        cleanDescription: input.cleanDescription,
        confidence: input.confidence,
        currency: input.currency,
        direction: input.direction,
        merchant: input.merchant,
        reference: input.reference ?? null,
      }),
      Date.now(),
      input.messageId,
    ],
  );

  upsertSmsCandidate({
    amountMinor: input.amountMinor,
    categoryId: null,
    confidence: input.confidence,
    currency: input.currency,
    direction: input.direction,
    merchant: input.merchant,
    notes: input.notes,
    occurredAt: input.occurredAt,
    parserKey: input.parserKey,
    reference: input.reference ?? undefined,
    smsMessageId: input.messageId,
  });
}

export function getSmsCandidateFeedbackContext(id: string) {
  ensureSmsCandidateAiColumns();
  return (
    sqliteDatabase.getFirstSync<{
      aiJobId: string | null;
      categoryId: string | null;
      categoryLabel: string;
      classificationSource: "rule" | "merchant_memory" | "ai" | "user";
      merchant: string;
      merchantKey: string | null;
      suggestedCategoryLabel: string | null;
    }>(
      `SELECT
        c.ai_job_id AS aiJobId,
        c.category_id AS categoryId,
        COALESCE(cat.label, 'Other') AS categoryLabel,
        c.classification_source AS classificationSource,
        c.merchant AS merchant,
        c.merchant_key AS merchantKey,
        c.suggested_category_label AS suggestedCategoryLabel
       FROM sms_transaction_candidates c
       LEFT JOIN categories cat
         ON cat.id = c.category_id
       WHERE c.id = ?
       LIMIT 1`,
      [id],
    ) ?? null
  );
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

export function updateSmsSyncState(input: {
  importLimit?: number;
  isListenerEnabled?: boolean;
  lastError?: string | null;
  lastImportCount?: number | null;
  lastImportedAt?: number | null;
  lastListenerEventAt?: number | null;
}) {
  ensureSmsSyncStateRow();
  const current = sqliteDatabase.getFirstSync<{
    importLimit: number | null;
    isListenerEnabled: number;
    lastError: string | null;
    lastImportCount: number | null;
    lastImportedAt: number | null;
    lastListenerEventAt: number | null;
  }>(
    `SELECT
      import_limit AS importLimit,
      listener_enabled AS isListenerEnabled,
      last_error AS lastError,
      last_import_count AS lastImportCount,
      last_imported_at AS lastImportedAt,
      last_listener_event_at AS lastListenerEventAt
     FROM sms_sync_state
     WHERE scope = 'default'`,
  );

  sqliteDatabase.runSync(
    `UPDATE sms_sync_state
     SET listener_enabled = ?,
         import_limit = ?,
         last_imported_at = ?,
         last_import_count = ?,
         last_listener_event_at = ?,
         last_error = ?
     WHERE scope = 'default'`,
    [
      input.isListenerEnabled !== undefined
        ? (input.isListenerEnabled ? 1 : 0)
        : current?.isListenerEnabled ?? 0,
      input.importLimit !== undefined
        ? input.importLimit
        : current?.importLimit ?? DEFAULT_SMS_IMPORT_LIMIT,
      input.lastImportedAt !== undefined ? input.lastImportedAt : current?.lastImportedAt ?? null,
      input.lastImportCount !== undefined ? input.lastImportCount : current?.lastImportCount ?? null,
      input.lastListenerEventAt !== undefined ? input.lastListenerEventAt : current?.lastListenerEventAt ?? null,
      input.lastError !== undefined ? input.lastError : current?.lastError ?? null,
    ],
  );
}

export function getSmsSyncState() {
  ensureSmsSyncStateRow();
  return sqliteDatabase.getFirstSync<{
    importLimit: number | null;
    isListenerEnabled: number;
    lastError: string | null;
    lastImportCount: number | null;
    lastImportedAt: number | null;
    lastListenerEventAt: number | null;
  }>(
    `SELECT
      import_limit AS importLimit,
      listener_enabled AS isListenerEnabled,
      last_error AS lastError,
      last_import_count AS lastImportCount,
      last_imported_at AS lastImportedAt,
      last_listener_event_at AS lastListenerEventAt
     FROM sms_sync_state
     WHERE scope = 'default'`,
  );
}

export function setSmsImportLimit(limit: number) {
  const normalizedLimit = Number.isFinite(limit)
    ? Math.max(1, Math.min(5000, Math.round(limit)))
    : DEFAULT_SMS_IMPORT_LIMIT;

  updateSmsSyncState({
    importLimit: normalizedLimit,
  });

  return normalizedLimit;
}

export function ingestSmsParseResult(input: {
  body: string;
  deviceMessageId: string;
  fingerprint: string;
  matchScore?: number | null;
  parsed: ParsedSmsCandidate | null;
  readAt?: number | null;
  receivedAt: number;
  sender: string;
  sourceAction?: SmsSourceAction | null;
  sourceProfileId?: string | null;
}) {
  ensureSmsMessageSourceColumns();
  const existingMessage = sqliteDatabase.getFirstSync<{ id: string }>(
    `SELECT id
     FROM sms_messages
     WHERE fingerprint = ?
     LIMIT 1`,
    [input.fingerprint],
  );
  const messageId = existingMessage?.id ?? input.deviceMessageId;

  upsertSmsMessage({
    body: input.body,
    fingerprint: input.fingerprint,
    id: messageId,
    metadata: input.parsed ?? undefined,
    matchScore: input.matchScore ?? null,
    parseStatus: input.parsed?.parseStatus ?? "ignored",
    parserKey: input.parsed?.parserKey ?? null,
    readAt: input.readAt ?? null,
    receivedAt: input.receivedAt,
    sender: input.sender,
    sourceAction: input.sourceAction ?? null,
    sourceProfileId: input.sourceProfileId ?? null,
  });

  if (!input.parsed || input.parsed.parseStatus !== "matched") {
    return;
  }

  upsertSmsCandidate({
    amountMinor: input.parsed.amountMinor,
    categoryId: input.parsed.categoryId,
    confidence: input.parsed.confidence,
    currency: input.parsed.currency,
    direction: input.parsed.direction,
    merchantKey: normalizeMerchantKey(input.parsed.merchant),
    merchant: input.parsed.merchant,
    notes: input.parsed.notes,
    occurredAt: input.parsed.occurredAt,
    parserKey: input.parsed.parserKey,
    reference: input.parsed.reference,
    smsMessageId: messageId,
  });
}

export function markSmsCandidateDismissed(id: string) {
  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET status = 'dismissed',
         updated_at = ?
     WHERE id = ?`,
    [Date.now(), id],
  );
}

export function acceptSmsCandidate(id: string): string {
  const candidate = sqliteDatabase.getFirstSync<{
    amountMinor: number;
    categoryId: string | null;
    currency: string;
    direction: "expense" | "income";
    merchant: string;
    notes: string | null;
    occurredAt: number;
    reference: string | null;
    status: "pending" | "accepted" | "dismissed";
  }>(
    `SELECT
      amount_minor AS amountMinor,
      category_id AS categoryId,
      currency,
      direction,
      merchant,
      notes,
      occurred_at AS occurredAt,
      reference,
      status
     FROM sms_transaction_candidates
     WHERE id = ?
     LIMIT 1`,
    [id],
  );

  if (!candidate) {
    throw new Error("SMS candidate not found.");
  }

  if (candidate.status === "accepted") {
    const existingId = sqliteDatabase.getFirstSync<{ transactionId: string | null }>(
      `SELECT transaction_id AS transactionId
       FROM sms_transaction_candidates
       WHERE id = ?`,
      [id],
    )?.transactionId;

    if (existingId) {
      return existingId;
    }
  }

  const transactionId = createTransaction({
    amount: String(candidate.amountMinor / 100),
    categoryId: candidate.categoryId ?? "cat-other",
    currency: candidate.currency,
    direction: candidate.direction,
    merchant: candidate.merchant,
    notes: candidate.notes ?? undefined,
    reference: candidate.reference ?? undefined,
    source: "sms",
    transactionAt: candidate.occurredAt,
  });

  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET status = 'accepted',
         transaction_id = ?,
         updated_at = ?
     WHERE id = ?`,
    [transactionId, Date.now(), id],
  );

  return transactionId;
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
  } else if (input.entityType === "category") {
    sqliteDatabase.runSync(
      `UPDATE categories
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

export function upsertRemoteCategory(input: {
  row: Record<string, unknown>;
  serverUpdatedAt: number;
  version: number;
}) {
  const row = input.row;
  sqliteDatabase.runSync(
    `INSERT INTO categories (
      id, user_id, label, color, created_at, updated_at, deleted_at, version, server_updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = excluded.user_id,
      label = excluded.label,
      color = excluded.color,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted_at = excluded.deleted_at,
      version = excluded.version,
      server_updated_at = excluded.server_updated_at`,
    [
      String(row.id),
      String(row.userId ?? DEFAULT_USER_ID),
      String(row.label ?? "Other"),
      String(row.color ?? "#4b5563"),
      Number(row.createdAt ?? Date.now()),
      Number(row.updatedAt ?? Date.now()),
      row.deletedAt ? Number(row.deletedAt) : null,
      input.version,
      input.serverUpdatedAt,
    ],
  );

  writeSyncMetadata({
    entityId: String(row.id),
    entityType: "category",
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
  } else if (input.entityType === "category") {
    sqliteDatabase.runSync(
      `UPDATE categories
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
      input.lastPullCursor !== undefined ? input.lastPullCursor : current?.lastPullCursor ?? null,
      input.lastSuccessfulSyncAt !== undefined ? input.lastSuccessfulSyncAt : current?.lastSuccessfulSyncAt ?? null,
      input.lastAttemptedSyncAt !== undefined ? input.lastAttemptedSyncAt : current?.lastAttemptedSyncAt ?? null,
      input.lockedAt !== undefined ? input.lockedAt : current?.lockedAt ?? null,
      input.lockOwner !== undefined ? input.lockOwner : current?.lockOwner ?? null,
      input.lastError !== undefined ? input.lastError : current?.lastError ?? null,
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

function normalizeCategoryLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function ensureUniqueCategoryLabel(label: string, excludeId?: string) {
  const existing = sqliteDatabase.getFirstSync<{ id: string }>(
    `SELECT id
     FROM categories
     WHERE user_id = ?
       AND deleted_at IS NULL
       AND LOWER(TRIM(label)) = LOWER(TRIM(?))
       AND (? IS NULL OR id != ?)
     LIMIT 1`,
    [DEFAULT_USER_ID, label, excludeId ?? null, excludeId ?? ""],
  );

  if (existing) {
    throw new Error("A category with this label already exists.");
  }
}

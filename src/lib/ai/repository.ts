import { normalizeCategoryProposalName, normalizeLabelKey, normalizeMerchantKey } from "@/lib/ai/utils";
import { DEFAULT_USER_ID } from "@/lib/finance/constants";
import { sqliteDatabase } from "@/lib/finance/database";
import type {
  AiBackendAvailability,
  AiJobItemRecord,
  AiJobRecord,
  AiJobScope,
  AiJobStatus,
  AiJobType,
  AiSnapshot,
  CategoryProposalRecord,
} from "@/lib/finance/types";
import { createId } from "@/lib/finance/utils";

const AI_TABLE_MIGRATIONS = `
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
`;

let aiTablesEnsured = false;

export function createAiJob(input: {
  itemIds: string[];
  itemType: "sms_message" | "sms_candidate";
  jobType: AiJobType;
  payload?: Record<string, unknown>;
  scope: AiJobScope;
}) {
  ensureAiTables();
  const uniqueItemIds = Array.from(new Set(input.itemIds));
  const queuedItemIds = uniqueItemIds.filter((itemId) => !hasOpenAiJobForItem(input.jobType, input.itemType, itemId));

  if (!queuedItemIds.length) {
    return null;
  }

  const jobId = createId("ai-job");
  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    sqliteDatabase.runSync(
      `INSERT INTO ai_jobs (
        id, job_type, scope, status, payload_json, attempt_count, next_retry_at, last_error, backend_job_id, progress, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, 'pending', ?, 0, NULL, NULL, NULL, 0, ?, ?, NULL)`,
      [jobId, input.jobType, input.scope, JSON.stringify(input.payload ?? {}), now, now],
    );

    for (const itemId of queuedItemIds) {
      sqliteDatabase.runSync(
        `INSERT INTO ai_job_items (
          id, job_id, item_type, item_id, status, result_json, last_error, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', NULL, NULL, ?, ?)`,
        [createId("ai-item"), jobId, input.itemType, itemId, now, now],
      );
    }
  });

  return jobId;
}

export function getDueAiJobs(limit: number) {
  ensureAiTables();
  const now = Date.now();
  return sqliteDatabase.getAllSync<AiJobRecord>(
    `SELECT
      id,
      job_type AS jobType,
      scope,
      status,
      payload_json AS payloadJson,
      attempt_count AS attemptCount,
      next_retry_at AS nextRetryAt,
      last_error AS lastError,
      backend_job_id AS backendJobId,
      progress,
      created_at AS createdAt,
      updated_at AS updatedAt,
      completed_at AS completedAt
     FROM ai_jobs
     WHERE status IN ('pending', 'failed')
       AND (next_retry_at IS NULL OR next_retry_at <= ?)
     ORDER BY created_at ASC
     LIMIT ?`,
    [now, limit],
  );
}

export function getAiJobById(jobId: string) {
  ensureAiTables();
  return (
    sqliteDatabase.getFirstSync<AiJobRecord>(
      `SELECT
        id,
        job_type AS jobType,
        scope,
        status,
        payload_json AS payloadJson,
        attempt_count AS attemptCount,
        next_retry_at AS nextRetryAt,
        last_error AS lastError,
        backend_job_id AS backendJobId,
        progress,
        created_at AS createdAt,
        updated_at AS updatedAt,
        completed_at AS completedAt
       FROM ai_jobs
       WHERE id = ?
       LIMIT 1`,
      [jobId],
    ) ?? null
  );
}

export function listAiJobItems(jobId: string) {
  ensureAiTables();
  return sqliteDatabase.getAllSync<AiJobItemRecord>(
    `SELECT
      id,
      job_id AS jobId,
      item_type AS itemType,
      item_id AS itemId,
      status,
      result_json AS resultJson,
      last_error AS lastError,
      updated_at AS updatedAt
     FROM ai_job_items
     WHERE job_id = ?
     ORDER BY created_at ASC`,
    [jobId],
  );
}

export function markAiJobRunning(jobId: string) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET status = 'running',
         last_error = NULL,
         updated_at = ?
     WHERE id = ?`,
    [Date.now(), jobId],
  );
}

export function attachAiBackendJob(jobId: string, backendJobId: string) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET backend_job_id = ?,
         status = 'running',
         last_error = NULL,
         updated_at = ?
     WHERE id = ?`,
    [backendJobId, Date.now(), jobId],
  );
}

export function updateAiJobPayload(jobId: string, payload: Record<string, unknown>) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET payload_json = ?,
         updated_at = ?
     WHERE id = ?`,
    [JSON.stringify(payload), Date.now(), jobId],
  );
}

export function updateAiJobFromBackend(input: {
  backendJobId?: string | null;
  completedAt?: number | null;
  jobId: string;
  lastError?: string | null;
  progress: number;
  status: "pending" | "running" | "completed" | "failed";
}) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET backend_job_id = COALESCE(?, backend_job_id),
         status = ?,
         progress = ?,
         last_error = ?,
         completed_at = ?,
         updated_at = ?
     WHERE id = ?`,
    [
      input.backendJobId ?? null,
      input.status,
      Math.max(0, Math.min(100, input.progress)),
      input.lastError ?? null,
      input.completedAt ?? null,
      Date.now(),
      input.jobId,
    ],
  );
}

export function markAiJobProgress(jobId: string, progress: number) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET progress = ?, updated_at = ?
     WHERE id = ?`,
    [Math.max(0, Math.min(100, progress)), Date.now(), jobId],
  );
}

export function markAiJobCompleted(jobId: string) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET status = 'completed',
         progress = 100,
         completed_at = ?,
         last_error = NULL,
         updated_at = ?
     WHERE id = ?`,
    [Date.now(), Date.now(), jobId],
  );
}

export function markAiJobFailed(input: {
  attemptCount: number;
  error: string;
  jobId: string;
  nextRetryAt: number;
}) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET status = 'failed',
         attempt_count = ?,
         next_retry_at = ?,
         last_error = ?,
         updated_at = ?
     WHERE id = ?`,
    [input.attemptCount, input.nextRetryAt, input.error, Date.now(), input.jobId],
  );
}

export function retryFailedAiJobs() {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_jobs
     SET next_retry_at = NULL,
         updated_at = ?
     WHERE status = 'failed'`,
    [Date.now()],
  );
}

export function markAiJobItemRunning(id: string) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_job_items
     SET status = 'running', last_error = NULL, updated_at = ?
     WHERE id = ?`,
    [Date.now(), id],
  );
}

export function markAiJobItemCompleted(id: string, result?: Record<string, unknown>) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_job_items
     SET status = 'completed',
         result_json = ?,
         last_error = NULL,
         updated_at = ?
     WHERE id = ?`,
    [result ? JSON.stringify(result) : null, Date.now(), id],
  );
}

export function markAiJobItemFailed(id: string, error: string, result?: Record<string, unknown>) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE ai_job_items
     SET status = 'failed',
         result_json = ?,
         last_error = ?,
         updated_at = ?
     WHERE id = ?`,
    [result ? JSON.stringify(result) : null, error, Date.now(), id],
  );
}

export function findAiJobByBackendJobId(backendJobId: string) {
  ensureAiTables();
  return (
    sqliteDatabase.getFirstSync<AiJobRecord>(
      `SELECT
        id,
        job_type AS jobType,
        scope,
        status,
        payload_json AS payloadJson,
        attempt_count AS attemptCount,
        next_retry_at AS nextRetryAt,
        last_error AS lastError,
        backend_job_id AS backendJobId,
        progress,
        created_at AS createdAt,
        updated_at AS updatedAt,
        completed_at AS completedAt
       FROM ai_jobs
       WHERE backend_job_id = ?
       LIMIT 1`,
      [backendJobId],
    ) ?? null
  );
}

export function listActiveRemoteAiJobs() {
  ensureAiTables();
  return sqliteDatabase.getAllSync<AiJobRecord>(
    `SELECT
      id,
      job_type AS jobType,
      scope,
      status,
      payload_json AS payloadJson,
      attempt_count AS attemptCount,
      next_retry_at AS nextRetryAt,
      last_error AS lastError,
      backend_job_id AS backendJobId,
      progress,
      created_at AS createdAt,
      updated_at AS updatedAt,
      completed_at AS completedAt
     FROM ai_jobs
     WHERE backend_job_id IS NOT NULL
       AND (
         status IN ('pending', 'running')
         OR EXISTS (
           SELECT 1
           FROM ai_job_items ji
           WHERE ji.job_id = ai_jobs.id
             AND ji.status != 'completed'
         )
       )
     ORDER BY created_at ASC`,
  );
}

export function upsertMerchantMemory(input: {
  categoryId: string;
  confidence: number;
  merchantKey: string;
  merchantName: string;
  source: "ai" | "user";
}) {
  ensureAiTables();
  const now = Date.now();
  sqliteDatabase.runSync(
    `INSERT INTO merchant_memory (
      merchant_key, merchant_name, category_id, confidence, source, use_count, last_used_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
    ON CONFLICT(merchant_key) DO UPDATE SET
      merchant_name = excluded.merchant_name,
      category_id = excluded.category_id,
      confidence = excluded.confidence,
      source = excluded.source,
      use_count = merchant_memory.use_count + 1,
      last_used_at = excluded.last_used_at,
      updated_at = excluded.updated_at`,
    [
      input.merchantKey,
      input.merchantName,
      input.categoryId,
      input.confidence,
      input.source,
      now,
      now,
      now,
    ],
  );
}

export function findMerchantMemory(merchantName: string | null | undefined) {
  ensureAiTables();
  const merchantKey = normalizeMerchantKey(merchantName);
  if (!merchantKey) {
    return null;
  }

  return (
    sqliteDatabase.getFirstSync<{
      categoryId: string;
      confidence: number;
      merchantKey: string;
      merchantName: string;
      source: "ai" | "user";
    }>(
      `SELECT
        merchant_key AS merchantKey,
        merchant_name AS merchantName,
        category_id AS categoryId,
        confidence,
        source
       FROM merchant_memory
       WHERE merchant_key = ?
       LIMIT 1`,
      [merchantKey],
    ) ?? null
  );
}

export function upsertCategoryProposal(input: {
  linkedCandidateId: string | null;
  proposedName: string;
}) {
  ensureAiTables();
  const normalizedName = normalizeLabelKey(input.proposedName);
  const existing = sqliteDatabase.getFirstSync<{ id: string }>(
    `SELECT id
     FROM category_proposals
     WHERE normalized_name = ?
       AND COALESCE(linked_candidate_id, '') = COALESCE(?, '')
       AND status = 'pending'
     LIMIT 1`,
    [normalizedName, input.linkedCandidateId],
  );

  const id = existing?.id ?? createId("cat-proposal");
  const now = Date.now();
  const proposedName = normalizeCategoryProposalName(input.proposedName);

  sqliteDatabase.runSync(
    `INSERT INTO category_proposals (
      id, proposed_name, normalized_name, linked_candidate_id, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, 'pending', ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      proposed_name = excluded.proposed_name,
      normalized_name = excluded.normalized_name,
      linked_candidate_id = excluded.linked_candidate_id,
      updated_at = excluded.updated_at`,
    [id, proposedName, normalizedName, input.linkedCandidateId, now, now],
  );

  return id;
}

export function listPendingCategoryProposals() {
  ensureAiTables();
  return sqliteDatabase.getAllSync<CategoryProposalRecord>(
    `SELECT
      id,
      linked_candidate_id AS linkedCandidateId,
      normalized_name AS normalizedName,
      proposed_name AS proposedName,
      status,
      updated_at AS updatedAt
     FROM category_proposals
     WHERE status = 'pending'
     ORDER BY created_at DESC`,
  );
}

export function approveCategoryProposal(id: string) {
  ensureAiTables();
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
       AND LOWER(REPLACE(label, '  ', ' ')) = ?
       AND deleted_at IS NULL
     LIMIT 1`,
    [DEFAULT_USER_ID, proposal.normalizedName],
  );

  const categoryId = existingCategory?.id ?? createId("cat");
  const now = Date.now();

  sqliteDatabase.withTransactionSync(() => {
    if (!existingCategory) {
      sqliteDatabase.runSync(
        `INSERT INTO categories (
          id, user_id, label, color, created_at, updated_at, deleted_at, version, server_updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, NULL)`,
        [categoryId, DEFAULT_USER_ID, proposal.proposedName, "#6366f1", now, now],
      );
    }

    sqliteDatabase.runSync(
      `UPDATE category_proposals
       SET status = 'approved', updated_at = ?
       WHERE id = ?`,
      [now, id],
    );

    if (proposal.linkedCandidateId) {
      sqliteDatabase.runSync(
        `UPDATE sms_transaction_candidates
         SET category_id = ?,
             category_proposal_id = NULL,
             classification_source = 'user',
             updated_at = ?
         WHERE id = ?`,
        [categoryId, now, proposal.linkedCandidateId],
      );
    }
  });

  return categoryId;
}

export function rejectCategoryProposal(id: string) {
  ensureAiTables();
  sqliteDatabase.runSync(
    `UPDATE category_proposals
     SET status = 'rejected', updated_at = ?
     WHERE id = ?`,
    [Date.now(), id],
  );

  sqliteDatabase.runSync(
    `UPDATE sms_transaction_candidates
     SET category_proposal_id = NULL,
         updated_at = ?
     WHERE category_proposal_id = ?`,
    [Date.now(), id],
  );
}

export function getAiSnapshot(input: { isConfigured: boolean; supportsStreaming: boolean }): AiSnapshot {
  ensureAiTables();
  const counts = sqliteDatabase.getFirstSync<{
    failedJobCount: number;
    pendingJobCount: number;
    runningJobCount: number;
  }>(
    `SELECT
      COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failedJobCount,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pendingJobCount,
      COALESCE(SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END), 0) AS runningJobCount
     FROM ai_jobs`,
  ) ?? {
    failedJobCount: 0,
    pendingJobCount: 0,
    runningJobCount: 0,
  };

  const latestJob = sqliteDatabase.getFirstSync<{ lastError: string | null; status: AiJobStatus }>(
    `SELECT
      last_error AS lastError,
      status
     FROM ai_jobs
     ORDER BY updated_at DESC
     LIMIT 1`,
  );

  const activeBatchJob =
    sqliteDatabase.getFirstSync<AiJobRecord>(
      `SELECT
        id,
        job_type AS jobType,
        scope,
        status,
        payload_json AS payloadJson,
        attempt_count AS attemptCount,
        next_retry_at AS nextRetryAt,
        last_error AS lastError,
        backend_job_id AS backendJobId,
        progress,
        created_at AS createdAt,
        updated_at AS updatedAt,
        completed_at AS completedAt
       FROM ai_jobs
       WHERE scope IN ('sms_batch', 'import_batch')
         AND status IN ('pending', 'running', 'failed')
       ORDER BY created_at DESC
       LIMIT 1`,
    ) ?? null;

  const recentJobs = sqliteDatabase.getAllSync<AiJobRecord>(
    `SELECT
      id,
      job_type AS jobType,
      scope,
      status,
      payload_json AS payloadJson,
      attempt_count AS attemptCount,
      next_retry_at AS nextRetryAt,
      last_error AS lastError,
      backend_job_id AS backendJobId,
      progress,
      created_at AS createdAt,
      updated_at AS updatedAt,
      completed_at AS completedAt
     FROM ai_jobs
     ORDER BY updated_at DESC
     LIMIT 8`,
  );

  const backend: AiBackendAvailability = {
    isConfigured: input.isConfigured,
    lastError: latestJob?.status === "failed" ? latestJob.lastError : null,
    status: !input.isConfigured
      ? "unconfigured"
      : latestJob?.status === "failed" && latestJob.lastError
        ? "unreachable"
        : "available",
    supportsStreaming: input.supportsStreaming,
  };

  return {
    activeBatchJob,
    backend,
    failedJobCount: counts.failedJobCount,
    pendingCategoryProposals: listPendingCategoryProposals(),
    pendingJobCount: counts.pendingJobCount,
    recentJobs,
    runningJobCount: counts.runningJobCount,
  };
}

function hasOpenAiJobForItem(jobType: AiJobType, itemType: "sms_message" | "sms_candidate", itemId: string) {
  ensureAiTables();
  return Boolean(
    sqliteDatabase.getFirstSync<{ id: string }>(
      `SELECT ji.id
       FROM ai_job_items ji
       INNER JOIN ai_jobs j
         ON j.id = ji.job_id
       WHERE j.job_type = ?
         AND ji.item_type = ?
         AND ji.item_id = ?
         AND j.status IN ('pending', 'running')
       LIMIT 1`,
      [jobType, itemType, itemId],
    )?.id,
  );
}

function ensureAiTables() {
  if (aiTablesEnsured) {
    return;
  }

  sqliteDatabase.execSync(AI_TABLE_MIGRATIONS);
  aiTablesEnsured = true;
}

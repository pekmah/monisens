import { DEFAULT_SYNC_SCOPE, RETRY_BACKOFF_SCHEDULE_MS, SYNC_LOCK_STALE_AFTER_MS, SYNC_PULL_BATCH_SIZE, SYNC_PUSH_BATCH_SIZE } from "@/lib/finance/constants";
import {
  applyRemoteDelete,
  getDueOutboxEntries,
  getSyncState,
  markEntitySynced,
  markOutboxDone,
  markOutboxFailed,
  markOutboxSyncing,
  rebuildSummaryTables,
  updateSyncState,
  upsertRemoteAttachment,
  upsertRemoteBudget,
  upsertRemoteCategory,
  upsertRemoteImport,
  upsertRemoteTransaction,
  writeSyncMetadata,
} from "@/lib/finance/repository";
import { createSyncTransport, SyncTransportDisabledError } from "@/lib/finance/sync-transport";
import type { PullChangeRecord, SyncTrigger } from "@/lib/finance/types";
import { createId } from "@/lib/finance/utils";

const syncTransport = createSyncTransport();
let inFlight = false;
const lockOwner = createId("sync");

export function hasRemoteSync() {
  return syncTransport.isConfigured;
}

export async function runFinanceSync(trigger: SyncTrigger) {
  if (inFlight) {
    return { reason: "in_flight" as const, status: "idle" as const };
  }

  if (!syncTransport.isConfigured) {
    return { reason: "disabled" as const, status: "disabled" as const };
  }

  const current = getSyncState();
  const now = Date.now();

  if (
    current?.lockedAt &&
    current.lockOwner &&
    current.lockOwner !== lockOwner &&
    now - current.lockedAt < SYNC_LOCK_STALE_AFTER_MS
  ) {
    return { reason: "locked" as const, status: "idle" as const };
  }

  inFlight = true;
  updateSyncState({
    lastAttemptedSyncAt: now,
    lastError: null,
    lockedAt: now,
    lockOwner,
  });

  try {
    const pushFailures = await pushOutbox();
    const nextCursor = await pullChanges(current?.lastPullCursor ?? null);
    rebuildSummaryTables();
    updateSyncState({
      lastError: null,
      lastPullCursor: nextCursor,
      lastSuccessfulSyncAt: Date.now(),
    });

    if (pushFailures.length > 0) {
      throw new Error(
        pushFailures.length === 1
          ? pushFailures[0]
          : `${pushFailures.length} changes failed to sync. ${pushFailures[0]}`,
      );
    }

    return { reason: trigger, status: "idle" as const };
  } catch (error) {
    const message =
      error instanceof SyncTransportDisabledError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Sync failed.";

    updateSyncState({
      lastError: message,
    });

    return { reason: trigger, status: "error" as const };
  } finally {
    updateSyncState({
      lockedAt: null,
      lockOwner: null,
    });
    inFlight = false;
    void DEFAULT_SYNC_SCOPE;
  }
}

async function pushOutbox() {
  const entries = getDueOutboxEntries(SYNC_PUSH_BATCH_SIZE);
  const failures: string[] = [];

  for (const entry of entries) {
    markOutboxSyncing(entry.id);

    try {
      const result = await syncTransport.pushChange({
        baseVersion: entry.baseVersion,
        clientId: lockOwner,
        clientTimestamp: Date.now(),
        dedupeKey: entry.dedupeKey,
        entityId: entry.entityId,
        entityType: entry.entityType,
        operation: entry.operation,
        payload: JSON.parse(entry.payloadJson) as Record<string, unknown>,
      });

      if (result.row) {
        applyRemoteChange({
          cursor: "",
          entityId: entry.entityId,
          entityType: entry.entityType,
          operation: entry.operation,
          row: result.row,
          serverUpdatedAt: result.serverUpdatedAt,
          version: result.version,
        });
      } else {
        applyRemoteDelete({
          entityId: entry.entityId,
          entityType: entry.entityType,
          serverUpdatedAt: result.serverUpdatedAt,
          version: result.version,
        });
      }

      markEntitySynced({
        entityId: entry.entityId,
        entityType: entry.entityType,
        lastSyncedAt: result.serverUpdatedAt,
        version: result.version,
      });
      markOutboxDone(entry.id);
    } catch (error) {
      const attemptCount = entry.attemptCount + 1;
      const retryOffset =
        RETRY_BACKOFF_SCHEDULE_MS[
          Math.min(attemptCount - 1, RETRY_BACKOFF_SCHEDULE_MS.length - 1)
        ];
      const message = error instanceof Error ? error.message : "Push failed.";

      markOutboxFailed({
        attemptCount,
        error: message,
        id: entry.id,
        nextRetryAt: Date.now() + retryOffset,
      });
      writeSyncMetadata({
        entityId: entry.entityId,
        entityType: entry.entityType,
        lastError: message,
        syncStatus: "failed",
        updatedAt: Date.now(),
      });
      failures.push(`${entry.entityType}:${entry.entityId} - ${message}`);
    }
  }

  return failures;
}

async function pullChanges(initialCursor: string | null) {
  let cursor = initialCursor;
  let hasMore = true;

  while (hasMore) {
    const page = await syncTransport.pullChanges({
      cursor,
      limit: SYNC_PULL_BATCH_SIZE,
    });

    for (const change of page.changes) {
      applyRemoteChange(change);
    }

    cursor = page.nextCursor;
    hasMore = page.hasMore;
  }

  return cursor;
}

function applyRemoteChange(change: PullChangeRecord) {
  if (change.operation === "delete" || !change.row) {
    applyRemoteDelete({
      entityId: change.entityId,
      entityType: change.entityType,
      serverUpdatedAt: change.serverUpdatedAt,
      version: change.version,
    });
    return;
  }

  if (change.entityType === "transaction") {
    upsertRemoteTransaction({
      row: change.row,
      serverUpdatedAt: change.serverUpdatedAt,
      version: change.version,
    });
    return;
  }

  if (change.entityType === "budget") {
    upsertRemoteBudget({
      row: change.row,
      serverUpdatedAt: change.serverUpdatedAt,
      version: change.version,
    });
    return;
  }

  if (change.entityType === "category") {
    upsertRemoteCategory({
      row: change.row,
      serverUpdatedAt: change.serverUpdatedAt,
      version: change.version,
    });
    return;
  }

  if (change.entityType === "import") {
    upsertRemoteImport({
      row: change.row,
      serverUpdatedAt: change.serverUpdatedAt,
      version: change.version,
    });
    return;
  }

  if (change.entityType === "attachment") {
    upsertRemoteAttachment({
      row: change.row,
      serverUpdatedAt: change.serverUpdatedAt,
      version: change.version,
    });
  }
}

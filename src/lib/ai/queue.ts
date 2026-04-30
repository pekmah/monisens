import { DEFAULT_AI_RETRY_BACKOFF_MS, DEFAULT_AI_RUN_BATCH_SIZE } from "@/lib/ai/constants";
import { emitAiQueueUpdate } from "@/lib/ai/events";
import {
  attachAiBackendJob,
  createAiJob,
  findAiJobByBackendJobId,
  findMerchantMemory,
  getAiJobById,
  getDueAiJobs,
  listActiveRemoteAiJobs,
  listAiJobItems,
  markAiJobCompleted,
  markAiJobFailed,
  markAiJobItemCompleted,
  markAiJobItemFailed,
  markAiJobItemRunning,
  markAiJobProgress,
  markAiJobRunning,
  updateAiJobFromBackend,
  upsertCategoryProposal,
} from "@/lib/ai/repository";
import { createAiTransport, type RemoteBatchResults, type RemoteBatchSnapshot, type RemoteClassification, type RemoteParsedSms } from "@/lib/ai/transport";
import { normalizeLabelKey, normalizeMerchantKey } from "@/lib/ai/utils";
import { DEFAULT_USER_ID } from "@/lib/finance/constants";
import {
  applyAiClassificationResult,
  applyAiParsedSmsResult,
  applyMerchantMemorySuggestion,
  listCategories,
  listSmsCandidateIdsForMessageIds,
  listSmsCandidateIdsNeedingAi,
  listSmsCandidatesForClassification,
  listSmsMessageIdsNeedingAiParse,
  listSmsMessagesForAiParse,
  markSmsCandidateAiFailed,
  markSmsCandidateAiQueued,
} from "@/lib/finance/repository";

const aiTransport = createAiTransport();
let inFlight = false;

export function hasAiBackend() {
  return aiTransport.isConfigured;
}

export function supportsAiStreaming() {
  return aiTransport.supportsStreaming;
}

export function enqueuePendingSmsAiJobs(scope: "sms_single" | "sms_batch" | "import_batch" = "sms_single") {
  const parseMessageIds = listSmsMessageIdsNeedingAiParse();
  const parseJobId = createAiJob({
    itemIds: parseMessageIds,
    itemType: "sms_message",
    jobType: "parse_sms",
    scope,
  });

  let classifyJobId: string | null = null;
  if (scope === "sms_single" || !aiTransport.isConfigured) {
    const candidateIds = resolveCandidatesForAi();
    classifyJobId = createAiJob({
      itemIds: candidateIds,
      itemType: "sms_candidate",
      jobType: "classify_candidate",
      scope,
    });

    if (classifyJobId) {
      markSmsCandidateAiQueued({
        candidateIds,
        jobId: classifyJobId,
      });
    }
  }

  if (parseJobId || classifyJobId) {
    emitAiQueueUpdate();
  }

  return {
    classifyJobId,
    parseJobId,
  };
}

export async function runAiQueue() {
  if (inFlight) {
    return { processedJobs: 0, status: "idle" as const };
  }

  inFlight = true;
  emitAiQueueUpdate();

  try {
    let processedJobs = 0;

    while (true) {
      const jobs = getDueAiJobs(DEFAULT_AI_RUN_BATCH_SIZE);
      if (jobs.length === 0) {
        return {
          processedJobs,
          status: processedJobs ? "processed" as const : "idle" as const,
        };
      }

      for (const job of jobs) {
        await processJob(job.id);
        processedJobs += 1;
      }
    }
  } finally {
    inFlight = false;
    emitAiQueueUpdate();
  }
}

export async function syncRemoteAiJobs() {
  const jobs = listActiveRemoteAiJobs();
  for (const job of jobs) {
    await syncRemoteAiJob(job.id);
  }
}

export function getAiTransportCapabilities() {
  return {
    isConfigured: aiTransport.isConfigured,
    supportsStreaming: aiTransport.supportsStreaming,
  };
}

export function connectAiJobStream(jobId: string, onEvent: (event: Parameters<typeof aiTransport.connectJobStream>[1] extends (event: infer T) => void ? T : never) => void) {
  return aiTransport.connectJobStream(jobId, onEvent);
}

export async function syncRemoteAiJobByBackendId(backendJobId: string) {
  const job = findAiJobByBackendJobId(backendJobId);
  if (!job) {
    return;
  }

  await syncRemoteAiJob(job.id);
}

async function processJob(jobId: string) {
  const job = getAiJobById(jobId);
  const items = listAiJobItems(jobId);

  if (!job || items.length === 0) {
    return;
  }

  const targetItems = items.filter((item) => item.status !== "completed");
  if (targetItems.length === 0) {
    markAiJobCompleted(jobId);
    emitAiQueueUpdate();
    return;
  }

  if (shouldUseRemoteBatchParse(job.scope, job.jobType, targetItems.length)) {
    await processRemoteBatchParseJob(jobId, targetItems, job.scope);
    emitAiQueueUpdate();
    return;
  }

  markAiJobRunning(jobId);
  emitAiQueueUpdate();

  const failures: string[] = [];
  let completedCount = 0;

  for (const item of targetItems) {
    markAiJobItemRunning(item.id);
    emitAiQueueUpdate();

    try {
      if (job.jobType === "parse_sms") {
        await processParseSmsItem(item.itemId, job.scope);
      } else if (job.jobType === "classify_candidate") {
        await processClassifyCandidateItem(item.itemId);
      } else if (job.jobType === "submit_feedback") {
        await processFeedbackItem(job.payloadJson);
      }

      markAiJobItemCompleted(item.id);
      completedCount += 1;
      markAiJobProgress(jobId, Math.round((completedCount / targetItems.length) * 100));
      emitAiQueueUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : "AI job failed.";
      markAiJobItemFailed(item.id, message);
      failures.push(message);
      if (job.jobType === "classify_candidate") {
        markSmsCandidateAiFailed({
          candidateId: item.itemId,
          error: message,
          jobId,
        });
      }
      emitAiQueueUpdate();
    }
  }

  if (failures.length > 0) {
    const attemptCount = job.attemptCount + 1;
    const retryOffset = DEFAULT_AI_RETRY_BACKOFF_MS[Math.min(attemptCount - 1, DEFAULT_AI_RETRY_BACKOFF_MS.length - 1)];
    markAiJobFailed({
      attemptCount,
      error: failures[0],
      jobId,
      nextRetryAt: Date.now() + retryOffset,
    });
  } else {
    markAiJobCompleted(jobId);
  }

  emitAiQueueUpdate();
}

async function processParseSmsItem(messageId: string, scope: "sms_single" | "sms_batch" | "import_batch") {
  const message = listSmsMessagesForAiParse([messageId])[0];
  if (!message) {
    throw new Error("SMS message not found for AI parsing.");
  }

  const parsed = await aiTransport.parseSms({
    message: message.body,
    userId: DEFAULT_USER_ID,
  });

  if (!parsed.amount || !parsed.currency || !parsed.merchantName || !isSupportedTransactionType(parsed.transactionType)) {
    throw new Error("AI parse did not return a usable finance transaction.");
  }

  applyAiParsedSmsResult({
    amountMinor: Math.round(parsed.amount * 100),
    cleanDescription: parsed.cleanDescription,
    confidence: Math.round(parsed.confidence * 100),
    currency: parsed.currency,
    direction: parsed.transactionType,
    merchant: parsed.merchantName,
    messageId,
    notes: parsed.cleanDescription || undefined,
    occurredAt: message.receivedAt,
    parserKey: `ai:${parsed.provider}`,
    reference: parsed.reference,
  });

  const candidateIds = listSmsCandidateIdsForMessageIds([messageId]);
  if (candidateIds.length > 0) {
    const queueableCandidateIds = resolveCandidatesForAi(candidateIds);
    const classifyJobId = createAiJob({
      itemIds: queueableCandidateIds,
      itemType: "sms_candidate",
      jobType: "classify_candidate",
      scope,
    });

    if (classifyJobId) {
      markSmsCandidateAiQueued({
        candidateIds: queueableCandidateIds,
        jobId: classifyJobId,
      });
    }
  }
}

async function processRemoteBatchParseJob(
  jobId: string,
  targetItems: Array<{ id: string; itemId: string }>,
  scope: "sms_single" | "sms_batch" | "import_batch",
) {
  const messages = listSmsMessagesForAiParse(targetItems.map((item) => item.itemId));
  if (messages.length === 0) {
    markAiJobCompleted(jobId);
    return;
  }

  for (const item of targetItems) {
    markAiJobItemRunning(item.id);
  }

  const snapshot = await aiTransport.queueBulkSmsIngest({
    clientBatchId: jobId,
    existingCategories: listCategories().map((entry) => entry.label),
    messages: messages.map((message) => message.body),
    userId: DEFAULT_USER_ID,
  });

  attachAiBackendJob(jobId, snapshot.batchId);
  updateAiJobFromBackend({
    backendJobId: snapshot.batchId,
    jobId,
    progress: getBatchProgress(snapshot),
    status: mapBatchStatusToJobStatus(snapshot.status),
  });

  if (snapshot.status === "completed" || snapshot.status === "partially_completed" || snapshot.status === "failed" || snapshot.status === "cancelled") {
    await syncRemoteAiJob(jobId);
    return;
  }

  if (scope === "sms_single") {
    await syncRemoteAiJob(jobId);
  }
}

async function processClassifyCandidateItem(candidateId: string) {
  const candidate = listSmsCandidatesForClassification([candidateId])[0];
  if (!candidate) {
    throw new Error("SMS candidate not found for classification.");
  }

  const memoryMatch = findMerchantMemory(candidate.merchant);
  if (memoryMatch) {
    applyMerchantMemorySuggestion({
      candidateId,
      categoryId: memoryMatch.categoryId,
      confidence: memoryMatch.confidence,
      merchantKey: memoryMatch.merchantKey,
    });
    return;
  }

  const categories = listCategories();
  const result = await aiTransport.classifyTransaction({
    amount: candidate.amountMinor / 100,
    cleanDescription: candidate.notes ?? candidate.reference ?? candidate.merchant,
    existingCategories: categories.map((entry) => entry.label),
    merchantName: candidate.merchant,
    transactionType: candidate.direction,
    userId: DEFAULT_USER_ID,
  });

  const matchedCategory = result.suggestedCategory
    ? categories.find((entry) => entry.label.toLowerCase() === result.suggestedCategory?.toLowerCase()) ?? null
    : null;
  const categoryProposalId = result.categoryProposal?.proposedName
    ? upsertCategoryProposal({
        linkedCandidateId: candidateId,
        proposedName: result.categoryProposal.proposedName,
      })
    : null;

  applyAiClassificationResult({
    candidateId,
    categoryId: matchedCategory?.id ?? null,
    categoryProposalId,
    confidence: result.confidence ? Math.round(result.confidence * 100) : null,
    merchantKey: normalizeMerchantKey(candidate.merchant),
    reason: result.reason,
    suggestedCategoryLabel: result.suggestedCategory ?? result.categoryProposal?.proposedName ?? null,
  });
}

async function processFeedbackItem(payloadJson: string) {
  const payload = JSON.parse(payloadJson) as {
    aiSuggestedCategory: string | null;
    finalCategory: string;
    merchantKey: string | null;
    merchantName: string | null;
    userId: string;
    wasAiCorrect: boolean;
  };

  await aiTransport.submitFeedback(payload);
}

async function syncRemoteAiJob(jobId: string) {
  const job = getAiJobById(jobId);
  if (!job?.backendJobId) {
    return;
  }

  const snapshot = await aiTransport.getJobSnapshot(job.backendJobId);
  if (!snapshot) {
    return;
  }

  updateAiJobFromBackend({
    backendJobId: snapshot.batchId,
    completedAt: isRemoteBatchTerminal(snapshot.status) ? Date.now() : null,
    jobId,
    progress: getBatchProgress(snapshot),
    status: mapBatchStatusToJobStatus(snapshot.status),
  });

  if (!isRemoteBatchTerminal(snapshot.status)) {
    emitAiQueueUpdate();
    return;
  }

  const results = await aiTransport.getJobResults(job.backendJobId);
  if (results) {
    await applyRemoteBatchResults(jobId, results);
  }

  emitAiQueueUpdate();
}

async function applyRemoteBatchResults(jobId: string, results: RemoteBatchResults) {
  const items = listAiJobItems(jobId);
  const itemByMessageId = new Map(items.map((item) => [item.itemId, item]));
  const messages = listSmsMessagesForAiParse(items.map((item) => item.itemId));
  const hashGroups = new Map<string, typeof messages>();

  for (const message of messages) {
    const hash = await hashSmsBody(message.body);
    const group = hashGroups.get(hash) ?? [];
    group.push(message);
    hashGroups.set(hash, group);
  }

  const categories = listCategories();
  let firstError: string | null = null;

  for (const result of results.results) {
    const matchedMessages = hashGroups.get(result.rawSmsHash) ?? [];
    if (matchedMessages.length === 0) {
      continue;
    }

    if (
      result.status !== "completed" ||
      !result.parsedTransaction ||
      !result.parsedTransaction.amount ||
      !result.parsedTransaction.currency ||
      !result.parsedTransaction.merchantName ||
      !isSupportedTransactionType(result.parsedTransaction.transactionType)
    ) {
      const errorMessage = result.errorMessage ?? "AI batch item failed.";
      firstError ??= errorMessage;
      for (const message of matchedMessages) {
        const item = itemByMessageId.get(message.id);
        if (item) {
          markAiJobItemFailed(item.id, errorMessage);
        }
      }
      continue;
    }

    for (const message of matchedMessages) {
      const item = itemByMessageId.get(message.id);
      if (!item) {
        continue;
      }

      applyParsedTransactionToMessage(
        message.id,
        message.receivedAt,
        result.parsedTransaction as RemoteParsedSms & {
          transactionType: "expense" | "income";
        },
      );
      const candidateIds = listSmsCandidateIdsForMessageIds([message.id]);
      applyRemoteClassificationToCandidates(
        candidateIds,
        result.classification,
        result.parsedTransaction,
        categories,
      );
      markAiJobItemCompleted(item.id, {
        classification: result.classification,
        parsedTransaction: result.parsedTransaction,
      });
    }
  }

  for (const item of items) {
    if (!messages.find((message) => message.id === item.itemId)) {
      markAiJobItemFailed(item.id, "SMS message missing while applying AI batch results.");
      firstError ??= "SMS message missing while applying AI batch results.";
    }
  }

  updateAiJobFromBackend({
    completedAt: Date.now(),
    jobId,
    lastError: firstError,
    progress: 100,
    status:
      results.status === "failed" || results.status === "cancelled"
        ? "failed"
        : "completed",
  });
}

function applyParsedTransactionToMessage(
  messageId: string,
  receivedAt: number,
  parsed: RemoteParsedSms & { transactionType: "expense" | "income" },
) {
  applyAiParsedSmsResult({
    amountMinor: Math.round((parsed.amount ?? 0) * 100),
    cleanDescription: parsed.cleanDescription,
    confidence: Math.round(parsed.confidence * 100),
    currency: parsed.currency,
    direction: parsed.transactionType,
    merchant: parsed.merchantName ?? "SMS transaction",
    messageId,
    notes: parsed.cleanDescription || undefined,
    occurredAt: receivedAt,
    parserKey: `ai:${parsed.provider}`,
    reference: parsed.reference,
  });
}

function applyRemoteClassificationToCandidates(
  candidateIds: string[],
  result: RemoteClassification | null,
  parsed: RemoteParsedSms,
  categories: ReturnType<typeof listCategories>,
) {
  if (candidateIds.length === 0 || !result) {
    return;
  }

  const matchedCategory = result.suggestedCategory
    ? categories.find(
        (entry) =>
          normalizeLabelKey(entry.label) === normalizeLabelKey(result.suggestedCategory ?? ""),
      ) ?? null
    : null;
  const proposalName =
    result.categoryProposal?.proposedName ??
    (result.suggestedCategory && !matchedCategory ? result.suggestedCategory : null);

  for (const candidateId of candidateIds) {
    const categoryProposalId = proposalName
      ? upsertCategoryProposal({
          linkedCandidateId: candidateId,
          proposedName: proposalName,
        })
      : null;

    if (result.source === "merchant_memory" && matchedCategory?.id) {
      applyMerchantMemorySuggestion({
        candidateId,
        categoryId: matchedCategory.id,
        confidence: result.confidence ? Math.round(result.confidence * 100) : 90,
        merchantKey: normalizeMerchantKey(parsed.merchantName),
      });
      continue;
    }

    applyAiClassificationResult({
      candidateId,
      categoryId: matchedCategory?.id ?? null,
      categoryProposalId,
      confidence: result.confidence ? Math.round(result.confidence * 100) : null,
      merchantKey: normalizeMerchantKey(parsed.merchantName),
      reason: result.reason,
      suggestedCategoryLabel: result.suggestedCategory ?? proposalName ?? null,
    });
  }
}

function resolveCandidatesForAi(candidateIds = listSmsCandidateIdsNeedingAi()) {
  const candidates = listSmsCandidatesForClassification(candidateIds);
  const queueableIds: string[] = [];

  for (const candidate of candidates) {
    if (candidate.categoryId && candidate.classificationStatus === "not_needed" && candidate.confidence >= 85) {
      continue;
    }

    const memoryMatch = findMerchantMemory(candidate.merchant);
    if (memoryMatch) {
      applyMerchantMemorySuggestion({
        candidateId: candidate.id,
        categoryId: memoryMatch.categoryId,
        confidence: memoryMatch.confidence,
        merchantKey: memoryMatch.merchantKey,
      });
      continue;
    }

    queueableIds.push(candidate.id);
  }

  return queueableIds;
}

function isSupportedTransactionType(value: string): value is "income" | "expense" {
  return value === "income" || value === "expense";
}

function shouldUseRemoteBatchParse(
  scope: "sms_single" | "sms_batch" | "import_batch",
  jobType: string,
  itemCount: number,
) {
  return aiTransport.isConfigured && jobType === "parse_sms" && scope !== "sms_single" && itemCount > 0;
}

function mapBatchStatusToJobStatus(
  status: RemoteBatchSnapshot["status"],
): "pending" | "running" | "completed" | "failed" {
  switch (status) {
    case "completed":
    case "partially_completed":
      return "completed";
    case "failed":
    case "cancelled":
      return "failed";
    case "queued":
      return "pending";
    default:
      return "running";
  }
}

function getBatchProgress(snapshot: RemoteBatchSnapshot) {
  if (snapshot.totalJobs <= 0) {
    return 0;
  }

  return Math.round(((snapshot.completedJobs + snapshot.failedJobs) / snapshot.totalJobs) * 100);
}

function isRemoteBatchTerminal(status: RemoteBatchSnapshot["status"]) {
  return (
    status === "completed" ||
    status === "partially_completed" ||
    status === "failed" ||
    status === "cancelled"
  );
}

async function hashSmsBody(body: string) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure hashing is unavailable in this runtime.");
  }

  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(body),
  );

  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

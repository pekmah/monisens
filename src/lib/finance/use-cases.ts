import {
  connectAiJobStream,
  enqueuePendingSmsAiJobs,
  getAiTransportCapabilities,
  hasAiBackend,
  runAiQueue,
  syncRemoteAiJobByBackendId,
  syncRemoteAiJobs,
  supportsAiStreaming,
} from "@/lib/ai/queue";
import {
  createAiFeedbackEvent,
  getAiSnapshot,
  rejectCategoryProposal,
  retryFailedAiJobs,
  upsertMerchantMemory,
} from "@/lib/ai/repository";
import { normalizeMerchantKey } from "@/lib/ai/utils";
import { DEFAULT_SMS_IMPORT_LIMIT } from "@/lib/finance/constants";
import { applyFinanceMigrations } from "@/lib/finance/migrations";
import {
  ensureSmsSyncStateRow,
  archiveBill,
  approvePendingCategoryProposal,
  createSmsSourceProfile,
  createBill,
  createCategory,
  duplicateSmsSourceProfile,
  generateUpcomingBillOccurrences,
  getSmsCandidateFeedbackContext,
  createBudget,
  createTransaction,
  deleteSmsSourceProfile,
  ensureDefaultCategories,
  ensureDefaultSmsSourceProfiles,
  deleteCategory,
  getFinanceSnapshot,
  getBillById,
  getCategoryLearningContext,
  listBillTransactionMatches,
  getSmsSyncState,
  getSmsSourceProfileGroups,
  getTransactionById,
  listIgnoredSmsMessages,
  listPendingSmsCandidatesPage,
  softDeleteTransaction,
  reorderSmsSourceProfiles,
  setSmsImportLimit,
  linkBillOccurrenceToTransaction,
  unlinkBillOccurrencePayment,
  updateCategory,
  updateBill,
  updateSmsSourceProfile,
  updateSmsCandidateCategory,
  updateTransaction,
} from "@/lib/finance/repository";
import type {
  AiSnapshot,
  CreateBillInput,
  CreateTransactionInput,
  FinanceSnapshot,
  SmsCandidatePage,
  SmsPermissionState,
} from "@/lib/finance/types";
import {
  ensureSmsListeningPermission,
  getSmsPermissionStatus,
  readSmsInbox,
  requestSmsPermission,
  startSmsListening,
  stopSmsListening,
  type NativeSmsMessage,
} from "@/lib/sms-native";
import { reprocessSmsMessageById } from "@/lib/sms-source";
import {
  acceptSmsCandidateUseCase,
  dismissSmsCandidateUseCase,
  getSmsListenerEnabled,
  importSmsMessages,
  recordSmsListenerEvent,
  setSmsListenerEnabled,
  setSmsSyncError,
} from "@/lib/sms-sync";

export function bootstrapFinanceStore() {
  applyFinanceMigrations();
  ensureDefaultCategories();
  ensureDefaultSmsSourceProfiles();
  ensureSmsSyncStateRow();
  generateUpcomingBillOccurrences();
}

export function loadFinanceSnapshot(input: {
  isOnline: boolean;
  smsPermissionState: SmsPermissionState;
  searchText?: string;
}): FinanceSnapshot {
  const aiCapabilities = getAiTransportCapabilities();
  generateUpcomingBillOccurrences();
  return getFinanceSnapshot({
    aiConfigured: aiCapabilities.isConfigured,
    aiSupportsStreaming: aiCapabilities.supportsStreaming,
    hasRemote: false,
    isOnline: input.isOnline,
    smsPermissionState: input.smsPermissionState,
    searchText: input.searchText,
    status: "idle",
  });
}

export function createBillUseCase(input: CreateBillInput) {
  return createBill(input);
}

export function updateBillUseCase(id: string, input: Partial<CreateBillInput>) {
  updateBill(id, input);
}

export function archiveBillUseCase(id: string) {
  archiveBill(id);
}

export function loadBillByIdUseCase(id: string) {
  return getBillById(id);
}

export function loadBillTransactionMatchesUseCase(occurrenceId: string) {
  return listBillTransactionMatches(occurrenceId);
}

export function linkBillOccurrenceToTransactionUseCase(input: {
  occurrenceId: string;
  transactionId: string;
}) {
  linkBillOccurrenceToTransaction(input);
}

export function unlinkBillOccurrencePaymentUseCase(occurrenceId: string) {
  unlinkBillOccurrencePayment(occurrenceId);
}

export function createBudgetUseCase(input: {
  amount: string;
  categoryId: string;
  monthKey?: string;
  notes?: string;
}) {
  return createBudget(input);
}

export function createCategoryUseCase(input: {
  color: string;
  label: string;
}) {
  return createCategory(input);
}

export function updateCategoryUseCase(input: {
  color: string;
  id: string;
  label: string;
}) {
  updateCategory(input);
}

export function deleteCategoryUseCase(id: string) {
  deleteCategory(id);
}

export function createTransactionUseCase(input: CreateTransactionInput) {
  const id = createTransaction(input);
  const transaction = getTransactionById(id);

  if (transaction?.categoryId && transaction.merchant.trim()) {
    queueMerchantLearningFeedback({
      amountMinor: transaction.amountMinor,
      correctionType: "manual_teach",
      direction: transaction.direction,
      entityId: id,
      entityType: "transaction",
      finalCategoryId: transaction.categoryId,
      finalCategoryLabel: transaction.categoryLabel,
      merchantName: transaction.merchant,
    });
  }

  return id;
}

export function updateTransactionUseCase(id: string, input: Partial<CreateTransactionInput>) {
  const before = getTransactionById(id);
  updateTransaction(id, input);
  const after = getTransactionById(id);

  if (
    before
    && after
    && input.categoryId
    && input.categoryId !== before.categoryId
    && after.categoryId
  ) {
    queueMerchantLearningFeedback({
      amountMinor: after.amountMinor,
      correctionType: "corrected",
      direction: after.direction,
      entityId: id,
      entityType: "transaction",
      finalCategoryId: after.categoryId,
      finalCategoryLabel: after.categoryLabel,
      merchantName: after.merchant,
      oldCategoryId: before.categoryId,
      oldCategoryLabel: before.categoryLabel,
    });
  }
}

export function deleteTransactionUseCase(id: string) {
  softDeleteTransaction(id);
}

export function loadTransactionByIdUseCase(id: string) {
  return getTransactionById(id);
}

export async function getSmsPermissionStatusUseCase() {
  return getSmsPermissionStatus();
}

export async function requestSmsPermissionUseCase() {
  return requestSmsPermission();
}

export async function importSmsInboxUseCase(input: {
  limit?: number;
  sinceTimestamp?: number | null;
} = {}) {
  const resolvedLimit =
    input.limit ??
    getSmsSyncState()?.importLimit ??
    DEFAULT_SMS_IMPORT_LIMIT;
  const messages = await readSmsInbox(resolvedLimit, input.sinceTimestamp ?? null);
  const result = await importSmsMessages(messages);
  if (messages.length > 0) {
    enqueuePendingSmsAiJobs(messages.length > 1 ? "import_batch" : "sms_single");
  }
  return result;
}

export function updateSmsImportLimitUseCase(limit: number) {
  return setSmsImportLimit(limit);
}

export async function startSmsListenerUseCase() {
  const permission = await ensureSmsListeningPermission();

  if (permission !== "granted") {
    throw new Error("Live SMS listening needs RECEIVE_SMS permission.");
  }

  await startSmsListening();
  setSmsListenerEnabled(true);
}

export async function stopSmsListenerUseCase() {
  await stopSmsListening();
  setSmsListenerEnabled(false);
}

export function getSmsListenerEnabledUseCase() {
  return getSmsListenerEnabled();
}

export function handleIncomingSmsUseCase(message: NativeSmsMessage) {
  recordSmsListenerEvent(message);
  enqueuePendingSmsAiJobs("sms_single");
}

export function setSmsSyncErrorUseCase(message: string | null) {
  setSmsSyncError(message);
}

export function acceptSmsCandidateReviewUseCase(id: string) {
  const feedbackContext = getSmsCandidateFeedbackContext(id);
  const transactionId = acceptSmsCandidateUseCase(id);

  if (feedbackContext?.merchantKey && feedbackContext.categoryId) {
    upsertMerchantMemory({
      categoryId: feedbackContext.categoryId,
      confidence: 100,
      merchantKey: feedbackContext.merchantKey,
      merchantName: feedbackContext.merchant,
      source: "user",
    });
  }

  if (
    feedbackContext?.suggestedCategoryLabel &&
    feedbackContext.categoryId &&
    feedbackContext.categoryLabel
  ) {
    const wasAiCorrect =
      feedbackContext.categoryLabel.toLowerCase() ===
      feedbackContext.suggestedCategoryLabel.toLowerCase();

    createAiFeedbackEvent({
      aiConfidence: feedbackContext.classificationConfidence,
      aiSuggestedCategoryLabel: feedbackContext.suggestedCategoryLabel,
      amountMinor: feedbackContext.amountMinor,
      classificationSource: feedbackContext.suggestedCategoryLabel
        ? "ai"
        : feedbackContext.classificationSource,
      correctionType: wasAiCorrect ? "confirmed" : "corrected",
      direction: feedbackContext.direction,
      entityId: id,
      entityType: "sms_candidate",
      finalCategoryId: feedbackContext.categoryId,
      finalCategoryLabel: feedbackContext.categoryLabel,
      merchantKey: feedbackContext.merchantKey,
      merchantName: feedbackContext.merchant,
    });
  }

  return transactionId;
}

function queueMerchantLearningFeedback(input: {
  amountMinor: number;
  correctionType: "confirmed" | "corrected" | "manual_teach" | "dismissed";
  direction: "expense" | "income";
  entityId: string;
  entityType: "sms_candidate" | "transaction" | "bill_payment";
  finalCategoryId: string;
  finalCategoryLabel: string;
  merchantName: string;
  oldCategoryId?: string | null;
  oldCategoryLabel?: string | null;
}) {
  const merchantKey = normalizeMerchantKey(input.merchantName);
  if (!merchantKey) {
    return;
  }

  const finalCategory = getCategoryLearningContext(input.finalCategoryId);
  if (!finalCategory) {
    return;
  }

  upsertMerchantMemory({
    categoryId: finalCategory.id,
    confidence: input.correctionType === "manual_teach" ? 92 : 100,
    merchantKey,
    merchantName: input.merchantName,
    source: "user",
  });

  createAiFeedbackEvent({
    amountMinor: input.amountMinor,
    correctionType: input.correctionType,
    direction: input.direction,
    entityId: input.entityId,
    entityType: input.entityType,
    finalCategoryId: finalCategory.id,
    finalCategoryLabel: finalCategory.label,
    merchantKey,
    merchantName: input.merchantName,
    oldCategoryId: input.oldCategoryId ?? null,
    oldCategoryLabel: input.oldCategoryLabel ?? null,
  });
}

export function dismissSmsCandidateReviewUseCase(id: string) {
  dismissSmsCandidateUseCase(id);
}

export function updateSmsCandidateCategoryUseCase(id: string, categoryId: string | null) {
  updateSmsCandidateCategory({
    candidateId: id,
    categoryId,
  });
}

export function loadSmsSourceProfileGroupsUseCase() {
  return getSmsSourceProfileGroups();
}

export function createSmsSourceProfileUseCase(input: {
  action: "process" | "exclude";
  description?: string | null;
  enabled: boolean;
  label: string;
  matchers: Array<{
    caseSensitive: boolean;
    enabled: boolean;
    field: "sender" | "body";
    matchType: "exact" | "contains" | "regex";
    pattern: string;
  }>;
  parserKey: "mpesa" | "bank-credit-debit" | "none";
}) {
  return createSmsSourceProfile(input);
}

export function updateSmsSourceProfileUseCase(input: {
  action: "process" | "exclude";
  description?: string | null;
  enabled: boolean;
  id: string;
  label: string;
  matchers: Array<{
    caseSensitive: boolean;
    enabled: boolean;
    field: "sender" | "body";
    id?: string;
    matchType: "exact" | "contains" | "regex";
    pattern: string;
  }>;
  parserKey: "mpesa" | "bank-credit-debit" | "none";
  sortOrder: number;
}) {
  updateSmsSourceProfile(input);
}

export function deleteSmsSourceProfileUseCase(id: string) {
  deleteSmsSourceProfile(id);
}

export function duplicateSmsSourceProfileUseCase(id: string) {
  return duplicateSmsSourceProfile(id);
}

export function reorderSmsSourceProfilesUseCase(ids: string[]) {
  reorderSmsSourceProfiles(ids);
}

export function loadIgnoredSmsMessagesUseCase(limit = 100) {
  return listIgnoredSmsMessages(limit);
}

export function reprocessIgnoredSmsMessageUseCase(messageId: string) {
  reprocessSmsMessageById(messageId);
}

export function loadPendingSmsCandidatesPageUseCase(input: {
  limit: number;
  offset: number;
}): SmsCandidatePage {
  return listPendingSmsCandidatesPage(input);
}

export async function runAiJobQueueUseCase() {
  const result = await runAiQueue();
  await syncRemoteAiJobs();
  return result;
}

export async function syncRemoteAiJobsUseCase() {
  await syncRemoteAiJobs();
}

export function retryAiJobUseCase() {
  retryFailedAiJobs();
}

export function loadAiSnapshotUseCase(): AiSnapshot {
  const capabilities = getAiTransportCapabilities();
  return getAiSnapshot({
    isConfigured: capabilities.isConfigured,
    supportsStreaming: capabilities.supportsStreaming,
  });
}

export function approveCategoryProposalUseCase(id: string) {
  return approvePendingCategoryProposal(id);
}

export function rejectCategoryProposalUseCase(id: string) {
  rejectCategoryProposal(id);
}

export function connectAiJobStreamUseCase(jobId: string, onEvent: Parameters<typeof connectAiJobStream>[1]) {
  if (!supportsAiStreaming() || !hasAiBackend()) {
    return () => undefined;
  }

  return connectAiJobStream(jobId, onEvent);
}

export async function syncRemoteAiJobUseCase(backendJobId: string) {
  await syncRemoteAiJobByBackendId(backendJobId);
}

export function disconnectAiJobStreamUseCase(disconnect: (() => void) | null | undefined) {
  disconnect?.();
}

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
  createAiJob,
  getAiSnapshot,
  rejectCategoryProposal,
  retryFailedAiJobs,
  upsertMerchantMemory,
} from "@/lib/ai/repository";
import { DEFAULT_SMS_IMPORT_LIMIT, DEFAULT_USER_ID } from "@/lib/finance/constants";
import { applyFinanceMigrations } from "@/lib/finance/migrations";
import {
  ensureSmsSyncStateRow,
  approvePendingCategoryProposal,
  createSmsSourceProfile,
  createCategory,
  duplicateSmsSourceProfile,
  getSmsCandidateFeedbackContext,
  createBudget,
  createTransaction,
  deleteSmsSourceProfile,
  ensureDefaultCategories,
  ensureDefaultSmsSourceProfiles,
  deleteCategory,
  getFinanceSnapshot,
  getSmsSyncState,
  getSmsSourceProfileGroups,
  getTransactionById,
  listIgnoredSmsMessages,
  listPendingSmsCandidatesPage,
  seedLocalDemoTransactions,
  softDeleteTransaction,
  reorderSmsSourceProfiles,
  setSmsImportLimit,
  updateCategory,
  updateSmsSourceProfile,
  updateSmsCandidateCategory,
  updateTransaction,
} from "@/lib/finance/repository";
import type {
  AiSnapshot,
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
}

export function loadFinanceSnapshot(input: {
  isOnline: boolean;
  smsPermissionState: SmsPermissionState;
  searchText?: string;
}): FinanceSnapshot {
  const aiCapabilities = getAiTransportCapabilities();
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
  return createTransaction(input);
}

export function seedLocalDemoTransactionsUseCase() {
  return seedLocalDemoTransactions();
}

export function updateTransactionUseCase(id: string, input: Partial<CreateTransactionInput>) {
  updateTransaction(id, input);
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
    feedbackContext?.classificationSource === "ai" &&
    feedbackContext.categoryId &&
    feedbackContext.suggestedCategoryLabel
  ) {
    createAiJob({
      itemIds: [id],
      itemType: "sms_candidate",
      jobType: "submit_feedback",
      payload: {
        aiSuggestedCategory: feedbackContext.suggestedCategoryLabel,
        finalCategory: feedbackContext.categoryLabel,
        merchantKey: feedbackContext.merchantKey,
        merchantName: feedbackContext.merchant,
        userId: DEFAULT_USER_ID,
        wasAiCorrect:
          feedbackContext.categoryLabel.toLowerCase() ===
          feedbackContext.suggestedCategoryLabel.toLowerCase(),
      },
      scope: "sms_single",
    });
  }

  return transactionId;
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

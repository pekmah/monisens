export type SyncStatus =
  | "pending"
  | "syncing"
  | "synced"
  | "failed"
  | "conflict";

export type OutboxStatus = "pending" | "syncing" | "done" | "failed";
export type OutboxOperation = "upsert" | "delete";
export type SyncEntityType =
  | "transaction"
  | "budget"
  | "bill"
  | "bill_occurrence"
  | "category"
  | "import"
  | "attachment";
export type TransactionDirection = "expense" | "income";
export type TransactionSource = "manual" | "sms" | "statement" | "import";
export type BillCadence = "once" | "weekly" | "monthly" | "yearly";
export type BillStatus = "active" | "archived";
export type BillOccurrenceStatus = "due" | "paid" | "skipped";

export type SyncTrigger =
  | "launch"
  | "resume"
  | "write"
  | "manual"
  | "network_reconnect";

export type SyncEngineStatus =
  | "idle"
  | "syncing"
  | "offline"
  | "disabled"
  | "error";

export type SmsPermissionState =
  | "unsupported"
  | "granted"
  | "denied"
  | "unknown";

export type CategoryRecord = {
  color: string;
  id: string;
  isDefault: boolean;
  label: string;
  usageCount: number;
};

export type SmsMessageRecord = {
  body: string;
  createdAt: number;
  fingerprint: string;
  id: string;
  matchScore: number | null;
  parseStatus: "matched" | "ignored" | "failed";
  parserKey: string | null;
  readAt: number | null;
  receivedAt: number;
  sender: string;
  sourceAction: SmsSourceAction | null;
  sourceProfileId: string | null;
  updatedAt: number;
};

export type SmsSourceParserKey = "mpesa" | "bank-credit-debit" | "none";
export type SmsSourceAction = "process" | "exclude";
export type SmsSourceMatchField = "sender" | "body";
export type SmsSourceMatchType = "exact" | "contains" | "regex";

export type SmsSourceMatcherRecord = {
  caseSensitive: boolean;
  createdAt: number;
  enabled: boolean;
  field: SmsSourceMatchField;
  id: string;
  matchType: SmsSourceMatchType;
  pattern: string;
  profileId: string;
  updatedAt: number;
};

export type SmsSourceProfileRecord = {
  action: SmsSourceAction;
  description: string | null;
  enabled: boolean;
  id: string;
  label: string;
  matcherCount: number;
  matchers: SmsSourceMatcherRecord[];
  parserKey: SmsSourceParserKey;
  sortOrder: number;
  updatedAt: number;
};

export type IgnoredSmsMessageRecord = {
  body: string;
  id: string;
  matchScore: number | null;
  parseStatus: "ignored" | "failed";
  parserKey: string | null;
  receivedAt: number;
  sender: string;
  sourceAction: SmsSourceAction | null;
  sourceProfileId: string | null;
  sourceProfileLabel: string | null;
};

export type SmsTransactionCandidateRecord = {
  amountMinor: number;
  aiJobId: string | null;
  categoryId: string | null;
  categoryLabel: string;
  categoryProposalId: string | null;
  classificationConfidence: number | null;
  classificationReason: string | null;
  classificationSource: "rule" | "merchant_memory" | "ai" | "user";
  classificationStatus: "not_needed" | "queued" | "processing" | "classified" | "failed";
  confidence: number;
  createdAt: number;
  currency: string;
  direction: TransactionDirection;
  id: string;
  merchantKey: string | null;
  merchant: string;
  notes: string | null;
  occurredAt: number;
  parserKey: string | null;
  reference: string | null;
  smsBody: string;
  smsMessageId: string;
  smsReceivedAt: number;
  smsSender: string;
  suggestedCategoryLabel: string | null;
  status: "pending" | "accepted" | "dismissed";
  transactionId: string | null;
  updatedAt: number;
};

export type ParsedSmsCandidate = {
  amountMinor: number;
  categoryId: string | null;
  confidence: number;
  currency: string;
  direction: TransactionDirection;
  merchant: string;
  notes?: string;
  occurredAt: number;
  parserKey: string;
  parseStatus: "matched" | "ignored" | "failed";
  reference?: string;
};

export type SmsImportResult = {
  importedCount: number;
  matchedCount: number;
};

export type SmsReviewSnapshot = {
  candidateCount: number;
  failedCandidateCount: number;
  importLimit: number;
  isListenerEnabled: boolean;
  processingCandidateCount: number;
  queuedCandidateCount: number;
  readyCandidateCount: number;
  lastError: string | null;
  lastImportedAt: number | null;
  lastImportCount: number;
  lastListenerEventAt: number | null;
  permissionState: SmsPermissionState;
  supported: boolean;
};

export type SmsCandidatePage = {
  hasMore: boolean;
  items: SmsTransactionCandidateRecord[];
  nextOffset: number;
  totalCount: number;
};

export type AiJobType = "parse_sms" | "classify_candidate" | "submit_feedback";
export type AiJobScope = "sms_single" | "sms_batch" | "import_batch";
export type AiJobStatus = "pending" | "running" | "completed" | "failed";
export type AiJobItemStatus = "pending" | "running" | "completed" | "failed";
export type AiClassificationStatus =
  | "not_needed"
  | "queued"
  | "processing"
  | "classified"
  | "failed";

export type AiJobRecord = {
  attemptCount: number;
  backendJobId: string | null;
  completedAt: number | null;
  createdAt: number;
  id: string;
  jobType: AiJobType;
  lastError: string | null;
  nextRetryAt: number | null;
  payloadJson: string;
  progress: number;
  scope: AiJobScope;
  status: AiJobStatus;
  updatedAt: number;
};

export type AiJobItemRecord = {
  id: string;
  itemId: string;
  itemType: "sms_message" | "sms_candidate" | "feedback_event";
  jobId: string;
  lastError: string | null;
  resultJson: string | null;
  status: AiJobItemStatus;
  updatedAt: number;
};

export type AiFeedbackCorrectionType =
  | "confirmed"
  | "corrected"
  | "manual_teach"
  | "dismissed";

export type CategoryProposalRecord = {
  id: string;
  linkedCandidateId: string | null;
  normalizedName: string;
  proposedName: string;
  status: "pending" | "approved" | "rejected";
  updatedAt: number;
};

export type AiClassificationResult = {
  categoryId: string | null;
  categoryProposalId: string | null;
  confidence: number | null;
  reason: string | null;
  source: "merchant_memory" | "ai" | "none";
  suggestedCategoryLabel: string | null;
};

export type AiBackendAvailability = {
  isConfigured: boolean;
  lastError: string | null;
  status: "available" | "unconfigured" | "unreachable";
  supportsStreaming: boolean;
};

export type AiStreamEvent = {
  event:
    | "job.accepted"
    | "job.queued"
    | "job.processing"
    | "job.progress"
    | "job.completed"
    | "job.failed";
  jobId: string;
  payload: Record<string, unknown>;
};

export type AiSnapshot = {
  activeBatchJob: AiJobRecord | null;
  backend: AiBackendAvailability;
  failedJobCount: number;
  feedbackEventCount: number;
  merchantMemoryCount: number;
  pendingCategoryProposals: CategoryProposalRecord[];
  pendingJobCount: number;
  recentJobs: AiJobRecord[];
  runningJobCount: number;
};

export type BudgetRecord = {
  amountMinor: number;
  categoryColor: string;
  categoryId: string;
  categoryLabel: string;
  createdAt: number;
  deletedAt: number | null;
  id: string;
  monthKey: string;
  notes: string | null;
  spentMinor: number;
  syncStatus: SyncStatus;
  updatedAt: number;
  version: number;
};

export type BudgetAllocationRecord = {
  accent: string;
  budget: string;
  id: string;
  label: string;
  meta: string;
  remaining: string;
  spent: string;
  status: string;
  value: number;
};

export type BudgetOverviewRecord = {
  allocatedMinor: number;
  bufferMinor: number;
  daysLeft: number;
  limitMinor: number;
  remainingMinor: number;
  runwayStatus: string;
  safePerDayMinor: number;
  spentMinor: number;
};

export type BillRecord = {
  accountLabel: string;
  amountMinor: number;
  cadence: BillCadence;
  categoryColor: string;
  categoryId: string | null;
  categoryLabel: string;
  createdAt: number;
  currency: string;
  deletedAt: number | null;
  endAt: number | null;
  expectedMerchant: string;
  id: string;
  merchantPattern: string | null;
  name: string;
  notes: string | null;
  occurrenceCount: number | null;
  startAt: number;
  status: BillStatus;
  syncStatus: SyncStatus;
  updatedAt: number;
  version: number;
};

export type BillOccurrenceRecord = {
  amountMinor: number;
  billId: string;
  billName: string;
  categoryColor: string;
  categoryId: string | null;
  categoryLabel: string;
  currency: string;
  dueAt: number;
  id: string;
  linkedTransactionAmountMinor: number | null;
  linkedTransactionAt: number | null;
  linkedTransactionId: string | null;
  linkedTransactionMerchant: string | null;
  matchConfidence: number | null;
  matchReason: string | null;
  paidAt: number | null;
  periodKey: string;
  status: BillOccurrenceStatus;
  state: "overdue" | "due_soon" | "upcoming" | "paid";
  updatedAt: number;
};

export type BillTransactionMatchRecord = {
  amount: string;
  amountMinor: number;
  categoryLabel: string;
  confidence: number;
  currency: string;
  id: string;
  merchant: string;
  meta: string;
  reason: string;
  transactionAt: number;
};

export type BillsSnapshot = {
  dueSoonCount: number;
  monthlyImpactMinor: number;
  occurrences: BillOccurrenceRecord[];
  overdueCount: number;
  paidThisPeriodCount: number;
  schedules: BillRecord[];
  upcomingCount: number;
};

export type CreateBillInput = {
  accountLabel?: string;
  amount: string;
  cadence: BillCadence;
  categoryId?: string | null;
  currency?: string;
  endAt?: number | null;
  expectedMerchant: string;
  merchantPattern?: string | null;
  name: string;
  notes?: string | null;
  occurrenceCount?: number | null;
  startAt: number;
};

export type UpdateBillInput = Partial<CreateBillInput>;

export type ImportRecord = {
  createdAt: number;
  deletedAt: number | null;
  fileName: string;
  id: string;
  rowCount: number;
  source: string;
  status: "draft" | "reviewed" | "synced";
  syncStatus: SyncStatus;
  updatedAt: number;
  version: number;
};

export type AttachmentRecord = {
  createdAt: number;
  deletedAt: number | null;
  id: string;
  linkedEntityId: string | null;
  linkedEntityType: SyncEntityType | null;
  localUri: string;
  mimeType: string;
  status: "local" | "uploaded" | "failed";
  syncStatus: SyncStatus;
  updatedAt: number;
  version: number;
};

export type TransactionRecord = {
  accountLabel: string;
  amountMinor: number;
  categoryColor: string;
  categoryId: string | null;
  categoryLabel: string;
  createdAt: number;
  currency: string;
  deletedAt: number | null;
  direction: TransactionDirection;
  id: string;
  merchant: string;
  notes: string | null;
  reference: string | null;
  source: TransactionSource;
  syncStatus: SyncStatus;
  transactionAt: number;
  updatedAt: number;
  version: number;
};

export type MonthlyTotalsRecord = {
  expenseMinor: number;
  incomeMinor: number;
  monthKey: string;
  netMinor: number;
  transactionCount: number;
};

export type CategorySummaryRecord = {
  amountMinor: number;
  categoryColor: string;
  categoryId: string | null;
  categoryLabel: string;
  monthKey: string;
  transactionCount: number;
};

export type TransactionSectionItem = {
  accent: string;
  amountMinor: number;
  amountLabel: string;
  category: string;
  currency: string;
  direction: "expense" | "income";
  id: string;
  hint?: string;
  time: string;
  title: string;
};

export type TransactionSectionRecord = {
  data: TransactionSectionItem[];
  title: string;
};

export type DashboardTransactionRecord = {
  accent: string;
  amount: string;
  bg: string;
  id: string;
  meta: string;
  title: string;
};

export type BreakdownRecord = {
  amount: number;
  color: string;
  id: string;
  label: string;
  value: string;
};

export type InsightAllocationRecord = {
  amountLabel: string;
  color: string;
  label: string;
  percentage: number;
};

export type InsightSubscriptionRecord = {
  accent: string;
  amount: string;
  amountMinor: number;
  categoryId: string | null;
  id: string;
  meta: string;
  title: string;
};

export type SpendingAlertRecord = {
  alertAmountMinor: number | null;
  alertDescription: string;
  alertTitle: string;
  burnRateMinor: number;
  status: "on_track" | "over_budget";
};

export type TrajectoryPointRecord = {
  label: string;
  valueMinor: number;
};

export type TrajectoryRecord = {
  changePercentage: number | null;
  monthLabel: string;
  points: TrajectoryPointRecord[];
  totalMinor: number;
  trend: "down" | "flat" | "up";
};

export type SyncSnapshot = {
  errorMessage: string | null;
  failedEntityCount: number;
  hasRemote: boolean;
  isOnline: boolean;
  lastAttemptedAt: number | null;
  lastSuccessfulSyncAt: number | null;
  openConflictCount: number;
  pendingOutboxCount: number;
  syncedEntityCount: number;
  syncingEntityCount: number;
  status: SyncEngineStatus;
  trackedEntityCount: number;
  unsyncedEntityCount: number;
};

export type FinanceSnapshot = {
  ai: AiSnapshot;
  attachments: AttachmentRecord[];
  bills: BillsSnapshot;
  budgetAllocations: BudgetAllocationRecord[];
  budgetOverview: BudgetOverviewRecord | null;
  budgets: BudgetRecord[];
  breakdown: BreakdownRecord[];
  categories: CategoryRecord[];
  currentMonthTotals: MonthlyTotalsRecord | null;
  dashboardTransactions: DashboardTransactionRecord[];
  imports: ImportRecord[];
  insightAllocations: InsightAllocationRecord[];
  insightSubscriptions: InsightSubscriptionRecord[];
  sms: SmsReviewSnapshot;
  spendingAlert: SpendingAlertRecord | null;
  sync: SyncSnapshot;
  trajectory: TrajectoryRecord | null;
  transactionSections: TransactionSectionRecord[];
  transactions: TransactionRecord[];
};

export type SmsSourceProfileGroup = {
  disabled: SmsSourceProfileRecord[];
  exclusions: SmsSourceProfileRecord[];
  processing: SmsSourceProfileRecord[];
};

export type CreateTransactionInput = {
  accountLabel?: string;
  amount: string;
  categoryId: string;
  currency?: string;
  direction: TransactionDirection;
  merchant: string;
  notes?: string;
  reference?: string;
  source?: TransactionSource;
  transactionAt?: number;
};

export type UpdateTransactionInput = Partial<
  Omit<CreateTransactionInput, "amount"> & { amount: string }
>;

export type PushChangePayload = {
  baseVersion: number;
  clientId: string;
  clientTimestamp: number;
  dedupeKey: string;
  entityId: string;
  entityType: SyncEntityType;
  operation: OutboxOperation;
  payload: Record<string, unknown>;
};

export type PushResult = {
  row: Record<string, unknown> | null;
  serverUpdatedAt: number;
  version: number;
};

export type PullChangeRecord = {
  cursor: string;
  entityId: string;
  entityType: SyncEntityType;
  operation: OutboxOperation;
  row: Record<string, unknown> | null;
  serverUpdatedAt: number;
  version: number;
};

export type PullResult = {
  changes: PullChangeRecord[];
  hasMore: boolean;
  nextCursor: string | null;
};

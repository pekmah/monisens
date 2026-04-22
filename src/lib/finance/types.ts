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
  | "import"
  | "attachment";
export type TransactionDirection = "expense" | "income";
export type TransactionSource = "manual" | "sms" | "statement" | "import";

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

export type CategoryRecord = {
  color: string;
  id: string;
  label: string;
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
  amountLabel: string;
  category: string;
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
  label: string;
  value: string;
};

export type SyncSnapshot = {
  errorMessage: string | null;
  hasRemote: boolean;
  isOnline: boolean;
  lastAttemptedAt: number | null;
  lastSuccessfulSyncAt: number | null;
  openConflictCount: number;
  pendingOutboxCount: number;
  status: SyncEngineStatus;
};

export type FinanceSnapshot = {
  attachments: AttachmentRecord[];
  budgetAllocations: BudgetAllocationRecord[];
  budgetOverview: BudgetOverviewRecord | null;
  budgets: BudgetRecord[];
  breakdown: BreakdownRecord[];
  categories: CategoryRecord[];
  currentMonthTotals: MonthlyTotalsRecord | null;
  dashboardTransactions: DashboardTransactionRecord[];
  imports: ImportRecord[];
  sync: SyncSnapshot;
  transactionSections: TransactionSectionRecord[];
  transactions: TransactionRecord[];
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

export const MONISENS_DB_NAME = "monisens.db";
export const DEFAULT_USER_ID = "local-device-user";
export const DEFAULT_SYNC_SCOPE = "default";

export const SYNC_PUSH_BATCH_SIZE = 25;
export const SYNC_PULL_BATCH_SIZE = 100;

export const RETRY_BACKOFF_SCHEDULE_MS = [
  30_000,
  120_000,
  600_000,
  1_800_000,
  7_200_000,
] as const;

export const SYNC_LOCK_STALE_AFTER_MS = 60_000;

export const DEFAULT_CURRENCY = "KES";
export const DEFAULT_ACCOUNT_LABEL = "Primary Wallet";
export const DEFAULT_TRANSACTION_SOURCE = "manual";

export const DEFAULT_FINANCE_CATEGORIES = [
  { color: "#ef4444", id: "cat-food", label: "Food & Dining" },
  { color: "#f97316", id: "cat-transport", label: "Transport" },
  { color: "#eab308", id: "cat-shopping", label: "Shopping" },
  { color: "#22c55e", id: "cat-income", label: "Income" },
  { color: "#06b6d4", id: "cat-bills", label: "Bills & Utilities" },
  { color: "#3b82f6", id: "cat-entertainment", label: "Entertainment" },
  { color: "#8b5cf6", id: "cat-health", label: "Health" },
  { color: "#ec4899", id: "cat-personal", label: "Personal Care" },
  { color: "#14b8a6", id: "cat-savings", label: "Savings" },
  { color: "#64748b", id: "cat-other", label: "Other" },
] as const;

export const CATEGORY_COLOR_OPTIONS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
] as const;

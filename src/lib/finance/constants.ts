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
export const DEFAULT_SMS_IMPORT_LIMIT = 250;

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
  "#f87171",
  "#dc2626",
  "#b91c1c",
  "#f97316",
  "#fb923c",
  "#ea580c",
  "#c2410c",
  "#eab308",
  "#facc15",
  "#ca8a04",
  "#a16207",
  "#22c55e",
  "#4ade80",
  "#16a34a",
  "#15803d",
  "#84cc16",
  "#65a30d",
  "#166534",
  "#06b6d4",
  "#22d3ee",
  "#0891b2",
  "#0e7490",
  "#14b8a6",
  "#2dd4bf",
  "#0f766e",
  "#3b82f6",
  "#60a5fa",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  "#6366f1",
  "#4f46e5",
  "#4338ca",
  "#8b5cf6",
  "#a78bfa",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#9333ea",
  "#c084fc",
  "#ec4899",
  "#f472b6",
  "#db2777",
  "#be185d",
  "#e11d48",
  "#fb7185",
  "#10b981",
  "#34d399",
  "#64748b",
  "#94a3b8",
  "#475569",
  "#334155",
  "#111827",
  "#4b5563",
  "#6b7280",
  "#a3a3a3",
  "#525252",
  "#854d0e",
  "#7c2d12",
] as const;

export const SMS_SOURCE_PARSER_KEYS = [
  "mpesa",
  "bank-credit-debit",
  "none",
] as const;

export const SMS_SOURCE_ACTIONS = ["process", "exclude"] as const;

export const SMS_SOURCE_MATCH_FIELDS = ["sender", "body"] as const;

export const SMS_SOURCE_MATCH_TYPES = ["exact", "contains", "regex"] as const;

export const DEFAULT_SMS_SOURCE_PROFILES = [
  {
    action: "process",
    description: "M-PESA payment and transfer confirmations.",
    id: "sms-source-mpesa",
    label: "M-PESA Payments",
    matchers: [
      {
        caseSensitive: false,
        field: "sender",
        id: "sms-source-mpesa-sender",
        matchType: "regex",
        pattern: "mpesa|m-pesa",
      },
      {
        caseSensitive: false,
        field: "body",
        id: "sms-source-mpesa-body",
        matchType: "contains",
        pattern: "ksh",
      },
    ],
    parserKey: "mpesa",
    sortOrder: 100,
  },
  {
    action: "process",
    description: "Bank debit and credit alerts from supported institutions.",
    id: "sms-source-bank-credit-debit",
    label: "Bank Debit/Credit",
    matchers: [
      {
        caseSensitive: false,
        field: "sender",
        id: "sms-source-bank-sender",
        matchType: "regex",
        pattern: "equity|kcb|ncba|absa|coop|co-op",
      },
      {
        caseSensitive: false,
        field: "body",
        id: "sms-source-bank-body",
        matchType: "regex",
        pattern: "debited|credited|spent|received",
      },
    ],
    parserKey: "bank-credit-debit",
    sortOrder: 200,
  },
  {
    action: "exclude",
    description: "Fuliza facility and loan servicing messages that should not create transactions.",
    id: "sms-source-fuliza",
    label: "Fuliza / Facility Messages",
    matchers: [
      {
        caseSensitive: false,
        field: "body",
        id: "sms-source-fuliza-body",
        matchType: "regex",
        pattern: "fuliza|overdraft|outstanding amount|access fee",
      },
    ],
    parserKey: "none",
    sortOrder: 50,
  },
] as const;

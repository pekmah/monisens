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

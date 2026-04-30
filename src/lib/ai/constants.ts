export const DEFAULT_AI_RUN_BATCH_SIZE = 4;
export const DEFAULT_AI_AUTO_ACCEPT_CONFIDENCE = 80;

export const DEFAULT_AI_RETRY_BACKOFF_MS = [
  15_000,
  60_000,
  300_000,
  900_000,
] as const;

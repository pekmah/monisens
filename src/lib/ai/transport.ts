import type { AiStreamEvent } from "@/lib/finance/types";
import { DEFAULT_USER_ID } from "@/lib/finance/constants";

const DEFAULT_AI_BASE_URL = "https://ai.cruizp.com";

export type RemoteParsedSms = {
  cleanDescription: string;
  confidence: number;
  currency: string;
  merchantName: string | null;
  provider: "mpesa" | "bank" | "unknown";
  reference: string | null;
  removedBalanceText: string | null;
  transactionDate: string | null;
  transactionType: "income" | "expense" | "transfer" | "reversal" | "unknown";
  amount: number | null;
};

export type RemoteClassification = {
  categoryProposal: {
    id: string;
    proposedName: string;
    status: string;
  } | null;
  confidence: number | null;
  needsReview: boolean;
  reason: string | null;
  source: "merchant_memory" | "gemma" | "none";
  suggestedCategory: string | null;
};

export type AiTransport = {
  connectJobStream: (jobId: string, onEvent: (event: AiStreamEvent) => void) => () => void;
  classifyTransaction: (input: {
    cleanDescription: string;
    existingCategories: string[];
    merchantName: string | null;
    transactionType: "income" | "expense";
    userId: string;
    amount: number | null;
  }) => Promise<RemoteClassification>;
  getJobResults: (jobId: string) => Promise<RemoteBatchResults | null>;
  getJobSnapshot: (jobId: string) => Promise<RemoteBatchSnapshot | null>;
  isConfigured: boolean;
  parseSms: (input: { message: string; userId: string }) => Promise<RemoteParsedSms>;
  queueBulkSmsIngest: (input: {
    clientBatchId: string;
    existingCategories: string[];
    messages: string[];
    userId: string;
  }) => Promise<RemoteBatchSnapshot>;
  submitFeedback: (input: {
    aiSuggestedCategory: string | null;
    finalCategory: string;
    merchantKey: string | null;
    merchantName: string | null;
    userId: string;
    wasAiCorrect: boolean;
  }) => Promise<void>;
  supportsStreaming: boolean;
};

export type RemoteBatchSnapshot = {
  batchId: string;
  completedJobs: number;
  createdAt: string;
  failedJobs: number;
  status: "queued" | "processing" | "completed" | "failed" | "partially_completed" | "cancelled";
  totalJobs: number;
  updatedAt: string;
};

export type RemoteBatchResultItem = {
  attemptCount: number;
  classification: RemoteClassification | null;
  createdAt: string;
  errorCode: string | null;
  errorMessage: string | null;
  jobId: string;
  parsedTransaction: RemoteParsedSms | null;
  rawSmsHash: string;
  status: "queued" | "processing" | "completed" | "failed" | "retryable_failed" | "cancelled";
  updatedAt: string;
};

export type RemoteBatchResults = RemoteBatchSnapshot & {
  results: RemoteBatchResultItem[];
};

export class AiTransportDisabledError extends Error {
  constructor(message = "AI backend is not configured.") {
    super(message);
  }
}

export function getConfiguredAiBaseUrl() {
  return process.env.EXPO_PUBLIC_MONISENSE_AI_BASE_URL ?? DEFAULT_AI_BASE_URL;
}

export function getConfiguredAiSecret() {
  return process.env.EXPO_PUBLIC_MONISENSE_AI_SECRET ?? "";
}

export function createAiTransport(): AiTransport {
  const baseUrl = getConfiguredAiBaseUrl();
  const apiSecret = getConfiguredAiSecret();

  if (!baseUrl || !apiSecret) {
    return {
      connectJobStream() {
        return () => undefined;
      },
      async classifyTransaction() {
        throw new AiTransportDisabledError();
      },
      async getJobResults() {
        return null;
      },
      async getJobSnapshot() {
        return null;
      },
      isConfigured: false,
      async parseSms() {
        throw new AiTransportDisabledError();
      },
      async queueBulkSmsIngest() {
        throw new AiTransportDisabledError();
      },
      async submitFeedback() {
        throw new AiTransportDisabledError();
      },
      supportsStreaming: false,
    };
  }

  const headers = {
    "Content-Type": "application/json",
    "x-api-secret": apiSecret,
  };

  return {
    connectJobStream(jobId, onEvent) {
      const controller = new AbortController();

      void consumeEventStream({
        onEvent,
        signal: controller.signal,
        url: `${baseUrl}/v1/ai/bulk/jobs/${jobId}/stream?userId=${encodeURIComponent(DEFAULT_USER_ID)}`,
        headers: {
          "x-api-secret": apiSecret,
        },
      });

      return () => controller.abort();
    },
    async classifyTransaction(input) {
      const response = await fetch(`${baseUrl}/v1/ai/classify-transaction`, {
        body: JSON.stringify({
          existingCategories: input.existingCategories,
          transaction: {
            amount: input.amount,
            cleanDescription: input.cleanDescription,
            merchantName: input.merchantName,
            transactionType: input.transactionType,
          },
          userId: input.userId,
        }),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        throw await buildAiTransportError(response, "classify transaction");
      }

      return (await response.json()) as RemoteClassification;
    },
    async getJobResults(jobId) {
      const response = await fetch(
        `${baseUrl}/v1/ai/bulk/jobs/${jobId}/results?userId=${encodeURIComponent(DEFAULT_USER_ID)}`,
        {
          headers: {
            "x-api-secret": apiSecret,
          },
          method: "GET",
        },
      );

      if (!response.ok) {
        throw await buildAiTransportError(response, "load AI job results");
      }

      return (await response.json()) as RemoteBatchResults;
    },
    async getJobSnapshot(jobId) {
      const response = await fetch(
        `${baseUrl}/v1/ai/bulk/jobs/${jobId}?userId=${encodeURIComponent(DEFAULT_USER_ID)}`,
        {
          headers: {
            "x-api-secret": apiSecret,
          },
          method: "GET",
        },
      );

      if (!response.ok) {
        throw await buildAiTransportError(response, "load AI job status");
      }

      return (await response.json()) as RemoteBatchSnapshot;
    },
    isConfigured: true,
    async parseSms(input) {
      const response = await fetch(`${baseUrl}/v1/ai/parse-sms`, {
        body: JSON.stringify(input),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        throw await buildAiTransportError(response, "parse SMS");
      }

      return (await response.json()) as RemoteParsedSms;
    },
    async queueBulkSmsIngest(input) {
      const response = await fetch(`${baseUrl}/v1/ai/bulk/ingest-sms`, {
        body: JSON.stringify(input),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        throw await buildAiTransportError(response, "queue bulk SMS ingest");
      }

      return (await response.json()) as RemoteBatchSnapshot;
    },
    async submitFeedback(input) {
      const response = await fetch(`${baseUrl}/v1/ai/feedback`, {
        body: JSON.stringify(input),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        throw await buildAiTransportError(response, "submit feedback");
      }
    },
    supportsStreaming: true,
  };
}

async function consumeEventStream(input: {
  headers: Record<string, string>;
  onEvent: (event: AiStreamEvent) => void;
  signal: AbortSignal;
  url: string;
}) {
  const response = await fetch(input.url, {
    headers: input.headers,
    method: "GET",
    signal: input.signal,
  });

  if (!response.ok || !response.body) {
    throw await buildAiTransportError(response, "connect AI event stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!input.signal.aborted) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const event = parseSseFrame(frame);
      if (event) {
        input.onEvent(event);
      }
    }
  }
}

function parseSseFrame(frame: string): AiStreamEvent | null {
  const lines = frame.split(/\r?\n/);
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (dataLines.length === 0) {
    return null;
  }

  const payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
  const jobId = typeof payload.batchId === "string" ? payload.batchId : "";

  return {
    event: normalizeStreamEvent(eventName),
    jobId,
    payload,
  };
}

function normalizeStreamEvent(value: string): AiStreamEvent["event"] {
  switch (value) {
    case "job.processing":
    case "job.progress":
    case "job.completed":
    case "job.failed":
    case "job.queued":
      return value;
    default:
      return "job.progress";
  }
}

async function buildAiTransportError(response: Response, operation: string) {
  const body = await response.text();
  return new Error(`${operation} failed with ${response.status}: ${body || "Unknown error."}`);
}

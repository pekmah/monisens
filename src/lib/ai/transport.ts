import { DEFAULT_USER_ID } from "@/lib/finance/constants";
import type { AiStreamEvent } from "@/lib/finance/types";

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
    messages: Array<
      | string
      | {
          clientMessageId: string;
          message: string;
        }
    >;
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
  clientMessageId?: string | null;
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
      void jobId;
      void onEvent;
      return () => undefined;
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
      const preferredPayload = {
        ...input,
        messages: input.messages,
      };
      let response = await fetch(`${baseUrl}/v1/ai/bulk/ingest-sms`, {
        body: JSON.stringify(preferredPayload),
        headers,
        method: "POST",
      });

      if (!response.ok && input.messages.some((entry) => typeof entry !== "string")) {
        response = await fetch(`${baseUrl}/v1/ai/bulk/ingest-sms`, {
          body: JSON.stringify({
            ...input,
            messages: input.messages.map((entry) =>
              typeof entry === "string" ? entry : entry.message,
            ),
          }),
          headers,
          method: "POST",
        });
      }

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
    supportsStreaming: false,
  };
}

async function buildAiTransportError(response: Response, operation: string) {
  const body = await response.text();
  return new Error(`${operation} failed with ${response.status}: ${body || "Unknown error."}`);
}

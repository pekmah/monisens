import type { PullResult, PushChangePayload, PushResult } from "@/lib/finance/types";

const DEFAULT_CONVEX_CLOUD_URL = "https://formal-meerkat-474.convex.cloud";
const DEFAULT_HTTP_ACTIONS_URL = "https://formal-meerkat-474.convex.site";

export type SyncTransport = {
  isConfigured: boolean;
  pullChanges: (args: { cursor: string | null; limit: number }) => Promise<PullResult>;
  pushChange: (payload: PushChangePayload) => Promise<PushResult>;
};

export class SyncTransportDisabledError extends Error {
  constructor() {
    super("Remote sync is not configured.");
  }
}

export function createSyncTransport(): SyncTransport {
  const pushUrl =
    process.env.EXPO_PUBLIC_CONVEX_SYNC_PUSH_URL ??
    `${DEFAULT_HTTP_ACTIONS_URL}/sync/push`;
  const pullUrl =
    process.env.EXPO_PUBLIC_CONVEX_SYNC_PULL_URL ??
    `${DEFAULT_HTTP_ACTIONS_URL}/sync/pull`;
  const authToken = process.env.EXPO_PUBLIC_CONVEX_SYNC_TOKEN;
  const cloudUrl =
    process.env.EXPO_PUBLIC_CONVEX_CLOUD_URL ?? DEFAULT_CONVEX_CLOUD_URL;

  if (!pushUrl || !pullUrl || !cloudUrl) {
    return {
      isConfigured: false,
      async pullChanges() {
        throw new SyncTransportDisabledError();
      },
      async pushChange() {
        throw new SyncTransportDisabledError();
      },
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  return {
    isConfigured: true,
    async pullChanges(args) {
      const response = await fetch(pullUrl, {
        body: JSON.stringify({
          limit: args.limit,
          sinceCursor: args.cursor,
        }),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        throw await buildTransportError(response, "pull");
      }

      return (await response.json()) as PullResult;
    },
    async pushChange(payload) {
      const response = await fetch(pushUrl, {
        body: JSON.stringify(payload),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        throw await buildTransportError(response, "push");
      }

      return (await response.json()) as PushResult;
    },
  };
}

async function buildTransportError(response: Response, operation: "push" | "pull") {
  const body = await response.text();

  if (body.includes("does not have HTTP actions enabled")) {
    return new Error(
      `Convex ${operation} is pointed at ${DEFAULT_HTTP_ACTIONS_URL}, but HTTP actions are not enabled on that deployment yet.`,
    );
  }

  return new Error(`${operation.toUpperCase()} failed with ${response.status}: ${body || "Unknown error."}`);
}

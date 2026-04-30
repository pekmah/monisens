import { v } from "convex/values";

import { api } from "./_generated/api";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { httpAction, mutation, query } from "./_generated/server";

const DEFAULT_USER_ID = "local-device-user";
const syncEntityType = v.union(
  v.literal("transaction"),
  v.literal("budget"),
  v.literal("category"),
  v.literal("import"),
  v.literal("attachment"),
);
const syncOperation = v.union(v.literal("upsert"), v.literal("delete"));

export type SyncEntityType = "transaction" | "budget" | "category" | "import" | "attachment";
export type SyncOperation = "upsert" | "delete";
type EntityRecord = Record<string, unknown>;

type PushResult = {
  row: Record<string, unknown> | null;
  serverUpdatedAt: number;
  version: number;
};

type PullResult = {
  changes: Array<{
    cursor: string;
    entityId: string;
    entityType: SyncEntityType;
    operation: SyncOperation;
    row: Record<string, unknown> | null;
    serverUpdatedAt: number;
    version: number;
  }>;
  hasMore: boolean;
  nextCursor: string | null;
};

export type PushArgs = {
  baseVersion: number;
  clientId: string;
  clientTimestamp: number;
  dedupeKey: string;
  entityId: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  payload: EntityRecord;
};

export type PullArgs = {
  limit: number;
  sinceCursor?: string;
  userId?: string;
};

export const pushChange = mutation({
  args: {
    baseVersion: v.number(),
    clientId: v.string(),
    clientTimestamp: v.number(),
    dedupeKey: v.string(),
    entityId: v.string(),
    entityType: syncEntityType,
    operation: syncOperation,
    payload: v.any(),
  },
  handler: async (ctx, args): Promise<PushResult> => {
    return pushChangeHandler(ctx, args as PushArgs);
  },
});

export const pullChanges = query({
  args: {
    limit: v.number(),
    sinceCursor: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<PullResult> => {
    return pullChangesHandler(ctx, args);
  },
});

export const pushHttp = httpAction(async (ctx, request) => {
  authorizeRequest(request);
  const body = (await request.json()) as Record<string, unknown>;
  const result = await ctx.runMutation(api.sync.pushChange, {
    baseVersion: toNumber(body.baseVersion),
    clientId: toString(body.clientId),
    clientTimestamp: toNumber(body.clientTimestamp),
    dedupeKey: toString(body.dedupeKey),
    entityId: toString(body.entityId),
    entityType: toEntityType(body.entityType),
    operation: toOperation(body.operation),
    payload: isObject(body.payload) ? body.payload : {},
  });

  return jsonResponse(result);
});

export const pullHttp = httpAction(async (ctx, request) => {
  authorizeRequest(request);
  const body = (await request.json()) as Record<string, unknown>;
  const result = await ctx.runQuery(api.sync.pullChanges, {
    limit: Math.max(1, toNumber(body.limit, 100)),
    sinceCursor: typeof body.sinceCursor === "string" ? body.sinceCursor : undefined,
    userId: typeof body.userId === "string" ? body.userId : undefined,
  });

  return jsonResponse(result);
});

export async function pushChangeHandler(ctx: MutationCtx, args: PushArgs): Promise<PushResult> {
  const userId = getUserId(args.payload);
  const existingMutation = await ctx.db
    .query("clientMutationLog")
    .withIndex("by_user_dedupeKey", (q) => q.eq("userId", userId).eq("dedupeKey", args.dedupeKey))
    .unique();

  if (existingMutation) {
    return {
      row: existingMutation.responseRow ?? null,
      serverUpdatedAt: existingMutation.serverUpdatedAt,
      version: existingMutation.version,
    };
  }

  const now = Date.now();
  const result =
    args.operation === "delete"
      ? await applyDelete(ctx, args.entityType, args.entityId, args.baseVersion, args.payload, userId, now)
      : await applyUpsert(ctx, args.entityType, args.entityId, args.baseVersion, args.payload, userId, now);

  await ctx.db.insert("clientMutationLog", {
    createdAt: now,
    dedupeKey: args.dedupeKey,
    entityId: args.entityId,
    entityType: args.entityType,
    operation: args.operation,
    responseRow: result.row ?? undefined,
    serverUpdatedAt: result.serverUpdatedAt,
    userId,
    version: result.version,
  });

  return result;
}

export async function pullChangesHandler(ctx: QueryCtx, args: PullArgs): Promise<PullResult> {
  const userId = args.userId ?? DEFAULT_USER_ID;
  const sinceSequence = parseCursor(args.sinceCursor);
  const page = await ctx.db
    .query("changeLog")
    .withIndex("by_user_sequence", (q) => q.eq("userId", userId).gt("sequence", sinceSequence))
    .order("asc")
    .take(args.limit + 1);

  const hasMore = page.length > args.limit;
  const items = hasMore ? page.slice(0, args.limit) : page;

  return {
    changes: items.map((item) => ({
      cursor: String(item.sequence),
      entityId: item.entityId,
      entityType: item.entityType,
      operation: item.operation,
      row: item.row ?? null,
      serverUpdatedAt: item.serverUpdatedAt,
      version: item.version,
    })),
    hasMore,
    nextCursor: items.length ? String(items[items.length - 1].sequence) : args.sinceCursor ?? null,
  };
}

async function applyUpsert(
  ctx: MutationCtx,
  entityType: SyncEntityType,
  entityId: string,
  baseVersion: number,
  payload: EntityRecord,
  userId: string,
  serverUpdatedAt: number,
): Promise<PushResult> {
  const current = await getExistingEntity(ctx, entityType, userId, entityId);

  if (!current && baseVersion !== 0) {
    throw new Error(`Version conflict: ${entityType} ${entityId} does not exist on the server.`);
  }

  if (current && baseVersion !== current.version) {
    throw new Error(`Version conflict: expected ${baseVersion} but server has ${current.version} for ${entityType} ${entityId}.`);
  }

  const version = current ? current.version + 1 : 1;
  const row = buildEntityRow(entityType, payload, userId, version, serverUpdatedAt);

  if (current) {
    await ctx.db.patch(current._id, row);
  } else {
    await insertEntity(ctx, entityType, row);
  }

  await appendChange(ctx, {
    entityId,
    entityType,
    operation: "upsert",
    row,
    serverUpdatedAt,
    userId,
    version,
  });

  return { row, serverUpdatedAt, version };
}

async function applyDelete(
  ctx: MutationCtx,
  entityType: SyncEntityType,
  entityId: string,
  baseVersion: number,
  payload: EntityRecord,
  userId: string,
  serverUpdatedAt: number,
): Promise<PushResult> {
  const current = await getExistingEntity(ctx, entityType, userId, entityId);

  if (current && baseVersion !== current.version) {
    throw new Error(`Version conflict: expected ${baseVersion} but server has ${current.version} for ${entityType} ${entityId}.`);
  }

  const version = current ? current.version + 1 : Math.max(baseVersion + 1, 1);

  if (current) {
    await ctx.db.patch(current._id, {
      deletedAt: getOptionalNumber(payload.deletedAt) ?? serverUpdatedAt,
      serverUpdatedAt,
      updatedAt: serverUpdatedAt,
      version,
    });
  }

  await appendChange(ctx, {
    entityId,
    entityType,
    operation: "delete",
    row: null,
    serverUpdatedAt,
    userId,
    version,
  });

  return { row: null, serverUpdatedAt, version };
}

async function appendChange(
  ctx: MutationCtx,
  input: {
    entityId: string;
    entityType: SyncEntityType;
    operation: SyncOperation;
    row: Record<string, unknown> | null;
    serverUpdatedAt: number;
    userId: string;
    version: number;
  },
) {
  const currentState = await ctx.db
    .query("syncState")
    .withIndex("by_userId", (q) => q.eq("userId", input.userId))
    .unique();
  const sequence = (currentState?.lastSequence ?? 0) + 1;

  if (currentState) {
    await ctx.db.patch(currentState._id, {
      lastSequence: sequence,
      updatedAt: input.serverUpdatedAt,
    });
  } else {
    await ctx.db.insert("syncState", {
      lastSequence: sequence,
      updatedAt: input.serverUpdatedAt,
      userId: input.userId,
    });
  }

  await ctx.db.insert("changeLog", {
    createdAt: input.serverUpdatedAt,
    entityId: input.entityId,
    entityType: input.entityType,
    operation: input.operation,
    row: input.row ?? undefined,
    sequence,
    serverUpdatedAt: input.serverUpdatedAt,
    userId: input.userId,
    version: input.version,
  });
}

async function getExistingEntity(ctx: MutationCtx, entityType: SyncEntityType, userId: string, entityId: string) {
  switch (entityType) {
    case "transaction":
      return await ctx.db.query("transactions").withIndex("by_user_id", (q) => q.eq("userId", userId).eq("id", entityId)).unique();
    case "budget":
      return await ctx.db.query("budgets").withIndex("by_user_id", (q) => q.eq("userId", userId).eq("id", entityId)).unique();
    case "category":
      return await ctx.db.query("categories").withIndex("by_user_id", (q) => q.eq("userId", userId).eq("id", entityId)).unique();
    case "import":
      return await ctx.db.query("imports").withIndex("by_user_id", (q) => q.eq("userId", userId).eq("id", entityId)).unique();
    case "attachment":
      return await ctx.db.query("attachments").withIndex("by_user_id", (q) => q.eq("userId", userId).eq("id", entityId)).unique();
  }
}

async function insertEntity(ctx: MutationCtx, entityType: SyncEntityType, row: Record<string, unknown>) {
  switch (entityType) {
    case "transaction":
      return await ctx.db.insert("transactions", row as never);
    case "budget":
      return await ctx.db.insert("budgets", row as never);
    case "category":
      return await ctx.db.insert("categories", row as never);
    case "import":
      return await ctx.db.insert("imports", row as never);
    case "attachment":
      return await ctx.db.insert("attachments", row as never);
  }
}

function buildEntityRow(entityType: SyncEntityType, payload: EntityRecord, userId: string, version: number, serverUpdatedAt: number) {
  switch (entityType) {
    case "transaction":
      return {
        accountLabel: getString(payload.accountLabel, "Primary Wallet"),
        amountMinor: getNumber(payload.amountMinor, 0),
        categoryId: getOptionalString(payload.categoryId),
        createdAt: getNumber(payload.createdAt, serverUpdatedAt),
        currency: getString(payload.currency, "KES"),
        deletedAt: getOptionalNumber(payload.deletedAt),
        direction: getDirection(payload.direction),
        id: getString(payload.id),
        merchant: getString(payload.merchant, "Unknown"),
        notes: getOptionalString(payload.notes),
        reference: getOptionalString(payload.reference),
        serverUpdatedAt,
        source: getString(payload.source, "manual"),
        transactionAt: getNumber(payload.transactionAt, serverUpdatedAt),
        updatedAt: getNumber(payload.updatedAt, serverUpdatedAt),
        userId,
        version,
      };
    case "budget":
      return {
        amountMinor: getNumber(payload.amountMinor, 0),
        categoryId: getString(payload.categoryId),
        createdAt: getNumber(payload.createdAt, serverUpdatedAt),
        deletedAt: getOptionalNumber(payload.deletedAt),
        id: getString(payload.id),
        monthKey: getString(payload.monthKey),
        notes: getOptionalString(payload.notes),
        serverUpdatedAt,
        updatedAt: getNumber(payload.updatedAt, serverUpdatedAt),
        userId,
        version,
      };
    case "category":
      return {
        color: getString(payload.color, "#4b5563"),
        createdAt: getNumber(payload.createdAt, serverUpdatedAt),
        deletedAt: getOptionalNumber(payload.deletedAt),
        id: getString(payload.id),
        label: getString(payload.label, "Other"),
        serverUpdatedAt,
        updatedAt: getNumber(payload.updatedAt, serverUpdatedAt),
        userId,
        version,
      };
    case "import":
      return {
        createdAt: getNumber(payload.createdAt, serverUpdatedAt),
        deletedAt: getOptionalNumber(payload.deletedAt),
        fileName: getString(payload.fileName, "import"),
        id: getString(payload.id),
        rowCount: getNumber(payload.rowCount, 0),
        serverUpdatedAt,
        source: getString(payload.source, "statement"),
        status: getString(payload.status, "draft"),
        updatedAt: getNumber(payload.updatedAt, serverUpdatedAt),
        userId,
        version,
      };
    case "attachment":
      return {
        createdAt: getNumber(payload.createdAt, serverUpdatedAt),
        deletedAt: getOptionalNumber(payload.deletedAt),
        id: getString(payload.id),
        linkedEntityId: getOptionalString(payload.linkedEntityId),
        linkedEntityType: getOptionalEntityType(payload.linkedEntityType),
        localUri: getString(payload.localUri, ""),
        mimeType: getString(payload.mimeType, "application/octet-stream"),
        serverUpdatedAt,
        status: getString(payload.status, "local"),
        updatedAt: getNumber(payload.updatedAt, serverUpdatedAt),
        userId,
        version,
      };
  }
}

function authorizeRequest(request: Request) {
  const configuredToken = process.env.CONVEX_SYNC_TOKEN ?? process.env.EXPO_PUBLIC_CONVEX_SYNC_TOKEN;
  if (!configuredToken) {
    return;
  }

  if (request.headers.get("Authorization") !== `Bearer ${configuredToken}`) {
    throw new Error("Unauthorized sync request.");
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function parseCursor(cursor?: string | null) {
  const value = Number(cursor ?? 0);
  return Number.isFinite(value) ? value : 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getUserId(payload: EntityRecord) {
  return getString(payload.userId, DEFAULT_USER_ID);
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getOptionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getOptionalNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getDirection(value: unknown) {
  return value === "income" ? "income" : "expense";
}

function toEntityType(value: unknown): SyncEntityType {
  if (value === "transaction" || value === "budget" || value === "category" || value === "import" || value === "attachment") {
    return value;
  }
  throw new Error("Invalid entity type.");
}

function getOptionalEntityType(value: unknown): SyncEntityType | undefined {
  return value === "transaction" || value === "budget" || value === "category" || value === "import" || value === "attachment"
    ? value
    : undefined;
}

function toOperation(value: unknown): SyncOperation {
  if (value === "delete" || value === "upsert") {
    return value;
  }
  throw new Error("Invalid sync operation.");
}

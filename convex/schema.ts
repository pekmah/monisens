import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const syncEntityType = v.union(
  v.literal("transaction"),
  v.literal("budget"),
  v.literal("category"),
  v.literal("import"),
  v.literal("attachment"),
);

const syncOperation = v.union(v.literal("upsert"), v.literal("delete"));

export default defineSchema({
  transactions: defineTable({
    id: v.string(),
    userId: v.string(),
    merchant: v.string(),
    amountMinor: v.number(),
    currency: v.string(),
    direction: v.union(v.literal("expense"), v.literal("income")),
    categoryId: v.optional(v.string()),
    accountLabel: v.string(),
    source: v.string(),
    notes: v.optional(v.string()),
    reference: v.optional(v.string()),
    transactionAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    version: v.number(),
    serverUpdatedAt: v.number(),
  })
    .index("by_user_id", ["userId", "id"])
    .index("by_user_transactionAt", ["userId", "transactionAt"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  budgets: defineTable({
    id: v.string(),
    userId: v.string(),
    categoryId: v.string(),
    monthKey: v.string(),
    amountMinor: v.number(),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    version: v.number(),
    serverUpdatedAt: v.number(),
  })
    .index("by_user_id", ["userId", "id"])
    .index("by_user_monthKey", ["userId", "monthKey"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  categories: defineTable({
    id: v.string(),
    userId: v.string(),
    label: v.string(),
    color: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    version: v.number(),
    serverUpdatedAt: v.number(),
  })
    .index("by_user_id", ["userId", "id"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  imports: defineTable({
    id: v.string(),
    userId: v.string(),
    fileName: v.string(),
    source: v.string(),
    rowCount: v.number(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    version: v.number(),
    serverUpdatedAt: v.number(),
  })
    .index("by_user_id", ["userId", "id"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  attachments: defineTable({
    id: v.string(),
    userId: v.string(),
    linkedEntityType: v.optional(syncEntityType),
    linkedEntityId: v.optional(v.string()),
    localUri: v.string(),
    mimeType: v.string(),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
    version: v.number(),
    serverUpdatedAt: v.number(),
  })
    .index("by_user_id", ["userId", "id"])
    .index("by_user_createdAt", ["userId", "createdAt"])
    .index("by_user_updatedAt", ["userId", "updatedAt"]),

  clientMutationLog: defineTable({
    userId: v.string(),
    dedupeKey: v.string(),
    entityType: syncEntityType,
    entityId: v.string(),
    operation: syncOperation,
    responseRow: v.optional(v.any()),
    version: v.number(),
    serverUpdatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_user_dedupeKey", ["userId", "dedupeKey"]),

  changeLog: defineTable({
    userId: v.string(),
    sequence: v.number(),
    entityType: syncEntityType,
    entityId: v.string(),
    operation: syncOperation,
    row: v.optional(v.any()),
    version: v.number(),
    serverUpdatedAt: v.number(),
    createdAt: v.number(),
  }).index("by_user_sequence", ["userId", "sequence"]),

  syncState: defineTable({
    userId: v.string(),
    lastSequence: v.number(),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),
});

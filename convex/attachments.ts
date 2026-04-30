import { v } from "convex/values";

import { mutation } from "./_generated/server";
import { pushChangeHandler } from "./sync";

export const upsertFromClient = mutation({
  args: {
    baseVersion: v.number(),
    clientId: v.string(),
    clientTimestamp: v.number(),
    dedupeKey: v.string(),
    entityId: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    return pushChangeHandler(ctx, {
      ...args,
      entityType: "attachment",
      operation: "upsert",
    });
  },
});

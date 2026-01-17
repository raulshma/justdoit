import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  userBackups: defineTable({
    tokenHash: v.string(),
    data: v.string(), // JSON blob
    updatedAt: v.number(),
  }).index("by_token_hash", ["tokenHash"]),
});

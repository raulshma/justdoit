import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save a backup for the user identified by tokenHash
 */
export const saveBackup = mutation({
  args: {
    tokenHash: v.string(),
    data: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if backup already exists for this token
    const existing = await ctx.db
      .query("userBackups")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing backup
      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt: now,
      });
      return { success: true, updated: true };
    } else {
      // Create new backup
      await ctx.db.insert("userBackups", {
        tokenHash: args.tokenHash,
        data: args.data,
        updatedAt: now,
      });
      return { success: true, updated: false };
    }
  },
});

/**
 * Get the backup for the user identified by tokenHash
 */
export const getBackup = query({
  args: {
    tokenHash: v.string(),
  },
  handler: async (ctx, args) => {
    const backup = await ctx.db
      .query("userBackups")
      .withIndex("by_token_hash", (q) => q.eq("tokenHash", args.tokenHash))
      .first();

    if (!backup) {
      return null;
    }

    return {
      data: backup.data,
      updatedAt: backup.updatedAt,
    };
  },
});

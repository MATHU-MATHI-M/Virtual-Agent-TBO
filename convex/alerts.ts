import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAlerts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) return [];

    return await ctx.db
      .query("alerts")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();
  },
});

export const createAlert = mutation({
  args: {
    type: v.string(),
    title: v.string(),
    message: v.string(),
    priority: v.string(),
    relatedId: v.optional(v.string()),
    actionRequired: v.boolean(),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    return await ctx.db.insert("alerts", {
      agentId: agent._id,
      type: args.type,
      title: args.title,
      message: args.message,
      priority: args.priority,
      relatedId: args.relatedId,
      isRead: false,
      actionRequired: args.actionRequired,
      expiresAt: args.expiresAt,
    });
  },
});

export const markAsRead = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const alert = await ctx.db.get(args.alertId);
    if (!alert) throw new Error("Alert not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent || alert.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.alertId, { isRead: true });
  },
});

export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) return 0;

    const unreadAlerts = await ctx.db
      .query("alerts")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadAlerts.length;
  },
});

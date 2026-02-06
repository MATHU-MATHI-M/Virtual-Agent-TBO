import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentAgent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return agent;
  },
});

export const createAgent = mutation({
  args: {
    agentCode: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    territory: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existingAgent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingAgent) {
      throw new Error("Agent profile already exists");
    }

    return await ctx.db.insert("agents", {
      userId,
      agentCode: args.agentCode,
      name: args.name,
      email: args.email,
      phone: args.phone,
      territory: args.territory,
      commissionRate: 0.05, // 5% default commission
      isActive: true,
    });
  },
});

export const getAgentStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) return null;

    const trips = await ctx.db
      .query("trips")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();

    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    const totalRevenue = bookings
      .filter(b => b.status === "confirmed")
      .reduce((sum, b) => sum + b.details.price, 0);

    const totalCommission = bookings
      .filter(b => b.status === "confirmed")
      .reduce((sum, b) => sum + b.commission, 0);

    return {
      totalTrips: trips.length,
      activeTrips: trips.filter(t => t.status === "planning" || t.status === "quoted").length,
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === "confirmed").length,
      totalCustomers: customers.length,
      unreadAlerts: alerts.length,
      totalRevenue,
      totalCommission,
    };
  },
});

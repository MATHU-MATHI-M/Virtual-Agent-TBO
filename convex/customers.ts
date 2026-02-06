import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createCustomer = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    preferences: v.object({
      budgetRange: v.string(),
      travelType: v.string(),
      preferredAirlines: v.array(v.string()),
      preferredHotels: v.array(v.string()),
      dietaryRestrictions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    return await ctx.db.insert("customers", {
      agentId: agent._id,
      name: args.name,
      email: args.email,
      phone: args.phone,
      preferences: args.preferences,
      pastTrips: [],
    });
  },
});

export const getCustomers = query({
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
      .query("customers")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .collect();
  },
});

export const getCustomer = query({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId);
  },
});

export const updateCustomerPreferences = mutation({
  args: {
    customerId: v.id("customers"),
    preferences: v.object({
      budgetRange: v.string(),
      travelType: v.string(),
      preferredAirlines: v.array(v.string()),
      preferredHotels: v.array(v.string()),
      dietaryRestrictions: v.array(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const customer = await ctx.db.get(args.customerId);
    if (!customer) throw new Error("Customer not found");

    // Verify agent owns this customer
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent || customer.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.customerId, {
      preferences: args.preferences,
    });
  },
});

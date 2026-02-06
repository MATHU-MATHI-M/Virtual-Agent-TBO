import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createTrip = mutation({
  args: {
    customerId: v.optional(v.id("customers")),
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    travelers: v.number(),
    budget: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    return await ctx.db.insert("trips", {
      agentId: agent._id,
      customerId: args.customerId,
      title: args.title,
      destination: args.destination,
      startDate: args.startDate,
      endDate: args.endDate,
      travelers: args.travelers,
      budget: args.budget,
      status: "planning",
      itinerary: [],
      recommendations: {
        flights: [],
        hotels: [],
        experiences: [],
      },
      totalCost: 0,
    });
  },
});

export const getTrips = query({
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
      .query("trips")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();
  },
});

export const getTrip = query({
  args: { tripId: v.id("trips") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.tripId);
  },
});

export const updateTripStatus = mutation({
  args: {
    tripId: v.id("trips"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    // Verify agent owns this trip
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent || trip.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.tripId, {
      status: args.status,
    });
  },
});

export const addItineraryDay = mutation({
  args: {
    tripId: v.id("trips"),
    day: v.number(),
    activities: v.array(v.string()),
    accommodation: v.optional(v.string()),
    meals: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const trip = await ctx.db.get(args.tripId);
    if (!trip) throw new Error("Trip not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent || trip.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    const newItineraryItem = {
      day: args.day,
      activities: args.activities,
      accommodation: args.accommodation,
      meals: args.meals,
    };

    const updatedItinerary = [...trip.itinerary, newItineraryItem];

    await ctx.db.patch(args.tripId, {
      itinerary: updatedItinerary,
    });
  },
});

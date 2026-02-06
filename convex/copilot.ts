import { mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const sendMessage = mutation({
  args: {
    message: v.string(),
    conversationId: v.optional(v.id("conversations")),
    customerId: v.optional(v.id("customers")),
    tripId: v.optional(v.id("trips")),
    isVoice: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    let conversationId = args.conversationId;

    if (!conversationId) {
      conversationId = await ctx.db.insert("conversations", {
        agentId: agent._id,
        customerId: args.customerId,
        tripId: args.tripId,
        messages: [],
        context: {
          searchCriteria: {},
        },
        isActive: true,
      });
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) throw new Error("Conversation not found");

    const userMessage = {
      role: "user" as const,
      content: args.message,
      timestamp: Date.now(),
      metadata: args.isVoice ? { isVoice: true } : undefined,
    };

    await ctx.db.patch(conversationId, {
      messages: [...conversation.messages, userMessage],
    });

    // Call the Node.js action in ai.ts
    await ctx.scheduler.runAfter(0, internal.ai.generateResponse, {
      conversationId,
      userMessage: args.message,
    });

    return conversationId;
  },
});

export const getConversation = internalQuery({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const getAgent = internalQuery({
  args: { agentId: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.agentId);
  },
});

export const getCustomer = internalQuery({
  args: { customerId: v.id("customers") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.customerId);
  },
});

export const addMessage = internalMutation({
  args: {
    conversationId: v.id("conversations"),
    message: v.object({
      role: v.string(),
      content: v.string(),
      timestamp: v.number(),
      metadata: v.optional(v.object({
        recommendations: v.optional(v.array(v.any())),
        actions: v.optional(v.array(v.string())),
        isVoice: v.optional(v.boolean()),
        searchResults: v.optional(v.any()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    await ctx.db.patch(args.conversationId, {
      messages: [...conversation.messages, args.message],
    });
  },
});

export const getActiveConversation = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) return null;

    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .first();

    return conversation;
  },
});

export const createBookingFromRecommendation = mutation({
  args: {
    recommendationData: v.any(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    // Create a quick booking from the recommendation
    const bookingReference = `TBO${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create default customer if none exists
    let customerId = await ctx.db
      .query("customers")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .first()
      .then(c => c?._id);

    if (!customerId) {
      customerId = await ctx.db.insert("customers", {
        agentId: agent._id,
        name: "Walk-in Customer",
        email: "customer@tbo.com",
        phone: "+91 0000000000",
        preferences: {
          budgetRange: "mid-range",
          travelType: "leisure",
          preferredAirlines: [],
          preferredHotels: [],
          dietaryRestrictions: [],
        },
        pastTrips: [],
      });
    }

    // Create trip
    const tripId = await ctx.db.insert("trips", {
      agentId: agent._id,
      customerId: customerId,
      title: `${args.recommendationData.type} Booking`,
      destination: args.recommendationData.destination || "Various",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      travelers: 1,
      budget: args.recommendationData.price || 0,
      status: "planning",
      itinerary: [],
      recommendations: { flights: [], hotels: [], experiences: [] },
      totalCost: args.recommendationData.price || 0,
    });

    const commission = (args.recommendationData.price || 0) * agent.commissionRate;

    const bookingId = await ctx.db.insert("bookings", {
      agentId: agent._id,
      customerId: customerId,
      tripId: tripId,
      bookingReference,
      type: args.recommendationData.type,
      details: {
        provider: args.recommendationData.airline || args.recommendationData.name || args.recommendationData.operator || "TBO Partner",
        productName: args.recommendationData.route || args.recommendationData.name || args.recommendationData.trainName,
        dates: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        passengers: [{ name: "Guest", age: 30, type: "adult" }],
        price: args.recommendationData.price || 0,
        currency: args.recommendationData.currency || "INR",
        image: args.recommendationData.image,
      },
      status: "held",
      paymentStatus: "pending",
      commission,
      holdExpiry: Date.now() + (24 * 60 * 60 * 1000),
    });

    return bookingId;
  },
});

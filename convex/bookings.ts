import { query, mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const createBooking = mutation({
  args: {
    customerId: v.id("customers"),
    tripId: v.id("trips"),
    type: v.string(),
    details: v.object({
      provider: v.string(),
      productName: v.string(),
      dates: v.object({
        start: v.string(),
        end: v.string(),
      }),
      passengers: v.array(v.object({
        name: v.string(),
        age: v.number(),
        type: v.string(),
      })),
      price: v.number(),
      currency: v.string(),
      image: v.optional(v.string()),
    }),
    status: v.string(),
    paymentStatus: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    const bookingReference = `TBO${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const commission = args.details.price * agent.commissionRate;

    const bookingId = await ctx.db.insert("bookings", {
      agentId: agent._id,
      customerId: args.customerId,
      tripId: args.tripId,
      bookingReference,
      type: args.type,
      details: args.details,
      status: args.status,
      paymentStatus: args.paymentStatus,
      commission,
      holdExpiry: args.status === "held" ? Date.now() + (24 * 60 * 60 * 1000) : undefined,
    });

    // Create alert for new booking
    await ctx.db.insert("alerts", {
      agentId: agent._id,
      type: "new_booking",
      title: "New Booking Created",
      message: `Booking ${bookingReference} for ${args.details.productName} has been created`,
      priority: "medium",
      relatedId: bookingId,
      isRead: false,
      actionRequired: args.status === "held",
    });

    return bookingId;
  },
});

export const getBookings = query({
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
      .query("bookings")
      .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
      .order("desc")
      .collect();
  },
});

export const getBooking = query({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) return null;

    // Verify ownership
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent || booking.agentId !== agent._id) {
      return null;
    }

    return booking;
  },
});

export const updateBookingStatus = mutation({
  args: {
    bookingId: v.id("bookings"),
    status: v.string(),
    paymentStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent || booking.agentId !== agent._id) {
      throw new Error("Unauthorized");
    }

    const updateData: any = { status: args.status };
    if (args.paymentStatus) {
      updateData.paymentStatus = args.paymentStatus;
    }

    await ctx.db.patch(args.bookingId, updateData);

    // Create alert for status update
    await ctx.db.insert("alerts", {
      agentId: agent._id,
      type: "booking_update",
      title: "Booking Status Updated",
      message: `Booking ${booking.bookingReference} status changed to ${args.status}`,
      priority: "low",
      relatedId: args.bookingId,
      isRead: false,
      actionRequired: false,
    });
  },
});

export const holdBooking = mutation({
  args: {
    type: v.string(),
    productData: v.any(),
    customerId: v.optional(v.id("customers")),
    tripId: v.optional(v.id("trips")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const agent = await ctx.db
      .query("agents")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!agent) throw new Error("Agent not found");

    let customerId = args.customerId;
    if (!customerId) {
      customerId = await ctx.db.insert("customers", {
        agentId: agent._id,
        name: "Walk-in Customer",
        email: "walkin@tbo.com",
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

    let tripId = args.tripId;
    if (!tripId) {
      tripId = await ctx.db.insert("trips", {
        agentId: agent._id,
        customerId: customerId,
        title: "Quick Booking",
        destination: "Various",
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        travelers: 1,
        budget: args.productData.price,
        status: "planning",
        itinerary: [],
        recommendations: {
          flights: [],
          hotels: [],
          experiences: [],
        },
        totalCost: 0,
      });
    }

    const bookingReference = `HOLD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const commission = args.productData.price * agent.commissionRate;

    const bookingId = await ctx.db.insert("bookings", {
      agentId: agent._id,
      customerId: customerId,
      tripId: tripId,
      bookingReference,
      type: args.type,
      details: {
        provider: args.productData.airline || args.productData.name || "TBO Partner",
        productName: args.productData.route || args.productData.name || args.productData.title,
        dates: {
          start: new Date().toISOString().split('T')[0],
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        passengers: [{ name: "Guest", age: 30, type: "adult" }],
        price: args.productData.price,
        currency: "INR",
        image: args.productData.image,
      },
      status: "held",
      paymentStatus: "pending",
      commission,
      holdExpiry: Date.now() + (24 * 60 * 60 * 1000),
    });

    // Create alert for hold booking
    await ctx.db.insert("alerts", {
      agentId: agent._id,
      type: "booking_hold",
      title: "Booking Held",
      message: `${args.productData.airline || args.productData.name} booking held for 24 hours`,
      priority: "high",
      relatedId: bookingId,
      isRead: false,
      actionRequired: true,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000),
    });

    return bookingId;
  },
});

export const processPayment = action({
  args: {
    bookingId: v.id("bookings"),
    paymentMethod: v.string(),
    razorpayOrderId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      await ctx.runMutation(internal.bookings.confirmPayment, {
        bookingId: args.bookingId,
      });
      return { success: true, transactionId: `TXN${Date.now()}` };
    } else {
      return { success: false, error: "Payment failed. Please try again." };
    }
  },
});

export const confirmPayment = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    await ctx.db.patch(args.bookingId, {
      status: "confirmed",
      paymentStatus: "paid",
    });

    // Create success alert
    await ctx.db.insert("alerts", {
      agentId: booking.agentId,
      type: "payment_success",
      title: "Payment Successful",
      message: `Payment confirmed for booking ${booking.bookingReference}`,
      priority: "medium",
      relatedId: args.bookingId,
      isRead: false,
      actionRequired: false,
    });
  },
});

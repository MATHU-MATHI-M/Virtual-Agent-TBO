import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // Travel Agents
  agents: defineTable({
    userId: v.id("users"),
    agentCode: v.string(),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    territory: v.string(),
    commissionRate: v.number(),
    isActive: v.boolean(),
  }).index("by_user", ["userId"]).index("by_agent_code", ["agentCode"]),

  // Customer Profiles
  customers: defineTable({
    agentId: v.id("agents"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    preferences: v.object({
      budgetRange: v.string(), // "budget", "mid-range", "luxury"
      travelType: v.string(), // "family", "business", "honeymoon", "solo"
      preferredAirlines: v.array(v.string()),
      preferredHotels: v.array(v.string()),
      dietaryRestrictions: v.array(v.string()),
    }),
    pastTrips: v.array(v.object({
      destination: v.string(),
      budget: v.number(),
      rating: v.number(),
      date: v.string(),
    })),
  }).index("by_agent", ["agentId"]).index("by_email", ["email"]),

  // Trip Planning
  trips: defineTable({
    agentId: v.id("agents"),
    customerId: v.optional(v.id("customers")),
    title: v.string(),
    destination: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    travelers: v.number(),
    budget: v.number(),
    status: v.string(), // "planning", "quoted", "booked", "completed"
    itinerary: v.array(v.object({
      day: v.number(),
      activities: v.array(v.string()),
      accommodation: v.optional(v.string()),
      meals: v.array(v.string()),
    })),
    recommendations: v.object({
      flights: v.array(v.object({
        airline: v.string(),
        route: v.string(),
        price: v.number(),
        duration: v.string(),
        stops: v.number(),
        rating: v.number(),
        pros: v.array(v.string()),
        cons: v.array(v.string()),
      })),
      hotels: v.array(v.object({
        name: v.string(),
        location: v.string(),
        price: v.number(),
        rating: v.number(),
        amenities: v.array(v.string()),
        pros: v.array(v.string()),
        cons: v.array(v.string()),
      })),
      experiences: v.array(v.object({
        name: v.string(),
        type: v.string(),
        price: v.number(),
        duration: v.string(),
        rating: v.number(),
        description: v.string(),
      })),
    }),
    totalCost: v.number(),
  }).index("by_agent", ["agentId"]).index("by_customer", ["customerId"]).index("by_status", ["status"]),

  // Conversations
  conversations: defineTable({
    agentId: v.id("agents"),
    customerId: v.optional(v.id("customers")),
    tripId: v.optional(v.id("trips")),
    messages: v.array(v.object({
      role: v.string(), // "user", "assistant", "system"
      content: v.string(),
      timestamp: v.number(),
      metadata: v.optional(v.object({
        recommendations: v.optional(v.array(v.any())),
        actions: v.optional(v.array(v.string())),
        isVoice: v.optional(v.boolean()),
        searchResults: v.optional(v.any()),
      })),
    })),
    context: v.object({
      currentQuery: v.optional(v.string()),
      searchCriteria: v.optional(v.object({
        destination: v.optional(v.string()),
        dates: v.optional(v.object({
          start: v.string(),
          end: v.string(),
        })),
        budget: v.optional(v.number()),
        travelers: v.optional(v.number()),
        preferences: v.optional(v.array(v.string())),
      })),
      lastRecommendations: v.optional(v.array(v.any())),
    }),
    isActive: v.boolean(),
  }).index("by_agent", ["agentId"]).index("by_customer", ["customerId"]).index("by_trip", ["tripId"]),

  // Bookings
  bookings: defineTable({
    agentId: v.id("agents"),
    customerId: v.id("customers"),
    tripId: v.id("trips"),
    bookingReference: v.string(),
    type: v.string(), // "flight", "hotel", "experience", "package"
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
        type: v.string(), // "adult", "child", "infant"
      })),
      price: v.number(),
      currency: v.string(),
      image: v.optional(v.string()),
    }),
    status: v.string(), // "held", "confirmed", "cancelled", "completed"
    paymentStatus: v.string(), // "pending", "paid", "refunded"
    commission: v.number(),
    holdExpiry: v.optional(v.number()),
  }).index("by_agent", ["agentId"]).index("by_customer", ["customerId"]).index("by_trip", ["tripId"]).index("by_status", ["status"]),

  // Alerts and Notifications
  alerts: defineTable({
    agentId: v.id("agents"),
    type: v.string(), // "price_increase", "availability_risk", "better_deal", "booking_expiry"
    title: v.string(),
    message: v.string(),
    priority: v.string(), // "low", "medium", "high", "urgent"
    relatedId: v.optional(v.string()), // tripId or bookingId
    isRead: v.boolean(),
    actionRequired: v.boolean(),
    expiresAt: v.optional(v.number()),
  }).index("by_agent", ["agentId"]).index("by_priority", ["priority"]).index("by_read", ["isRead"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});

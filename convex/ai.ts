"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const generateResponse = internalAction({
    args: {
        conversationId: v.id("conversations"),
        userMessage: v.string(),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.runQuery(internal.copilot.getConversation, {
            conversationId: args.conversationId,
        });

        if (!conversation) throw new Error("Conversation not found");

        const agent = await ctx.runQuery(internal.copilot.getAgent, {
            agentId: conversation.agentId,
        });

        if (!agent) throw new Error("Agent not found");

        let customerContext = "";
        if (conversation.customerId) {
            const customer = await ctx.runQuery(internal.copilot.getCustomer, {
                customerId: conversation.customerId,
            });
            if (customer) {
                customerContext = `Customer Profile:
Name: ${customer.name}
Preferences: ${customer.preferences.travelType}, ${customer.preferences.budgetRange}
Past Trips: ${customer.pastTrips.map((t: any) => `${t.destination} (₹${t.budget}, ${t.rating}★)`).join(", ")}`;
            }
        }

        const conversationHistory = conversation.messages
            .slice(-10)
            .map((m: any) => `${m.role}: ${m.content}`)
            .join("\n");

        // Extract search intent and parameters
        const searchIntent = await ctx.runAction(internal.ai.extractSearchIntent, {
            message: args.userMessage,
        });

        let searchResults = null;
        if (searchIntent.hasSearchIntent) {
            searchResults = await ctx.runAction(internal.ai.performSearch, {
                intent: searchIntent,
            });
        }

        const systemPrompt = `You are TravelBot, an expert AI Travel Copilot for TBO.com agents. You help travel agents plan, recommend, and book travel products efficiently.

PERSONALITY:
- Professional, knowledgeable, and confident
- Concise but thorough in explanations
- Always provide reasoning for recommendations
- Proactive in suggesting better options
- Focus on value and customer satisfaction

CAPABILITIES:
- Flight, hotel, train, and bus search and recommendations
- Itinerary planning and optimization
- Price comparison and value analysis
- Booking assistance and management
- Customer preference learning
- Travel advice and suggestions

RESPONSE FORMAT:
- Always explain WHY you recommend something
- Include specific pricing and value propositions
- Mention booking policies and cancellation terms
- Provide actionable next steps
- Be specific about dates, prices, and availability

CURRENT CONTEXT:
${customerContext}

Agent: ${agent.name} (${agent.territory})
Commission Rate: ${(agent.commissionRate * 100).toFixed(1)}%

${searchResults ? `SEARCH RESULTS:
${JSON.stringify(searchResults, null, 2)}` : ''}

Conversation History:
${conversationHistory}

Current Query: ${args.userMessage}

Respond as TravelBot with specific recommendations, accurate pricing insights, and clear booking instructions. Always mention commission opportunities for the agent.`;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: systemPrompt }],
                temperature: 0.7,
                max_tokens: 2048,
            });

            const aiResponse = response.choices[0].message.content || "I apologize, but I'm having trouble processing your request right now. Please try again.";

            await ctx.runMutation(internal.copilot.addMessage, {
                conversationId: args.conversationId,
                message: {
                    role: "assistant",
                    content: aiResponse,
                    timestamp: Date.now(),
                    metadata: searchResults ? { searchResults } : undefined,
                },
            });

            // Generate recommendations if search results exist
            if (searchResults && Object.keys(searchResults).length > 0) {
                await ctx.scheduler.runAfter(1000, internal.ai.generateRecommendations, {
                    conversationId: args.conversationId,
                    searchResults,
                });
            }

        } catch (error: any) {
            console.error("OpenAI API error:", error);
            let errorMessage = "I apologize, but I'm experiencing technical difficulties. Please try your request again in a moment.";

            // Fallback for quota limits - Simulate a response
            if (error?.status === 429 || error?.code === 'insufficient_quota') {
                console.log("Quota exceeded, using fallback response");

                const mockResponse = `I see you are looking for travel options to ${searchIntent.destination || 'your destination'}. 
         
Based on your request, I found some excellent options for you. 
The flights start from approximately ₹5,800. I also found some great hotels nearby.
Would you like to proceed with booking any of these?`;

                await ctx.runMutation(internal.copilot.addMessage, {
                    conversationId: args.conversationId,
                    message: {
                        role: "assistant",
                        content: mockResponse,
                        timestamp: Date.now(),
                        metadata: searchResults ? { searchResults } : undefined,
                    },
                });

                if (searchResults && Object.keys(searchResults).length > 0) {
                    await ctx.scheduler.runAfter(1000, internal.ai.generateRecommendations, {
                        conversationId: args.conversationId,
                        searchResults,
                    });
                }
                return;
            }

            await ctx.runMutation(internal.copilot.addMessage, {
                conversationId: args.conversationId,
                message: {
                    role: "assistant",
                    content: errorMessage,
                    timestamp: Date.now(),
                },
            });
        }
    },
});

export const extractSearchIntent = internalAction({
    args: {
        message: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: `Analyze this travel query and extract search parameters. Return JSON only:

Query: "${args.message}"

Extract:
- hasSearchIntent: boolean
- type: "flight" | "hotel" | "train" | "bus" | "destination" | "package"
- origin: string (if applicable)
- destination: string
- dates: {start: "YYYY-MM-DD", end?: "YYYY-MM-DD"}
- passengers: number
- budget: {min?: number, max?: number}
- preferences: string[]

Example: {"hasSearchIntent": true, "type": "flight", "origin": "Chennai", "destination": "Delhi", "dates": {"start": "2024-02-15"}, "passengers": 1, "budget": {"max": 200000}}`
                }],
                temperature: 0.1,
                max_tokens: 500,
            });

            const content = response.choices[0].message.content;
            return JSON.parse(content || '{"hasSearchIntent": false}');
        } catch (error: any) {
            if (error?.status === 429 || error?.code === 'insufficient_quota') {
                console.warn("OpenAI Quota Exceeded in Intent Extraction - using rule-based fallback");
            } else {
                console.error("Intent extraction error:", error);
            }

            // Fallback intent extraction
            const lowerMsg = args.message.toLowerCase();
            const words = args.message.split(" ");

            // Helper to find destination after "to"
            const getDestination = () => {
                const toIndex = words.indexOf("to");
                if (toIndex !== -1 && toIndex + 1 < words.length) {
                    return words[toIndex + 1]; // Simply take the next word for now
                }
                return "Goa"; // Default destination
            };

            if (lowerMsg.includes("flight") || lowerMsg.includes("fly") || lowerMsg.includes("plane")) {
                return {
                    hasSearchIntent: true,
                    type: "flight",
                    origin: "Delhi",
                    destination: getDestination(),
                    passengers: 1
                };
            }

            if (lowerMsg.includes("hotel") || lowerMsg.includes("stay") || lowerMsg.includes("room")) {
                return {
                    hasSearchIntent: true,
                    type: "hotel",
                    destination: getDestination(),
                    guests: 2
                };
            }

            // Generic travel intent
            if (lowerMsg.includes("go to") || lowerMsg.includes("trip to") || lowerMsg.includes("travel to") || lowerMsg.includes("visit")) {
                return {
                    hasSearchIntent: true,
                    type: "flight", // Default to flight for generic travel queries
                    origin: "Delhi",
                    destination: getDestination(),
                    passengers: 1
                };
            }

            return { hasSearchIntent: false };
        }
    },
});

export const performSearch = internalAction({
    args: {
        intent: v.any(),
    },
    handler: async (ctx, args) => {
        const { intent } = args;
        const results: any = {};

        try {
            // Generate mock data based on search intent
            if (intent.type === "flight" || intent.origin || intent.destination) {
                // Always return flight data if it looks like a flight request or generic request
                results.flights = [
                    {
                        id: "AI101",
                        airline: "Air India",
                        flightNumber: "AI-101",
                        origin: intent.origin || "Delhi",
                        destination: intent.destination || "Mumbai",
                        departureTime: "06:00",
                        arrivalTime: "08:30",
                        duration: "2h 30m",
                        price: 8500,
                        currency: "INR",
                        class: "Economy",
                        availableSeats: 45,
                        stops: 0,
                        aircraft: "Boeing 737",
                        amenities: ["WiFi", "Meals", "Entertainment"],
                    },
                    {
                        id: "6E202",
                        airline: "IndiGo",
                        flightNumber: "6E-202",
                        origin: intent.origin || "Delhi",
                        destination: intent.destination || "Mumbai",
                        departureTime: "14:15",
                        arrivalTime: "16:45",
                        duration: "2h 30m",
                        price: 7200,
                        currency: "INR",
                        class: "Economy",
                        availableSeats: 32,
                        stops: 0,
                        aircraft: "Airbus A320",
                        amenities: ["WiFi", "Snacks"],
                    },
                    {
                        id: "SG303",
                        airline: "SpiceJet",
                        flightNumber: "SG-303",
                        origin: intent.origin || "Delhi",
                        destination: intent.destination || "Mumbai",
                        departureTime: "20:30",
                        arrivalTime: "23:00",
                        duration: "2h 30m",
                        price: 6800,
                        currency: "INR",
                        class: "Economy",
                        availableSeats: 28,
                        stops: 0,
                        aircraft: "Boeing 737",
                        amenities: ["Meals", "Entertainment"],
                    }
                ];
            }

            if (intent.type === "hotel" || intent.destination) {
                // Always return hotel data if requested
                results.hotels = [
                    {
                        id: "hotel1",
                        name: "The Leela Palace",
                        location: `${intent.destination || 'City'} City Center`,
                        city: intent.destination || 'City',
                        rating: 4.8,
                        pricePerNight: 12000,
                        currency: "INR",
                        amenities: ["Pool", "Spa", "Gym", "Restaurant", "WiFi"],
                        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop"],
                        description: "Luxury hotel in prime location",
                        roomTypes: ["Deluxe", "Suite", "Presidential"],
                        policies: { cancellation: "Free cancellation up to 24 hours" },
                    },
                    {
                        id: "hotel2",
                        name: "Taj Hotel",
                        location: `${intent.destination || 'City'} Business District`,
                        city: intent.destination || 'City',
                        rating: 4.6,
                        pricePerNight: 9500,
                        currency: "INR",
                        amenities: ["Pool", "Restaurant", "WiFi", "Parking"],
                        images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop"],
                        description: "Premium business hotel",
                        roomTypes: ["Standard", "Deluxe", "Suite"],
                        policies: { cancellation: "Free cancellation up to 48 hours" },
                    }
                ];
            }

            return results;
        } catch (error) {
            console.error("Search error:", error);
            return {};
        }
    },
});

export const generateRecommendations = internalAction({
    args: {
        conversationId: v.id("conversations"),
        searchResults: v.any(),
    },
    handler: async (ctx, args) => {
        const { searchResults } = args;
        const recommendations = [];

        // Process flights
        if (searchResults.flights && searchResults.flights.length > 0) {
            const topFlights = searchResults.flights.slice(0, 3).map((flight: any) => ({
                ...flight,
                type: "flight",
                image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=300&h=200&fit=crop",
                pros: ["Real-time availability", "Competitive pricing", "Instant booking"],
                cons: flight.stops > 0 ? ["Has stops"] : ["Direct flight"],
            }));
            recommendations.push({ type: "flights", data: topFlights });
        }

        // Process hotels
        if (searchResults.hotels && searchResults.hotels.length > 0) {
            const topHotels = searchResults.hotels.slice(0, 3).map((hotel: any) => ({
                ...hotel,
                type: "hotel",
                price: hotel.pricePerNight,
                image: hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop",
                pros: ["Verified property", "Instant confirmation", "Best rates"],
                cons: ["Limited availability"],
            }));
            recommendations.push({ type: "hotels", data: topHotels });
        }

        if (recommendations.length > 0) {
            await ctx.runMutation(internal.copilot.addMessage, {
                conversationId: args.conversationId,
                message: {
                    role: "assistant",
                    content: "Here are my recommendations based on your search criteria:",
                    timestamp: Date.now(),
                    metadata: { recommendations },
                },
            });
        }
    },
});

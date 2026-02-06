"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://tbo-copilot:tbo-copilot@tbo-copilot.4s91wjj.mongodb.net/?appName=tbo-copilot";

let cachedClient: MongoClient | null = null;

async function connectToMongoDB() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export const searchFlights = action({
  args: {
    origin: v.string(),
    destination: v.string(),
    departureDate: v.string(),
    returnDate: v.optional(v.string()),
    passengers: v.number(),
    class: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const client = await connectToMongoDB();
      const db = client.db("tbo-travel");
      const flights = db.collection("flights");

      const searchQuery: any = {
        origin: new RegExp(args.origin, 'i'),
        destination: new RegExp(args.destination, 'i'),
        departureDate: { $gte: new Date(args.departureDate) },
        availableSeats: { $gte: args.passengers },
      };

      if (args.class) {
        searchQuery.class = args.class;
      }

      const results = await flights.find(searchQuery).limit(20).toArray();
      
      return results.map(flight => ({
        id: flight._id.toString(),
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        origin: flight.origin,
        destination: flight.destination,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        duration: flight.duration,
        price: flight.price,
        currency: flight.currency,
        class: flight.class,
        availableSeats: flight.availableSeats,
        stops: flight.stops || 0,
        aircraft: flight.aircraft,
        amenities: flight.amenities || [],
      }));
    } catch (error) {
      console.error("MongoDB flight search error:", error);
      return [];
    }
  },
});

export const searchHotels = action({
  args: {
    destination: v.string(),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.number(),
    rooms: v.optional(v.number()),
    budget: v.optional(v.object({
      min: v.number(),
      max: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const client = await connectToMongoDB();
      const db = client.db("tbo-travel");
      const hotels = db.collection("hotels");

      const searchQuery: any = {
        city: new RegExp(args.destination, 'i'),
        availability: {
          $elemMatch: {
            date: { $gte: new Date(args.checkIn), $lte: new Date(args.checkOut) },
            rooms: { $gte: args.rooms || 1 },
          }
        },
      };

      if (args.budget) {
        searchQuery.pricePerNight = {
          $gte: args.budget.min,
          $lte: args.budget.max,
        };
      }

      const results = await hotels.find(searchQuery).limit(20).toArray();
      
      return results.map(hotel => ({
        id: hotel._id.toString(),
        name: hotel.name,
        location: hotel.location,
        city: hotel.city,
        rating: hotel.rating,
        pricePerNight: hotel.pricePerNight,
        currency: hotel.currency,
        amenities: hotel.amenities || [],
        images: hotel.images || [],
        description: hotel.description,
        roomTypes: hotel.roomTypes || [],
        policies: hotel.policies || {},
      }));
    } catch (error) {
      console.error("MongoDB hotel search error:", error);
      return [];
    }
  },
});

export const searchTrains = action({
  args: {
    origin: v.string(),
    destination: v.string(),
    date: v.string(),
    class: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const client = await connectToMongoDB();
      const db = client.db("tbo-travel");
      const trains = db.collection("trains");

      const searchQuery: any = {
        $and: [
          {
            route: {
              $elemMatch: {
                station: new RegExp(args.origin, 'i'),
              }
            }
          },
          {
            route: {
              $elemMatch: {
                station: new RegExp(args.destination, 'i'),
              }
            }
          }
        ],
        operatingDays: new Date(args.date).getDay(),
      };

      const results = await trains.find(searchQuery).limit(15).toArray();
      
      return results.map(train => ({
        id: train._id.toString(),
        trainNumber: train.trainNumber,
        trainName: train.trainName,
        origin: train.route.find((r: any) => r.station.match(new RegExp(args.origin, 'i'))),
        destination: train.route.find((r: any) => r.station.match(new RegExp(args.destination, 'i'))),
        duration: train.duration,
        classes: train.classes || [],
        amenities: train.amenities || [],
        operatingDays: train.operatingDays,
      }));
    } catch (error) {
      console.error("MongoDB train search error:", error);
      return [];
    }
  },
});

export const searchBuses = action({
  args: {
    origin: v.string(),
    destination: v.string(),
    date: v.string(),
    busType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const client = await connectToMongoDB();
      const db = client.db("tbo-travel");
      const buses = db.collection("buses");

      const searchQuery: any = {
        origin: new RegExp(args.origin, 'i'),
        destination: new RegExp(args.destination, 'i'),
        operatingDays: new Date(args.date).getDay(),
      };

      if (args.busType) {
        searchQuery.busType = args.busType;
      }

      const results = await buses.find(searchQuery).limit(15).toArray();
      
      return results.map(bus => ({
        id: bus._id.toString(),
        operator: bus.operator,
        busNumber: bus.busNumber,
        origin: bus.origin,
        destination: bus.destination,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        duration: bus.duration,
        busType: bus.busType,
        price: bus.price,
        currency: bus.currency,
        amenities: bus.amenities || [],
        availableSeats: bus.availableSeats,
      }));
    } catch (error) {
      console.error("MongoDB bus search error:", error);
      return [];
    }
  },
});

export const getDestinationInfo = action({
  args: {
    destination: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const client = await connectToMongoDB();
      const db = client.db("tbo-travel");
      const destinations = db.collection("destinations");

      const result = await destinations.findOne({
        name: new RegExp(args.destination, 'i')
      });

      if (!result) return null;

      return {
        id: result._id.toString(),
        name: result.name,
        country: result.country,
        description: result.description,
        bestTimeToVisit: result.bestTimeToVisit,
        attractions: result.attractions || [],
        activities: result.activities || [],
        cuisine: result.cuisine || [],
        weather: result.weather || {},
        budget: result.budget || {},
        images: result.images || [],
        tips: result.tips || [],
      };
    } catch (error) {
      console.error("MongoDB destination info error:", error);
      return null;
    }
  },
});

export const saveBookingToMongoDB = action({
  args: {
    bookingData: v.object({
      bookingReference: v.string(),
      agentId: v.string(),
      customerId: v.string(),
      type: v.string(),
      details: v.any(),
      status: v.string(),
      paymentStatus: v.string(),
      totalAmount: v.number(),
      commission: v.number(),
      createdAt: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    try {
      const client = await connectToMongoDB();
      const db = client.db("tbo-travel");
      const bookings = db.collection("bookings");

      const result = await bookings.insertOne({
        ...args.bookingData,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        success: true,
        mongoId: result.insertedId.toString(),
      };
    } catch (error) {
      console.error("MongoDB booking save error:", error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  },
});

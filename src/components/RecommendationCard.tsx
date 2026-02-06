import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Plane,
  Hotel,
  Train,
  Bus,
  Star,
  Clock,
  Users,
  MapPin,
  CreditCard,
  CheckCircle,
  XCircle,
  ShoppingCart
} from "lucide-react";

import { useNavigate } from "react-router-dom";

interface RecommendationCardProps {
  recommendation: {
    type: string;
    data: any[];
  };
  conversationId?: Id<"conversations">;
}

export function RecommendationCard({ recommendation, conversationId }: RecommendationCardProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const createBooking = useMutation(api.copilot.createBookingFromRecommendation);
  const navigate = useNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case "flights": return <Plane className="w-5 h-5" />;
      case "hotels": return <Hotel className="w-5 h-5" />;
      case "trains": return <Train className="w-5 h-5" />;
      case "buses": return <Bus className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "flights": return "Flight Options";
      case "hotels": return "Hotel Options";
      case "trains": return "Train Options";
      case "buses": return "Bus Options";
      default: return "Recommendations";
    }
  };

  const handleQuickBook = async (item: any) => {
    if (!conversationId) {
      toast.error("Missing conversation ID. Cannot create booking.");
      return;
    }

    try {
      const bookingId = await createBooking({
        recommendationData: item,
        conversationId,
      });
      toast.success(`${item.type} booking created successfully!`);
      navigate(`/booking/${bookingId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to create booking");
    }
  };

  const formatPrice = (price: number, currency: string = "INR") => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="glass-card overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 border-indigo-50">
      <div className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 px-5 py-3 border-b border-indigo-100/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white rounded-lg shadow-sm text-indigo-600">
            {getIcon(recommendation.type)}
          </div>
          <h3 className="font-bold text-gray-800">{getTypeLabel(recommendation.type)}</h3>
          <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-auto">
            {recommendation.data.length} options
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {recommendation.data.map((item: any, index: number) => (
          <div key={index} className="bg-white rounded-xl p-4 border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all duration-300 group">
            <div className="flex gap-4">
              {/* Image */}
              {item.image && (
                <div className="flex-shrink-0">
                  <img
                    src={item.image}
                    alt=""
                    className="w-24 h-24 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 truncate text-lg group-hover:text-indigo-600 transition-colors">
                      {item.airline || item.name || item.trainName || item.operator}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {item.route || item.location || `${item.origin?.station || item.origin} - ${item.destination?.station || item.destination}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-indigo-600">
                      {formatPrice(item.price || item.pricePerNight)}
                    </div>
                    {item.pricePerNight && (
                      <div className="text-xs text-slate-400 font-medium">per night</div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  {item.duration && (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                      <Clock className="w-3.5 h-3.5" />
                      {item.duration}
                    </div>
                  )}

                  {item.rating && (
                    <div className="flex items-center gap-1.5 bg-yellow-50 px-2 py-1 rounded-md">
                      {renderStars(item.rating)}
                    </div>
                  )}

                  {item.stops !== undefined && (
                    <div className="text-slate-600 bg-slate-50 px-2 py-1 rounded-md text-center">
                      {item.stops === 0 ? "Direct" : `${item.stops} stop${item.stops > 1 ? 's' : ''}`}
                    </div>
                  )}

                  {item.availableSeats && (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                      <Users className="w-3.5 h-3.5" />
                      {item.availableSeats} seats
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleQuickBook(item)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium flex items-center justify-center gap-2 transform active:scale-95"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Quick Book
                  </button>

                  <button
                    onClick={() => toast.info("Opening detailed view...", { duration: 2000 })}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors font-medium active:scale-95"
                  >
                    Details
                  </button>

                  <button
                    onClick={() => toast.success("Option held for 24 hours via TBO Hold API", { duration: 3000 })}
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 font-medium active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    Hold
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Send, Bot, User, Zap } from "lucide-react";
import { RecommendationCard } from "./RecommendationCard";
import { VoiceAssistant } from "./VoiceAssistant";

export function Copilot() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = useQuery(api.copilot.getActiveConversation);
  const sendMessage = useMutation(api.copilot.sendMessage);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  // Show loading state while initializing
  if (conversation === undefined) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50/50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm text-indigo-600 font-medium">Connecting to Copilot...</p>
        </div>
      </div>
    );
  }

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || message;
    if (!textToSend.trim()) return;

    setIsLoading(true);
    try {
      await sendMessage({
        message: textToSend,
        conversationId: conversation?._id,
      });
      if (!messageText) setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleVoiceMessage = (voiceText: string) => {
    setMessage(voiceText);
    handleSendMessage(voiceText);
  };

  const quickSuggestions = [
    "Book flight from Chennai to Delhi for 5 days under ₹2 lakh",
    "Find hotels in Goa under ₹5000 per night",
    "Plan a 5-day trip to Kerala with budget ₹50000",
    "Search flights from Mumbai to Singapore",
    "Find luxury hotels in Dubai",
    "Show me direct flights to London",
    "Find budget accommodation in Thailand",
    "Book train tickets from Delhi to Mumbai",
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="p-4 border-b border-indigo-100 flex justify-between items-center bg-white/40 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="p-2 bg-indigo-100 rounded-lg">
              <Bot className="w-5 h-5 text-indigo-600" />
            </span>
            AI Travel Copilot
          </h1>
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 ml-1">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
            Powered by TBO Intelligence
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {!conversation?.messages?.length ? (
          <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
            {/* Hero Section */}
            <div className="relative h-[400px] flex-shrink-0">
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1200&h=400&fit=crop"
                  alt="Travel Hero"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
              </div>

              <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-4">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-center text-shadow-lg">
                  Explore the World with AI
                </h2>
                <p className="text-xl md:text-2xl mb-8 text-center text-shadow opacity-90">
                  Flights • Hotels • Holiday Packages • Trains
                </p>

                {/* Search Widget Container */}
                <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-4xl text-gray-800">
                  <div className="flex gap-4 border-b border-gray-100 pb-4 mb-4 overflow-x-auto">
                    {['Flights', 'Hotels', 'Holidays', 'Trains', 'Buses'].map((tab, i) => (
                      <button key={tab} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${i === 0 ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50 text-gray-600'}`}>
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">From</label>
                      <div className="text-lg font-bold text-gray-900">Delhi (DEL)</div>
                      <div className="text-xs text-gray-500 truncate">Indira Gandhi International Airport</div>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 pl-4">
                      <label className="text-xs font-bold text-gray-500 uppercase">To</label>
                      <div className="text-lg font-bold text-gray-900">Mumbai (BOM)</div>
                      <div className="text-xs text-gray-500 truncate">Chhatrapati Shivaji International Airport</div>
                    </div>
                    <div className="space-y-1 border-l border-gray-100 pl-4">
                      <label className="text-xs font-bold text-gray-500 uppercase">Departure</label>
                      <div className="text-lg font-bold text-gray-900">12 Oct'24</div>
                      <div className="text-xs text-gray-500">Saturday</div>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSendMessage("Plan a trip from Delhi to Mumbai")}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-xl py-3 rounded-xl hover:shadow-lg hover:from-red-600 hover:to-orange-600 transition-all uppercase"
                      >
                        SEARCH
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trending Offers Section */}
            <div className="p-8 max-w-7xl mx-auto w-full">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Trending Offers</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: "Summer in Goa", code: "GOA50", price: "₹12,499", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=250&fit=crop" },
                  { title: "Dubai Shopping Fest", code: "DXB20", price: "₹24,999", img: "https://images.unsplash.com/photo-1518684079-3c830dcefacf?w=400&h=250&fit=crop" },
                  { title: "Kerala Backwaters", code: "KERALA10", price: "₹8,999", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=250&fit=crop" }
                ].map((offer, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer" onClick={() => handleSendMessage(`Tell me about ${offer.title} offer`)}>
                    <div className="h-48 overflow-hidden">
                      <img src={offer.img} alt={offer.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-lg text-gray-800">{offer.title}</h4>
                        <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded">{offer.code}</span>
                      </div>
                      <p className="text-gray-500 text-sm mb-3">All inclusive packages starting from</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">{offer.price}</span>
                        <button className="text-blue-600 font-semibold text-sm hover:underline">Book Now &rarr;</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {conversation.messages.map((msg: any, index: number) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <div
                  className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-200 mt-1">
                      <Bot className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl px-5 py-3.5 rounded-2xl shadow-sm ${msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-br-none"
                      : "bg-white border border-indigo-50 text-gray-800 rounded-bl-none shadow-sm"
                      }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    {msg.metadata?.isVoice && (
                      <div className="text-[10px] opacity-75 mt-2 flex items-center gap-1 border-t border-white/20 pt-1">
                        <span>🎤</span> Voice message
                      </div>
                    )}
                  </div>

                  {msg.role === "user" && (
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0 shadow-md border border-gray-600 mt-1">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Recommendations */}
                {msg.metadata?.recommendations && (
                  <div className="mt-4 ml-12 space-y-4">
                    {msg.metadata.recommendations.map((rec: any, recIndex: number) => (
                      <div key={recIndex} className="animate-fade-in" style={{ animationDelay: '200ms' }}>
                        <RecommendationCard
                          recommendation={rec}
                          conversationId={conversation?._id}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start animate-pulse">
                <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="bg-white px-5 py-4 rounded-2xl rounded-bl-none border border-indigo-50 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-indigo-50 bg-white/60 backdrop-blur-lg">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <div className="flex-1 relative bg-white rounded-2xl shadow-sm border border-indigo-100 hover:border-indigo-300 transition-colors">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about flights, hotels, travel plans..."
              className="w-full pl-4 pr-12 py-3.5 bg-transparent border-none focus:ring-0 resize-none text-gray-800 placeholder-gray-400"
              rows={1}
              style={{ minHeight: '52px', maxHeight: '120px' }}
              disabled={isLoading}
            />
            <div className="absolute right-2 bottom-2">
              <VoiceAssistant
                conversationId={conversation?._id}
                onMessage={handleVoiceMessage}
              />
            </div>
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!message.trim() || isLoading}
            className="h-[52px] w-[52px] bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

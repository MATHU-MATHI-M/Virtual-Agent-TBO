import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plane, Hotel, Map, Train, Bus, Car, Coins, Search, Star, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function ServiceLanding() {
    const { service } = useParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);

    const getServiceConfig = (serviceName: string = "") => {
        switch (serviceName.toLowerCase()) {
            case 'flights': return { icon: <Plane className="w-8 h-8" />, title: "Book Flights", placeholder: "From (e.g., Delhi) to (e.g., Mumbai)", color: "from-sky-500 to-blue-600" };
            case 'hotels': return { icon: <Hotel className="w-8 h-8" />, title: "Find Hotels", placeholder: "City, Hotel, or Area", color: "from-rose-500 to-pink-600" };
            case 'holidays': return { icon: <Map className="w-8 h-8" />, title: "Holiday Packages", placeholder: "Destination or Theme", color: "from-orange-500 to-amber-600" };
            case 'trains': return { icon: <Train className="w-8 h-8" />, title: "Train Tickets", placeholder: "From Station to Station", color: "from-red-500 to-red-700" };
            case 'buses': return { icon: <Bus className="w-8 h-8" />, title: "Bus Booking", placeholder: "From City to City", color: "from-yellow-400 to-orange-500" };
            case 'cabs': return { icon: <Car className="w-8 h-8" />, title: "Cab Rental", placeholder: "Pickup Location", color: "from-slate-700 to-black" };
            case 'forex': return { icon: <Coins className="w-8 h-8" />, title: "Forex Services", placeholder: "Currency or Country", color: "from-emerald-500 to-green-700" };
            default: return { icon: <Plane className="w-8 h-8" />, title: "Travel Services", placeholder: "What are you looking for?", color: "from-indigo-500 to-purple-600" };
        }
    };

    const config = getServiceConfig(service);

    const handleSearch = () => {
        if (!query.trim()) {
            toast.error("Please enter a search term");
            return;
        }

        setIsSearching(true);
        setResults([]);

        // Simulate API search with mock data
        setTimeout(() => {
            const mockResults = generateMockResults(service || "flights", query);
            setResults(mockResults);
            setIsSearching(false);
        }, 1500);
    };

    const generateMockResults = (type: string, searchTerm: string) => {
        const count = 3 + Math.floor(Math.random() * 5);
        return Array.from({ length: count }).map((_, i) => ({
            id: i,
            title: getMockTitle(type, i, searchTerm),
            subtitle: getMockSubtitle(type),
            price: 1500 + Math.floor(Math.random() * 10000),
            rating: 3.5 + Math.random() * 1.5,
            image: getMockImage(type, i),
            features: getMockFeatures(type),
        }));
    };

    const getMockTitle = (type: string, index: number, term: string) => {
        const termCapitalized = term.charAt(0).toUpperCase() + term.slice(1);
        switch (type.toLowerCase()) {
            case 'flights': return `${['Indigo', 'Air India', 'Vistara', 'SpiceJet'][index % 4]} • ${termCapitalized}`;
            case 'hotels': return `${termCapitalized} ${['Grand', 'Regency', 'Plaza', 'Resort'][index % 4]}`;
            case 'holidays': return `${['Exotic', 'Magical', 'Relaxing', 'Adventure'][index % 4]} ${termCapitalized} Tour`;
            case 'trains': return `${termCapitalized} Express`;
            case 'buses': return `${['Volvo', 'Scania', 'Sleeper', 'Luxury'][index % 4]} to ${termCapitalized}`;
            case 'cabs': return `${['Sedan', 'SUV', 'Hatchback', 'Luxury'][index % 4]} in ${termCapitalized}`;
            default: return `${termCapitalized} Option ${index + 1}`;
        }
    };

    const getMockSubtitle = (type: string) => {
        switch (type.toLowerCase()) {
            case 'flights': return "Non-stop • 2h 15m";
            case 'hotels': return "City Center • Breakfast Included";
            case 'holidays': return "5 Days / 4 Nights • All Inclusive";
            default: return "Available Now";
        }
    };

    const getMockFeatures = (type: string) => {
        switch (type.toLowerCase()) {
            case 'flights': return ["Free Meal", "Refundable", "Extra Legroom"];
            case 'hotels': return ["Free Wifi", "Pool", "Spa", "Gym"];
            default: return ["Verified", "Best Value"];
        }
    };

    const getMockImage = (type: string, index: number) => {
        const images = {
            flights: [
                "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500&h=300&fit=crop",
                "https://images.unsplash.com/photo-1542296332-2e44a04823a3?w=500&h=300&fit=crop"
            ],
            hotels: [
                "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500&h=300&fit=crop",
                "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=500&h=300&fit=crop"
            ],
            holidays: [
                "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=500&h=300&fit=crop",
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&h=300&fit=crop"
            ]
        };
        // @ts-ignore
        const catImages = images[type.toLowerCase()] || images.holidays;
        return catImages[index % catImages.length];
    };

    const handleBookNow = (item: any) => {
        // For demo purposes, we'll navigate to a booking page with holding data
        // In a real app we'd create a temporary hold via API then navigate
        toast.success("Proceeding to booking...");
        // Simulate hold ID creation
        const tempId = "temp_booking_" + Date.now();
        navigate(`/booking/${tempId}?mock=true`);
    };

    return (
        <div className="h-full overflow-y-auto bg-slate-50">
            {/* Hero Section */}
            <div className={`bg-gradient-to-r ${config.color} text-white py-16 px-6 relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-white/30">
                        {config.icon}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">{config.title}</h1>
                    <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                        Find the best deals on {service} and book instantly with TBO Holidays.
                    </p>

                    <div className="bg-white p-2 rounded-xl shadow-2xl flex flex-col md:flex-row gap-2 max-w-2xl mx-auto">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={config.placeholder}
                                className="w-full pl-12 pr-4 py-4 text-slate-800 outline-none rounded-lg placeholder:text-slate-400"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isSearching}
                            className={`px-8 py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 ${isSearching ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            {isSearching ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Searching...
                                </>
                            ) : (
                                "Search"
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="max-w-5xl mx-auto px-6 py-12">
                {results.length > 0 ? (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Available Options</h2>
                        {results.map((item) => (
                            <div key={item.id} className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group flex flex-col md:flex-row gap-6">
                                <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden flex-shrink-0 relative">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                        {item.rating.toFixed(1)}
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                                <p className="text-slate-500 font-medium mb-3">{item.subtitle}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-slate-900">₹{item.price.toLocaleString()}</div>
                                                <div className="text-xs text-slate-400">per person</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            {item.features.map((feature: string, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-semibold rounded-full border border-slate-100">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex gap-3">
                                        <button
                                            onClick={() => handleBookNow(item)}
                                            className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            Book Now <ArrowRight className="w-4 h-4" />
                                        </button>
                                        <button className="px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    !isSearching && (
                        <div className="text-center py-20 opacity-50">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-400" />
                            </div>
                            <p className="text-lg">Enter a destination or service name to start searching</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

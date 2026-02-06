import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import {
    CreditCard,
    CheckCircle,
    Clock,
    MapPin,
    Calendar,
    User,
    ShieldCheck,
    ArrowLeft,
    Printer,
    Download
} from "lucide-react";

export function BookingPage() {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const booking = useQuery(api.bookings.getBooking, {
        bookingId: bookingId as Id<"bookings">
    });
    const processPayment = useAction(api.bookings.processPayment);

    const [isProcessing, setIsProcessing] = useState(false);

    if (booking === undefined) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (booking === null) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="text-xl font-bold text-slate-800">Booking not found</div>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    Return Home
                </button>
            </div>
        );
    }

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            const result = await processPayment({
                bookingId: booking._id,
                paymentMethod: "card",
            });

            if (result.success) {
                toast.success("Payment successful! Booking confirmed.");
            } else {
                toast.error(result.error || "Payment failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred during payment");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const details = booking.details;

    return (
        <div className="h-full overflow-y-auto bg-slate-50 pb-20">
            {/* Header */}
            <header className="bg-white border-b border-indigo-100 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800">Review & Pay</h1>
                        <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {booking.status}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Itinerary Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 overflow-hidden">
                            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex justify-between items-center text-white">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        {booking.type === 'flight' ? '✈️' : booking.type === 'hotel' ? '🏨' : '📅'}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-lg">{details.productName}</h2>
                                        <p className="text-indigo-100 text-sm">{details.provider}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: details.currency || 'INR', minimumFractionDigits: 0 }).format(details.price)}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="flex gap-8 mb-6">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check In / Departure</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-5 h-5 text-indigo-500" />
                                            <span className="font-semibold text-slate-800">{formatDate(details.dates.start)}</span>
                                        </div>
                                        <div className="text-sm text-slate-500 ml-7">After 12:00 PM</div>
                                    </div>
                                    <div className="w-px bg-slate-100"></div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check Out / Return</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-5 h-5 text-indigo-500" />
                                            <span className="font-semibold text-slate-800">{formatDate(details.dates.end)}</span>
                                        </div>
                                        <div className="text-sm text-slate-500 ml-7">Before 11:00 AM</div>
                                    </div>
                                </div>

                                {details.image && (
                                    <div className="mb-6 h-48 rounded-xl overflow-hidden">
                                        <img src={details.image} alt="Product" className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="bg-slate-50 rounded-xl p-4 flex gap-4 text-sm text-slate-600">
                                    <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                    <div>
                                        <span className="font-bold text-slate-800">Free Cancellation</span> available until 24 hours before check-in.
                                        Instant refund enabled.
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Travelers Form */}
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" />
                                Traveler Details
                            </h3>

                            <div className="space-y-4">
                                {/* This would be a form in a real app, currently read-only derived from booking */}
                                {details.passengers?.map((p: any, i: number) => (
                                    <div key={i} className="flex gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{p.name}</div>
                                            <div className="text-sm text-slate-500">{p.age} years • {p.type}</div>
                                        </div>
                                    </div>
                                ))}
                                <button className="text-indigo-600 text-sm font-semibold hover:underline">
                                    + Add another traveler
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">

                        {/* Price Breakdown */}
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-6">
                            <h3 className="font-bold text-slate-800 mb-4">Fare Summary</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-slate-600">
                                    <span>Base Fare</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(details.price * 0.82)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                    <span>Taxes & Fees</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(details.price * 0.18)}</span>
                                </div>
                                <div className="border-t border-slate-100 pt-3 flex justify-between font-bold text-lg text-slate-900">
                                    <span>Total</span>
                                    <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(details.price)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Action */}
                        <div className="bg-white rounded-2xl shadow-sm border border-indigo-50 p-6">
                            {booking.status === 'confirmed' ? (
                                <div className="text-center space-y-4">
                                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h3 className="font-bold text-emerald-700 text-lg">Booking Confirmed</h3>
                                    <p className="text-sm text-slate-500">Your booking reference is <span className="font-mono bg-slate-100 px-1 rounded">{booking.bookingReference}</span></p>
                                    <div className="flex gap-2 justify-center pt-2">
                                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
                                            <Printer className="w-4 h-4" /> Print
                                        </button>
                                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium">
                                            <Download className="w-4 h-4" /> PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2 mb-4 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium">Price held for 14:30 mins</span>
                                    </div>
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isProcessing ? (
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Pay Now
                                            </>
                                        )}
                                    </button>
                                    <p className="text-xs text-center text-slate-400 mt-3">
                                        By proceeding, you agree to our Terms & Conditions
                                    </p>
                                </>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

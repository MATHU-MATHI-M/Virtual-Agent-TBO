import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function BookingsPanel() {
  const bookings = useQuery(api.bookings.getBookings);
  const updateBookingStatus = useMutation(api.bookings.updateBookingStatus);

  const handleStatusUpdate = async (bookingId: string, status: string, paymentStatus?: string) => {
    try {
      await updateBookingStatus({
        bookingId: bookingId as any,
        status,
        paymentStatus
      });
      toast.success("Booking status updated successfully!");
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "held": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "refunded": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!bookings) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
        <p className="text-gray-600 mt-1">
          Manage all your customer bookings and reservations
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-600">Start making recommendations to create your first booking.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{booking.details.productName}</h3>
                  <p className="text-gray-600">{booking.details.provider}</p>
                  <p className="text-sm text-gray-500">Ref: {booking.bookingReference}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">₹{booking.details.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Commission: ₹{booking.commission.toLocaleString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Type</p>
                  <p className="text-sm text-gray-600 capitalize">{booking.type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Check-in/Start</p>
                  <p className="text-sm text-gray-600">{new Date(booking.details.dates.start).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Check-out/End</p>
                  <p className="text-sm text-gray-600">{new Date(booking.details.dates.end).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Passengers</p>
                  <p className="text-sm text-gray-600">{booking.details.passengers.length} person(s)</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus.toUpperCase()}
                  </span>
                  {booking.holdExpiry && booking.status === "held" && (
                    <span className="text-xs text-orange-600">
                      Expires: {new Date(booking.holdExpiry).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {booking.status === "held" && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(booking._id, "confirmed", "paid")}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Confirm Booking
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking._id, "cancelled")}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Cancel Hold
                      </button>
                    </>
                  )}

                  {booking.status === "confirmed" && booking.paymentStatus === "pending" && (
                    <button
                      onClick={() => handleStatusUpdate(booking._id, "confirmed", "paid")}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      Mark as Paid
                    </button>
                  )}

                  {booking.status === "confirmed" && (
                    <button
                      onClick={() => handleStatusUpdate(booking._id, "completed")}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Mark Complete
                    </button>
                  )}

                  <button
                    onClick={() => toast.info("Viewing booking details...")}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

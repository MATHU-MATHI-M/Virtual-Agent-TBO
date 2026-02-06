import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { X, CreditCard, User, Calendar, MapPin, Phone, Mail } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productData: any;
  productType: string;
}

export function BookingModal({ isOpen, onClose, productData, productType }: BookingModalProps) {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    passengers: [{ name: "", age: 30, type: "adult" }],
    contactInfo: {
      name: "",
      email: "",
      phone: "",
    },
    paymentMethod: "razorpay",
  });

  const customers = useQuery(api.customers.getCustomers);
  const trips = useQuery(api.trips.getTrips);
  const createBooking = useMutation(api.bookings.createBooking);
  const processPayment = useAction(api.bookings.processPayment);

  const handlePassengerChange = (index: number, field: string, value: any) => {
    const updatedPassengers = [...bookingData.passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setBookingData({ ...bookingData, passengers: updatedPassengers });
  };

  const addPassenger = () => {
    setBookingData({
      ...bookingData,
      passengers: [...bookingData.passengers, { name: "", age: 30, type: "adult" }],
    });
  };

  const removePassenger = (index: number) => {
    if (bookingData.passengers.length > 1) {
      const updatedPassengers = bookingData.passengers.filter((_, i) => i !== index);
      setBookingData({ ...bookingData, passengers: updatedPassengers });
    }
  };

  const handleContactChange = (field: string, value: string) => {
    setBookingData({
      ...bookingData,
      contactInfo: { ...bookingData.contactInfo, [field]: value },
    });
  };

  const handleBooking = async () => {
    try {
      // Create booking
      const bookingId = await createBooking({
        customerId: customers?.[0]?._id || ("" as any),
        tripId: trips?.[0]?._id || ("" as any),
        type: productType,
        details: {
          provider: productData.airline || productData.operator || productData.name || "TBO Partner",
          productName: productData.route || productData.name || productData.title,
          dates: {
            start: new Date().toISOString().split('T')[0],
            end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          },
          passengers: bookingData.passengers,
          price: productData.price,
          currency: "INR",
          image: productData.image,
        },
        status: "held",
        paymentStatus: "pending",
      });

      setStep(3);
      
      // Simulate payment processing
      setTimeout(async () => {
        try {
          const paymentResult = await processPayment({
            bookingId,
            paymentMethod: bookingData.paymentMethod,
            razorpayOrderId: `order_${Date.now()}`,
          });

          if (paymentResult.success) {
            toast.success("Booking confirmed! Payment successful.");
            onClose();
          } else {
            toast.error(paymentResult.error || "Payment failed");
          }
        } catch (error) {
          toast.error("Payment processing failed");
        }
      }, 3000);

    } catch (error) {
      toast.error("Booking failed. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            Book {productData.airline || productData.operator || productData.name}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2">Details</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2">Review</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                3
              </div>
              <span className="ml-2">Payment</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* Product Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  {productData.image && (
                    <img src={productData.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <div>
                    <h3 className="font-semibold">{productData.airline || productData.operator || productData.name}</h3>
                    <p className="text-gray-600">{productData.route || productData.type}</p>
                    <p className="text-lg font-bold text-green-600">₹{productData.price?.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={bookingData.contactInfo.name}
                      onChange={(e) => handleContactChange("name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={bookingData.contactInfo.email}
                      onChange={(e) => handleContactChange("email", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={bookingData.contactInfo.phone}
                      onChange={(e) => handleContactChange("phone", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              {/* Passenger Details */}
              <div>
                <h4 className="font-semibold mb-4">Passenger Details</h4>
                {bookingData.passengers.map((passenger, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium">Passenger {index + 1}</h5>
                      {bookingData.passengers.length > 1 && (
                        <button
                          onClick={() => removePassenger(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={passenger.name}
                          onChange={(e) => handlePassengerChange(index, "name", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          value={passenger.age}
                          onChange={(e) => handlePassengerChange(index, "age", parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                          max="120"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={passenger.type}
                          onChange={(e) => handlePassengerChange(index, "type", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="adult">Adult</option>
                          <option value="child">Child</option>
                          <option value="infant">Infant</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addPassenger}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  + Add Another Passenger
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue to Review
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Review Your Booking</h3>
              
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Booking Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Service:</span>
                    <span>{productData.airline || productData.operator || productData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Route/Type:</span>
                    <span>{productData.route || productData.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passengers:</span>
                    <span>{bookingData.passengers.length}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span className="text-green-600">₹{(productData.price * bookingData.passengers.length).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Method
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={bookingData.paymentMethod === "razorpay"}
                      onChange={(e) => setBookingData({ ...bookingData, paymentMethod: e.target.value })}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Razorpay</div>
                      <div className="text-sm text-gray-600">Credit/Debit Card, UPI, Net Banking</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Confirm & Pay
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Processing Payment...</h3>
                <p className="text-gray-600">Please wait while we process your payment securely.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

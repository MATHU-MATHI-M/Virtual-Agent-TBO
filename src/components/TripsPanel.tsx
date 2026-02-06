import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function TripsPanel() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    startDate: "",
    endDate: "",
    travelers: 1,
    budget: 0,
  });

  const trips = useQuery(api.trips.getTrips);
  const createTrip = useMutation(api.trips.createTrip);
  const updateTripStatus = useMutation(api.trips.updateTripStatus);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTrip(formData);
      toast.success("Trip created successfully!");
      setShowCreateForm(false);
      setFormData({
        title: "",
        destination: "",
        startDate: "",
        endDate: "",
        travelers: 1,
        budget: 0,
      });
    } catch (error) {
      toast.error("Failed to create trip");
    }
  };

  const handleStatusChange = async (tripId: string, status: string) => {
    try {
      await updateTripStatus({ tripId: tripId as any, status });
      toast.success("Trip status updated");
    } catch (error) {
      toast.error("Failed to update trip status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planning": return "bg-blue-100 text-blue-800";
      case "quoted": return "bg-yellow-100 text-yellow-800";
      case "booked": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (!trips) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all your customer trips
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all font-medium flex items-center gap-2"
        >
          <span>+</span> Create New Trip
        </button>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl border border-indigo-100">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Create New Trip</h2>
            <form onSubmit={handleCreateTrip} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 crt">
                  Trip Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Destination
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData(prev => ({ ...prev, destination: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Travelers
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.travelers}
                    onChange={(e) => setFormData(prev => ({ ...prev, travelers: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-lg shadow-indigo-200"
                >
                  Create Trip
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center opacity-0 animate-fade-in">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-indigo-50">
            <span className="text-4xl">✈️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No trips created yet</h3>
          <p className="text-gray-500 max-w-sm mb-8">Start planning your first trip by clicking the button above.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-2.5 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 transition-colors font-medium"
          >
            Create Your First Trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-xl border border-indigo-50 p-6 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[100px] -mr-12 -mt-12 transition-transform group-hover:scale-110" />

              <div className="relative">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-indigo-600 transition-colors">{trip.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                      {trip.destination}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(trip.status)}`}>
                    {trip.status}
                  </span>
                </div>

                <div className="space-y-3 text-sm text-gray-600 mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Dates</span>
                    <span className="font-medium text-gray-800">{new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Travelers</span>
                    <span className="font-medium text-gray-800">{trip.travelers} Guest{trip.travelers > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Budget</span>
                    <span className="font-medium text-gray-800">₹{trip.budget.toLocaleString()}</span>
                  </div>
                  {trip.totalCost > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-bold text-gray-700">Total Cost</span>
                      <span className="font-bold text-indigo-600">₹{trip.totalCost.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <select
                    value={trip.status}
                    onChange={(e) => handleStatusChange(trip._id, e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-medium text-gray-700"
                  >
                    <option value="planning">Planning</option>
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    onClick={() => toast.info("Opening trip details...", { duration: 2000 })}
                    className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100 transition-colors font-semibold"
                  >
                    View details
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

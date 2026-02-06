import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function StatsOverview() {
  const agentStats = useQuery(api.agents.getAgentStats);

  if (!agentStats) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Revenue",
      value: `₹${agentStats.totalRevenue.toLocaleString()}`,
      change: "+12.5%",
      changeType: "positive" as const,
      icon: "💰",
    },
    {
      title: "Commission Earned",
      value: `₹${agentStats.totalCommission.toLocaleString()}`,
      change: "+8.2%",
      changeType: "positive" as const,
      icon: "💎",
    },
    {
      title: "Active Trips",
      value: agentStats.activeTrips.toString(),
      change: "+3",
      changeType: "positive" as const,
      icon: "✈️",
    },
    {
      title: "Total Customers",
      value: agentStats.totalCustomers.toString(),
      change: "+5",
      changeType: "positive" as const,
      icon: "👥",
    },
    {
      title: "Confirmed Bookings",
      value: agentStats.confirmedBookings.toString(),
      change: "+7",
      changeType: "positive" as const,
      icon: "✅",
    },
    {
      title: "Pending Alerts",
      value: agentStats.unreadAlerts.toString(),
      change: "-2",
      changeType: "negative" as const,
      icon: "🔔",
    },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Track your performance and business metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{stat.icon}</div>
              <div className={`text-sm font-medium px-2 py-1 rounded ${stat.changeType === "positive"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
                }`}>
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">✈️</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New trip created</p>
                <p className="text-xs text-gray-500">Singapore package for the Sharma family</p>
              </div>
              <span className="text-xs text-gray-400">2h ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">✅</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Booking confirmed</p>
                <p className="text-xs text-gray-500">Dubai flight for Mr. Patel</p>
              </div>
              <span className="text-xs text-gray-400">4h ago</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">💰</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Commission received</p>
                <p className="text-xs text-gray-500">₹2,500 from Goa booking</p>
              </div>
              <span className="text-xs text-gray-400">1d ago</span>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">🎯</span>
                <h4 className="font-medium text-blue-900">Conversion Rate</h4>
              </div>
              <p className="text-2xl font-bold text-blue-900">78%</p>
              <p className="text-sm text-blue-700">+5% from last month</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">⚡</span>
                <h4 className="font-medium text-green-900">Avg. Response Time</h4>
              </div>
              <p className="text-2xl font-bold text-green-900">2.3 min</p>
              <p className="text-sm text-green-700">-30s from last month</p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-purple-600">⭐</span>
                <h4 className="font-medium text-purple-900">Customer Rating</h4>
              </div>
              <p className="text-2xl font-bold text-purple-900">4.8/5</p>
              <p className="text-sm text-purple-700">Based on 24 reviews</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

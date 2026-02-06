import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AlertsPanel() {
  const alerts = useQuery(api.alerts.getAlerts);
  const markAsRead = useMutation(api.alerts.markAsRead);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead({ alertId: alertId as any });
      toast.success("Alert marked as read");
    } catch (error) {
      toast.error("Failed to mark alert as read");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 border-red-200 text-red-800";
      case "high": return "bg-orange-100 border-orange-200 text-orange-800";
      case "medium": return "bg-yellow-100 border-yellow-200 text-yellow-800";
      default: return "bg-blue-100 border-blue-200 text-blue-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "price_increase": return "📈";
      case "availability_risk": return "⚠️";
      case "better_deal": return "💡";
      case "booking_expiry": return "⏰";
      default: return "🔔";
    }
  };

  if (!alerts) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
        <p className="text-gray-600 mt-1">
          Stay updated with important travel alerts and opportunities
        </p>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔔</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts</h3>
          <p className="text-gray-600">You're all caught up! No new alerts at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert._id}
              className={`p-4 rounded-lg border ${alert.isRead ? "bg-gray-50 border-gray-200" : "bg-white border-gray-300 shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-2xl">{getTypeIcon(alert.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${alert.isRead ? "text-gray-600" : "text-gray-900"}`}>
                        {alert.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(alert.priority)}`}>
                        {alert.priority}
                      </span>
                    </div>
                    <p className={`text-sm ${alert.isRead ? "text-gray-500" : "text-gray-700"}`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{new Date(alert._creationTime).toLocaleString()}</span>
                      {alert.expiresAt && (
                        <span>Expires: {new Date(alert.expiresAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {alert.actionRequired && (
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      Take Action
                    </button>
                  )}
                  {!alert.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(alert._id)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

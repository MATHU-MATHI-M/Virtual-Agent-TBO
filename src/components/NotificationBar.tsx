import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";

export function NotificationBar() {
  const [isOpen, setIsOpen] = useState(false);
  const alerts = useQuery(api.alerts.getAlerts);
  const unreadCount = useQuery(api.alerts.getUnreadCount);
  const markAsRead = useMutation(api.alerts.markAsRead);

  const unreadAlerts = alerts?.filter(alert => !alert.isRead) || [];
  const latestAlert = unreadAlerts[0];

  useEffect(() => {
    if (latestAlert && !isOpen) {
      // Auto-show notification for high priority alerts
      if (latestAlert.priority === "high" || latestAlert.priority === "urgent") {
        setIsOpen(true);
        setTimeout(() => setIsOpen(false), 5000);
      }
    }
  }, [latestAlert, isOpen]);

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAsRead({ alertId: alertId as any });
    } catch (error) {
      console.error("Failed to mark alert as read:", error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "high": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "medium": return <Info className="w-4 h-4 text-blue-500" />;
      case "low": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-50 border-red-200 text-red-800";
      case "high": return "bg-orange-50 border-orange-200 text-orange-800";
      case "medium": return "bg-blue-50 border-blue-200 text-blue-800";
      case "low": return "bg-green-50 border-green-200 text-green-800";
      default: return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Bell className="w-6 h-6" />
          {(unreadCount || 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount! > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!alerts || alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {alerts.slice(0, 10).map((alert) => (
                    <div
                      key={alert._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !alert.isRead ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(alert.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {alert.title}
                            </h4>
                            {!alert.isRead && (
                              <button
                                onClick={() => handleMarkAsRead(alert._id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          <div className="flex items-center justify-between">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(alert.priority)}`}>
                              {alert.priority.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(alert._creationTime).toLocaleTimeString()}
                            </span>
                          </div>
                          {alert.expiresAt && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <Clock className="w-3 h-3" />
                              Expires: {new Date(alert.expiresAt).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {alerts && alerts.length > 10 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notification for Latest Alert */}
      {latestAlert && isOpen && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div className={`max-w-sm rounded-lg shadow-lg border p-4 ${getPriorityColor(latestAlert.priority)}`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getPriorityIcon(latestAlert.priority)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium mb-1">{latestAlert.title}</h4>
                <p className="text-sm opacity-90">{latestAlert.message}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-shrink-0 opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

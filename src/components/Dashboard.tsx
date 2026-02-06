import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Copilot } from "./Copilot";
import { StatsOverview } from "./StatsOverview";
import { AlertsPanel } from "./AlertsPanel";
import { TripsPanel } from "./TripsPanel";
import { CustomersPanel } from "./CustomersPanel";
import { BookingsPanel } from "./BookingsPanel";
import { NotificationBar } from "./NotificationBar";

type TabType = "copilot" | "trips" | "customers" | "bookings" | "alerts" | "stats";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("copilot");
  const currentAgent = useQuery(api.agents.getCurrentAgent);
  const agentStats = useQuery(api.agents.getAgentStats);
  const unreadAlerts = useQuery(api.alerts.getUnreadCount);

  if (!currentAgent) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: "copilot", label: "AI Copilot", icon: "🤖" },
    { id: "trips", label: "Trips", icon: "✈️", badge: agentStats?.activeTrips },
    { id: "customers", label: "Customers", icon: "👥", badge: agentStats?.totalCustomers },
    { id: "bookings", label: "Bookings", icon: "📋", badge: agentStats?.totalBookings },
    { id: "alerts", label: "Alerts", icon: "🔔", badge: unreadAlerts },
    { id: "stats", label: "Analytics", icon: "📊" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Agent Stats Bar */}
      <div className="flex-none bg-white/60 backdrop-blur-sm border-b border-indigo-100 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-indigo-50">
              <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {currentAgent.name.charAt(0)}
              </div>
              <p className="font-semibold text-sm text-slate-700">{currentAgent.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-600 bg-slate-100/50 px-4 py-1.5 rounded-full">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {currentAgent.territory}
              </span>
              <span className="w-px h-4 bg-slate-300" />
              <span className="text-indigo-600">{(currentAgent.commissionRate * 100).toFixed(1)}% Commission</span>
            </div>
            <NotificationBar />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-72 glass-card m-4 mr-0 border-r-0 flex flex-col overflow-hidden">
          <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-200 group ${activeTab === tab.id
                        ? "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30 font-medium translate-x-1"
                        : "text-slate-600 hover:bg-white hover:text-indigo-600 hover:shadow-md hover:translate-x-1"
                      }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`text-xl transition-transform duration-200 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && tab.badge > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${activeTab === tab.id
                          ? "bg-white/20 text-white"
                          : "bg-rose-100 text-rose-600"
                        }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          <div className="glass-card h-full w-full overflow-hidden flex flex-col relative">
            {activeTab === "copilot" && <Copilot />}
            {activeTab === "trips" && <TripsPanel />}
            {activeTab === "customers" && <CustomersPanel />}
            {activeTab === "bookings" && <BookingsPanel />}
            {activeTab === "alerts" && <AlertsPanel />}
            {activeTab === "stats" && <StatsOverview />}
          </div>
        </div>
      </div>
    </div>
  );
}

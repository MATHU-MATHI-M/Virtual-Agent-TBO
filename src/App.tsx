import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { Dashboard } from "./components/Dashboard";
import { AgentSetup } from "./components/AgentSetup";
import { BookingPage } from "./components/BookingPage";
import { ServiceLanding } from "./components/ServiceLanding";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const services = ['Flights', 'Hotels', 'Holidays', 'Trains', 'Buses', 'Cabs', 'Forex'];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      <header className="flex-none z-20 bg-gradient-to-r from-red-600 to-orange-600 h-16 flex justify-between items-center shadow-lg px-6 text-white">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/30">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              TBO Holidays
            </h2>
          </Link>

          <nav className="hidden md:flex items-center gap-2 text-sm font-medium">
            {services.map((item) => (
              <Link
                key={item}
                to={`/service/${item.toLowerCase()}`}
                className={`px-3 py-1.5 rounded-full transition-all flex items-center gap-2 ${location.pathname.includes(item.toLowerCase())
                    ? 'bg-white text-red-600 shadow-md transform scale-105'
                    : 'hover:bg-white/10 text-white/90'
                  }`}
              >
                {item === 'Flights' && <span>✈️</span>}
                {item === 'Hotels' && <span>🏨</span>}
                {item}
              </Link>
            ))}
          </nav>
        </div>

        <Authenticated>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end text-xs opacity-90">
              <span className="font-semibold">24/7 Support</span>
              <span>+91 9876543210</span>
            </div>
            <SignOutButton />
          </div>
        </Authenticated>
      </header>

      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/50 -z-10" />
        <Routes>
          <Route path="/" element={<AuthWrapper><Dashboard /></AuthWrapper>} />
          <Route path="/booking/:bookingId" element={<AuthWrapper><BookingPage /></AuthWrapper>} />
          <Route path="/service/:service" element={<ServiceLanding />} />
        </Routes>
      </main>
      <Toaster position="top-right" theme="light" />
    </div>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const currentAgent = useQuery(api.agents.getCurrentAgent);

  // Authentication Loading State
  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not logged in
  if (loggedInUser === null) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-full max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to TBO Travel Copilot
            </h1>
            <p className="text-xl text-gray-600">
              Your AI-powered travel planning assistant
            </p>
          </div>
          <SignInForm />
        </div>
      </div>
    );
  }

  // Logged in but agent not setup
  if (currentAgent === undefined) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentAgent === null) {
    return <AgentSetup />;
  }

  return <>{children}</>;
}

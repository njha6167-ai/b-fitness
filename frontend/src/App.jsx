import { useState } from "react";
import Sidebar from "./components/Layout/Sidebar";
import Dashboard from "./components/Dashboard/Dashboard";
import MemberList from "./components/Members/MemberList";
import MemberProfile from "./components/Members/MemberProfile";
import Settings from "./components/Settings/Settings";

export default function App() {
  const [view, setView] = useState("dashboard"); // dashboard | members | settings
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

  function navigate(nextView) {
    setSelectedMemberId(null);
    setView(nextView);
  }

  function openProfile(id) {
    setSelectedMemberId(id);
  }

  function closeProfile() {
    setSelectedMemberId(null);
    setDashboardRefreshKey((k) => k + 1); // in case a renewal/edit happened, dashboard stats refresh on return
  }

  return (
    <div className="flex min-h-screen bg-gym-bg text-gym-text">
      <Sidebar active={view} onNavigate={navigate} />

      <main className="flex-1 overflow-x-hidden px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
        {selectedMemberId ? (
          <MemberProfile
            memberId={selectedMemberId}
            onBack={closeProfile}
            onDeleted={() => {
              setSelectedMemberId(null);
              setDashboardRefreshKey((k) => k + 1);
            }}
          />
        ) : view === "dashboard" ? (
          <Dashboard onSelectMember={openProfile} refreshKey={dashboardRefreshKey} />
        ) : view === "members" ? (
          <MemberList onSelectMember={openProfile} />
        ) : (
          <Settings />
        )}
      </main>
    </div>
  );
}

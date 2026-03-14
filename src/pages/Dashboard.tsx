import { useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import StatsCards from "@/components/dashboard/StatsCards";
import UserAccountsTable from "@/components/dashboard/UserAccountsTable";
import SubscriptionTable from "@/components/dashboard/SubscriptionTable";
import SuccessStories from "@/components/dashboard/SuccessStories";

const Dashboard = () => {
  const [language, setLanguage] = useState<"en" | "es">("en");
  const [activeItem, setActiveItem] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "es" : "en"));

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <DashboardHeader
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onToggleLanguage={toggleLanguage}
        language={language}
      />

      <div className="flex">
        <DashboardSidebar
          activeItem={activeItem}
          onItemClick={setActiveItem}
          language={language}
          isOpen={sidebarOpen}
        />

        {/* Overlay for mobile sidebar */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 p-6 space-y-6 overflow-auto">
          <StatsCards language={language} />

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
            <div className="space-y-6">
              <UserAccountsTable language={language} />
              <SubscriptionTable language={language} />
            </div>
            <SuccessStories language={language} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

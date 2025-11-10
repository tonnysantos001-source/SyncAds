import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Páginas que não devem ter padding/container
  const isFullPageRoute = location.pathname === "/chat";

  return (
    <div className="flex h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64 relative z-10">
        {!isFullPageRoute && <Header setSidebarOpen={setSidebarOpen} />}
        <main
          className={`flex-1 overflow-y-auto ${isFullPageRoute ? "" : "p-4 md:p-6 lg:p-8"}`}
        >
          {isFullPageRoute ? (
            children
          ) : (
            <div className="max-w-7xl mx-auto">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

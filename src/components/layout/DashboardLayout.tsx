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

  // Páginas que devem ter layout sem padding/espaços
  const isFullWidthPage =
    location.pathname === "/chat" || location.pathname === "/onboarding";

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64">
        <Header setSidebarOpen={setSidebarOpen} />
        <main
          className={`flex-1 overflow-y-auto ${isFullWidthPage ? "" : "bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8"}`}
        >
          {isFullWidthPage ? (
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

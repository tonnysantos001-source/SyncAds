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
  const isFullWidthPage = location.pathname === "/chat";

  return (
    <div
      className={`flex h-screen relative overflow-hidden ${isFullWidthPage ? "bg-gray-950" : "bg-gradient-to-br from-white via-pink-50/30 to-blue-50/30 dark:from-gray-950 dark:via-pink-950/20 dark:to-blue-950/20"}`}
    >
      {/* Background Gradients - Rosa e Azul (apenas para páginas normais) */}
      {!isFullWidthPage && (
        <>
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-pink-400/20 to-rose-400/10 dark:from-pink-600/10 dark:to-rose-600/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-cyan-400/10 dark:from-blue-600/10 dark:to-cyan-600/5 rounded-full blur-3xl pointer-events-none animate-pulse-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-400/10 to-pink-400/10 dark:from-purple-600/5 dark:to-pink-600/5 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      {/* Modern Sidebar */}
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 md:ml-64 relative z-10">
        <Header setSidebarOpen={setSidebarOpen} />
        <main
          className={`flex-1 overflow-y-auto ${isFullWidthPage ? "" : "p-4 md:p-6 lg:p-8"}`}
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

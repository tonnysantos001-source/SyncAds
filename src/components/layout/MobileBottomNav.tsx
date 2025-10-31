import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Bot, Megaphone, Plug, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/onboarding", icon: LayoutDashboard, label: "Início" },
  { to: "/chat", icon: Bot, label: "Chat IA" },
  { to: "/campaigns", icon: Megaphone, label: "Campanhas" },
  { to: "/integrations", icon: Plug, label: "Integrações" },
  { to: "/settings", icon: Settings, label: "Ajustes" },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-40 sm:hidden",
        "bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl",
        "border-t border-gray-200/50 dark:border-gray-800/50",
        "shadow-2xl shadow-gray-900/10 dark:shadow-black/50",
      )}
    >
      {/* Gradient Overlay Top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

      <div className="grid h-full grid-cols-5 max-w-lg mx-auto px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            item.to === "/settings"
              ? location.pathname.startsWith("/settings")
              : location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center text-center relative group"
            >
              {/* Active Indicator */}
              {isActive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg shadow-blue-500/50" />
              )}

              <div
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300",
                  "transform group-hover:scale-110 group-active:scale-95",
                  isActive
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                    : "text-gray-600 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-800/50",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300",
                    isActive && "drop-shadow-lg",
                    "group-hover:scale-110",
                  )}
                />
                <span
                  className={cn(
                    "text-[9px] mt-0.5 font-semibold tracking-tight transition-all",
                    isActive && "drop-shadow-md",
                  )}
                >
                  {item.label}
                </span>
              </div>
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Safe Area for iOS */}
      <div className="h-safe-area-inset-bottom bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl" />
    </nav>
  );
};

export default MobileBottomNav;

import React from "react";
import { Menu, Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { theme, toggleTheme } = useDarkMode();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 px-6",
        "bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl",
        "border-b border-gray-200/50 dark:border-gray-800/50",
        "shadow-sm shadow-gray-200/50 dark:shadow-gray-950/50",
      )}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

      <Button
        size="icon"
        variant="outline"
        className={cn(
          "sm:hidden border-gray-300 dark:border-gray-700",
          "hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent",
          "transition-all duration-200",
        )}
        onClick={() => setSidebarOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>

      <div className="ml-auto flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "relative p-2 rounded-xl overflow-hidden",
            "bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-yellow-500/10 dark:to-orange-500/10",
            "border border-gray-200 dark:border-gray-700",
            "hover:border-blue-400 dark:hover:border-yellow-400",
            "transition-all duration-200 hover:scale-105",
            "group",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-yellow-500/20 dark:to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          <div className="relative w-5 h-5">
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400 transition-transform duration-200" />
            ) : (
              <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-200" />
            )}
          </div>

          <span
            className={cn(
              "absolute -bottom-10 left-1/2 -translate-x-1/2",
              "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
              "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
              "pointer-events-none opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
            )}
          >
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </span>
        </button>
      </div>
    </header>
  );
};

export default Header;

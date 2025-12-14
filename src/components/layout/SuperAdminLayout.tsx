import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  HiSparkles,
  HiHome,
  HiChartBar,
  HiUsers,
  HiCurrencyDollar,
  HiCreditCard,
  HiCog6Tooth,
  HiChatBubbleBottomCenterText,
  HiPuzzlePiece,
} from "react-icons/hi2";
import {
  IoShieldCheckmark,
  IoSwapHorizontal,
  IoLogOut,
  IoRocketSharp,
  IoStorefront,
} from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { to: "/super-admin", icon: HiHome, label: "Dashboard" },
  {
    to: "/super-admin/chat",
    icon: HiChatBubbleBottomCenterText,
    label: "Chat Admin",
  },
  { to: "/super-admin/clients", icon: HiUsers, label: "Clientes" },
  { to: "/super-admin/plans", icon: IoRocketSharp, label: "Planos" },
  {
    to: "/super-admin/payment-split",
    icon: IoSwapHorizontal,
    label: "Split Pagamento",
  },
  { to: "/super-admin/billing", icon: HiCurrencyDollar, label: "Faturamento" },
  { to: "/super-admin/usage", icon: HiChartBar, label: "Uso de IA" },
  { to: "/super-admin/ai-connections", icon: HiSparkles, label: "IA Global" },
  { to: "/super-admin/gateways", icon: HiCreditCard, label: "Gateways" },
  {
    to: "/super-admin/oauth-config",
    icon: HiPuzzlePiece,
    label: "OAuth Config",
  },
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login-v2", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex h-full relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40">
      {/* Sidebar - Sempre visível */}
      <aside className="w-64 bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 flex flex-col shadow-2xl">
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-md opacity-50" />
              <div className="relative h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <IoShieldCheckmark className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Super Admin
              </h1>
              <p className="text-xs text-gray-400">Painel Administrativo</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/50",
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
                <Icon
                  className={cn(
                    "w-5 h-5 relative z-10 transition-transform group-hover:scale-110",
                    isActive && "text-white",
                  )}
                />
                <span className="font-medium relative z-10">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="ml-auto relative z-10 text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-800/50">
            <Avatar className="h-10 w-10 border-2 border-purple-500">
              <AvatarImage src={user?.avatarUrl} />
              <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || "SA"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || "Super Admin"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-gray-700/50 bg-gray-900/95 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 shadow-lg">
          {/* Page Title */}
          <div className="flex-1">
            <h2 className="text-lg md:text-xl font-bold text-white">
              {navItems.find((item) => item.to === location.pathname)?.label ||
                "Super Admin"}
            </h2>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 hover:bg-gray-800/50 border border-gray-700/50"
              >
                <Avatar className="h-8 w-8 border-2 border-purple-500">
                  <AvatarImage src={user?.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xs font-bold">
                    {user?.name?.substring(0, 2).toUpperCase() || "SA"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-white">
                  {user?.name || "Admin"}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-gray-900 border-gray-700"
            >
              <DropdownMenuLabel className="text-gray-400">
                Minha Conta
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={() => navigate("/app/dashboard")}
                className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
              >
                <IoStorefront className="mr-2 h-4 w-4" />
                Ver Painel Cliente
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate("/app/settings")}
                className="text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer"
              >
                <HiCog6Tooth className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 cursor-pointer"
              >
                <IoLogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}


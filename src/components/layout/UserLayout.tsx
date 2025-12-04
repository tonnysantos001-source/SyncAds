import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  HiSparkles,
  HiHome,
  HiChartBar,
  HiShoppingCart,
  HiCube,
  HiUsers,
  HiMegaphone,
  HiCreditCard,
  HiPuzzlePiece,
  HiCog6Tooth,
} from "react-icons/hi2";
import {
  IoFlash,
  IoTicket,
  IoStorefront,
  IoColorPalette,
  IoLogOut,
  IoMenu,
  IoClose,
} from "react-icons/io5";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuthStoreV2 } from "@/store/authStoreV2";
import { SyncAdsWatermarkBg } from "@/components/backgrounds/SyncAdsWatermarkBg";

interface UserLayoutProps {
  children: React.ReactNode;
}

interface SubMenuItem {
  to: string;
  label: string;
  icon?: React.ElementType;
}

interface MenuItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  submenu?: SubMenuItem[];
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStoreV2();

  // Força modo escuro sempre
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login-v2");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [label]: !prev[label]
    }));
  };

  const menuItems: MenuItem[] = [
    { to: "/onboarding", icon: HiHome, label: "Início" },
    {
      icon: HiChartBar,
      label: "Relatórios",
      submenu: [
        { to: "/reports/overview", label: "Visão Geral", icon: HiChartBar },
        { to: "/reports/audience", label: "Audiência" },
        { to: "/reports/utms", label: "UTMs" },
        { to: "/reports/ads", label: "Anúncios" },
      ],
    },
    {
      icon: HiShoppingCart,
      label: "Pedidos",
      submenu: [
        { to: "/orders/all", label: "Todos Pedidos", icon: HiShoppingCart },
        { to: "/orders/abandoned-carts", label: "Carrinhos Abandonados" },
        { to: "/orders/pix-recovered", label: "PIX Recuperados" },
      ],
    },
    {
      icon: HiCube,
      label: "Produtos",
      submenu: [
        { to: "/products/all", label: "Todos Produtos", icon: HiCube },
        { to: "/products/collections", label: "Coleções" },
        { to: "/products/kits", label: "Kits" },
      ],
    },
    {
      icon: HiUsers,
      label: "Clientes",
      submenu: [
        { to: "/customers/all", label: "Todos Clientes", icon: HiUsers },
        { to: "/customers/leads", label: "Leads" },
      ],
    },
    {
      icon: HiMegaphone,
      label: "Marketing",
      submenu: [
        { to: "/marketing/coupons", label: "Cupons", icon: IoTicket },
        { to: "/marketing/order-bump", label: "Order Bump" },
        { to: "/marketing/upsell", label: "Upsell" },
        { to: "/marketing/cross-sell", label: "Cross-sell" },
        { to: "/marketing/discount-banner", label: "Banner Desconto" },
        { to: "/marketing/cashback", label: "Cashback" },
        { to: "/marketing/pixels", label: "Pixels" },
      ],
    },
    {
      icon: IoStorefront,
      label: "Checkout",
      submenu: [
        { to: "/checkouts", label: "Gerenciar", icon: IoStorefront },
        { to: "/checkout/domain", label: "Domínio" },
        { to: "/checkout/discounts", label: "Descontos" },
        { to: "/checkout/customize", label: "Personalizar", icon: IoColorPalette },
        { to: "/checkout/social-proof", label: "Prova Social" },
        { to: "/checkout/gateways", label: "Gateways", icon: HiCreditCard },
        { to: "/checkout/shipping", label: "Frete" },
      ],
    },
    { to: "/billing", icon: HiCreditCard, label: "Plano & Faturamento" },
    { to: "/integrations", icon: HiPuzzlePiece, label: "Integrações" },
    { to: "/settings", icon: HiCog6Tooth, label: "Configurações" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ item }: { item: MenuItem }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.label];
    const Icon = item.icon;

    if (!hasSubmenu && item.to) {
      return (
        <NavLink
          to={item.to}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150",
              isActive
                ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400"
                : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
            )
          }
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm">{item.label}</span>
          {item.badge && (
            <Badge variant="secondary" className="ml-auto">
              {item.badge}
            </Badge>
          )}
        </NavLink>
      );
    }

    return (
      <div>
        <button
          onClick={() => toggleSubmenu(item.label)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-150",
            isExpanded
              ? "bg-gray-800/50 text-white"
              : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium text-sm flex-1 text-left">{item.label}</span>
          <svg
            className={cn("w-4 h-4 transition-transform duration-150", isExpanded && "rotate-180")}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && item.submenu && (
          <div className="mt-1 space-y-1 pl-4">
            {item.submenu.map((subItem) => {
              const SubIcon = subItem.icon;
              return (
                <NavLink
                  key={subItem.to}
                  to={subItem.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-150 text-sm",
                      isActive
                        ? "bg-blue-500/10 text-blue-400"
                        : "text-gray-400 hover:bg-gray-800/30 hover:text-gray-200"
                    )
                  }
                >
                  {SubIcon && <SubIcon className="w-4 h-4" />}
                  <span>{subItem.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40">
      {/* Background decorativo */}
      <SyncAdsWatermarkBg watermarkOpacity={0.08} variant="default" />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-200"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col shadow-2xl transition-transform duration-300 md:translate-x-0",
          "bg-gray-900/95 backdrop-blur-xl border-r border-gray-700/50",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <IoFlash className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">SyncAds</h1>
                <p className="text-xs text-blue-400 font-semibold">MARKETING AI</p>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
          {menuItems.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </nav>

        {/* Status */}
        <div className="px-6 py-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Sistema Online</span>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-t border-gray-700/50 bg-gray-800/30">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name || "Usuário"}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg transition-all duration-200 border border-red-500/20"
          >
            <IoLogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Header */}
        <header className="h-16 bg-gray-900/80 backdrop-blur-xl border-b border-gray-700/50 flex items-center justify-between px-6 shadow-lg">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              <IoMenu className="w-6 h-6" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-white">
                {menuItems.find((item) => item.to && isActive(item.to))?.label || "Dashboard"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30"
            >
              Plano: {user?.plan || "Free"}
            </Badge>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Chat IA Flutuante */}
      <AnimatePresence mode="wait">
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.25,
              ease: [0.4, 0, 0.2, 1]
            }}
            className="fixed bottom-24 right-6 w-96 h-[600px] z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Chat Header */}
            <div className="h-14 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <HiSparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Assistente IA</h3>
                  <p className="text-xs text-white/80">Online</p>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <IoClose className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Content */}
            <iframe
              src="/chat"
              className="w-full h-[calc(100%-3.5rem)] border-0"
              title="Chat IA"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão Chat IA */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 z-40 h-14 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-blue-500/50 flex items-center gap-2 font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
      >
        <HiSparkles className="w-5 h-5" />
        <span>Assistente IA</span>
      </button>
    </div>
  );
};

export default UserLayout;

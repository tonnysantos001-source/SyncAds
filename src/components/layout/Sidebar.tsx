import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  HiSparkles,
  HiChatBubbleBottomCenterText,
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
  IoChevronDown,
  IoFlash,
  IoEye,
  IoCart,
  IoGift,
  IoTrendingUp,
  IoBarcode,
  IoPeople,
  IoPersonAdd,
  IoTicket,
  IoRocketSharp,
  IoTrendingDownSharp,
  IoStorefront,
  IoLayersSharp,
  IoColorPalette,
  IoShieldCheckmark,
  IoSwapHorizontal,
} from "react-icons/io5";
import { Badge } from "../ui/badge";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface SubMenuItem {
  to: string;
  label: string;
  icon?: React.ElementType;
  badge?: string;
  openInNewTab?: boolean;
}

interface NavItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  subItems?: SubMenuItem[];
}

const navItems: NavItem[] = [
  { to: "/chat", icon: HiChatBubbleBottomCenterText, label: "Chat IA" },
  { to: "/onboarding", icon: HiHome, label: "Página inicial" },
  {
    icon: HiChartBar,
    label: "Relatórios",
    subItems: [
      { to: "/reports/overview", label: "Visão geral", icon: IoEye },
      { to: "/reports/audience", label: "Público alvo", icon: IoPeople },
      { to: "/reports/utms", label: "UTMs", icon: IoBarcode },
    ],
  },
  {
    icon: HiShoppingCart,
    label: "Pedidos",
    subItems: [
      { to: "/orders/all", label: "Ver todos", icon: IoCart },
      {
        to: "/orders/abandoned-carts",
        label: "Carrinhos abandonados",
        icon: IoTrendingDownSharp,
      },
      {
        to: "/orders/pix-recovered",
        label: "Pix Recuperados",
        icon: IoTrendingUp,
      },
    ],
  },
  {
    icon: HiCube,
    label: "Produtos",
    subItems: [
      { to: "/products/all", label: "Ver todos", icon: IoStorefront },
      { to: "/products/collections", label: "Coleções", icon: IoLayersSharp },
      { to: "/products/kits", label: "Kit de Produtos", icon: IoGift },
    ],
  },
  {
    icon: HiUsers,
    label: "Clientes",
    subItems: [
      { to: "/customers/all", label: "Ver todos", icon: IoPeople },
      { to: "/customers/leads", label: "Leads", icon: IoPersonAdd },
    ],
  },
  {
    icon: HiMegaphone,
    label: "Marketing",
    subItems: [
      { to: "/marketing/coupons", label: "Cupons", icon: IoTicket },
      { to: "/marketing/order-bump", label: "Order Bump", icon: IoRocketSharp },
      { to: "/marketing/upsell", label: "Upsell", icon: IoTrendingUp },
      {
        to: "/marketing/cross-sell",
        label: "Cross-Sell",
        icon: IoSwapHorizontal,
      },
      {
        to: "/marketing/discount-banner",
        label: "Faixa de desconto",
        icon: IoGift,
      },
      { to: "/marketing/cashback", label: "Cashback", icon: IoTicket },
      { to: "/marketing/pixels", label: "Pixels", icon: IoBarcode },
    ],
  },
  {
    icon: HiCreditCard,
    label: "Checkout",
    subItems: [
      { to: "/checkout/discounts", label: "Descontos", icon: IoTicket },
      {
        to: "/checkout/customize",
        label: "Personalizar",
        icon: IoColorPalette,
        openInNewTab: true,
      },
      {
        to: "/checkout/social-proof",
        label: "Provas Sociais",
        icon: IoShieldCheckmark,
      },
      { to: "/checkout/gateways", label: "Gateways", icon: HiCreditCard },
      {
        to: "/checkout/redirect",
        label: "Redirecionamento",
        icon: IoSwapHorizontal,
      },
    ],
  },
  { to: "/integrations", icon: HiPuzzlePiece, label: "Integrações" },
  { to: "/billing", icon: HiCreditCard, label: "Faturamento" },
  { to: "/settings", icon: HiCog6Tooth, label: "Configurações" },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();

  const toggleMenu = (label: string) => {
    // Garante que só um menu fica aberto por vez
    if (expandedMenu === label) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(label);
    }
  };

  useEffect(() => {
    // Encontra apenas o primeiro menu que contém a rota atual
    const activeMenu = navItems.find((item) =>
      item.subItems?.some((s) => location.pathname.startsWith(s.to)),
    );

    if (activeMenu) {
      setExpandedMenu(activeMenu.label);
    }
  }, [location.pathname]);

  const NavItem: React.FC<{ item: NavItem }> = ({ item }) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenu === item.label;

    if (hasSubItems) {
      return (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleMenu(item.label);
            }}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200",
              isExpanded
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
            )}
          >
            <motion.div
              animate={
                isExpanded
                  ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 360],
                    }
                  : {}
              }
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isExpanded ? "text-white" : "text-gray-600",
                )}
              />
              {isExpanded && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                </motion.div>
              )}
            </motion.div>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                {item.badge}
              </Badge>
            )}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <IoChevronDown
                className={cn(
                  "h-4 w-4",
                  isExpanded ? "text-white" : "text-gray-400",
                )}
              />
            </motion.div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-10 mt-1 space-y-0.5 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  {item.subItems.map((subItem) =>
                    subItem.openInNewTab ? (
                      <a
                        key={subItem.to}
                        href={subItem.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-all duration-150",
                          "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600",
                        )}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          {subItem.icon && <subItem.icon className="h-4 w-4" />}
                          <span>{subItem.label}</span>
                        </div>
                      </a>
                    ) : (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-all duration-150",
                            isActive
                              ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                              : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600",
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <div className="flex items-center gap-2 flex-1">
                              {subItem.icon && (
                                <subItem.icon className="h-4 w-4" />
                              )}
                              <span>{subItem.label}</span>
                            </div>
                            {isActive && (
                              <motion.div
                                layoutId="activeSubDot"
                                className="w-1.5 h-1.5 rounded-full bg-blue-600"
                                transition={{
                                  type: "spring",
                                  stiffness: 400,
                                  damping: 30,
                                }}
                              />
                            )}
                            {subItem.badge && (
                              <Badge
                                variant="destructive"
                                className="text-[9px] px-1 h-4"
                              >
                                {subItem.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </NavLink>
                    ),
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    return (
      <NavLink
        to={item.to!}
        className={({ isActive }) =>
          cn(
            "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
              : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
          )
        }
      >
        {({ isActive }) => (
          <>
            <motion.div whileHover={{ scale: 1.1 }} className="relative">
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isActive ? "text-white" : "text-gray-600",
                )}
              />
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <div className="w-2 h-2 rounded-full bg-yellow-400" />
                </motion.div>
              )}
            </motion.div>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <Badge
                variant="destructive"
                className={cn(
                  "text-[10px] px-1.5 h-5",
                  isActive && "bg-white/20 text-white border-0",
                )}
              >
                {item.badge}
              </Badge>
            )}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 w-1 h-10 bg-white rounded-r-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </>
        )}
      </NavLink>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-white dark:bg-gray-950">
      {/* Logo Header */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-200 dark:border-gray-800">
        <div className="relative">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-lg shadow-blue-500/40">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <IoFlash className="h-7 w-7 text-white drop-shadow-lg" />
            </motion.div>
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              className="absolute -top-1 -right-1"
            >
              <HiSparkles className="h-4 w-4 text-yellow-400 drop-shadow-lg" />
            </motion.div>
          </div>
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute inset-0 rounded-2xl bg-blue-400/30 blur-xl -z-10"
          />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
            SyncAds
          </h1>
          <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 tracking-wider">
            MARKETING AI
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 pt-24 pb-4 space-y-1 scrollbar-hide">
        {navItems.map((item) => (
          <NavItem key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </motion.div>
          <span>Sistema Online</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-y-0 left-0 z-50 w-64 md:hidden border-r border-gray-200 dark:border-gray-800"
      >
        <SidebarContent />
      </motion.aside>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-gray-200 dark:border-gray-800">
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;

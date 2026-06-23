import React, { useState, useEffect, useCallback, useMemo } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
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
  HiTruck,
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
  IoMail,
} from "react-icons/io5";
import { Badge } from "../ui/badge";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  User,
  Settings,
  LogOut,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Megaphone,
  Globe,
} from "lucide-react";

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
  // { to: "/app/extension", icon: HiPuzzlePiece, label: "Extensão do Navegador" },
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
      { to: "/marketing/emails", label: "E-mails", icon: IoMail },
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
      { to: "/checkout/shipping", label: "Logística", icon: HiTruck },
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

// Memoizar o componente de submenu para evitar re-renders desnecessários
const SubMenuItem = React.memo<{
  subItem: SubMenuItem;
}>(({ subItem }) => {
  if (subItem.openInNewTab) {
    return (
      <a
        href={`${window.location.origin}${subItem.to}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-all duration-150 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600"
      >
        <div className="flex items-center gap-2 flex-1">
          {subItem.icon && <subItem.icon className="h-4 w-4" />}
          <span>{subItem.label}</span>
        </div>
      </a>
    );
  }

  return (
    <NavLink
      to={subItem.to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-base font-medium transition-all duration-150",
          isActive
            ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20"
            : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600",
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-2 flex-1">
            {subItem.icon && <subItem.icon className="h-4 w-4" />}
            <span>{subItem.label}</span>
          </div>
          {isActive && (
            <motion.div
              layoutId="activeSubDot"
              className="w-1.5 h-1.5 rounded-full bg-blue-600"
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 35,
                mass: 0.5,
              }}
            />
          )}
          {subItem.badge && (
            <Badge variant="destructive" className="text-[9px] px-1 h-4">
              {subItem.badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );
});

SubMenuItem.displayName = "SubMenuItem";



const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  // Estado para controlar menu expandido (apenas 1 por vez - accordion)
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() => {
    const activeMenu = navItems.find((item) =>
      item.subItems?.some((s) => location.pathname.startsWith(s.to)),
    );
    return activeMenu?.label || null;
  });

    const handleLogout = async () => {
    await logout();
    window.location.href = "/login-v2";
  };

  // Memoizar função de toggle para evitar recriação
  const toggleMenu = useCallback((label: string, element?: HTMLElement) => {
    setExpandedMenu((prev) => {
      const newValue = prev === label ? null : label;

      // Scroll suave para o item clicado após um pequeno delay
      if (newValue && element) {
        setTimeout(() => {
          element.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }, 100);
      }

      return newValue;
    });
  }, []);

  // Memoizar função de fechar sidebar
  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, [setSidebarOpen]);

  // Componente NavItem memoizado
  const NavItemComponent = React.memo<{ item: NavItem }>(({ item }) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenu === item.label;
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    const handleClick = useCallback(() => {
      if (hasSubItems && buttonRef.current) {
        toggleMenu(item.label, buttonRef.current);
      }
    }, [hasSubItems]);

    if (hasSubItems) {
      return (
        <div>
          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200",
              isExpanded
                ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
            )}
          >
            <div className="relative">
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors",
                  isExpanded
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400",
                )}
              />
            </div>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <Badge variant="destructive" className="text-[10px] px-1.5 h-5">
                {item.badge}
              </Badge>
            )}
            <IoChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded ? "text-white rotate-180" : "text-gray-400",
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.2,
                  ease: "easeInOut",
                }}
                className="overflow-hidden"
              >
                <div className="ml-10 mt-1 space-y-0.5 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  {item.subItems?.map((subItem) => (
                    <SubMenuItem key={subItem.to} subItem={subItem} />
                  ))}
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
            "group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all duration-200",
            isActive
              ? "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
              : "text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
          )
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative">
              <item.icon
                className={cn(
                  "h-6 w-6 transition-colors duration-150",
                  isActive ? "text-white" : "text-gray-600 dark:text-gray-400",
                )}
              />
            </div>
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
              <div className="absolute left-0 w-1 h-10 bg-white rounded-r-full" />
            )}
          </>
        )}
      </NavLink>
    );
  });

  NavItemComponent.displayName = "NavItemComponent";

  // Memoizar o conteúdo da sidebar
  const SidebarContent = useMemo(
    () => (
      <div className="flex h-full flex-col bg-white dark:bg-gray-950">
        {/* Logo Header */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <img
              src="/syncads-logo.svg"
              alt="SyncAds Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight text-gray-900 dark:text-white">
              SyncAds
            </h1>
            <p className="text-[11px] font-bold tracking-wider text-blue-600 dark:text-blue-400">
              MARKETING AI
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-16 pb-4 space-y-1 scrollbar-hide">
          {navItems.map((item) => (
            <NavItemComponent key={item.label} item={item} />
          ))}
        </nav>

        {/* User profile & Notifications Footer */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800/80 bg-gray-50/40 dark:bg-gray-900/10 flex items-center justify-between gap-1.5">
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-105 dark:hover:bg-gray-800/50 text-left flex-1 min-w-0 transition-all duration-200 group">
                <div className="relative flex-shrink-0">
                  <Avatar className="h-9 w-9 ring-2 ring-gray-100 dark:ring-gray-800 transition-all duration-200 group-hover:scale-105">
                    <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm">
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-950" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate leading-none mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user?.name || "Usuário"}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-none">
                    {user?.email}
                  </p>
                </div>
                <IoChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start" side="top" sideOffset={12}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href="https://status.syncads.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center w-full"
                >
                  <Globe className="mr-2 h-4 w-4" /> <span>Status do Sistema</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center w-full">
                  <Settings className="mr-2 h-4 w-4" /> <span>Configurações</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    ),
    [expandedMenu, user],
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
            transition={{ duration: 0.15 }}
            onClick={handleCloseSidebar}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
              mass: 0.8,
            }}
            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden border-r border-gray-200 dark:border-gray-800"
          >
            {SidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30 border-r border-gray-200 dark:border-gray-800">
        {SidebarContent}
      </aside>
    </>
  );
};

export default React.memo(Sidebar);


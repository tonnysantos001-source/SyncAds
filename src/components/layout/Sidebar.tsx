import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Plug,
  Settings,
  X,
  PanelLeft,
  ChevronDown,
  ChevronUp,
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Megaphone,
  CreditCard,
  Home,
  Target,
  Link2,
  ShoppingBag,
  FolderKanban,
  Gift,
  UserCircle,
  BadgeCheck,
  Tag,
  TrendingUp,
  Repeat,
  Percent,
  DollarSign,
  Gauge,
  Palette,
  Star,
  Wallet,
  ArrowRightLeft,
} from 'lucide-react';
import Logo from '../Logo';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

interface SubMenuItem {
  to: string;
  label: string;
  badge?: string;
}

interface NavItem {
  to?: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  subItems?: SubMenuItem[];
}

const navItems: NavItem[] = [
  { to: '/chat', icon: Bot, label: 'Chat IA' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  {
    icon: BarChart3,
    label: 'Relatórios',
    subItems: [
      { to: '/reports/overview', label: 'Visão geral' },
      { to: '/reports/audience', label: 'Público alvo' },
      { to: '/reports/utms', label: 'UTMs' },
    ],
  },
  {
    icon: ShoppingCart,
    label: 'Pedidos',
    subItems: [
      { to: '/orders/all', label: 'Ver todos' },
      { to: '/orders/abandoned-carts', label: 'Carrinhos abandonados' },
      { to: '/orders/pix-recovered', label: 'Pix Recuperados' },
    ],
  },
  {
    icon: Package,
    label: 'Produtos',
    subItems: [
      { to: '/products/all', label: 'Ver todos' },
      { to: '/products/collections', label: 'Coleções' },
      { to: '/products/kits', label: 'Kit de Produtos' },
    ],
  },
  {
    icon: Users,
    label: 'Clientes',
    subItems: [
      { to: '/customers/all', label: 'Ver todos' },
      { to: '/customers/leads', label: 'Leads' },
    ],
  },
  {
    icon: Megaphone,
    label: 'Marketing',
    subItems: [
      { to: '/marketing/coupons', label: 'Cupons' },
      { to: '/marketing/order-bump', label: 'Order Bump' },
      { to: '/marketing/upsell', label: 'Upsell' },
      { to: '/marketing/cross-sell', label: 'Cross-Sell' },
      { to: '/marketing/discount-banner', label: 'Faixa de desconto' },
      { to: '/marketing/cashback', label: 'Cashback' },
      { to: '/marketing/pixels', label: 'Pixels' },
    ],
  },
  {
    icon: CreditCard,
    label: 'Checkout',
    subItems: [
      { to: '/checkout/discounts', label: 'Descontos' },
      { to: '/checkout/customize', label: 'Personalizar' },
      { to: '/checkout/social-proof', label: 'Provas Sociais' },
      { to: '/checkout/gateways', label: 'Gateways' },
      { to: '/checkout/redirect', label: 'Redirecionamento' },
    ],
  },
  { to: '/integrations', icon: Plug, label: 'Integrações' },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    );
  };

  const NavItem: React.FC<{ item: NavItem; isCollapsed: boolean }> = ({ item, isCollapsed }) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedMenus.includes(item.label);

    if (hasSubItems) {
      return (
        <div>
          <button
            onClick={() => toggleMenu(item.label)}
            className={cn(
              'group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
              'text-white/80',
              'hover:bg-white/10 hover:text-white',
              isCollapsed && 'justify-center px-3',
              isExpanded && 'bg-white/20 text-white'
            )}
          >
            <item.icon className={cn("h-5 w-5 transition-transform duration-200", isCollapsed && "h-6 w-6")} />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 transition-transform duration-200" />
                ) : (
                  <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                )}
              </>
            )}
          </button>

          {/* Submenu */}
          {!isCollapsed && isExpanded && (
            <div className="ml-4 mt-1 border-l-2 border-white/20 pl-4 space-y-1">
              {item.subItems.map((subItem) => (
                <NavLink
                  key={subItem.to}
                  to={subItem.to}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-200',
                      isActive
                        ? 'bg-white/20 text-white font-medium'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )
                  }
                >
                  <span>{subItem.label}</span>
                  {subItem.badge && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">
                      {subItem.badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Item sem submenu
    return (
      <NavLink
        to={item.to!}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
            'text-white/80',
            'hover:bg-white/10 hover:text-white',
            isActive && 'bg-white/20 text-white',
            isCollapsed && 'justify-center px-3'
          )
        }
      >
        <item.icon className={cn("h-5 w-5 transition-transform duration-200 group-hover:scale-110", isCollapsed && "h-6 w-6")} />
        {!isCollapsed && (
          <>
            <span>{item.label}</span>
            {item.badge && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 ml-auto">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const SidebarContent = () => (
    <div className={cn("flex h-full max-h-screen flex-col gap-2 bg-[#1a1a1a]", isCollapsed && "items-center")}>
      {/* Header com Logo */}
      <div
        className={cn(
          "flex h-20 items-center px-6 border-b border-white/10"
        )}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {/* Logo SyncAds com coração */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Coração branco */}
                  <path
                    d="M50,85 C50,85 15,60 15,40 C15,25 25,15 35,15 C42,15 47,19 50,25 C53,19 58,15 65,15 C75,15 85,25 85,40 C85,60 50,85 50,85 Z"
                    fill="white"
                  />
                  {/* Detalhe rosa */}
                  <circle cx="70" cy="30" r="18" fill="#EC4899" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-white text-xl font-bold tracking-tight">SyncAds</span>
              </div>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-10 h-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M50,85 C50,85 15,60 15,40 C15,25 25,15 35,15 C42,15 47,19 50,25 C53,19 58,15 65,15 C75,15 85,25 85,40 C85,60 50,85 50,85 Z"
                fill="white"
              />
              <circle cx="70" cy="30" r="18" fill="#EC4899" />
            </svg>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto">
        <nav className={cn("grid items-start gap-2 px-3 py-4", isCollapsed && "px-2")}>
          {navItems.map((item) => (
            <NavItem key={item.label} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div
        className={cn(
          "mt-auto p-4 border-t border-white/10"
        )}
      >
        <nav className={cn("grid items-start gap-2", isCollapsed && "px-0")}>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200',
                'text-white/80',
                'hover:bg-white/10 hover:text-white',
                isActive && 'bg-white/20 text-white',
                isCollapsed && 'justify-center px-3'
              )
            }
          >
            <Settings className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90" />
            {!isCollapsed && <span>Configurações</span>}
          </NavLink>
        </nav>

        {/* Collapse Button */}
        <Button
          size="icon"
          variant="outline"
          className={cn(
            "w-full hidden sm:flex mt-3 border-white/20 text-white/80",
            "hover:bg-white/10 hover:text-white hover:border-white/30",
            "transition-all duration-200"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <PanelLeft className={cn("h-4 w-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/60 transition-opacity sm:hidden',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out sm:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 absolute top-0 right-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden sm:block border-r border-gray-200/50 dark:border-gray-800/50 transition-all duration-300",
          "shadow-xl shadow-gray-200/50 dark:shadow-gray-950/50",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;

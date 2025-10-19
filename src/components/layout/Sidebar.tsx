import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Megaphone,
  Bot,
  Plug,
  Settings,
  X,
  PanelLeft,
  BarChart3,
} from 'lucide-react';
import Logo from '../Logo';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/chat', icon: Bot, label: 'Chat IA' },
  { to: '/integrations', icon: Plug, label: 'Integrações' },
];

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const NavItem: React.FC<{ item: typeof navItems[0], isCollapsed: boolean }> = ({ item, isCollapsed }) => (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
          isActive && 'bg-muted text-primary',
          isCollapsed && 'justify-center'
        )
      }
    >
      <item.icon className="h-5 w-5" />
      {!isCollapsed && <span className="font-medium">{item.label}</span>}
    </NavLink>
  );

  const SidebarContent = () => (
    <div className={cn("flex h-full max-h-screen flex-col gap-2", isCollapsed && "items-center")}>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        {!isCollapsed && <Logo />}
      </div>
      <div className="flex-1">
        <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isCollapsed && "px-2")}>
          {navItems.map((item) => (
            <NavItem key={item.label} item={item} isCollapsed={isCollapsed} />
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4 border-t">
        <nav className={cn("grid items-start gap-1 text-sm font-medium", isCollapsed && "px-0")}>
           <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                  isActive && 'bg-muted text-primary',
                  isCollapsed && 'justify-center'
                )
              }
            >
              <Settings className="h-5 w-5" />
              {!isCollapsed && <span>Configurações</span>}
            </NavLink>
        </nav>
        <Button size="icon" variant="outline" className="w-full hidden sm:flex mt-4" onClick={() => setIsCollapsed(!isCollapsed)}>
          <PanelLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
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
      <aside className={cn("hidden sm:block border-r bg-background transition-all", isCollapsed ? "w-20" : "w-64")}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;

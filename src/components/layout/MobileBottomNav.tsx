import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Bot, Megaphone, Plug, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/chat', icon: Bot, label: 'Chat IA' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
  { to: '/integrations', icon: Plug, label: 'Integrações' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-card/60 backdrop-blur-xl border-t z-40 sm:hidden">
      <div className="grid h-full grid-cols-5 max-w-lg mx-auto">
        {navItems.map((item) => {
          // Keep settings active for all sub-routes
          const isActive = item.to === '/settings' 
            ? location.pathname.startsWith('/settings') 
            : location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className={cn(
                "flex flex-col items-center justify-center w-[60px] h-[52px] rounded-lg transition-colors duration-200",
                isActive ? 'bg-primary text-primary-foreground' : 'text-foreground/60'
              )}>
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] mt-1 font-medium tracking-tight">{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

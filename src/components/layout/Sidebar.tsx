import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { MENU_ITEMS, BOTTOM_MENU_ITEMS, LOGO_ICON as Logo } from '../../constants/menu';
import type { MenuItem } from '../../constants/menu';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const { role } = useAuth();

  const adminOnlyItems = ['mother-ai', 'users'];
  const visibleMenuItems = MENU_ITEMS.filter(item => {
      if (adminOnlyItems.includes(item.id)) {
          return role === 'admin';
      }
      return true;
  });

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? '5rem' : '16rem' }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-light-card dark:bg-dark-card border-r border-light-border dark:border-dark-border z-20"
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-light-border dark:border-dark-border">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Logo className="text-brand-primary h-7 w-7" />
              <span className="text-xl font-bold tracking-tighter whitespace-nowrap text-gray-900 dark:text-white">SyncAds AI</span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ChevronLeft
            className={cn('transition-transform duration-300', isCollapsed && 'rotate-180')}
          />
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {visibleMenuItems.map((item) => (
          <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} />
        ))}
      </nav>

      <div className="px-2 py-4 border-t border-light-border dark:border-dark-border">
        <div className="px-3 py-2">
           <ThemeToggle />
        </div>
        {BOTTOM_MENU_ITEMS.map((item) => (
          <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} />
        ))}
        <div className="mt-4">
            <UserMenu isCollapsed={isCollapsed} />
        </div>
      </div>
    </motion.aside>
  );
};

const SidebarItem = ({ item, isCollapsed }: { item: MenuItem, isCollapsed: boolean }) => {
    const location = useLocation();
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isParentActive = hasSubItems && item.subItems.some(sub => location.pathname.startsWith(sub.path!));
    const [isSubMenuOpen, setSubMenuOpen] = useState(isParentActive);

    const handleItemClick = () => {
        if (hasSubItems) {
            setSubMenuOpen(!isSubMenuOpen);
        }
    };
    
    if (hasSubItems) {
        return (
            <div>
                <button
                    onClick={handleItemClick}
                    className={cn(
                        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700',
                        'group',
                        (isParentActive && !isSubMenuOpen) && 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                                className="font-medium whitespace-nowrap overflow-hidden flex-1 text-left"
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </AnimatePresence>
                    <AnimatePresence>
                    {!isCollapsed && (
                        <ChevronDown className={cn('h-4 w-4 ml-auto transition-transform', isSubMenuOpen && 'rotate-180')} />
                    )}
                    </AnimatePresence>
                </button>
                <AnimatePresence>
                    {isSubMenuOpen && !isCollapsed && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-6 pl-3 border-l border-gray-300 dark:border-dark-border/50 flex flex-col space-y-1 py-1"
                        >
                            {item.subItems?.map(subItem => (
                                <Link
                                    key={subItem.id}
                                    to={subItem.path!}
                                    className={cn(
                                        'block rounded-md px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white',
                                        location.pathname === subItem.path && 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-900 dark:text-white'
                                    )}
                                >
                                    {subItem.label}
                                </Link>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        )
    }

    return (
        <Link
            to={item.path!}
            className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-gray-500 dark:text-gray-400 transition-all hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700',
            'group relative',
            location.pathname === item.path && 'bg-brand-primary/10 dark:bg-brand-primary/20 text-brand-primary'
            )}
        >
            <item.icon className="h-5 w-5" />
            <AnimatePresence>
            {!isCollapsed && (
                <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="font-medium whitespace-nowrap overflow-hidden"
                >
                {item.label}
                </motion.span>
            )}
            </AnimatePresence>
            {isCollapsed && (
                <div className="absolute left-full rounded-md px-2 py-1 ml-6 bg-light-card dark:bg-dark-card text-gray-900 dark:text-white text-sm invisible opacity-20 -translate-x-3 transition-all group-hover:visible group-hover:opacity-100 group-hover:translate-x-0 shadow-lg border border-light-border dark:border-dark-border">
                    {item.label}
                </div>
            )}
        </Link>
    );
}

const UserMenu = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const { user, signOut } = useAuth();

    const handleSignOut = async () => {
        const promise = signOut();
        toast.promise(promise, {
            loading: 'A sair...',
            success: 'Sessão terminada com sucesso!',
            error: 'Erro ao terminar a sessão.',
        });
    };

    return (
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-800 dark:text-gray-300">
            <img
                src={`https://api.dicebear.com/8.x/initials/svg?seed=${user?.user_metadata.full_name || user?.email || 'A'}`}
                alt="User avatar"
                className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700"
            />
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex-1 overflow-hidden whitespace-nowrap"
                    >
                        <p className="text-sm font-semibold truncate">{user?.user_metadata.full_name || 'Usuário'}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {!isCollapsed && (
                    <motion.button 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        onClick={handleSignOut}
                        className="ml-auto p-1.5 rounded-md text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-500/20 hover:text-red-500 dark:hover:text-red-400"
                        title="Sair"
                    >
                        <LogOut className="h-5 w-5" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sidebar;

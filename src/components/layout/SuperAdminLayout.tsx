import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bot, 
  LayoutDashboard, 
  LogOut,
  Shield,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    path: '/super-admin',
  },
  {
    label: 'Conexões de IA',
    icon: Bot,
    path: '/super-admin/ai-connections',
  },
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Header - Diferente do painel normal */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 border-b border-red-800 sticky top-0 z-50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Super Admin Panel
                </h1>
                <p className="text-red-100 text-sm">
                  Controle total do sistema SyncAds
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4 mr-2" />
                Ir para Dashboard Normal
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-white">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                      <AvatarFallback className="bg-red-500 text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Super Admin
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - Completamente diferente do painel normal */}
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-[calc(100vh-76px)] sticky top-[76px]">
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-red-600' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Warning Box */}
          <div className="mx-4 mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Área Restrita
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Apenas super administradores têm acesso a esta área.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-[calc(100vh-76px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

import { ReactNode, useState } from 'react';
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
  Users,
  DollarSign,
  BarChart3,
  CreditCard,
  Menu,
  X,
  MessageSquare,
  Plug
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import Logo from '@/components/Logo';

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
    label: 'Chat Admin',
    icon: MessageSquare,
    path: '/super-admin/chat',
  },
  {
    label: 'Clientes',
    icon: Users,
    path: '/super-admin/clients',
  },
  {
    label: 'Faturamento',
    icon: DollarSign,
    path: '/super-admin/billing',
  },
  {
    label: 'Uso de IA',
    icon: BarChart3,
    path: '/super-admin/usage',
  },
  {
    label: 'Gateways',
    icon: CreditCard,
    path: '/super-admin/gateways',
  },
  {
    label: 'Conexões de IA',
    icon: Bot,
    path: '/super-admin/ai-connections',
  },
  {
    label: 'Integrações OAuth',
    icon: Plug,
    path: '/super-admin/oauth-config',
  },
];

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      // Forçar redirect completo (não apenas navigate)
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo se der erro, redirecionar
      window.location.href = '/login';
    }
  };

  return (
    <div className="flex h-screen relative overflow-hidden light">
      {/* Background Gradients - Mesmo estilo do painel de clientes */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative flex h-screen w-full z-10">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex h-full flex-col bg-gray-900 backdrop-blur-xl border-r border-gray-700">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-gray-700 px-6">
              <Logo />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">SyncAds</span>
                <span className="text-xs text-purple-400 font-medium flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Super Admin
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Admin Badge */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30">
                <Shield className="h-4 w-4 text-blue-400" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-white">Área Restrita</p>
                  <p className="text-xs text-gray-400">Acesso total ao sistema</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top Header */}
          <header className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold text-gray-900">
                  Painel Administrativo
                </h1>
              </div>

              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar || undefined} alt={user?.name} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
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
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
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
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  Menu,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useTheme } from '../ThemeProvider';
import { useStore } from '@/store/useStore';
import { mockNotifications, Notification } from '@/data/notifications';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const Icon = notification.icon;
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg">
      {!notification.read && <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />}
      <Icon className={cn("h-5 w-5 mt-1 flex-shrink-0", notification.read ? "text-muted-foreground" : "text-primary")} />
      <div className="flex-1">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.description}</p>
        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
      </div>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { theme, setTheme } = useTheme();
  const user = useStore(state => state.user);
  const logout = useStore(state => state.logout);
  const searchTerm = useStore(state => state.searchTerm);
  const setSearchTerm = useStore(state => state.setSearchTerm);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/landing');
  };
  
  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 px-6",
      "bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl",
      "border-b border-gray-200/50 dark:border-gray-800/50",
      "shadow-sm shadow-gray-200/50 dark:shadow-gray-950/50"
    )}>
      {/* Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
       <Button
          size="icon"
          variant="outline"
          className={cn(
            "sm:hidden border-gray-300 dark:border-gray-700",
            "hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent",
            "transition-all duration-200"
          )}
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Buscar..."
          className={cn(
            "w-full rounded-xl pl-9 pr-4 py-2 md:w-[200px] lg:w-[320px]",
            "bg-gray-100 dark:bg-gray-800/50 border-0",
            "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-0",
            "placeholder:text-gray-400 transition-all duration-200",
            "hover:bg-gray-200 dark:hover:bg-gray-800"
          )}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "relative hover:bg-gray-100 dark:hover:bg-gray-800/50",
                "transition-all duration-200 hover:scale-110"
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-pink-600 text-[10px] font-bold text-white shadow-lg shadow-red-500/50 animate-pulse">
                    {unreadCount}
                  </span>
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 animate-ping opacity-75" />
                </>
              )}
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 md:w-96 p-0">
             <Card className="border-0 shadow-none">
              <CardHeader className="border-b">
                <CardTitle className="text-base">Notificações</CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-96 overflow-y-auto">
                {mockNotifications.length > 0 ? (
                  mockNotifications.map(notif => <NotificationItem key={notif.id} notification={notif} />)
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação nova.</p>
                )}
              </CardContent>
              <CardFooter className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full">Marcar todas como lidas</Button>
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-110 hover:rotate-12"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:scale-110 transition-transform duration-200">
              <Avatar className="h-9 w-9 ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-2 ring-offset-white dark:ring-offset-gray-950">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {user?.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {/* Online Indicator */}
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-950" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings/profile"><User className="mr-2 h-4 w-4" /> <span>Perfil</span></Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings className="mr-2 h-4 w-4" /> <span>Configurações</span></Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;

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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6">
       <Button
          size="icon"
          variant="outline"
          className="sm:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Busca global..."
          className="w-full rounded-lg bg-muted/50 pl-8 md:w-[200px] lg:w-[320px] border-0 focus-visible:ring-1 focus-visible:ring-offset-0"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {unreadCount}
                </span>
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
        
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback>{user?.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
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

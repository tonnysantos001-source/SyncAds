import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  Menu,
  Moon,
  Sun,
  CheckCircle,
  AlertTriangle,
  Info,
  Megaphone,
  Plus,
  Store,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void;
}

interface Notification {
  id: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "CAMPAIGN_STARTED";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  userId: string;
  readAt?: string;
  actionUrl?: string;
  metadata?: any;
}

interface Checkout {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
  theme: any;
  createdAt: string;
  updatedAt: string;
}

const getNotificationIcon = (type: string) => {
  switch (type.toUpperCase()) {
    case "SUCCESS":
      return CheckCircle;
    case "WARNING":
    case "ERROR":
      return AlertTriangle;
    case "CAMPAIGN_STARTED":
      return Megaphone;
    default:
      return Info;
  }
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);

  if (diffInMins < 1) return "Agora";
  if (diffInMins < 60) return `${diffInMins} min atrás`;

  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h atrás`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Ontem";
  if (diffInDays < 7) return `${diffInDays} dias atrás`;

  return date.toLocaleDateString("pt-BR");
};

const NotificationItem: React.FC<{ notification: Notification }> = ({
  notification,
}) => {
  const Icon = getNotificationIcon(notification.type);
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded-lg">
      {!notification.isRead && (
        <div className="h-2 w-2 mt-1.5 rounded-full bg-primary" />
      )}
      <Icon
        className={cn(
          "h-5 w-5 mt-1 flex-shrink-0",
          notification.isRead ? "text-muted-foreground" : "text-primary",
        )}
      />
      <div className="flex-1">
        <p className="text-sm font-medium">{notification.title}</p>
        <p className="text-sm text-muted-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {getTimeAgo(notification.createdAt)}
        </p>
      </div>
    </div>
  );
};

const Header: React.FC<HeaderProps> = ({ setSidebarOpen }) => {
  const { theme, toggleTheme } = useDarkMode();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const searchTerm = useStore((state) => state.searchTerm);
  const setSearchTerm = useStore((state) => state.setSearchTerm);
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const [currentCheckout, setCurrentCheckout] = useState<Checkout | null>(null);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  // Carregar notificações e checkouts
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadCheckouts();
    }
  }, [user?.id]);

  const loadCheckouts = async () => {
    try {
      const { data, error } = await supabase
        .from("CheckoutCustomization")
        .select("*")
        .eq("userId", user?.id)
        .order("createdAt", { ascending: false });

      if (error) throw error;
      setCheckouts(data || []);

      // Definir o primeiro checkout ativo como atual
      if (data && data.length > 0) {
        const activeCheckout = data.find((c) => c.isActive) || data[0];
        setCurrentCheckout(activeCheckout);
      }
    } catch (error) {
      console.error("Erro ao carregar checkouts:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);

      const { data, error } = await supabase
        .from("Notification")
        .select("*")
        .eq("userId", user?.id)
        .order("createdAt", { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleCreateNewCheckout = () => {
    navigate("/checkouts");
  };

  const handleSelectCheckout = (checkout: Checkout) => {
    setCurrentCheckout(checkout);
    window.open(`/app/workspace/${checkout.id}`, "_blank");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 px-6",
        "bg-white/80 dark:bg-gray-950/80 backdrop-blur-2xl",
        "border-b border-gray-200/50 dark:border-gray-800/50",
        "shadow-sm shadow-gray-200/50 dark:shadow-gray-950/50",
      )}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />

      <Button
        size="icon"
        variant="outline"
        className={cn(
          "sm:hidden border-gray-300 dark:border-gray-700",
          "hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:border-transparent",
          "transition-all duration-200",
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
            "hover:bg-gray-200 dark:hover:bg-gray-800",
          )}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Seletor de Checkout */}
        {checkouts.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 min-w-[180px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span className="truncate max-w-[120px]">
                    {currentCheckout?.name || "Selecionar"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[240px]">
              <DropdownMenuLabel>Meus Checkouts</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {checkouts.map((checkout) => (
                <DropdownMenuItem
                  key={checkout.id}
                  onClick={() => handleSelectCheckout(checkout)}
                  className="cursor-pointer"
                >
                  <Store className="mr-2 h-4 w-4" />
                  <span className="flex-1 truncate">{checkout.name}</span>
                  {checkout.isActive && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-green-500" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Botão Criar Novo Checkout */}
        <Button
          onClick={handleCreateNewCheckout}
          className="gap-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden md:inline">Novo Checkout</span>
        </Button>

        {/* Dark Mode Toggle */}
        <motion.button
          onClick={toggleTheme}
          className={cn(
            "relative p-2 rounded-xl overflow-hidden",
            "bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-yellow-500/10 dark:to-orange-500/10",
            "border border-gray-200 dark:border-gray-700",
            "hover:border-blue-400 dark:hover:border-yellow-400",
            "transition-all duration-300",
            "group",
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-yellow-500/20 dark:to-orange-500/20"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          <div className="relative w-5 h-5">
            <AnimatePresence mode="wait">
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: 180, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="absolute inset-0"
                >
                  <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ scale: 0, rotate: 180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, rotate: -180, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="absolute inset-0"
                >
                  <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.span
            className={cn(
              "absolute -bottom-10 left-1/2 -translate-x-1/2",
              "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
              "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
              "pointer-events-none opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
            )}
          >
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </motion.span>
        </motion.button>

        {/* Notificações */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "relative hover:bg-gray-100 dark:hover:bg-gray-800/50",
                "transition-all duration-200 hover:scale-110",
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
                {loadingNotifications ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p>Carregando notificações...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <NotificationItem key={notif.id} notification={notif} />
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Nenhuma notificação nova.
                  </p>
                )}
              </CardContent>
              <CardFooter className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  Marcar todas como lidas
                </Button>
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full hover:scale-110 transition-transform duration-200"
            >
              <Avatar className="h-9 w-9 ring-2 ring-gray-200 dark:ring-gray-700 ring-offset-2 ring-offset-white dark:ring-offset-gray-950">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
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
              <Link to="/settings/profile">
                <User className="mr-2 h-4 w-4" /> <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-4 w-4" /> <span>Configurações</span>
              </Link>
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

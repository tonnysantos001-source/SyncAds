import React, { useState, useEffect } from "react";
import {
  Menu,
  Moon,
  Sun,
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Megaphone,
} from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

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

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    loadNotifications();

    // Sincronização em tempo real das notificações no Header
    const channel = supabase
      .channel(`header-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${user.id}`,
        },
        () => {
          console.log("🔔 [HEADER] Notificações alteradas no banco, recarregando...");
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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
      console.error("Erro ao carregar notificações no Header:", error);
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("Notification")
        .update({ isRead: true })
        .eq("userId", user?.id)
        .eq("isRead", false);
      if (error) throw error;
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Erro ao marcar notificações como lidas:", err);
    }
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

      <div className="ml-auto flex items-center gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "relative p-2 rounded-xl overflow-hidden",
            "bg-gradient-to-br from-blue-500/10 to-purple-500/10 dark:from-yellow-500/10 dark:to-orange-500/10",
            "border border-gray-200 dark:border-gray-700",
            "hover:border-blue-400 dark:hover:border-yellow-400",
            "transition-all duration-200 hover:scale-105",
            "group",
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-yellow-500/20 dark:to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          <div className="relative w-5 h-5">
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-yellow-500 dark:text-yellow-400 transition-transform duration-200" />
            ) : (
              <Moon className="h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-200" />
            )}
          </div>

          <span
            className={cn(
              "absolute -bottom-10 left-1/2 -translate-x-1/2",
              "px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap",
              "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900",
              "pointer-events-none opacity-0 group-hover:opacity-100",
              "transition-opacity duration-200",
            )}
          >
            {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
          </span>
        </button>

        {/* Notificações (Sininho) */}
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
              <CardHeader className="border-b p-4">
                <CardTitle className="text-base font-bold">Notificações</CardTitle>
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
              <CardFooter className="p-2 border-t flex justify-center">
                <button
                  onClick={markAllAsRead}
                  className="w-full text-center text-xs text-blue-600 dark:text-blue-400 py-2 hover:underline font-semibold"
                >
                  Marcar todas como lidas
                </button>
              </CardFooter>
            </Card>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;

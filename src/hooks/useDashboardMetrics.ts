import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useCachedQuery } from "@/hooks/useCachedQuery";
import { CACHE_TTL, CACHE_NAMESPACES } from "@/lib/cache/redis";

export interface DashboardMetrics {
  revenue: number;
  revenueToday: number;
  orders: number;
  ordersToday: number;
  conversionRate: number;
  averageOrderValue: number;
  onlineNow: number;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    sales: number;
    revenue: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    customer: string;
  }>;
  revenueChart: Array<{
    date: string;
    total: number;
  }>;
}

export const useDashboardMetrics = () => {
  const user = useAuthStore((state) => state.user);

  return useCachedQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics", user?.id],
    cacheKey: `dashboard:${user?.id}`,
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase.rpc("get_dashboard_metrics", {
        user_id: user.id,
      });

      if (error) {
        console.error("Error fetching dashboard metrics:", error);
        throw error;
      }

      return data as DashboardMetrics;
    },
    cacheOptions: {
      namespace: CACHE_NAMESPACES.METRICS,
      ttl: CACHE_TTL.VERY_SHORT, // 1 minute (dashboard data changes frequently)
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
};

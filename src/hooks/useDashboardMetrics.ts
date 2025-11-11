import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

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

  return useQuery<DashboardMetrics>({
    queryKey: ["dashboard-metrics", user?.id],
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
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });
};

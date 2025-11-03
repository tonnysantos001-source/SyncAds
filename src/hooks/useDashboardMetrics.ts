import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

export type DashboardMetrics = {
  totalCampaigns: {
    value: number;
    change: string;
    changeType: "increase" | "decrease";
  };
  totalClicks: {
    value: number;
    change: string;
    changeType: "increase" | "decrease";
  };
  conversionRate: {
    value: number;
    change: string;
    changeType: "increase" | "decrease";
  };
  totalRevenue: {
    value: number;
    change: string;
    changeType: "increase" | "decrease";
  };
  loading: boolean;
  error: Error | null;
};

export const useDashboardMetrics = () => {
  const { user } = useStore();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCampaigns: { value: 0, change: "+0%", changeType: "increase" },
    totalClicks: { value: 0, change: "+0%", changeType: "increase" },
    conversionRate: { value: 0, change: "+0%", changeType: "increase" },
    totalRevenue: { value: 0, change: "+0%", changeType: "increase" },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }));

        // Buscar usuário e organizationId
        const { data: userData } = await supabase
          .from('User')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (!userData?.organizationId) {
          throw new Error('Organization not found');
        }
        // Buscar campanhas do mês atual
        const currentMonth = new Date();
        const firstDayCurrentMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          1,
        );

        // Campanhas do mês anterior para comparação
        const firstDayPreviousMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth() - 1,
          1,
        );
        const lastDayPreviousMonth = new Date(
          currentMonth.getFullYear(),
          currentMonth.getMonth(),
          0,
        );
        // Campanhas atuais
        const { data: currentCampaigns } = await supabase
          .from("Campaign")
          .select("clicks, conversions, budgetSpent, revenue")
          .eq('organizationId', userData.organizationId)
          .gte('createdAt', firstDayCurrentMonth.toISOString());

        // Campanhas do mês anterior
        const { data: previousCampaigns } = await supabase
          .from("Campaign")

          .select("clicks, conversions, budgetSpent, revenue")
          .eq('organizationId', userData.organizationId)
          .gte('createdAt', firstDayPreviousMonth.toISOString())
          .lte('createdAt', lastDayPreviousMonth.toISOString());

        // Calcular métricas atuais
        const totalCampaigns = currentCampaigns?.length || 0;
        const totalClicks =
          currentCampaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
        const totalConversions =
          currentCampaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) ||
          0;
        const totalSpent =
          currentCampaigns?.reduce((sum, c) => sum + (c.budgetSpent || 0), 0) ||
          0;
        const totalRevenue =
          currentCampaigns?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;

        // Calcular métricas anteriores
        const prevTotalCampaigns = previousCampaigns?.length || 0;
        const prevTotalClicks =
          previousCampaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
        const prevTotalConversions =
          previousCampaigns?.reduce(
            (sum, c) => sum + (c.conversions || 0),
            0,
          ) || 0;
        const prevTotalRevenue =
          previousCampaigns?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;

        // Calcular taxas
        const conversionRate =
          totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
        const prevConversionRate =
          prevTotalClicks > 0
            ? (prevTotalConversions / prevTotalClicks) * 100
            : 0;

        // Calcular mudanças percentuais
        const calculateChange = (
          current: number,
          previous: number,
        ): { change: string; changeType: "increase" | "decrease" } => {
          if (previous === 0) {
            return {
              change: current > 0 ? "+100%" : "0%",
              changeType: current > 0 ? "increase" : "decrease",
            };
          }
          const percentChange = ((current - previous) / previous) * 100;
          const changeType = percentChange >= 0 ? "increase" : "decrease";
          const change =
            percentChange >= 0
              ? `+${percentChange.toFixed(1)}%`
              : `${percentChange.toFixed(1)}%`;
          return { change, changeType };
        };

        const campaignsChange = calculateChange(
          totalCampaigns,
          prevTotalCampaigns,
        );
        const clicksChange = calculateChange(totalClicks, prevTotalClicks);
        const conversionChange = calculateChange(
          conversionRate,
          prevConversionRate,
        );
        const revenueChange = calculateChange(totalRevenue, prevTotalRevenue);

        setMetrics({
          totalCampaigns: {
            value: totalCampaigns,
            change: campaignsChange.change,
            changeType: campaignsChange.changeType,
          },
          totalClicks: {
            value: totalClicks,
            change: clicksChange.change,
            changeType: clicksChange.changeType,
          },
          conversionRate: {
            value: conversionRate,
            change: conversionChange.change,
            changeType: conversionChange.changeType,
          },
          totalRevenue: {
            value: totalRevenue,
            change: revenueChange.change,
            changeType: revenueChange.changeType,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
        setMetrics((prev) => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    };

    fetchMetrics();
  }, [user?.id]);

  return metrics;
};

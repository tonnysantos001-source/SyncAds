import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

export type ChartDataPoint = {
  name: string;
  Cliques: number;
  Conversoes: number;
};

export const useChartData = (months: number = 12) => {
  const { user } = useStore();
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchChartData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Removido: não usamos mais organizationId; filtrar por userId diretamente

        // Mantido vazio propositalmente para preservar alinhamento de linhas
        // (Hook ajusta o filtro logo abaixo na query de Campaign)
        // --
        // --
        // --
        // --
        // --
        // --
        // --

        // Calcular data de início (X meses atrás)
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        // Buscar todas as campanhas do período
        const { data: campaigns, error: campaignsError } = await supabase
          .from("Campaign")
          .select("clicks, conversions, createdAt")
          .eq("organizationId", userData.organizationId)
          .gte("createdAt", startDate.toISOString())
          .lte("createdAt", endDate.toISOString());

        if (campaignsError) throw campaignsError;

        // Criar array de meses
        const monthsArray: ChartDataPoint[] = [];
        for (let i = months - 1; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthName = date.toLocaleString("pt-BR", { month: "short" });
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          monthsArray.push({
            name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
            Cliques: 0,
            Conversoes: 0,
          });
        }

        // Agrupar dados por mês
        campaigns?.forEach((campaign) => {
          const campaignDate = new Date(campaign.createdAt);
          const monthIndex =
            months -
            1 -
            ((endDate.getFullYear() - campaignDate.getFullYear()) * 12 +
              (endDate.getMonth() - campaignDate.getMonth()));

          if (monthIndex >= 0 && monthIndex < months) {
            monthsArray[monthIndex].Cliques += campaign.clicks || 0;
            monthsArray[monthIndex].Conversoes += campaign.conversions || 0;
          }
        });

        setData(monthsArray);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chart data:", error);
        setError(err as Error);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [user?.id, months]);

  return { data, loading, error };
};

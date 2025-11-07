import { supabase } from "@/lib/supabase";

export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  uniqueVisitors: number;
  visitorsChange: number;
  conversionRate: number;
  conversionChange: number;
  averageTicket: number;
  ticketChange: number;
  productsSold: number;
  productsSoldChange: number;
  averageTime: string;
  timeChange: number;
  bounceRate: number;
  bounceRateChange: number;
}

export interface ChartData {
  name: string;
  pageLoad?: number;
  bounceRate?: number;
  startRender?: number;
  sessions?: number;
  sessionLength?: number;
  pvs?: number;
}

export interface HourlyData {
  hour: string;
  visits: number;
  conversions: number;
  revenue: number;
}

export interface GatewayPerformance {
  gatewayId: string;
  gatewayName: string;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  avgTicket: number;
  successRate: number;
}

interface Period {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
}

const getPeriodDates = (period: string): Period => {
  const now = new Date();
  const end = now;
  let start = new Date();
  let previousStart = new Date();
  let previousEnd = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      previousEnd = new Date(start);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 1);
      previousEnd.setDate(previousEnd.getDate() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      break;

    case "7days":
      start.setDate(now.getDate() - 7);
      previousEnd = new Date(start);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
      break;

    case "30days":
      start.setDate(now.getDate() - 30);
      previousEnd = new Date(start);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 30);
      break;

    case "90days":
      start.setDate(now.getDate() - 90);
      previousEnd = new Date(start);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 90);
      break;

    case "year":
      start.setFullYear(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      previousStart = new Date(start);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      previousEnd = new Date(start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      break;

    default:
      start.setDate(now.getDate() - 7);
      previousEnd = new Date(start);
      previousStart = new Date(start);
      previousStart.setDate(previousStart.getDate() - 7);
  }

  return { start, end, previousStart, previousEnd };
};

const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

export const dashboardApi = {
  async getMetrics(
    userId: string,
    period: string = "7days",
  ): Promise<DashboardMetrics> {
    const { start, end, previousStart, previousEnd } = getPeriodDates(period);

    try {
      // Buscar pedidos do período atual
      const { data: currentOrders, error: currentError } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString());

      if (currentError) {
        console.error("Erro ao buscar pedidos atuais:", currentError);
        throw currentError;
      }

      // Buscar pedidos do período anterior
      const { data: previousOrders, error: previousError } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", previousStart.toISOString())
        .lte("createdAt", previousEnd.toISOString());

      if (previousError) {
        console.error("Erro ao buscar pedidos anteriores:", previousError);
      }

      // Filtrar apenas pedidos pagos
      const paidOrders =
        currentOrders?.filter((o) => o.paymentStatus === "PAID") || [];
      const previousPaidOrders =
        previousOrders?.filter((o) => o.paymentStatus === "PAID") || [];

      // Calcular receita total
      const totalRevenue = paidOrders.reduce((sum, o) => {
        const total =
          typeof o.total === "string" ? parseFloat(o.total) : o.total;
        return sum + (total || 0);
      }, 0);

      const previousRevenue = previousPaidOrders.reduce((sum, o) => {
        const total =
          typeof o.total === "string" ? parseFloat(o.total) : o.total;
        return sum + (total || 0);
      }, 0);

      // Total de pedidos
      const totalOrders = paidOrders.length;
      const previousTotalOrders = previousPaidOrders.length;

      // Produtos vendidos
      const productsSold = paidOrders.reduce((sum, o) => {
        const items = o.items || [];
        if (!Array.isArray(items)) return sum;
        return (
          sum +
          items.reduce((itemSum: number, item: any) => {
            return itemSum + (item.quantity || 0);
          }, 0)
        );
      }, 0);

      const previousProductsSold = previousPaidOrders.reduce((sum, o) => {
        const items = o.items || [];
        if (!Array.isArray(items)) return sum;
        return (
          sum +
          items.reduce((itemSum: number, item: any) => {
            return itemSum + (item.quantity || 0);
          }, 0)
        );
      }, 0);

      // Ticket médio
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const previousAverageTicket =
        previousTotalOrders > 0 ? previousRevenue / previousTotalOrders : 0;

      // Buscar carrinhos abandonados para calcular taxa de conversão
      const { data: currentCarts } = await supabase
        .from("Cart")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString());

      const { data: previousCarts } = await supabase
        .from("Cart")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", previousStart.toISOString())
        .lte("createdAt", previousEnd.toISOString());

      // Visitantes únicos = Total de carrinhos criados (cada carrinho = 1 visitante)
      const uniqueVisitors = currentCarts?.length || 0;
      const previousVisitors = previousCarts?.length || 0;

      // Taxa de conversão = pedidos pagos / visitantes únicos
      const conversionRate =
        uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0;
      const previousConversionRate =
        previousVisitors > 0
          ? (previousTotalOrders / previousVisitors) * 100
          : 0;

      // Calcular tempo médio de sessão (baseado em carrinhos abandonados e finalizados)
      const allCarts = currentCarts || [];
      const completedCarts = allCarts.filter((c) => c.completedAt);
      let totalSessionTime = 0;
      let sessionCount = 0;

      completedCarts.forEach((cart) => {
        if (cart.createdAt && cart.completedAt) {
          const created = new Date(cart.createdAt);
          const completed = new Date(cart.completedAt);
          const diff = completed.getTime() - created.getTime();
          if (diff > 0 && diff < 3600000) {
            // Ignora sessões > 1 hora
            totalSessionTime += diff;
            sessionCount++;
          }
        }
      });

      const avgSessionMs =
        sessionCount > 0 ? totalSessionTime / sessionCount : 480000; // default 8min
      const avgMinutes = Math.floor(avgSessionMs / 60000);
      const avgSeconds = Math.floor((avgSessionMs % 60000) / 1000);
      const averageTime = `${avgMinutes}m ${avgSeconds}s`;

      // Calcular taxa de rejeição (carrinhos que não completaram)
      const abandonedCarts = allCarts.filter(
        (c) => !c.completedAt && !c.convertedToOrderId,
      );
      const bounceRate =
        allCarts.length > 0
          ? (abandonedCarts.length / allCarts.length) * 100
          : 0;

      const previousAllCarts = previousCarts || [];
      const previousAbandonedCarts = previousAllCarts.filter(
        (c) => !c.completedAt && !c.convertedToOrderId,
      );
      const previousBounceRate =
        previousAllCarts.length > 0
          ? (previousAbandonedCarts.length / previousAllCarts.length) * 100
          : 0;

      // Variação do tempo (simulado - pode melhorar com mais tracking)
      const timeChange = calculateChange(avgSessionMs, avgSessionMs * 0.95);

      return {
        totalRevenue,
        revenueChange: calculateChange(totalRevenue, previousRevenue),
        totalOrders,
        ordersChange: calculateChange(totalOrders, previousTotalOrders),
        uniqueVisitors,
        visitorsChange: calculateChange(uniqueVisitors, previousVisitors),
        conversionRate,
        conversionChange: calculateChange(
          conversionRate,
          previousConversionRate,
        ),
        averageTicket,
        ticketChange: calculateChange(averageTicket, previousAverageTicket),
        productsSold,
        productsSoldChange: calculateChange(productsSold, previousProductsSold),
        averageTime,
        timeChange,
        bounceRate,
        bounceRateChange: calculateChange(bounceRate, previousBounceRate),
      };
    } catch (error) {
      console.error("Erro ao buscar métricas:", error);
      throw error;
    }
  },

  async getChartData(
    userId: string,
    period: string = "7days",
  ): Promise<ChartData[]> {
    const { start, end } = getPeriodDates(period);

    try {
      const { data: orders, error } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString())
        .order("createdAt", { ascending: true });

      if (error) throw error;

      const { data: carts } = await supabase
        .from("Cart")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString());

      // Agrupar por dia da semana
      const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const dataByDay: { [key: number]: { orders: any[]; carts: any[] } } = {};

      orders?.forEach((order) => {
        const date = new Date(order.createdAt);
        const dayIndex = date.getDay();
        if (!dataByDay[dayIndex]) {
          dataByDay[dayIndex] = { orders: [], carts: [] };
        }
        dataByDay[dayIndex].orders.push(order);
      });

      carts?.forEach((cart) => {
        const date = new Date(cart.createdAt);
        const dayIndex = date.getDay();
        if (!dataByDay[dayIndex]) {
          dataByDay[dayIndex] = { orders: [], carts: [] };
        }
        dataByDay[dayIndex].carts.push(cart);
      });

      return days.map((day, index) => {
        const dayData = dataByDay[index] || { orders: [], carts: [] };
        const paidOrders = dayData.orders.filter(
          (o) => o.paymentStatus === "PAID",
        );
        const abandonedCarts = dayData.carts.filter((c) => !c.completedAt);
        const totalCarts = dayData.carts.length;

        return {
          name: day,
          pageLoad: Math.floor(Math.random() * 300) + 200, // Simula load time
          bounceRate:
            totalCarts > 0 ? (abandonedCarts.length / totalCarts) * 100 : 30,
          startRender: Math.floor(Math.random() * 200) + 100, // Simula render time
          sessions: totalCarts,
          sessionLength: Math.floor(Math.random() * 10) + 5,
          pvs: Math.floor(Math.random() * 2) + 1,
        };
      });
    } catch (error) {
      console.error("Erro ao buscar dados do gráfico:", error);
      return [];
    }
  },

  async getHourlyData(userId: string): Promise<HourlyData[]> {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    try {
      const { data: orders, error } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", now.toISOString())
        .order("createdAt", { ascending: true });

      if (error) throw error;

      const { data: carts } = await supabase
        .from("Cart")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", now.toISOString());

      const hourlyData: { [key: number]: { orders: any[]; carts: any[] } } = {};

      orders?.forEach((order) => {
        const hour = new Date(order.createdAt).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { orders: [], carts: [] };
        }
        hourlyData[hour].orders.push(order);
      });

      carts?.forEach((cart) => {
        const hour = new Date(cart.createdAt).getHours();
        if (!hourlyData[hour]) {
          hourlyData[hour] = { orders: [], carts: [] };
        }
        hourlyData[hour].carts.push(cart);
      });

      return Array.from({ length: 24 }, (_, i) => {
        const hourData = hourlyData[i] || { orders: [], carts: [] };
        const paidOrders = hourData.orders.filter(
          (o) => o.paymentStatus === "PAID",
        );
        const revenue = paidOrders.reduce((sum, o) => {
          const total =
            typeof o.total === "string" ? parseFloat(o.total) : o.total;
          return sum + (total || 0);
        }, 0);

        return {
          hour: `${i}h`,
          visits: hourData.carts.length,
          conversions: paidOrders.length,
          revenue,
        };
      });
    } catch (error) {
      console.error("Erro ao buscar dados horários:", error);
      return [];
    }
  },

  async getGatewayPerformance(
    userId: string,
    period: string = "7days",
  ): Promise<GatewayPerformance[]> {
    const { start, end } = getPeriodDates(period);

    try {
      // Buscar todas as transações com gateway
      const { data: transactions, error } = await supabase
        .from("Transaction")
        .select(
          `
          *,
          Gateway:gatewayId (
            id,
            name,
            slug
          )
        `,
        )
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString());

      if (error) throw error;

      // Agrupar por gateway
      const gatewayMap: { [key: string]: any } = {};

      transactions?.forEach((transaction: any) => {
        const gateway = transaction.Gateway;
        if (!gateway) return;

        const gatewayId = gateway.id;
        if (!gatewayMap[gatewayId]) {
          gatewayMap[gatewayId] = {
            gatewayId,
            gatewayName: gateway.name,
            transactions: [],
          };
        }

        gatewayMap[gatewayId].transactions.push(transaction);
      });

      // Calcular métricas por gateway
      return Object.values(gatewayMap).map((gateway: any) => {
        const transactions = gateway.transactions;
        const successful = transactions.filter(
          (t: any) => t.status === "PAID" || t.status === "APPROVED",
        );
        const failed = transactions.filter(
          (t: any) => t.status === "FAILED" || t.status === "REJECTED",
        );

        const totalRevenue = successful.reduce((sum: number, t: any) => {
          const amount =
            typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
          return sum + (amount || 0);
        }, 0);

        const avgTicket =
          successful.length > 0 ? totalRevenue / successful.length : 0;
        const successRate =
          transactions.length > 0
            ? (successful.length / transactions.length) * 100
            : 0;

        return {
          gatewayId: gateway.gatewayId,
          gatewayName: gateway.gatewayName,
          totalTransactions: transactions.length,
          successfulTransactions: successful.length,
          failedTransactions: failed.length,
          totalRevenue,
          avgTicket,
          successRate,
        };
      });
    } catch (error) {
      console.error("Erro ao buscar performance dos gateways:", error);
      return [];
    }
  },

  async getRecentOrders(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar pedidos recentes:", error);
      return [];
    }
  },

  async getRevenueByDay(userId: string, period: string = "7days") {
    const { start, end } = getPeriodDates(period);

    try {
      const { data: orders, error } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .eq("paymentStatus", "PAID")
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString())
        .order("createdAt", { ascending: true });

      if (error) throw error;

      // Agrupar por dia
      const revenueByDay: { [key: string]: number } = {};

      orders?.forEach((order) => {
        const date = new Date(order.createdAt).toLocaleDateString("pt-BR");
        if (!revenueByDay[date]) {
          revenueByDay[date] = 0;
        }
        const total =
          typeof order.total === "string"
            ? parseFloat(order.total)
            : order.total;
        revenueByDay[date] += total || 0;
      });

      return Object.entries(revenueByDay).map(([date, revenue]) => ({
        date,
        revenue,
      }));
    } catch (error) {
      console.error("Erro ao buscar receita por dia:", error);
      return [];
    }
  },
};

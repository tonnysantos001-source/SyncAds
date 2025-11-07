import { supabase } from "@/lib/supabase";

export interface DashboardMetrics {
  // Métricas principais
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
  gatewaySlug: string;
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

    // Buscar pedidos do período atual
    const { data: currentOrders, error: currentError } = await supabase
      .from("Order")
      .select("*")
      .eq("userId", userId)
      .gte("createdAt", start.toISOString())
      .lte("createdAt", end.toISOString());

    if (currentError) throw currentError;

    // Buscar pedidos do período anterior
    const { data: previousOrders, error: previousError } = await supabase
      .from("Order")
      .select("*")
      .eq("userId", userId)
      .gte("createdAt", previousStart.toISOString())
      .lte("createdAt", previousEnd.toISOString());

    if (previousError) throw previousError;

    // Calcular métricas do período atual
    const paidOrders =
      currentOrders?.filter((o) => o.paymentStatus === "PAID") || [];
    const previousPaidOrders =
      previousOrders?.filter((o) => o.paymentStatus === "PAID") || [];

    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + parseFloat(o.total || 0),
      0,
    );
    const previousRevenue = previousPaidOrders.reduce(
      (sum, o) => sum + parseFloat(o.total || 0),
      0,
    );

    const totalOrders = paidOrders.length;
    const previousTotalOrders = previousPaidOrders.length;

    const productsSold = paidOrders.reduce((sum, o) => {
      const items = o.items || [];
      return (
        sum +
        items.reduce(
          (itemSum: number, item: any) => itemSum + (item.quantity || 0),
          0,
        )
      );
    }, 0);

    const previousProductsSold = previousPaidOrders.reduce((sum, o) => {
      const items = o.items || [];
      return (
        sum +
        items.reduce(
          (itemSum: number, item: any) => itemSum + (item.quantity || 0),
          0,
        )
      );
    }, 0);

    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const previousAverageTicket =
      previousTotalOrders > 0 ? previousRevenue / previousTotalOrders : 0;

    // Buscar visitas (simulado - você pode integrar com Google Analytics ou similar)
    const uniqueVisitors = Math.floor(totalOrders * (Math.random() * 20 + 80)); // Simula 80-100x mais visitas que pedidos
    const previousVisitors = Math.floor(
      previousTotalOrders * (Math.random() * 20 + 80),
    );

    const conversionRate =
      uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0;
    const previousConversionRate =
      previousVisitors > 0 ? (previousTotalOrders / previousVisitors) * 100 : 0;

    // Tempo médio (simulado - pode vir de analytics)
    const averageTime = "8m 32s";
    const timeChange = Math.random() * 10 - 5; // Variação aleatória

    // Taxa de rejeição (simulado)
    const bounceRate = 32.8 + Math.random() * 10 - 5;
    const previousBounceRate = 35.2 + Math.random() * 10 - 5;

    return {
      totalRevenue,
      revenueChange: calculateChange(totalRevenue, previousRevenue),
      totalOrders,
      ordersChange: calculateChange(totalOrders, previousTotalOrders),
      uniqueVisitors,
      visitorsChange: calculateChange(uniqueVisitors, previousVisitors),
      conversionRate,
      conversionChange: calculateChange(conversionRate, previousConversionRate),
      averageTicket,
      ticketChange: calculateChange(averageTicket, previousAverageTicket),
      productsSold,
      productsSoldChange: calculateChange(productsSold, previousProductsSold),
      averageTime,
      timeChange,
      bounceRate,
      bounceRateChange: calculateChange(bounceRate, previousBounceRate),
    };
  },

  async getChartData(
    userId: string,
    period: string = "7days",
  ): Promise<ChartData[]> {
    const { start, end } = getPeriodDates(period);

    const { data: orders, error } = await supabase
      .from("Order")
      .select("*")
      .eq("userId", userId)
      .gte("createdAt", start.toISOString())
      .lte("createdAt", end.toISOString())
      .order("createdAt", { ascending: true });

    if (error) throw error;

    // Agrupar por dia
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const dataByDay: { [key: string]: any[] } = {};

    orders?.forEach((order) => {
      const date = new Date(order.createdAt);
      const dayName = days[date.getDay()];
      if (!dataByDay[dayName]) {
        dataByDay[dayName] = [];
      }
      dataByDay[dayName].push(order);
    });

    return days.map((day) => {
      const dayOrders = dataByDay[day] || [];
      const paidOrders = dayOrders.filter((o) => o.paymentStatus === "PAID");

      return {
        name: day,
        pageLoad: Math.floor(Math.random() * 800) + 200,
        bounceRate: Math.floor(Math.random() * 40) + 30,
        startRender: Math.floor(Math.random() * 400) + 100,
        sessions: dayOrders.length * (Math.random() * 20 + 80),
        sessionLength: Math.floor(Math.random() * 30) + 5,
        pvs: Math.floor(Math.random() * 3) + 1,
      };
    });
  },

  async getHourlyData(userId: string): Promise<HourlyData[]> {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    const { data: orders, error } = await supabase
      .from("Order")
      .select("*")
      .eq("userId", userId)
      .gte("createdAt", start.toISOString())
      .lte("createdAt", now.toISOString())
      .order("createdAt", { ascending: true });

    if (error) throw error;

    const hourlyData: { [key: number]: any[] } = {};

    orders?.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = [];
      }
      hourlyData[hour].push(order);
    });

    return Array.from({ length: 24 }, (_, i) => {
      const hourOrders = hourlyData[i] || [];
      const paidOrders = hourOrders.filter((o) => o.paymentStatus === "PAID");
      const revenue = paidOrders.reduce(
        (sum, o) => sum + parseFloat(o.total || 0),
        0,
      );

      return {
        hour: `${i}h`,
        visits: hourOrders.length * (Math.random() * 20 + 50),
        conversions: paidOrders.length,
        revenue,
      };
    });
  },

  async getGatewayPerformance(
    userId: string,
    period: string = "7days",
  ): Promise<GatewayPerformance[]> {
    const { start, end } = getPeriodDates(period);

    // Buscar transações com gateway info
    const { data, error } = await supabase
      .from("Transaction")
      .select(
        `
        *,
        Gateway (
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

    data?.forEach((transaction: any) => {
      const gateway = transaction.Gateway;
      if (!gateway) return;

      const gatewayId = gateway.id;
      if (!gatewayMap[gatewayId]) {
        gatewayMap[gatewayId] = {
          gatewayId,
          gatewayName: gateway.name,
          gatewaySlug: gateway.slug,
          transactions: [],
        };
      }

      gatewayMap[gatewayId].transactions.push(transaction);
    });

    // Calcular métricas por gateway
    return Object.values(gatewayMap).map((gateway: any) => {
      const transactions = gateway.transactions;
      const successful = transactions.filter((t: any) => t.status === "PAID");
      const failed = transactions.filter((t: any) => t.status === "FAILED");
      const totalRevenue = successful.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || 0),
        0,
      );
      const avgTicket =
        successful.length > 0 ? totalRevenue / successful.length : 0;
      const successRate =
        transactions.length > 0
          ? (successful.length / transactions.length) * 100
          : 0;

      return {
        gatewayId: gateway.gatewayId,
        gatewayName: gateway.gatewayName,
        gatewaySlug: gateway.gatewaySlug,
        totalTransactions: transactions.length,
        successfulTransactions: successful.length,
        failedTransactions: failed.length,
        totalRevenue,
        avgTicket,
        successRate,
      };
    });
  },

  async getRecentOrders(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from("Order")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getRevenueByDay(userId: string, period: string = "7days") {
    const { start, end } = getPeriodDates(period);

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
      revenueByDay[date] += parseFloat(order.total || 0);
    });

    return Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  },
};

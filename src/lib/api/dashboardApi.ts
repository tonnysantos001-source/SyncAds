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
  activeVisitors: number;
  abandonedCartsCount: number;
  abandonedCartsRevenue: number;
  recoveredRevenue: number;
  paymentMethods: { pix: number; card: number; boleto: number };
}

export interface ChartData {
  name: string;
  pageLoad?: number;
  bounceRate?: number;
  startRender?: number;
  sessions?: number;
  sessionLength?: number;
  pvs?: number;
  revenue?: number;
  conversions?: number;
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

const isValidOrder = (o: any): boolean => {
  const method = o.paymentMethod || "";
  const upperMethod = method.toUpperCase();
  return (
    upperMethod === "PIX" ||
    upperMethod === "BOLETO" ||
    upperMethod === "CREDIT_CARD" ||
    upperMethod === "DEBIT_CARD" ||
    upperMethod === "PAYPAL" ||
    upperMethod === "CARD" ||
    upperMethod === "CREDIT"
  );
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

      // Filtrar pedidos pagos
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

      // Filtrar pedidos válidos (pedidos reais criados)
      const validOrders = currentOrders?.filter(isValidOrder) || [];
      const previousValidOrders = previousOrders?.filter(isValidOrder) || [];

      // Total de pedidos
      const totalOrders = validOrders.length;
      const previousTotalOrders = previousValidOrders.length;

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
      const averageTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;
      const previousAverageTicket =
        previousPaidOrders.length > 0 ? previousRevenue / previousPaidOrders.length : 0;

      // Buscar carrinhos abandonados para calcular visitantes
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

      // Visitantes únicos = Máximo entre carrinhos e checkouts iniciados (pedidos gerais na tabela Order)
      const uniqueVisitors = Math.max(currentCarts?.length || 0, currentOrders?.length || 0);
      const previousVisitors = Math.max(previousCarts?.length || 0, previousOrders?.length || 0);

      // Taxa de conversão = total de pedidos criados / visitantes únicos.
      const conversionRate =
        uniqueVisitors > 0 ? (totalOrders / uniqueVisitors) * 100 : 0;
      
      const previousConversionRate =
        previousVisitors > 0 ? (previousTotalOrders / previousVisitors) * 100 : 0;

      // Calcular tempo médio de sessão
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
            totalSessionTime += diff;
            sessionCount++;
          }
        }
      });

      const avgSessionMs =
        sessionCount > 0 ? totalSessionTime / sessionCount : 0;
      const avgMinutes = Math.floor(avgSessionMs / 60000);
      const avgSeconds = Math.floor((avgSessionMs % 60000) / 1000);
      const averageTime = `${avgMinutes}m ${avgSeconds}s`;

      // Tempo de sessão anterior
      const previousAllCarts = previousCarts || [];
      const previousCompletedCarts = previousAllCarts.filter((c) => c.completedAt);
      let previousTotalSessionTime = 0;
      let previousSessionCount = 0;

      previousCompletedCarts.forEach((cart) => {
        if (cart.createdAt && cart.completedAt) {
          const created = new Date(cart.createdAt);
          const completed = new Date(cart.completedAt);
          const diff = completed.getTime() - created.getTime();
          if (diff > 0 && diff < 3600000) {
            previousTotalSessionTime += diff;
            previousSessionCount++;
          }
        }
      });

      const previousAvgSessionMs =
        previousSessionCount > 0 ? previousTotalSessionTime / previousSessionCount : 0;

      const timeChange = calculateChange(avgSessionMs, previousAvgSessionMs);

      // Calcular visitantes online ativos (carrinhos atualizados ou criados nos últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const activeCarts = allCarts.filter((c) => {
        const updated = c.updatedAt || c.createdAt;
        return updated >= fiveMinutesAgo;
      });
      const activeVisitors = activeCarts.length;

      // Calcular carrinhos abandonados (visitas/sessões que não viraram pedido)
      const abandonedCartsCount = Math.max(0, uniqueVisitors - totalOrders);
      
      // Calcular faturamento abandonado (soma de todos os checkouts iniciados que não viraram pedido)
      const abandonedOrders = currentOrders?.filter(o => !isValidOrder(o)) || [];
      const abandonedCartsRevenue = abandonedOrders.reduce((sum, o) => {
        const cartTotal = typeof o.total === "string" ? parseFloat(o.total) : o.total;
        return sum + (cartTotal || 0);
      }, 0);

      const previousAbandonedOrders = previousOrders?.filter(o => !isValidOrder(o)) || [];
      const previousAbandonedCartsRevenue = previousAbandonedOrders.reduce((sum, o) => {
        const cartTotal = typeof o.total === "string" ? parseFloat(o.total) : o.total;
        return sum + (cartTotal || 0);
      }, 0);

      const bounceRate =
        uniqueVisitors > 0
          ? (abandonedCartsCount / uniqueVisitors) * 100
          : 0;

      const previousAbandonedCartsCount = Math.max(0, previousVisitors - previousTotalOrders);
      const previousBounceRate =
        previousVisitors > 0
          ? (previousAbandonedCartsCount / previousVisitors) * 100
          : 0;

      // Calcular receita recuperada (carrinhos convertidos para pedido)
      const recoveredCarts = allCarts.filter((c) => c.completedAt && c.convertedToOrderId);
      const recoveredRevenue = recoveredCarts.reduce((sum, c) => {
        const cartTotal = typeof c.total === "string" ? parseFloat(c.total) : c.total;
        return sum + (cartTotal || 0);
      }, 0);

      // Calcular distribuição de métodos de pagamento (apenas de pedidos válidos)
      const paymentMethods = { pix: 0, card: 0, boleto: 0 };
      validOrders.forEach((o) => {
        const method = o.paymentMethod || "";
        const upperMethod = method.toUpperCase();
        if (upperMethod.includes("PIX")) paymentMethods.pix++;
        else if (upperMethod.includes("BOLETO")) paymentMethods.boleto++;
        else if (upperMethod.includes("CARD") || upperMethod.includes("CREDIT")) paymentMethods.card++;
      });

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
        activeVisitors,
        abandonedCartsCount,
        abandonedCartsRevenue,
        recoveredRevenue,
        paymentMethods,
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
      const { data: currentOrders, error: ordersError } = await supabase
        .from("Order")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString())
        .order("createdAt", { ascending: true });

      if (ordersError) throw ordersError;

      const { data: currentCarts } = await supabase
        .from("Cart")
        .select("*")
        .eq("userId", userId)
        .gte("createdAt", start.toISOString())
        .lte("createdAt", end.toISOString());

      const isYear = period === "year";

      if (isYear) {
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const dataByMonth: { [key: number]: { orders: any[]; carts: any[] } } = {};
        
        for (let i = 0; i < 12; i++) {
          dataByMonth[i] = { orders: [], carts: [] };
        }

        currentOrders?.forEach((order) => {
          const m = new Date(order.createdAt).getMonth();
          dataByMonth[m]?.orders.push(order);
        });

        currentCarts?.forEach((cart) => {
          const m = new Date(cart.createdAt).getMonth();
          dataByMonth[m]?.carts.push(cart);
        });

        return months.map((month, index) => {
          const monthData = dataByMonth[index];
          const ordersInMonth = monthData.orders;
          const cartsInMonth = monthData.carts;
          
          const activeOrders = ordersInMonth.filter((o) => o.paymentStatus === "PAID");

          const revenue = activeOrders.reduce((sum, o) => {
            const total = typeof o.total === "string" ? parseFloat(o.total) : o.total;
            return sum + (total || 0);
          }, 0);

          const conversions = ordersInMonth.filter(isValidOrder).length;
          const sessions = Math.max(cartsInMonth.length, ordersInMonth.length);
          const abandoned = Math.max(0, sessions - conversions);

          return {
            name: month,
            revenue,
            conversions,
            sessions,
            pageLoad: 0,
            bounceRate: sessions > 0 ? (abandoned / sessions) * 100 : 0,
            startRender: 0,
            sessionLength: 0,
            pvs: 0,
          };
        });
      }

      // Group by day (DD/MM)
      const dataByDay: { [key: string]: { orders: any[]; carts: any[] } } = {};
      const dateLabels: string[] = [];

      // Use local date boundaries for cleaner day groupings
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);

      const tempDate = new Date(startDate);
      while (tempDate <= endDate) {
        const label = `${String(tempDate.getDate()).padStart(2, '0')}/${String(tempDate.getMonth() + 1).padStart(2, '0')}`;
        dateLabels.push(label);
        dataByDay[label] = { orders: [], carts: [] };
        tempDate.setDate(tempDate.getDate() + 1);
      }

      // Fill data
      currentOrders?.forEach((order) => {
        const label = `${String(new Date(order.createdAt).getDate()).padStart(2, '0')}/${String(new Date(order.createdAt).getMonth() + 1).padStart(2, '0')}`;
        if (dataByDay[label]) {
          dataByDay[label].orders.push(order);
        }
      });

      currentCarts?.forEach((cart) => {
        const label = `${String(new Date(cart.createdAt).getDate()).padStart(2, '0')}/${String(new Date(cart.createdAt).getMonth() + 1).padStart(2, '0')}`;
        if (dataByDay[label]) {
          dataByDay[label].carts.push(cart);
        }
      });

      return dateLabels.map((label) => {
        const dayData = dataByDay[label];
        const ordersInDay = dayData.orders;
        const cartsInDay = dayData.carts;

        const activeOrders = ordersInDay.filter((o) => o.paymentStatus === "PAID");

        const revenue = activeOrders.reduce((sum, o) => {
          const total = typeof o.total === "string" ? parseFloat(o.total) : o.total;
          return sum + (total || 0);
        }, 0);

        const conversions = ordersInDay.filter(isValidOrder).length;
        const sessions = Math.max(cartsInDay.length, ordersInDay.length);

        const abandoned = Math.max(0, sessions - conversions);

        const bounceRate = sessions > 0 
          ? (abandoned / sessions) * 100 
          : 0;

        return {
          name: label,
          revenue,
          conversions,
          sessions,
          pageLoad: 0,
          bounceRate,
          startRender: 0,
          sessionLength: 0,
          pvs: 0,
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
        
        const visits = hourData.carts.length || hourData.orders.length || 0;
        const conversions = hourData.orders.length;

        const revenue = paidOrders.reduce((sum, o) => {
          const total =
            typeof o.total === "string" ? parseFloat(o.total) : o.total;
          return sum + (total || 0);
        }, 0);

        return {
          hour: `${i}h`,
          visits,
          conversions,
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

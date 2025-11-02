import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  CreditCard,
  Package,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Interfaces
interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  trend: "up" | "down";
  icon: React.ReactNode;
  prefix?: string;
  suffix?: string;
}

interface RecentTransaction {
  id: string;
  customer: string;
  amount: number;
  status: "approved" | "pending" | "failed";
  time: string;
  paymentMethod: string;
}

interface OnlineUser {
  id: string;
  page: string;
  timeOnPage: number;
  device: "desktop" | "mobile";
}

const UnifiedDashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  // Estados
  const [isLoading, setIsLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [dateRange, setDateRange] = useState<
    "today" | "week" | "month" | "year"
  >("week");

  // Métricas principais
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    averageOrderValue: 0,
    aovChange: 0,
    onlineNow: 0,
    checkoutViews: 0,
    checkoutAbandonment: 0,
    topProducts: [] as any[],
  });

  // Carregar dados
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();

      // Atualizar dados em tempo real a cada 30 segundos
      const interval = setInterval(() => {
        loadRealtimeData();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user?.id, dateRange]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadRevenueMetrics(),
        loadOrdersMetrics(),
        loadConversionMetrics(),
        loadRevenueChart(),
        loadRecentTransactions(),
        loadTopProducts(),
        loadRealtimeData(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRevenueMetrics = async () => {
    try {
      const { data: orders } = await supabase
        .from("Order")
        .select("total, createdAt")
        .eq("userId", user!.id)
        .eq("status", "paid")
        .gte("createdAt", getDateRangeStart())
        .order("createdAt", { ascending: false });

      if (orders && orders.length > 0) {
        const total = orders.reduce(
          (sum, order) => sum + (order.total || 0),
          0,
        );
        const change = calculateChange(orders);

        setMetrics((prev) => ({
          ...prev,
          totalRevenue: total,
          revenueChange: change,
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar receita:", error);
    }
  };

  const loadOrdersMetrics = async () => {
    try {
      const { data: orders } = await supabase
        .from("Order")
        .select("id, createdAt, total")
        .eq("userId", user!.id)
        .gte("createdAt", getDateRangeStart())
        .order("createdAt", { ascending: false });

      if (orders) {
        const totalOrders = orders.length;
        const change = calculateOrdersChange(orders);

        // Calcular AOV
        const totalRevenue = orders.reduce(
          (sum, order) => sum + (order.total || 0),
          0,
        );
        const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        setMetrics((prev) => ({
          ...prev,
          totalOrders,
          ordersChange: change,
          averageOrderValue: aov,
          aovChange: 5.2, // Placeholder
        }));
      }
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  };

  const loadConversionMetrics = async () => {
    try {
      // Simular taxa de conversão (em produção, usar analytics real)
      const conversionRate = 3.2; // %
      const change = 0.8;

      setMetrics((prev) => ({
        ...prev,
        conversionRate,
        conversionChange: change,
        checkoutViews: 1247,
        checkoutAbandonment: 68.5,
      }));
    } catch (error) {
      console.error("Erro ao carregar conversão:", error);
    }
  };

  const loadRevenueChart = async () => {
    try {
      const { data: orders } = await supabase
        .from("Order")
        .select("total, createdAt")
        .eq("userId", user!.id)
        .eq("status", "paid")
        .gte("createdAt", getDateRangeStart())
        .order("createdAt", { ascending: true });

      if (orders) {
        const chartData = processChartData(orders);
        setRevenueData(chartData);
      }
    } catch (error) {
      console.error("Erro ao carregar gráfico:", error);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      const { data: orders } = await supabase
        .from("Order")
        .select("id, customerName, total, status, createdAt, paymentMethod")
        .eq("userId", user!.id)
        .order("createdAt", { ascending: false })
        .limit(5);

      if (orders) {
        const transactions: RecentTransaction[] = orders.map((order) => ({
          id: order.id,
          customer: order.customerName || "Cliente",
          amount: order.total || 0,
          status:
            order.status === "paid"
              ? "approved"
              : order.status === "pending"
                ? "pending"
                : "failed",
          time: formatTime(order.createdAt),
          paymentMethod: order.paymentMethod || "Cartão",
        }));

        setRecentTransactions(transactions);
      }
    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    }
  };

  const loadTopProducts = async () => {
    try {
      // Placeholder data - em produção, fazer query real
      const topProducts = [
        { name: "Produto A", sales: 45, revenue: 4500 },
        { name: "Produto B", sales: 32, revenue: 3200 },
        { name: "Produto C", sales: 28, revenue: 2800 },
        { name: "Produto D", sales: 21, revenue: 2100 },
      ];

      setMetrics((prev) => ({ ...prev, topProducts }));
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const loadRealtimeData = async () => {
    try {
      // Simular usuários online (em produção, usar websockets/analytics real)
      const mockOnlineUsers: OnlineUser[] = [
        {
          id: "1",
          page: "Checkout - Pagamento",
          timeOnPage: 45,
          device: "mobile",
        },
        {
          id: "2",
          page: "Checkout - Dados Pessoais",
          timeOnPage: 120,
          device: "desktop",
        },
        {
          id: "3",
          page: "Produto - Fones XYZ",
          timeOnPage: 30,
          device: "mobile",
        },
      ];

      setOnlineUsers(mockOnlineUsers);
      setMetrics((prev) => ({ ...prev, onlineNow: mockOnlineUsers.length }));
    } catch (error) {
      console.error("Erro ao carregar dados em tempo real:", error);
    }
  };

  // Funções auxiliares
  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case "week":
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case "month":
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case "year":
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
    }
  };

  const calculateChange = (orders: any[]) => {
    // Calcular mudança percentual (placeholder)
    return 12.5;
  };

  const calculateOrdersChange = (orders: any[]) => {
    return 8.3;
  };

  const processChartData = (orders: any[]) => {
    // Agrupar por dia
    const grouped: { [key: string]: number } = {};

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
      grouped[date] = (grouped[date] || 0) + (order.total || 0);
    });

    return Object.entries(grouped).map(([date, revenue]) => ({
      date,
      revenue,
      orders: Math.floor(Math.random() * 20) + 5, // Placeholder
    }));
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m atrás`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h atrás`;
    return date.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Cards de métricas
  const metricCards: MetricCard[] = [
    {
      title: "Receita Total",
      value: formatCurrency(metrics.totalRevenue),
      change: metrics.revenueChange,
      trend: metrics.revenueChange >= 0 ? "up" : "down",
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      title: "Pedidos",
      value: metrics.totalOrders,
      change: metrics.ordersChange,
      trend: metrics.ordersChange >= 0 ? "up" : "down",
      icon: <ShoppingCart className="h-5 w-5" />,
    },
    {
      title: "Taxa de Conversão",
      value: metrics.conversionRate,
      change: metrics.conversionChange,
      trend: metrics.conversionChange >= 0 ? "up" : "down",
      icon: <TrendingUp className="h-5 w-5" />,
      suffix: "%",
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(metrics.averageOrderValue),
      change: metrics.aovChange,
      trend: metrics.aovChange >= 0 ? "up" : "down",
      icon: <CreditCard className="h-5 w-5" />,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Visão geral das suas métricas de vendas
          </p>
        </div>

        {/* Filtro de Período */}
        <div className="flex gap-2">
          {(["today", "week", "month", "year"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateRange === range
                  ? "bg-pink-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {range === "today" && "Hoje"}
              {range === "week" && "7 dias"}
              {range === "month" && "30 dias"}
              {range === "year" && "1 ano"}
            </button>
          ))}
        </div>
      </div>

      {/* Usuários Online - Destaque */}
      <Card className="bg-gradient-to-br from-pink-500 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                <Activity className="h-8 w-8 animate-pulse" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">
                  Usuários Online Agora
                </p>
                <p className="text-4xl font-bold mt-1">{metrics.onlineNow}</p>
                <p className="text-white/80 text-xs mt-1">
                  {
                    onlineUsers.filter((u) => u.page.includes("Checkout"))
                      .length
                  }{" "}
                  no checkout
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Ao Vivo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                  {metric.icon}
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <p className="text-gray-600 text-sm font-medium mb-1">
                {metric.title}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {metric.prefix}
                {metric.value}
                {metric.suffix}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico de Receita + Usuários Online */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Receita ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: "#666", fontSize: 12 }} />
                <YAxis tick={{ fill: "#666", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ec4899"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lista de Usuários Online */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Eye className="h-5 w-5 text-pink-600" />
              Atividade em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="h-2 w-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.page}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {user.timeOnPage}s na página
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 capitalize">
                        {user.device}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {onlineUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum usuário online no momento
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes + Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transações Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Transações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        transaction.status === "approved"
                          ? "bg-green-100"
                          : transaction.status === "pending"
                            ? "bg-yellow-100"
                            : "bg-red-100"
                      }`}
                    >
                      {transaction.status === "approved" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {transaction.status === "pending" && (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                      {transaction.status === "failed" && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.customer}
                      </p>
                      <p className="text-xs text-gray-500">
                        {transaction.time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {transaction.paymentMethod}
                    </p>
                  </div>
                </div>
              ))}

              {recentTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhuma transação recente
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-5 w-5 text-pink-600" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-8 w-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.sales} vendas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </p>
                  </div>
                </div>
              ))}

              {metrics.topProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Nenhum produto vendido ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Performance do Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">
                Visualizações do Checkout
              </p>
            </div>
            <p className="text-3xl font-bold text-blue-900">
              {metrics.checkoutViews}
            </p>
            <p className="text-xs text-blue-700 mt-1">Últimos 7 dias</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="h-5 w-5 text-amber-600" />
              <p className="text-sm font-medium text-amber-900">
                Taxa de Abandono
              </p>
            </div>
            <p className="text-3xl font-bold text-amber-900">
              {metrics.checkoutAbandonment}%
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Oportunidade de melhoria
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">
                Novos Clientes
              </p>
            </div>
            <p className="text-3xl font-bold text-green-900">
              {Math.floor(metrics.totalOrders * 0.65)}
            </p>
            <p className="text-xs text-green-700 mt-1">65% dos pedidos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedDashboardPage;

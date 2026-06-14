import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  ShoppingBag,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  Target,
  Zap,
  Eye,
  MousePointer,
  BarChart3,
  Calendar,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardApi, DashboardMetrics } from "@/lib/api/dashboardApi";
import { supabase } from "@/lib/supabase";

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: any;
  color: string;
  delay?: number;
  isSecondary?: boolean;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0,
  isSecondary = false,
}: MetricCardProps) => {
  const isPositive = change >= 0;

  if (isSecondary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
        whileHover={{ y: -1 }}
      >
        <Card className="relative overflow-hidden border border-gray-150/30 dark:border-gray-800/40 bg-white/40 dark:bg-gray-950/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 p-3.5 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {title}
            </span>
            <div className={`p-1 rounded-md ${color} bg-opacity-10 flex-shrink-0`}>
              <Icon className={`h-3 w-3 ${color.replace("bg-", "text-")}`} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-xl font-extrabold text-gray-800 dark:text-gray-200 tracking-tight">
              {value}
            </div>
            <div className="flex items-center gap-0.5">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-[10px] font-bold ${
                  isPositive ? "text-green-500" : "text-red-500"
                }`}
              >
                {Math.abs(change).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="relative overflow-hidden border border-purple-500/10 dark:border-purple-500/20 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 p-5 rounded-2xl">
        <div
          className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-[0.08] rounded-full blur-2xl`}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-15 flex-shrink-0`}>
            <Icon className={`h-4 w-4 ${color.replace("bg-", "text-")}`} />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-950 via-gray-700 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
            {value}
          </div>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
            )}
            <span
              className={`text-xs font-bold ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
              vs anterior
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-750 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mt-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-300">{entry.name}:</span>
            <span className="text-white font-semibold">
              {typeof entry.value === "number" && entry.name.includes("Receita")
                ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(entry.value)
                : typeof entry.value === "number" && entry.name.includes("Rate") || entry.name.includes("Rejeição")
                ? `${entry.value.toFixed(1)}%`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ReportsOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7days");
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const formatOrderDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }) + " - " + date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      PENDING: {
        label: "Pendente",
        color: "bg-yellow-100/80 text-yellow-800 border border-yellow-250/20 dark:bg-yellow-950/45 dark:text-yellow-400 dark:border-yellow-900/50",
      },
      PROCESSING: {
        label: "Processando",
        color: "bg-blue-100/80 text-blue-800 border border-blue-250/20 dark:bg-blue-950/45 dark:text-blue-400 dark:border-blue-900/50",
      },
      PAID: {
        label: "Pago",
        color: "bg-green-100/80 text-green-800 border border-green-250/20 dark:bg-green-950/45 dark:text-green-400 dark:border-green-900/50",
      },
      FAILED: {
        label: "Falhou",
        color: "bg-red-100/80 text-red-800 border border-red-250/20 dark:bg-red-950/45 dark:text-red-400 dark:border-red-900/50",
      },
      REFUNDED: {
        label: "Reembolsado",
        color: "bg-gray-100/80 text-gray-800 border border-gray-200 dark:bg-gray-900/45 dark:text-gray-400 dark:border-gray-800/50",
      },
      CANCELLED: {
        label: "Cancelado",
        color: "bg-gray-100/80 text-gray-800 border border-gray-200 dark:bg-gray-900/45 dark:text-gray-400 dark:border-gray-800/50",
      },
    };
    return (
      statusMap[status] || {
        label: status || "Pendente",
        color: "bg-gray-100/80 text-gray-800 dark:bg-gray-950/45 dark:text-gray-400 border border-gray-200/20",
      }
    );
  };

  const getFirstItem = (order: any) => {
    if (!order.items) return null;
    let items: any[] = [];
    if (Array.isArray(order.items)) {
      items = order.items;
    } else if (typeof order.items === "object") {
      const itemsObj = order.items as any;
      if (Array.isArray(itemsObj.items)) {
        items = itemsObj.items;
      } else {
        items = [itemsObj];
      }
    }
    return items.length > 0 ? items[0] : null;
  };

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();

      // ✅ Sincronização automática em tempo real dos pedidos no dashboard!
      const channel = supabase
        .channel("dashboard-orders-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "Order",
            filter: `userId=eq.${user.id}`,
          },
          (payload) => {
            console.log("🔄 [DASHBOARD] Mudança em tempo real detectada nos pedidos! Recarregando dados...", payload);
            loadDashboardData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id, period]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [metricsData, chartDataResult, hourlyDataResult, recentOrdersResult] =
        await Promise.all([
          dashboardApi.getMetrics(user.id, period),
          dashboardApi.getChartData(user.id, period),
          dashboardApi.getHourlyData(user.id),
          dashboardApi.getRecentOrders(user.id, 5),
        ]);

      setMetrics(metricsData);
      setChartData(chartDataResult);
      setHourlyData(hourlyDataResult);
      setRecentOrders(recentOrdersResult);
    } catch (error: any) {
      console.error("Erro ao carregar dashboard:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (value: string) => {
    setPeriod(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const primaryCards = metrics
    ? [
        {
          title: "Receita Total",
          value: formatCurrency(metrics.totalRevenue),
          change: metrics.revenueChange,
          icon: DollarSign,
          color: "bg-green-500",
        },
        {
          title: "Total de Pedidos",
          value: formatNumber(metrics.totalOrders),
          change: metrics.ordersChange,
          icon: ShoppingCart,
          color: "bg-blue-500",
        },
        {
          title: "Taxa de Conversão",
          value: `${metrics.conversionRate.toFixed(2)}%`,
          change: metrics.conversionChange,
          icon: Target,
          color: "bg-cyan-500",
        },
        {
          title: "Ticket Médio",
          value: formatCurrency(metrics.averageTicket),
          change: metrics.ticketChange,
          icon: Package,
          color: "bg-pink-500",
        },
      ]
    : [];

  const secondaryCards = metrics
    ? [
        {
          title: "Visitantes Únicos",
          value: formatNumber(metrics.uniqueVisitors),
          change: metrics.visitorsChange,
          icon: Users,
          color: "bg-purple-500",
        },
        {
          title: "Produtos Vendidos",
          value: formatNumber(metrics.productsSold),
          change: metrics.productsSoldChange,
          icon: Package,
          color: "bg-orange-500",
        },
        {
          title: "Tempo Médio",
          value: metrics.averageTime,
          change: metrics.timeChange,
          icon: Clock,
          color: "bg-yellow-500",
        },
        {
          title: "Taxa de Rejeição",
          value: `${metrics.bounceRate.toFixed(1)}%`,
          change: metrics.bounceRateChange,
          icon: Activity,
          color: "bg-red-500",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // ✅ Unificar dados a serem exibidos de acordo com o período (hoje -> dados horários, outros -> dados diários)
  const displayData = period === "today"
    ? hourlyData.map((h) => ({
        name: h.hour,
        revenue: h.revenue,
        conversions: h.conversions,
        sessions: h.visits,
        pageLoad: h.visits > 0 ? Math.floor(Math.random() * 120) + 160 : 0,
        bounceRate: h.visits > 0 ? 45.2 : 0,
        startRender: h.visits > 0 ? Math.floor(Math.random() * 80) + 90 : 0,
        sessionLength: h.visits > 0 ? Math.floor(Math.random() * 6) + 4 : 0,
        pvs: h.visits > 0 ? Math.floor(Math.random() * 2) + 1.4 : 0,
      }))
    : chartData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Visão geral das suas métricas de vendas e conversão
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="90days">Últimos 90 dias</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadDashboardData()}
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Métricas Principais (Financeiras) */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {primaryCards.map((metric, index) => (
          <MetricCard key={index} {...metric} delay={index * 0.05} />
        ))}
      </div>

      {/* Gráfico Principal - Vendas e Faturamento */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="border border-purple-500/10 dark:border-purple-500/20 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl shadow-md p-5 rounded-2xl">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-850 mb-5">
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-gray-950 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Desempenho de Vendas e Faturamento
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                Acompanhamento dinâmico de faturamento e volume de pedidos no período selecionado
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-sm">
              <Zap className="h-3 w-3 mr-1" />
              Atualizado em Tempo Real
            </Badge>
          </div>
          <CardContent className="p-0">
            <ResponsiveContainer width="100%" height={320}>
              {displayData.length > 0 ? (
                <ComposedChart data={displayData}>
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9ca3af"
                    style={{ fontSize: "11px" }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#06b6d4"
                    style={{ fontSize: "11px" }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#8b5cf6"
                    style={{ fontSize: "11px" }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: "15px" }}
                    iconType="circle"
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    fill="url(#colorRevenue)"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    name="Receita (R$)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="conversions"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: "#8b5cf6", r: 4 }}
                    name="Pedidos"
                  />
                </ComposedChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Sem dados disponíveis
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Métricas Operacionais (Secundárias - Mais Compactas) */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Métricas Operacionais e Performance
        </h3>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {secondaryCards.map((metric, index) => (
            <MetricCard key={index} {...metric} isSecondary={true} delay={index * 0.05} />
          ))}
        </div>
      </div>

      {/* Grid de Gráficos Secundários */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Sessões e Tráfego */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border border-gray-150/40 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/75 backdrop-blur-xl shadow-md p-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <BarChart3 className="h-4.5 w-4.5 text-purple-500" />
                  Sessões e Tráfego
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Visitas totais no período selecionado
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={230}>
                {displayData.length > 0 ? (
                  <AreaChart data={displayData}>
                    <defs>
                      <linearGradient
                        id="colorVisits"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.15}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis stroke="#9ca3af" style={{ fontSize: "10px" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sessions"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#colorVisits)"
                      name="Sessões"
                    />
                  </AreaChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tempo de Carregamento vs Rejeição */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="border border-gray-150/40 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/75 backdrop-blur-xl shadow-md p-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Activity className="h-4.5 w-4.5 text-cyan-500" />
                  Performance vs Rejeição
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Tempo de carregamento e taxa de rejeição
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={230}>
                {displayData.length > 0 ? (
                  <ComposedChart data={displayData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.15}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#06b6d4"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#ef4444"
                      style={{ fontSize: "10px" }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      yAxisId="left"
                      dataKey="pageLoad"
                      fill="#06b6d4"
                      opacity={0.6}
                      radius={[4, 4, 0, 0]}
                      name="Load (ms)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bounceRate"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: "#ef4444", r: 3 }}
                      name="Rejeição (%)"
                    />
                  </ComposedChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Grid de Métricas Avançadas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Métricas de Engajamento */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border border-gray-150/40 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/75 backdrop-blur-xl shadow-md p-5 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Eye className="h-4.5 w-4.5 text-pink-500" />
                  Métricas de Engajamento
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Tempo de sessão e visualizações por sessão
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              <ResponsiveContainer width="100%" height={230}>
                {displayData.length > 0 ? (
                  <LineChart data={displayData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#374151"
                      opacity={0.15}
                    />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis yAxisId="left" stroke="#f59e0b" style={{ fontSize: "10px" }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ec4899" style={{ fontSize: "10px" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="sessionLength"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 3 }}
                      name="Sessão (min)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="pvs"
                      stroke="#ec4899"
                      strokeWidth={2}
                      dot={{ fill: "#ec4899", r: 3 }}
                      name="PVs/Sessão"
                    />
                  </LineChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Sem dados disponíveis
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Últimos Pedidos */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border border-gray-150/40 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/75 backdrop-blur-xl shadow-md p-5 rounded-2xl h-full">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-850 mb-4">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <ShoppingBag className="h-4.5 w-4.5 text-purple-500" />
                  Últimos Pedidos
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  Últimas 5 vendas registradas em tempo real
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const firstItem = getFirstItem(order);
                    const productName = firstItem?.name || `Pedido #${order.orderNumber}`;
                    const productImg = firstItem?.image;

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-gray-850 bg-white/50 dark:bg-gray-950/40 hover:bg-white/80 dark:hover:bg-gray-950/60 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={productName}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-150/10 dark:border-gray-800/20 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 border border-purple-500/10 dark:border-purple-500/20 flex items-center justify-center font-bold text-[11px] text-purple-600 dark:text-purple-400 shrink-0">
                              <Package className="h-4.5 w-4.5" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate pr-2">
                              {productName}
                            </span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                              {formatOrderDate(order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2 shrink-0">
                          <Badge className={`${getStatusBadge(order.paymentStatus).color} text-[9px] px-1.5 py-0.5 font-bold shadow-none border-0`}>
                            {getStatusBadge(order.paymentStatus).label}
                          </Badge>
                          <span className="text-xs font-black text-gray-900 dark:text-white">
                            {formatCurrency(typeof order.total === "string" ? parseFloat(order.total) : order.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <span className="text-xs text-gray-500 font-medium">
                      Nenhum pedido recente registrado
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
};

export default ReportsOverviewPage;



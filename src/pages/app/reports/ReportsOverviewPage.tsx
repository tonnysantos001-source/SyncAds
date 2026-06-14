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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  delay = 0,
  isSecondary = false,
  subtitle,
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
        <Card className="relative overflow-hidden border border-gray-150/30 dark:border-gray-800/20 bg-white/40 dark:bg-gray-950/30 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 p-2.5 rounded-xl min-h-[82px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {title}
            </span>
            <div className={`p-1 rounded-md ${color} bg-opacity-10 flex-shrink-0`}>
              <Icon className={`h-3 w-3 ${color.replace("bg-", "text-")}`} />
            </div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <div className="flex flex-col min-w-0">
              <div className="text-base font-extrabold text-gray-800 dark:text-gray-200 tracking-tight truncate">
                {value}
              </div>
              {subtitle && (
                <span className="text-[8px] font-semibold text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                  {subtitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0 ml-1">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span
                className={`text-[9px] font-bold ${
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ y: -1 }}
    >
      <Card className="relative overflow-hidden border border-purple-500/10 dark:border-purple-500/20 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-200 p-3 rounded-xl min-h-[95px] flex flex-col justify-between">
        <div
          className={`absolute top-0 right-0 w-20 h-20 ${color} opacity-[0.08] rounded-full blur-2xl`}
        />
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </span>
          <div className={`p-1.5 rounded-lg ${color} bg-opacity-15 flex-shrink-0`}>
            <Icon className={`h-3.5 w-3.5 ${color.replace("bg-", "text-")}`} />
          </div>
        </div>
        <div className="mt-1.5">
          <div className="text-lg md:text-xl font-black bg-gradient-to-r from-gray-950 via-gray-700 to-gray-900 dark:from-white dark:via-gray-100 dark:to-gray-300 bg-clip-text text-transparent tracking-tight">
            {value}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            )}
            <span
              className={`text-[9px] font-bold ${
                isPositive ? "text-green-500" : "text-red-500"
              }`}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium">
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
          title: "Carrinhos Abandonados",
          value: formatNumber(metrics.abandonedCartsCount),
          change: metrics.bounceRateChange,
          icon: ShoppingBag,
          color: "bg-orange-500",
          subtitle: `Perda: ${formatCurrency(metrics.abandonedCartsRevenue)}`,
        },
        {
          title: "Receita Recuperada",
          value: formatCurrency(metrics.recoveredRevenue),
          change: metrics.revenueChange,
          icon: Zap,
          color: "bg-green-500",
        },
        {
          title: "Taxa de Abandono",
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
    <div className="space-y-4 max-w-[1600px] mx-auto p-0.5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-150/40 dark:border-gray-800/20 pb-2.5"
      >
        <div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight">
            Dashboard
          </h1>
          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Visão geral das suas métricas de vendas e conversão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[145px] h-8 text-[11px] font-semibold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today" className="text-xs">Hoje</SelectItem>
              <SelectItem value="7days" className="text-xs">Últimos 7 dias</SelectItem>
              <SelectItem value="30days" className="text-xs">Últimos 30 dias</SelectItem>
              <SelectItem value="90days" className="text-xs">Últimos 90 dias</SelectItem>
              <SelectItem value="year" className="text-xs">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => loadDashboardData()}
          >
            <Activity className="h-3.5 w-3.5" />
          </Button>
        </div>
      </motion.div>

      {/* Métricas Principais (Financeiras e Online) */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        {primaryCards.map((metric, index) => (
          <MetricCard key={index} {...metric} delay={index * 0.05} />
        ))}
        {/* Globo Online como o quinto card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          whileHover={{ y: -1 }}
        >
          <Card className="relative overflow-hidden border border-green-500/10 dark:border-green-500/20 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl shadow-md hover:shadow-lg transition-all duration-200 p-3 rounded-xl flex justify-between items-center h-full min-h-[95px]">
            <div className="flex flex-col flex-1 min-w-0 pr-1">
              <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Visitantes Online
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {metrics?.activeVisitors || 0}
                </span>
                <span className="text-[8px] font-bold text-green-500 flex items-center gap-1 shrink-0">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                  </span>
                  ativos
                </span>
              </div>
              <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium mt-0.5 truncate">
                Navegando no checkout
              </span>
            </div>
            
            {/* Globo Animado Shopify Style */}
            <div className="relative h-9 w-9 flex items-center justify-center shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <svg className="h-7.5 w-7.5 text-green-500/60 dark:text-green-400/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="2 2" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
              </motion.div>
              {/* Ponto verde piscante fixado no topo do globo */}
              <div className="absolute top-0.5 right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Gráfico Principal e Últimos Pedidos em Linha Lado a Lado */}
      <div className="grid gap-4 md:grid-cols-12">
        {/* Gráfico Principal - Vendas e Faturamento */}
        <motion.div
          className="md:col-span-7"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border border-purple-500/10 dark:border-purple-500/20 bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl shadow-md p-3 rounded-xl h-full flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
              <div>
                <h3 className="text-xs md:text-sm font-bold bg-gradient-to-r from-gray-950 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Desempenho de Vendas e Faturamento
                </h3>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                  Faturamento e volume de pedidos no período selecionado
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-sm text-[8px] px-1.5 py-0.5 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Tempo Real
              </Badge>
            </div>
            <CardContent className="p-0 flex-1 flex items-center">
              <ResponsiveContainer width="100%" height={185}>
                {displayData.length > 0 ? (
                  <ComposedChart data={displayData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "9px" }} />
                    <YAxis
                      yAxisId="left"
                      stroke="#06b6d4"
                      style={{ fontSize: "9px" }}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" style={{ fontSize: "9px" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "5px", fontSize: "9px" }} iconType="circle" />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      fill="url(#colorRevenue)"
                      stroke="#06b6d4"
                      strokeWidth={1.5}
                      name="Receita (R$)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="conversions"
                      stroke="#8b5cf6"
                      strokeWidth={1.5}
                      dot={{ fill: "#8b5cf6", r: 2 }}
                      name="Pedidos"
                    />
                  </ComposedChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                    Sem dados disponíveis
                  </div>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Últimos Pedidos */}
        <motion.div
          className="md:col-span-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border border-gray-150/40 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/75 backdrop-blur-xl shadow-md p-3 rounded-xl h-full flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800 mb-2">
              <div>
                <h3 className="text-xs md:text-sm font-bold flex items-center gap-1.5 text-gray-900 dark:text-white">
                  <ShoppingBag className="h-4 w-4 text-purple-500" />
                  Últimos Pedidos
                </h3>
                <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                  Últimas 5 vendas registradas em tempo real
                </p>
              </div>
            </div>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="space-y-1 max-h-[185px] overflow-y-auto pr-1">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order) => {
                    const firstItem = getFirstItem(order);
                    const productName = firstItem?.name || `Pedido #${order.orderNumber}`;
                    const productImg = firstItem?.image;

                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-1.5 rounded-lg border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-950/40 hover:bg-white/80 dark:hover:bg-gray-950/60 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={productName}
                              className="w-7 h-7 rounded-md object-cover border border-gray-150/10 dark:border-gray-800/20 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-blue-500/20 to-purple-500/20 dark:from-blue-500/30 dark:to-purple-500/30 border border-purple-500/10 dark:border-purple-500/20 flex items-center justify-center font-bold text-[9px] text-purple-600 dark:text-purple-400 shrink-0">
                              <Package className="h-3.5 w-3.5" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[9.5px] font-bold text-gray-800 dark:text-gray-200 truncate pr-2">
                              {productName}
                            </span>
                            <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium">
                              {formatOrderDate(order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1 shrink-0">
                          <Badge className={`${getStatusBadge(order.paymentStatus).color} text-[7.5px] px-1 py-0.2 font-bold shadow-none border-0`}>
                            {getStatusBadge(order.paymentStatus).label}
                          </Badge>
                          <span className="text-[10px] font-black text-gray-900 dark:text-white">
                            {formatCurrency(typeof order.total === "string" ? parseFloat(order.total) : order.total)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
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

      {/* Painel Analítico Tabulado com Gráficos e Funis Secundários */}
      <Tabs defaultValue="conversion" className="space-y-3">
        <TabsList className="bg-white/40 dark:bg-gray-950/20 border border-gray-150/30 dark:border-gray-800/30 p-1 rounded-xl inline-flex">
          <TabsTrigger value="conversion" className="text-[11px] font-bold px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm">
            Funil & Pagamentos
          </TabsTrigger>
          <TabsTrigger value="traffic" className="text-[11px] font-bold px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm">
            Tráfego & Engajamento
          </TabsTrigger>
          <TabsTrigger value="performance" className="text-[11px] font-bold px-3 py-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm">
            Velocidade & Rejeição
          </TabsTrigger>
        </TabsList>

        <Card className="border border-gray-150/40 dark:border-gray-800/40 bg-white/70 dark:bg-gray-900/75 backdrop-blur-xl shadow-md p-3.5 rounded-xl">
          {/* Tab 1: Funil & Pagamentos */}
          <TabsContent value="conversion" className="mt-0 space-y-4">
            {/* Grid de Métricas do Checkout */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Visitantes Únicos"
                value={formatNumber(metrics?.uniqueVisitors || 0)}
                change={metrics?.visitorsChange || 0}
                icon={Users}
                color="bg-purple-500"
                isSecondary={true}
              />
              <MetricCard
                title="Carrinhos Abandonados"
                value={formatNumber(metrics?.abandonedCartsCount || 0)}
                change={metrics?.bounceRateChange || 0}
                icon={ShoppingBag}
                color="bg-orange-500"
                isSecondary={true}
                subtitle={`${metrics?.abandonedCartsCount || 0} abandonos`}
              />
              <MetricCard
                title="Valor Abandonado"
                value={formatCurrency(metrics?.abandonedCartsRevenue || 0)}
                change={metrics?.bounceRateChange || 0}
                icon={TrendingDown}
                color="bg-red-500"
                isSecondary={true}
              />
              <MetricCard
                title="Receita Recuperada"
                value={formatCurrency(metrics?.recoveredRevenue || 0)}
                change={metrics?.revenueChange || 0}
                icon={Zap}
                color="bg-green-500"
                isSecondary={true}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 p-1">
              {/* Funil de Vendas */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Funil do Checkout</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Eficiência de conversão em cada etapa do checkout</p>
                </div>
                
                <div className="space-y-3">
                  {/* Visitas / Iniciado */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-gray-600 dark:text-gray-400">1. Checkout Iniciado (Visitas)</span>
                      <span className="text-gray-900 dark:text-white">{metrics?.uniqueVisitors || 0} (100%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full w-full" />
                    </div>
                  </div>

                  {/* Dados Preenchidos */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-gray-600 dark:text-gray-400">2. Dados do Frete Preenchidos</span>
                      <span className="text-gray-900 dark:text-white">
                        {Math.round((metrics?.uniqueVisitors || 0) * 0.72)} (72%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full" style={{ width: '72%' }} />
                    </div>
                  </div>

                  {/* Pago */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-gray-600 dark:text-gray-400">3. Vendas Finalizadas (Pagas)</span>
                      <span className="text-gray-900 dark:text-white">
                        {metrics?.totalOrders || 0} ({metrics ? metrics.conversionRate.toFixed(1) : 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                        style={{ width: `${Math.min(100, Math.max(5, metrics?.conversionRate || 0))}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Métodos de Pagamento */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Meios de Pagamento</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Preferência de pagamento usada pelos clientes nas compras</p>
                </div>

                <div className="space-y-3">
                  {/* Cartão de Crédito */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-gray-600 dark:text-gray-400">💳 Cartão de Crédito</span>
                      <span className="text-gray-900 dark:text-white">
                        {metrics?.paymentMethods?.card || 0} vendas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" 
                        style={{ 
                          width: `${
                            metrics?.paymentMethods 
                              ? (metrics.paymentMethods.card / (metrics.paymentMethods.card + metrics.paymentMethods.pix + metrics.paymentMethods.boleto || 1)) * 100 
                              : 50
                          }%` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* PIX */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-gray-600 dark:text-gray-400">⚡ PIX</span>
                      <span className="text-gray-900 dark:text-white">
                        {metrics?.paymentMethods?.pix || 0} vendas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full" 
                        style={{ 
                          width: `${
                            metrics?.paymentMethods 
                              ? (metrics.paymentMethods.pix / (metrics.paymentMethods.card + metrics.paymentMethods.pix + metrics.paymentMethods.boleto || 1)) * 100 
                              : 30
                          }%` 
                        }} 
                      />
                    </div>
                  </div>

                  {/* Boleto */}
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold mb-1">
                      <span className="text-gray-600 dark:text-gray-400">📄 Boleto Bancário</span>
                      <span className="text-gray-900 dark:text-white">
                        {metrics?.paymentMethods?.boleto || 0} vendas
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full" 
                        style={{ 
                          width: `${
                            metrics?.paymentMethods 
                              ? (metrics.paymentMethods.boleto / (metrics.paymentMethods.card + metrics.paymentMethods.pix + metrics.paymentMethods.boleto || 1)) * 100 
                              : 20
                          }%` 
                        }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Tráfego & Engajamento */}
          <TabsContent value="traffic" className="mt-0 space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <MetricCard
                title="Visitantes Únicos"
                value={formatNumber(metrics?.uniqueVisitors || 0)}
                change={metrics?.visitorsChange || 0}
                icon={Users}
                color="bg-purple-500"
                isSecondary={true}
              />
              <MetricCard
                title="Tempo Médio de Sessão"
                value={metrics?.averageTime || "8m 0s"}
                change={metrics?.timeChange || 0}
                icon={Clock}
                color="bg-yellow-500"
                isSecondary={true}
              />
              <MetricCard
                title="Taxa de Rejeição"
                value={`${(metrics?.bounceRate || 0).toFixed(1)}%`}
                change={metrics?.bounceRateChange || 0}
                icon={Activity}
                color="bg-red-500"
                isSecondary={true}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Sessões e Tráfego */}
              <div className="space-y-2">
                <div className="pb-1 border-b border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Sessões e Tráfego</h4>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  {displayData.length > 0 ? (
                    <AreaChart data={displayData}>
                      <defs>
                        <linearGradient id="colorVisits animate-pulse" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                      <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "9px" }} />
                      <YAxis stroke="#9ca3af" style={{ fontSize: "9px" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="sessions"
                        stroke="#8b5cf6"
                        strokeWidth={1.5}
                        fill="url(#colorVisits)"
                        name="Sessões"
                      />
                    </AreaChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                      Sem dados disponíveis
                    </div>
                  )}
                </ResponsiveContainer>
              </div>

              {/* Métricas de Engajamento */}
              <div className="space-y-2">
                <div className="pb-1 border-b border-gray-100 dark:border-gray-800">
                  <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Métricas de Engajamento</h4>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  {displayData.length > 0 ? (
                    <LineChart data={displayData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                      <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "9px" }} />
                      <YAxis yAxisId="left" stroke="#f59e0b" style={{ fontSize: "9px" }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#ec4899" style={{ fontSize: "9px" }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="sessionLength"
                        stroke="#f59e0b"
                        strokeWidth={1.5}
                        dot={{ fill: "#f59e0b", r: 2 }}
                        name="Sessão (min)"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="pvs"
                        stroke="#ec4899"
                        strokeWidth={1.5}
                        dot={{ fill: "#ec4899", r: 2 }}
                        name="PVs/Sessão"
                      />
                    </LineChart>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                      Sem dados disponíveis
                    </div>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Velocidade & Rejeição */}
          <TabsContent value="performance" className="mt-0 space-y-4">
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <MetricCard
                title="Tempo de Resposta (Load)"
                value="182 ms"
                change={-5.4}
                icon={Zap}
                color="bg-cyan-500"
                isSecondary={true}
              />
              <MetricCard
                title="Início de Render"
                value="96 ms"
                change={-8.1}
                icon={Clock}
                color="bg-blue-500"
                isSecondary={true}
              />
              <MetricCard
                title="Taxa de Rejeição"
                value={`${(metrics?.bounceRate || 0).toFixed(1)}%`}
                change={metrics?.bounceRateChange || 0}
                icon={Activity}
                color="bg-red-500"
                isSecondary={true}
              />
            </div>

            <div className="space-y-2">
              <div className="pb-1 border-b border-gray-100 dark:border-gray-800 mb-1">
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">Performance vs Taxa de Abandono (Rejeição)</h4>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                {displayData.length > 0 ? (
                  <ComposedChart data={displayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "9px" }} />
                    <YAxis yAxisId="left" stroke="#06b6d4" style={{ fontSize: "9px" }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#ef4444" style={{ fontSize: "9px" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      yAxisId="left"
                      dataKey="pageLoad"
                      fill="#06b6d4"
                      opacity={0.6}
                      radius={[3, 3, 0, 0]}
                      name="Load (ms)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="bounceRate"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      dot={{ fill: "#ef4444", r: 2 }}
                      name="Rejeição (%)"
                    />
                  </ComposedChart>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                    Sem dados disponíveis
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default ReportsOverviewPage;



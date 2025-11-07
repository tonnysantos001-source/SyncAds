import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
  HiOutlineTrendingUp,
  HiOutlineCreditCard,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineXCircle,
  HiOutlineUsers,
  HiOutlineRefresh,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineExclamationCircle,
  HiOutlineShoppingBag,
  HiOutlineCube,
} from "react-icons/hi2";
import { IoSparklesSharp } from "react-icons/io5";

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;
  checkoutViews: number;
  conversionRate: number;
  abandonedCarts: number;
  abandonmentRate: number;
  recoveredCarts: number;
  recoveryRate: number;
  pendingPayments: number;
  paidOrders: number;
  failedPayments: number;
  totalCustomers: number;
  newCustomers: number;
}

interface RecentActivity {
  id: string;
  type: "checkout" | "payment" | "product";
  title: string;
  description: string;
  time: string;
  status: "success" | "warning" | "error" | "info";
  image?: string;
}

interface Transaction {
  id: string;
  orderNumber: string;
  customerName: string | null;
  amount: number;
  status: string;
  items: any[];
  createdAt: string;
}

// Componente de Card de Métrica Modernizado
interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  iconColor: string;
  progressValue?: number;
  progressColor?: string;
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  iconColor,
  progressValue,
  progressColor,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group"
    >
      <Card className="relative overflow-hidden border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-500">
        {/* Fundo gradiente animado */}
        <div className={cn("absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500", color)} />

        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-3 rounded-2xl shadow-lg", iconColor)}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            {change !== undefined && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Badge
                  className={cn(
                    "flex items-center gap-1 border-0 shadow-sm",
                    change >= 0
                      ? "bg-gradient-to-r from-green-500 to-emerald-500"
                      : "bg-gradient-to-r from-red-500 to-rose-500"
                  )}
                >
                  {change >= 0 ? (
                    <HiOutlineTrendingUp className="h-3 w-3" />
                  ) : (
                    <HiOutlineXCircle className="h-3 w-3" />
                  )}
                  <span className="text-white font-semibold">
                    {Math.abs(change).toFixed(1)}%
                  </span>
                </Badge>
              </motion.div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <motion.p
              className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {value}
            </motion.p>
          </div>

          {progressValue !== undefined && (
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
              <motion.div
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full",
                  progressColor || "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progressValue, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function ReportsOverviewPage() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days">("7days");

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    averageOrderValue: 0,
    aovChange: 0,
    checkoutViews: 0,
    conversionRate: 0,
    abandonedCarts: 0,
    abandonmentRate: 0,
    recoveredCarts: 0,
    recoveryRate: 0,
    pendingPayments: 0,
    paidOrders: 0,
    failedPayments: 0,
    totalCustomers: 0,
    newCustomers: 0,
  });

  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [ordersChartData, setOrdersChartData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id, dateRange]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [orders, carts, customers] = await Promise.all([
        loadOrders(),
        loadAbandonedCarts(),
        loadCustomers(),
      ]);

      calculateMetrics(orders, carts, customers);
      generateChartData(orders);
      generateRecentActivity(orders);
      loadRecentTransactions(orders);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("Order")
      .select("*")
      .eq("userId", user!.id)
      .order("createdAt", { ascending: false })
      .limit(500);

    if (error) throw error;
    return data || [];
  };

  const loadAbandonedCarts = async () => {
    const { data, error } = await supabase
      .from("AbandonedCart")
      .select("*")
      .eq("userId", user!.id);

    if (error) return [];
    return data || [];
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from("Customer")
      .select("*")
      .eq("userId", user!.id);

    if (error) return [];
    return data || [];
  };

  const loadRecentTransactions = (orders: any[]) => {
    const recent = orders
      .filter((o) => o.items && o.items.length > 0)
      .slice(0, 5)
      .map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        amount: o.total,
        status: o.paymentStatus,
        items: o.items || [],
        createdAt: o.createdAt,
      }));

    setRecentTransactions(recent);
  };

  const calculateMetrics = (orders: any[], carts: any[], customers: any[]) => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const currentPeriodOrders = orders.filter(
      (o) => new Date(o.createdAt) >= startDate
    );
    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime())
    );
    const previousPeriodOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= previousStartDate &&
        new Date(o.createdAt) < startDate
    );

    const paidOrders = currentPeriodOrders.filter(
      (o) => o.paymentStatus === "PAID"
    );
    const previousPaid = previousPeriodOrders.filter(
      (o) => o.paymentStatus === "PAID"
    );

    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + (parseFloat(o.total) || 0),
      0
    );
    const previousRevenue = previousPaid.reduce(
      (sum, o) => sum + (parseFloat(o.total) || 0),
      0
    );
    const revenueChange =
      previousRevenue > 0
        ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    const totalOrders = paidOrders.length;
    const ordersChange =
      previousPaid.length > 0
        ? ((totalOrders - previousPaid.length) / previousPaid.length) * 100
        : 0;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const previousAOV =
      previousPaid.length > 0 ? previousRevenue / previousPaid.length : 0;
    const aovChange =
      previousAOV > 0
        ? ((averageOrderValue - previousAOV) / previousAOV) * 100
        : 0;

    const recentCarts = carts.filter(
      (c) => new Date(c.abandonedAt) >= startDate
    );
    const abandonedCarts = recentCarts.filter((c) => !c.recoveredAt).length;
    const recoveredCarts = recentCarts.filter((c) => c.recoveredAt).length;
    const totalCartsSession = currentPeriodOrders.length + abandonedCarts;
    const abandonmentRate =
      totalCartsSession > 0 ? (abandonedCarts / totalCartsSession) * 100 : 0;
    const recoveryRate =
      recentCarts.length > 0 ? (recoveredCarts / recentCarts.length) * 100 : 0;

    const checkoutViews = totalCartsSession;
    const conversionRate =
      checkoutViews > 0 ? (totalOrders / checkoutViews) * 100 : 0;

    const pendingPayments = currentPeriodOrders.filter(
      (o) => o.paymentStatus === "PENDING"
    ).length;
    const failedPayments = currentPeriodOrders.filter(
      (o) => o.paymentStatus === "FAILED"
    ).length;

    const newCustomers = customers.filter(
      (c) => new Date(c.createdAt) >= startDate
    ).length;

    setMetrics({
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      averageOrderValue,
      aovChange,
      checkoutViews,
      conversionRate,
      abandonedCarts,
      abandonmentRate,
      recoveredCarts,
      recoveryRate,
      pendingPayments,
      paidOrders: totalOrders,
      failedPayments,
      totalCustomers: customers.length,
      newCustomers,
    });
  };

  const generateChartData = (orders: any[]) => {
    const now = new Date();
    const days = dateRange === "today" ? 24 : dateRange === "7days" ? 7 : 30;
    const chartData: any[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      if (dateRange === "today") {
        date.setHours(now.getHours() - i, 0, 0, 0);
      } else {
        date.setHours(0, 0, 0, 0);
      }

      const nextDate = new Date(date);
      if (dateRange === "today") {
        nextDate.setHours(date.getHours() + 1);
      } else {
        nextDate.setDate(date.getDate() + 1);
      }

      const dayOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= date && orderDate < nextDate;
      });

      const paidOrders = dayOrders.filter((o) => o.paymentStatus === "PAID");
      const revenue = paidOrders.reduce(
        (sum, o) => sum + (parseFloat(o.total) || 0),
        0
      );

      chartData.push({
        date:
          dateRange === "today"
            ? date.getHours() + "h"
            : date.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              }),
        receita: revenue,
        pedidos: paidOrders.length,
        pendentes: dayOrders.filter((o) => o.paymentStatus === "PENDING").length,
        falhos: dayOrders.filter((o) => o.paymentStatus === "FAILED").length,
      });
    }

    setRevenueChartData(chartData);
    setOrdersChartData(chartData);
  };

  const generateRecentActivity = (orders: any[]) => {
    const activities: RecentActivity[] = [];

    orders.slice(0, 10).forEach((order) => {
      const productImage = order.items?.[0]?.image || null;
      const productName = order.items?.[0]?.name || "Produto";

      if (order.paymentStatus === "PAID") {
        activities.push({
          id: order.id,
          type: "payment",
          title: "Pagamento Confirmado",
          description: `${order.customerName || "Cliente"} - ${productName}`,
          time: formatRelativeTime(order.updatedAt || order.createdAt),
          status: "success",
          image: productImage,
        });
      } else if (order.paymentStatus === "PENDING") {
        activities.push({
          id: order.id,
          type: "checkout",
          title: "Aguardando Pagamento",
          description: `${order.customerName || "Cliente"} - ${productName}`,
          time: formatRelativeTime(order.createdAt),
          status: "warning",
          image: productImage,
        });
      } else if (order.paymentStatus === "FAILED") {
        activities.push({
          id: order.id,
          type: "payment",
          title: "Pagamento Falhou",
          description: `${order.customerName || "Cliente"} - ${productName}`,
          time: formatRelativeTime(order.updatedAt || order.createdAt),
          status: "error",
          image: productImage,
        });
      }
    });

    setRecentActivity(activities);
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: "Atualizado!",
      description: "Dados atualizados com sucesso.",
    });
  };

  if (loading && revenueChartData.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Modernizado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <HiOutlineLightningBolt className="h-8 w-8 text-blue-500" />
            </motion.div>
            <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            >
              <IoSparklesSharp className="h-6 w-6 text-pink-500" />
            </motion.div>
          </div>
          <p className="text-gray-600 font-medium">
            Visão geral das suas métricas de vendas e conversão
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[160px] border-gray-200 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7days">7 dias</SelectItem>
              <SelectItem value="30days">30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="icon"
            className="bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all duration-300"
          >
            <HiOutlineRefresh
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </motion.div>

      {/* Banner de Usuários Online - Super Modernizado */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.01 }}
      >
        <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-500">
          {/* Background animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Círculos flutuantes */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />

          <CardContent className="p-8 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  className="relative"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <div className="p-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg">
                    <HiOutlineChartBar className="h-10 w-10 text-white" />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-5 w-5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-2 border-white"></span>
                  </span>
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 flex items-center gap-2 mb-1">
                    <HiOutlineLightningBolt className="w-4 h-4 text-blue-500" />
                    Atividade em Tempo Real
                  </p>
                  <motion.p
                    className="text-5xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
                    key={metrics.pendingPayments}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {metrics.pendingPayments > 0 ? metrics.pendingPayments : "0"}
                  </motion.p>
                </div>
              </div>
              <div className="text-right space-y-2">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg px-4 py-2 text-sm">
                    <span className="inline-block w-2 h-2 rounded-full bg-white mr-2 animate-pulse"></span>
                    Ao Vivo
                  </Badge>
                </motion.div>
                <p className="text-sm font-semibold text-gray-700">
                  {metrics.pendingPayments} usuários no checkout
                </p>
                <p className="text-xs text-gray-500">
                  Taxa de conversão: {metrics.conversionRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Métricas Principais - Grid Modernizado */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics.totalRevenue)}
          change={metrics.revenueChange}
          icon={HiOutlineCurrencyDollar}
          color="bg-gradient-to-br from-green-400 to-emerald-500"
          iconColor="bg-gradient-to-br from-green-500 to-emerald-600"
          progressValue={Math.min((metrics.totalRevenue / 10000) * 100, 100)}
          progressColor="bg-gradient-to-r from-green-400 via-green-500 to-emerald-600"
        />
        <MetricCard
          title="Pedidos Pagos"
          value={metrics.paidOrders.toString()}
          change={metrics.ordersChange}
          icon={HiOutlineShoppingCart}
          color="bg-gradient-to-br from-blue-400 to-blue-600"
          iconColor="bg-gradient-to-br from-blue-500 to-blue-700"
          progressValue={Math.min((metrics.paidOrders / 50) * 100, 100)}
          progressColor="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={HiOutlineTrendingUp}
          color="bg-gradient-to-br from-purple-400 to-pink-500"
          iconColor="bg-gradient-to-br from-purple-500 to-pink-600"
          progressValue={metrics.conversionRate}
          progressColor="bg-gradient-to-r from-purple-400 via-purple-500 to-pink-600"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics.averageOrderValue)}
          change={metrics.aovChange}
          icon={HiOutlineCreditCard}
          color="bg-gradient-to-br from-orange-400 to-red-500"
          iconColor="bg-gradient-to-br from-orange-500 to-red-600"
          progressValue={Math.min((metrics.aver

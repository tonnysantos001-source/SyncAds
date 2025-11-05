import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Activity,
  CreditCard,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
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

export default function ReportsOverviewPage() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<"today" | "7days" | "30days">(
    "7days",
  );

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
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

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
      (o) => new Date(o.createdAt) >= startDate,
    );
    const previousStartDate = new Date(
      startDate.getTime() - (now.getTime() - startDate.getTime()),
    );
    const previousPeriodOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= previousStartDate &&
        new Date(o.createdAt) < startDate,
    );

    const paidOrders = currentPeriodOrders.filter(
      (o) => o.paymentStatus === "PAID",
    );
    const previousPaid = previousPeriodOrders.filter(
      (o) => o.paymentStatus === "PAID",
    );

    const totalRevenue = paidOrders.reduce(
      (sum, o) => sum + (parseFloat(o.total) || 0),
      0,
    );
    const previousRevenue = previousPaid.reduce(
      (sum, o) => sum + (parseFloat(o.total) || 0),
      0,
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
      (c) => new Date(c.abandonedAt) >= startDate,
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
      (o) => o.paymentStatus === "PENDING",
    ).length;
    const failedPayments = currentPeriodOrders.filter(
      (o) => o.paymentStatus === "FAILED",
    ).length;

    const newCustomers = customers.filter(
      (c) => new Date(c.createdAt) >= startDate,
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
        0,
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
        pendentes: dayOrders.filter((o) => o.paymentStatus === "PENDING")
          .length,
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
          title: "Checkout Iniciado",
          description: `${productName} - ${formatCurrency(order.total)}`,
          time: formatRelativeTime(order.createdAt),
          status: "info",
          image: productImage,
        });
      } else if (order.paymentStatus === "FAILED") {
        activities.push({
          id: order.id,
          type: "payment",
          title: "Pagamento Falhou",
          description: `${order.orderNumber} - ${productName}`,
          time: formatRelativeTime(order.updatedAt || order.createdAt),
          status: "error",
          image: productImage,
        });
      }
    });

    setRecentActivity(activities.slice(0, 5));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: "Dashboard atualizado!",
      description: "Dados carregados com sucesso",
    });
  };

  const formatCurrency = (value: number | string) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue || 0);
  };

  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return `${diffDays}d atrás`;
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    progressValue,
    progressColor,
  }: {
    title: string;
    value: string;
    change?: number;
    icon: any;
    color: string;
    progressValue?: number;
    progressColor?: string;
  }) => (
    <Card className="hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className={`rounded-xl p-2.5 ${color} shadow-sm`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold tracking-tight">{value}</div>

        {change !== undefined && (
          <div className="flex items-center text-sm">
            {change >= 0 ? (
              <div className="flex items-center gap-1 text-green-600 font-medium">
                <ArrowUpRight className="h-4 w-4" />
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600 font-medium">
                <ArrowDownRight className="h-4 w-4" />
                <span>{Math.abs(change).toFixed(1)}%</span>
              </div>
            )}
            <span className="text-gray-500 text-xs ml-2">
              vs. período anterior
            </span>
          </div>
        )}

        {/* Barra de Progresso Animada */}
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-1000 ease-out ${
              progressColor || "bg-gradient-to-r from-blue-500 to-blue-600"
            }`}
            style={{
              width: `${progressValue || 0}%`,
              animation: "shimmer 2s infinite",
            }}
          >
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              style={{
                animation: "slide 2s infinite",
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das suas métricas de vendas e conversão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
            <SelectTrigger className="w-[160px]">
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
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Usuários Online */}
      <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Activity className="h-8 w-8 text-purple-500" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Usuários Online Agora
                </p>
                <p className="text-3xl font-bold">
                  {metrics.pendingPayments > 0 ? metrics.pendingPayments : "0"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                Ao Vivo
              </Badge>
              <p className="text-sm text-muted-foreground mt-2">
                {metrics.pendingPayments} no checkout
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Receita Total"
          value={formatCurrency(metrics.totalRevenue)}
          change={metrics.revenueChange}
          icon={DollarSign}
          color="bg-gradient-to-br from-green-500 to-green-600"
          progressValue={Math.min((metrics.totalRevenue / 10000) * 100, 100)}
          progressColor="bg-gradient-to-r from-green-400 via-green-500 to-green-600"
        />
        <MetricCard
          title="Pedidos Pagos"
          value={metrics.paidOrders.toString()}
          change={metrics.ordersChange}
          icon={ShoppingCart}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          progressValue={Math.min((metrics.paidOrders / 50) * 100, 100)}
          progressColor="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600"
        />
        <MetricCard
          title="Taxa de Conversão"
          value={`${metrics.conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
          progressValue={metrics.conversionRate}
          progressColor="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600"
        />
        <MetricCard
          title="Ticket Médio"
          value={formatCurrency(metrics.averageOrderValue)}
          change={metrics.aovChange}
          icon={CreditCard}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
          progressValue={Math.min((metrics.averageOrderValue / 500) * 100, 100)}
          progressColor="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita ao Longo do Tempo</CardTitle>
            <CardDescription>
              Análise de faturamento por período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="receita"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Pedidos</CardTitle>
            <CardDescription>
              Distribuição por status de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis tick={{ fill: "#888", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="pedidos"
                  fill="#22c55e"
                  name="Pagos"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pendentes"
                  fill="#eab308"
                  name="Pendentes"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="falhos"
                  fill="#ef4444"
                  name="Falhos"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Status de Pagamentos */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-green-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="rounded-xl p-2 bg-gradient-to-br from-green-500 to-green-600 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                Pedidos Pagos
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-green-600 tracking-tight">
              {metrics.paidOrders}
            </div>

            {/* Barra de Progresso Animada */}
            <div className="relative h-2 bg-green-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 transition-all duration-1000 ease-out"
                style={{
                  width: `${(metrics.paidOrders / (metrics.paidOrders + metrics.pendingPayments + metrics.failedPayments || 1)) * 100}%`,
                  animation: "shimmer 2s infinite",
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: "slide 2s infinite",
                  }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              {formatCurrency(metrics.totalRevenue)} em receita
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-yellow-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="rounded-xl p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-sm">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                Pagamentos Pendentes
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-yellow-600 tracking-tight">
              {metrics.pendingPayments}
            </div>

            {/* Barra de Progresso Animada */}
            <div className="relative h-2 bg-yellow-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 transition-all duration-1000 ease-out"
                style={{
                  width: `${(metrics.pendingPayments / (metrics.paidOrders + metrics.pendingPayments + metrics.failedPayments || 1)) * 100}%`,
                  animation: "shimmer 2s infinite",
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: "slide 2s infinite",
                  }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 font-medium">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-red-50 to-white hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="rounded-xl p-2 bg-gradient-to-br from-red-500 to-red-600 shadow-sm">
                  <XCircle className="h-4 w-4 text-white" />
                </div>
                Pagamentos Falhados
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-red-600 tracking-tight">
              {metrics.failedPayments}
            </div>

            {/* Barra de Progresso Animada */}
            <div className="relative h-2 bg-red-100 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-red-400 via-red-500 to-red-600 transition-all duration-1000 ease-out"
                style={{
                  width: `${(metrics.failedPayments / (metrics.paidOrders + metrics.pendingPayments + metrics.failedPayments || 1)) * 100}%`,
                  animation: "shimmer 2s infinite",
                }}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  style={{
                    animation: "slide 2s infinite",
                  }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 font-medium">Requer atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente e Transações */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade em Tempo Real</CardTitle>
            <CardDescription>Últimas ações no checkout</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                  >
                    {activity.image ? (
                      <img
                        src={activity.image}
                        alt={activity.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div
                        className={`rounded-full p-2 ${
                          activity.status === "success"
                            ? "bg-green-500/10 text-green-500"
                            : activity.status === "error"
                              ? "bg-red-500/10 text-red-500"
                              : activity.status === "warning"
                                ? "bg-yellow-500/10 text-yellow-500"
                                : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {activity.status === "success" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : activity.status === "error" ? (
                          <XCircle className="h-5 w-5" />
                        ) : activity.status === "warning" ? (
                          <AlertCircle className="h-5 w-5" />
                        ) : (
                          <Clock className="h-5 w-5" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
            <CardDescription>Pedidos mais recentes</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma transação recente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const productImage = transaction.items?.[0]?.image;
                  const productName = transaction.items?.[0]?.name || "Produto";

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                    >
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.customerName || "Cliente"} •{" "}
                          {transaction.orderNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant={
                            transaction.status === "PAID"
                              ? "default"
                              : transaction.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {transaction.status === "PAID"
                            ? "Pago"
                            : transaction.status === "PENDING"
                              ? "Pendente"
                              : "Falhou"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Carrinhos e Clientes */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Carrinhos Abandonados</CardTitle>
            <CardDescription>Oportunidades de recuperação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Abandonados
                </p>
                <p className="text-3xl font-bold">{metrics.abandonedCarts}</p>
              </div>
              <Badge variant="destructive" className="text-lg px-3 py-1">
                {metrics.abandonmentRate.toFixed(1)}%
              </Badge>
            </div>
            <Progress value={metrics.abandonmentRate} className="h-2" />
            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm text-muted-foreground">Recuperados</p>
                <p className="text-xl font-bold text-green-500">
                  {metrics.recoveredCarts}
                </p>
              </div>
              <Badge variant="outline" className="text-green-500">
                {metrics.recoveryRate.toFixed(1)}% recuperação
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>Base de clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-bold">{metrics.totalCustomers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Novos Clientes</p>
                <p className="text-xl font-bold text-blue-500">
                  {metrics.newCustomers}
                </p>
              </div>
              <Badge variant="outline" className="text-blue-500">
                Este período
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

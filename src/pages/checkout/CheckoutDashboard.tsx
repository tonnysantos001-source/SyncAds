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
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { shopifySyncApi } from "@/lib/api/shopifySync";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardMetrics {
  // Vendas
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;

  // Conversão
  checkoutViews: number;
  conversionRate: number;
  conversionChange: number;

  // Carrinhos
  abandonedCarts: number;
  abandonmentRate: number;
  recoveredCarts: number;
  recoveryRate: number;

  // Pagamentos
  pendingPayments: number;
  paidOrders: number;
  failedPayments: number;

  // Clientes
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
}

interface RecentActivity {
  id: string;
  type: "checkout" | "payment" | "product" | "cart";
  title: string;
  description: string;
  time: string;
  status: "success" | "warning" | "error" | "info";
}

interface Transaction {
  id: string;
  orderNumber: string;
  customerName: string | null;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function CheckoutDashboard() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    averageOrderValue: 0,
    aovChange: 0,
    checkoutViews: 0,
    conversionRate: 0,
    conversionChange: 0,
    abandonedCarts: 0,
    abandonmentRate: 0,
    recoveredCarts: 0,
    recoveryRate: 0,
    pendingPayments: 0,
    paidOrders: 0,
    failedPayments: 0,
    totalCustomers: 0,
    newCustomers: 0,
    returningCustomers: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );

  useEffect(() => {
    loadDashboardData();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Carregar dados em paralelo
      const [orders, carts, customers, transactions] = await Promise.all([
        loadOrders(),
        loadAbandonedCarts(),
        loadCustomers(),
        loadTransactions(),
      ]);

      // Calcular métricas
      calculateMetrics(orders, carts, customers);
      generateRecentActivity(orders, transactions);
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

    if (error) throw error;
    return data || [];
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from("Customer")
      .select("*")
      .eq("userId", user!.id);

    if (error) throw error;
    return data || [];
  };

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from("Transaction")
      .select(
        `
        id,
        amount,
        status,
        paymentMethod,
        createdAt,
        Order (
          orderNumber,
          customerName
        )
      `,
      )
      .eq("userId", user!.id)
      .order("createdAt", { ascending: false })
      .limit(10);

    if (error) throw error;

    const transactions: Transaction[] = (data || []).map((t: any) => ({
      id: t.id,
      orderNumber: t.Order?.orderNumber || "N/A",
      customerName: t.Order?.customerName || null,
      amount: t.amount,
      status: t.status,
      paymentMethod: t.paymentMethod,
      createdAt: t.createdAt,
    }));

    setRecentTransactions(transactions);
    return transactions;
  };

  const calculateMetrics = (orders: any[], carts: any[], customers: any[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Pedidos deste mês
    const thisMonthOrders = orders.filter(
      (o) => new Date(o.createdAt) >= thisMonth,
    );
    const lastMonthOrders = orders.filter(
      (o) =>
        new Date(o.createdAt) >= lastMonth &&
        new Date(o.createdAt) < thisMonth,
    );

    // Pedidos pagos
    const paidOrders = thisMonthOrders.filter((o) => o.paymentStatus === "PAID");
    const lastMonthPaid = lastMonthOrders.filter(
      (o) => o.paymentStatus === "PAID",
    );

    // Receita
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
    const lastMonthRevenue = lastMonthPaid.reduce((sum, o) => sum + o.total, 0);
    const revenueChange =
      lastMonthRevenue > 0
        ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Pedidos
    const totalOrders = paidOrders.length;
    const ordersChange =
      lastMonthPaid.length > 0
        ? ((totalOrders - lastMonthPaid.length) / lastMonthPaid.length) * 100
        : 0;

    // Ticket médio
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lastMonthAOV =
      lastMonthPaid.length > 0
        ? lastMonthRevenue / lastMonthPaid.length
        : 0;
    const aovChange =
      lastMonthAOV > 0
        ? ((averageOrderValue - lastMonthAOV) / lastMonthAOV) * 100
        : 0;

    // Carrinhos abandonados
    const recentCarts = carts.filter(
      (c) => new Date(c.abandonedAt) >= thisMonth,
    );
    const abandonedCarts = recentCarts.filter((c) => !c.recoveredAt).length;
    const recoveredCarts = recentCarts.filter((c) => c.recoveredAt).length;
    const totalCartsSession = thisMonthOrders.length + abandonedCarts;
    const abandonmentRate =
      totalCartsSession > 0 ? (abandonedCarts / totalCartsSession) * 100 : 0;
    const recoveryRate =
      recentCarts.length > 0 ? (recoveredCarts / recentCarts.length) * 100 : 0;

    // Conversão
    const checkoutViews = totalCartsSession;
    const conversionRate =
      checkoutViews > 0 ? (totalOrders / checkoutViews) * 100 : 0;

    // Status de pagamento
    const pendingPayments = thisMonthOrders.filter(
      (o) => o.paymentStatus === "PENDING",
    ).length;
    const failedPayments = thisMonthOrders.filter(
      (o) => o.paymentStatus === "FAILED",
    ).length;

    // Clientes
    const newCustomers = customers.filter(
      (c) => new Date(c.createdAt) >= thisMonth,
    ).length;
    const returningCustomers = customers.filter(
      (c) => c.totalOrders > 1,
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
      conversionChange: 0,
      abandonedCarts,
      abandonmentRate,
      recoveredCarts,
      recoveryRate,
      pendingPayments,
      paidOrders: totalOrders,
      failedPayments,
      totalCustomers: customers.length,
      newCustomers,
      returningCustomers,
    });
  };

  const generateRecentActivity = (orders: any[], transactions: any[]) => {
    const activities: RecentActivity[] = [];

    // Últimos pedidos pagos
    orders
      .filter((o) => o.paymentStatus === "PAID")
      .slice(0, 3)
      .forEach((order) => {
        activities.push({
          id: order.id,
          type: "payment",
          title: "Pagamento Confirmado",
          description: `${order.orderNumber} - ${formatCurrency(order.total)}`,
          time: formatRelativeTime(order.updatedAt),
          status: "success",
        });
      });

    // Checkouts iniciados (pedidos pendentes recentes)
    orders
      .filter((o) => o.paymentStatus === "PENDING")
      .slice(0, 2)
      .forEach((order) => {
        activities.push({
          id: order.id,
          type: "checkout",
          title: "Checkout Iniciado",
          description: `${order.customerEmail || "Cliente"} - ${order.orderNumber}`,
          time: formatRelativeTime(order.createdAt),
          status: "info",
        });
      });

    // Falhas de pagamento
    orders
      .filter((o) => o.paymentStatus === "FAILED")
      .slice(0, 2)
      .forEach((order) => {
        activities.push({
          id: order.id,
          type: "payment",
          title: "Pagamento Falhou",
          description: `${order.orderNumber} - Requer atenção`,
          time: formatRelativeTime(order.updatedAt),
          status: "error",
        });
      });

    // Ordenar por tempo
    activities.sort(
      (a, b) =>
        new Date(b.time).getTime() - new Date(a.time).getTime(),
    );

    setRecentActivity(activities.slice(0, 5));
  };

  const handleSync = async () => {
    if (!user?.id || !user?.organizationId) return;

    try {
      setSyncing(true);
      const result = await shopifySyncApi.syncAll(user.id, user.organizationId);

      if (result.success) {
        toast({
          title: "Sincronização concluída!",
          description: `${result.products.synced} produtos e ${result.orders.synced} pedidos sincronizados`,
        });
        loadDashboardData();
      }
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
  }: {
    title: string;
    value: string;
    change?: number;
    icon: any;
    color: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`rounded-full p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {change >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-1">vs. mês anterior</span>
          </p>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard do Checkout
            </h1>
            <p className="text-muted-foreground">
              Visão geral das suas métricas de vendas e conversão
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing} variant="outline">
            <RefreshCw
              className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
            />
            Sincronizar
          </Button>
        </div>

        {/* Indicador de usuários online */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Activity className="h-6 w-6 text-purple-500" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium">Usuários Online Agora</p>
                  <p className="text-2xl font-bold">
                    {metrics.checkoutViews > 0 ? "3" : "0"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  2 no checkout • 1 vendo produtos
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receita Total"
            value={formatCurrency(metrics.totalRevenue)}
            change={metrics.revenueChange}
            icon={DollarSign}
            color="bg-green-500/10 text-green-500"
          />
          <MetricCard
            title="Pedidos"
            value={metrics.totalOrders.toString()}
            change={metrics.ordersChange}
            icon={ShoppingCart}
            color="bg-blue-500/10 text-blue-500"
          />
          <MetricCard
            title="Taxa de Conversão"
            value={`${metrics.conversionRate.toFixed(1)}%`}
            icon={TrendingUp}
            color="bg-purple-500/10 text-purple-500"
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(metrics.averageOrderValue)}
            change={metrics.aovChange}
            icon={CreditCard}
            color="bg-orange-500/10 text-orange-500"
          />
        </div>

        {/* Status de Pagamentos e Carrinhos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Pedidos Pagos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.paidOrders}</div>
              <Progress
                value={
                  (metrics.paidOrders /
                    (metrics.paidOrders +
                      metrics.pendingPayments +
                      metrics.failedPayments || 1)) *
                  100
                }
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.pendingPayments}</div>
              <Progress
                value={
                  (metrics.pendingPayments /
                    (metrics.paidOrders +
                      metrics.pendingPayments +
                      metrics.failedPayments || 1)) *
                  100
                }
                className="mt-2"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Pagamentos Falhados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics.failedPayments}</div>
              <Progress
                value={
                  (metrics.failedPayments /
                    (metrics.paidOrders +
                      metrics.pendingPayments +
                      metrics.failedPayments || 1)) *
                  100
                }
                className="mt-2"
              />
            </CardContent>
          </Card>
        </div>

        {/* Carrinhos Abandonados */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Carrinhos Abandonados</CardTitle>
              <CardDescription>
                Oportunidades de recuperação de vendas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Abandonados</p>
                  <p className="text-2xl font-bold">{metrics.abandonedCarts}</p>
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
              <CardDescription>Estatísticas de clientes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{metrics.totalCustomers}</p>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Novos</p>
                  <p className="text-xl font-bold text-blue-500">
                    {metrics.newCustomers}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recorrentes</p>
                  <p className="text-xl font-bold text-purple-500">
                    {metrics.returningCustomers}
                  </p>
                </div>
              </div>
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
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma atividade recente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
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
                          <CheckCircle2 className="h-4 w-4" />
                        ) : activity.status === "error" ? (
                          <XCircle className="h-4 w-4" />
                        ) : activity.status === "warning" ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
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
              <CardTitle>Transações Recentes</CardTitle>
              <CardDescription>Últimos pagamentos processados</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transação recente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {transaction.orderNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.customerName || "Cliente"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <Badge
                          variant={
                            transaction.status === "COMPLETED"
                              ? "default"
                              : transaction.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


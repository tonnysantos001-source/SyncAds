import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  Truck,
  CreditCard,
  User,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { shopifySyncApi } from "@/lib/api/shopifySync";
import { Skeleton } from "@/components/ui/skeleton";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  items: any[];
  createdAt: string;
  updatedAt: string;
  paymentMethod: string;
  metadata?: {
    shopifyOrderId?: string;
    shopifyOrderNumber?: number;
  };
}

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; variant: string; icon: any }
> = {
  PENDING: { label: "Pendente", variant: "warning", icon: Clock },
  PAID: { label: "Pago", variant: "success", icon: CheckCircle },
  FAILED: { label: "Falhou", variant: "destructive", icon: XCircle },
  REFUNDED: { label: "Reembolsado", variant: "secondary", icon: TrendingUp },
};

const orderStatusConfig: Record<
  OrderStatus,
  { label: string; variant: string; icon: any }
> = {
  PENDING: { label: "Pendente", variant: "warning", icon: Clock },
  PROCESSING: { label: "Processando", variant: "default", icon: Package },
  SHIPPED: { label: "Enviado", variant: "default", icon: Truck },
  DELIVERED: { label: "Entregue", variant: "success", icon: CheckCircle },
  CANCELLED: { label: "Cancelado", variant: "destructive", icon: XCircle },
};

export default function AllOrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const [syncStats, setSyncStats] = useState({
    totalOrders: 0,
    lastSync: null as string | null,
  });

  // Estatísticas
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.paymentStatus === "PENDING").length,
    paid: orders.filter((o) => o.paymentStatus === "PAID").length,
    failed: orders.filter((o) => o.paymentStatus === "FAILED").length,
    revenue: orders
      .filter((o) => o.paymentStatus === "PAID")
      .reduce((sum, o) => sum + o.total, 0),
  };

  useEffect(() => {
    loadOrders();
    loadSyncStats();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);

      if (!user?.id) return;

      // Buscar pedidos do Supabase
      const { data, error } = await supabase
        .from("Order")
        .select(
          `
          id,
          orderNumber,
          status,
          paymentStatus,
          total,
          subtotal,
          tax,
          discount,
          items,
          paymentMethod,
          createdAt,
          updatedAt,
          customerName,
          customerEmail,
          metadata
        `,
        )
        .eq("userId", user.id)
        .order("createdAt", { ascending: false })
        .limit(500);

      if (error) throw error;

      setOrders((data || []) as Order[]);
    } catch (error: any) {
      console.error("Erro ao carregar pedidos:", error);
      toast({
        title: "Erro ao carregar pedidos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSyncStats = async () => {
    if (!user?.id) return;
    try {
      const stats = await shopifySyncApi.getSyncStats(user.id);
      setSyncStats({
        totalOrders: stats.totalOrders,
        lastSync: stats.lastSync,
      });
    } catch (error) {
      console.error("Error loading sync stats:", error);
    }
  };

  const handleSyncShopify = async () => {
    if (!user?.id || !user?.organizationId) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      setSyncing(true);

      toast({
        title: "Sincronizando...",
        description: "Buscando pedidos da Shopify",
      });

      const result = await shopifySyncApi.syncOrders(
        user.id,
        user.organizationId,
      );

      if (result.success) {
        toast({
          title: "Sincronização concluída!",
          description: result.message,
        });

        // Recarregar pedidos
        await loadOrders();
        await loadSyncStats();
      } else {
        toast({
          title: "Erro na sincronização",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPaymentStatus =
      paymentStatusFilter === "all" ||
      order.paymentStatus === paymentStatusFilter;

    const matchesOrderStatus =
      orderStatusFilter === "all" || order.status === orderStatusFilter;

    const matchesDate = () => {
      if (dateFilter === "all") return true;
      const orderDate = new Date(order.createdAt);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          return orderDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    };

    return (
      matchesSearch &&
      matchesPaymentStatus &&
      matchesOrderStatus &&
      matchesDate()
    );
  });

  const exportToCSV = () => {
    const headers = [
      "Número",
      "Cliente",
      "Email",
      "Status Pagamento",
      "Status Pedido",
      "Total",
      "Data",
    ];
    const csvData = filteredOrders.map((order) => [
      order.orderNumber,
      order.customerName || "N/A",
      order.customerEmail,
      paymentStatusConfig[order.paymentStatus].label,
      orderStatusConfig[order.status].label,
      `R$ ${order.total.toFixed(2)}`,
      new Date(order.createdAt).toLocaleDateString("pt-BR"),
    ]);

    const csv = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todos os pedidos da sua loja
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSyncShopify}
              variant="outline"
              disabled={syncing}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
              />
              {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
            </Button>
            <Button onClick={exportToCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Sync Stats Alert */}
        {syncStats.lastSync && (
          <Alert>
            <ShoppingBag className="h-4 w-4" />
            <AlertTitle>Integração Shopify Ativa</AlertTitle>
            <AlertDescription>
              Última sincronização:{" "}
              {new Date(syncStats.lastSync).toLocaleString("pt-BR")} •{" "}
              {syncStats.totalOrders} pedidos importados
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pedidos
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Todos os pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.paid}</div>
              <p className="text-xs text-muted-foreground">
                Pagamentos confirmados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falhados</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failed}</div>
              <p className="text-xs text-muted-foreground">
                Pagamentos cancelados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.revenue)}
              </div>
              <p className="text-xs text-muted-foreground">Pedidos pagos</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Busque e filtre os pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por número, cliente ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select
                value={paymentStatusFilter}
                onValueChange={setPaymentStatusFilter}
              >
                <SelectTrigger>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Pagamentos</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Pago</SelectItem>
                  <SelectItem value="FAILED">Falhou</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={orderStatusFilter}
                onValueChange={setOrderStatusFilter}
              >
                <SelectTrigger>
                  <Package className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status Pedido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PROCESSING">Processando</SelectItem>
                  <SelectItem value="SHIPPED">Enviado</SelectItem>
                  <SelectItem value="DELIVERED">Entregue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo o período</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pedidos ({filteredOrders.length})</CardTitle>
            <CardDescription>
              {filteredOrders.length === orders.length
                ? "Mostrando todos os pedidos"
                : `Mostrando ${filteredOrders.length} de ${orders.length} pedidos`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm ||
                  paymentStatusFilter !== "all" ||
                  orderStatusFilter !== "all" ||
                  dateFilter !== "all"
                    ? "Nenhum pedido encontrado com os filtros aplicados"
                    : "Nenhum pedido encontrado"}
                </p>
                {!searchTerm &&
                  paymentStatusFilter === "all" &&
                  orderStatusFilter === "all" &&
                  dateFilter === "all" && (
                    <Button
                      onClick={handleSyncShopify}
                      variant="outline"
                      disabled={syncing}
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`}
                      />
                      Sincronizar Pedidos da Shopify
                    </Button>
                  )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const PaymentIcon =
                    paymentStatusConfig[order.paymentStatus].icon;
                  const StatusIcon = orderStatusConfig[order.status].icon;
                  const firstProduct =
                    order.items && order.items.length > 0
                      ? order.items[0]
                      : null;
                  const remainingProducts = (order.items?.length || 0) - 1;

                  return (
                    <Card
                      key={order.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex gap-6">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            {firstProduct?.image ? (
                              <img
                                src={firstProduct.image}
                                alt={firstProduct.name || "Produto"}
                                className="w-24 h-24 object-cover rounded-lg border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = "none";
                                  if (target.nextElementSibling) {
                                    (
                                      target.nextElementSibling as HTMLElement
                                    ).style.display = "flex";
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center border">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            {remainingProducts > 0 && (
                              <Badge
                                variant="secondary"
                                className="mt-2 text-xs w-full justify-center"
                              >
                                +{remainingProducts} produto
                                {remainingProducts > 1 ? "s" : ""}
                              </Badge>
                            )}
                          </div>

                          {/* Order Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">
                                  {firstProduct?.name || "Produto sem nome"}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant={
                                      paymentStatusConfig[order.paymentStatus]
                                        .variant as any
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    <PaymentIcon className="h-3 w-3" />
                                    {
                                      paymentStatusConfig[order.paymentStatus]
                                        .label
                                    }
                                  </Badge>
                                  <Badge
                                    variant={
                                      orderStatusConfig[order.status]
                                        .variant as any
                                    }
                                    className="flex items-center gap-1"
                                  >
                                    <StatusIcon className="h-3 w-3" />
                                    {orderStatusConfig[order.status].label}
                                  </Badge>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-2xl font-bold text-primary">
                                  {formatCurrency(order.total)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {order.items?.length || 0} item
                                  {(order.items?.length || 0) > 1 ? "s" : ""}
                                </div>
                              </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {order.customerName || "Cliente Anônimo"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground truncate">
                                  {order.customerEmail}
                                </span>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t">
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {new Date(order.createdAt).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {new Date(order.createdAt).toLocaleTimeString(
                                    "pt-BR",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    },
                                  )}
                                </div>
                                {order.metadata?.shopifyOrderId && (
                                  <Badge variant="outline" className="text-xs">
                                    <ShoppingBag className="h-3 w-3 mr-1" />
                                    Shopify #{order.metadata.shopifyOrderNumber}
                                  </Badge>
                                )}
                              </div>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/orders/${order.id}`)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


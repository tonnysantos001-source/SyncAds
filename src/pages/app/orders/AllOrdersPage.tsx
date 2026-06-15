import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Search,
  Eye,
  DollarSign,
  Package,
  PackageX,
  RefreshCw,
  Mail,
  User,
  Calendar,
  ShoppingBag,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ordersApi, Order } from "@/lib/api/ordersApi";
import { shopifySync } from "@/lib/api/shopifySync";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDebounce } from "@/hooks/useDebounce";

interface OrderItemData {
  productId?: string;
  variantId?: string;
  name?: string;
  price?: number;
  quantity?: number;
  image?: string;
  sku?: string;
  total?: number;
}

const AllOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 50;

  // Debounce para busca
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadOrders();
  }, [currentPage, debouncedSearchTerm, statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [debouncedSearchTerm, statusFilter, orders]);

  const loadOrders = async () => {
    try {
      if (!user?.id) return;

      const mainOrders = await ordersApi.getAll(user.id);

      const { data: shopifyOrders } = await supabase
        .from("ShopifyOrder")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      const convertedShopifyOrders: Order[] = (shopifyOrders || []).map(
        (so: any) => ({
          id: so.id.toString(),
          userId: so.userId,
          orderNumber: so.orderNumber?.toString() || so.id.toString(),
          customerId: so.customerData?.id || "shopify-customer",
          cartId: undefined,
          customerEmail: so.email || "",
          customerName:
            so.name ||
            so.customerData?.first_name + " " + so.customerData?.last_name ||
            "Cliente",
          customerPhone: so.phone,
          shippingAddress: so.shippingAddress || {},
          billingAddress: so.billingAddress || {},
          items: so.lineItems || {},
          subtotal: parseFloat(so.subtotalPrice || 0),
          discount: 0,
          shipping: 0,
          tax: parseFloat(so.totalTax || 0),
          total: parseFloat(so.totalPrice || 0),
          currency: so.currency || "BRL",
          paymentMethod: "CREDIT_CARD" as any,
          paymentStatus:
            so.financialStatus === "paid"
              ? "PAID"
              : so.financialStatus === "pending"
                ? "PENDING"
                : ("FAILED" as any),
          fulfillmentStatus:
            so.fulfillmentStatus === "fulfilled"
              ? "DELIVERED"
              : ("PENDING" as any),
          createdAt: so.createdAt,
          updatedAt: so.updatedAt,
        }),
      );

      const allOrders = [...mainOrders, ...convertedShopifyOrders];
      const uniqueOrders = allOrders.filter(
        (order, index, self) =>
          index === self.findIndex((o) => o.orderNumber === order.orderNumber),
      );

      setOrders(uniqueOrders);
      setFilteredOrders(uniqueOrders);
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

  const handleSyncShopify = async () => {
    try {
      setSyncing(true);
      toast({ title: "Sincronizando com Shopify..." });

      if (!user?.id) return;

      await shopifySync.syncOrders(user.id);

      toast({ title: "✅ Pedidos sincronizados com sucesso!" });
      await loadOrders();
    } catch (error: any) {
      console.error("Erro ao sincronizar:", error);
      toast({
        title: "Erro ao sincronizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          (order.id && order.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (order) => order.paymentStatus === statusFilter,
      );
    }

    setFilteredOrders(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: Order["paymentStatus"]) => {
    const statusMap = {
      PENDING: {
        label: "Pendente",
        variant: "secondary" as const,
        color: "bg-yellow-100 text-yellow-800 border border-yellow-250/20 dark:bg-yellow-950/45 dark:text-yellow-400 dark:border-yellow-900/50",
      },
      PROCESSING: {
        label: "Processando",
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800 border border-blue-250/20 dark:bg-blue-950/45 dark:text-blue-400 dark:border-blue-900/50",
      },
      PAID: {
        label: "Pago",
        variant: "default" as const,
        color: "bg-green-100 text-green-800 border border-green-250/20 dark:bg-green-950/45 dark:text-green-400 dark:border-green-900/50",
      },
      FAILED: {
        label: "Falhou",
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800 border border-red-250/20 dark:bg-red-950/45 dark:text-red-400 dark:border-red-900/50",
      },
      REFUNDED: {
        label: "Reembolsado",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/45 dark:text-gray-400 dark:border-gray-800/50",
      },
      CANCELLED: {
        label: "Cancelado",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-900/45 dark:text-gray-400 dark:border-gray-800/50",
      },
    };
    return (
      statusMap[status] || {
        label: status || "Pendente",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800 dark:bg-gray-950/45 dark:text-gray-400",
      }
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      CREDIT_CARD: "💳 Cartão de Crédito",
      DEBIT_CARD: "💳 Cartão de Débito",
      PIX: "⚡ PIX",
      BOLETO: "📄 Boleto Bancário",
      PAYPAL: "🅿️ PayPal",
      WALLET: "👛 Carteira Digital",
    };
    return methodMap[method] || method || "Não especificado";
  };

  const getOrderItems = (order: Order): OrderItemData[] => {
    if (!order.items) return [];

    if (Array.isArray(order.items)) {
      return order.items;
    }

    if (typeof order.items === "object" && !Array.isArray(order.items)) {
      const itemsObj = order.items as any;
      if (Array.isArray(itemsObj.items)) {
        return itemsObj.items;
      }
      return [itemsObj];
    }

    return [];
  };

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter(
    (o) => o.paymentStatus === "PENDING",
  ).length;
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Pedidos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Visualize e gerencie todos os pedidos da sua loja
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total de Pedidos
              </CardTitle>
              <div className="p-2 rounded-lg bg-blue-500 bg-opacity-10">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {orders.length}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Todos os pedidos
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pedidos Pagos
              </CardTitle>
              <div className="p-2 rounded-lg bg-green-500 bg-opacity-10">
                <Package className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent">
                {paidOrders}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pagamentos confirmados
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pedidos Pendentes
              </CardTitle>
              <div className="p-2 rounded-lg bg-yellow-500 bg-opacity-10">
                <PackageX className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-yellow-600 to-yellow-400 bg-clip-text text-transparent">
                {pendingOrders}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Aguardando pagamento
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-10 rounded-full blur-3xl" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Receita Total
              </CardTitle>
              <div className="p-2 rounded-lg bg-purple-500 bg-opacity-10">
                <DollarSign className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold bg-gradient-to-br from-purple-600 to-pink-500 bg-clip-text text-transparent">
                {formatCurrency(totalRevenue)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pedidos pagos
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex flex-col sm:flex-row items-center gap-4"
      >
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px] border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="PENDING">Pendente</SelectItem>
            <SelectItem value="PROCESSING">Processando</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="FAILED">Falhou</SelectItem>
            <SelectItem value="REFUNDED">Reembolsado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={handleSyncShopify}
          disabled={syncing}
          variant="outline"
          className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
        </Button>
      </motion.div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2 dark:text-white">
                Nenhum pedido encontrado
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Os pedidos aparecerão aqui assim que forem criados"}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order, index) => {
            const statusInfo = getStatusBadge(order.paymentStatus);
            const items = getOrderItems(order);

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.005 }}
              >
                <Card className="relative overflow-hidden border border-gray-100 dark:border-gray-800/80 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 group">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                  <CardContent className="relative p-6">
                    <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
                      {/* Informações principais */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="font-mono text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            #{order.orderNumber}
                          </div>
                          <Badge className={`${statusInfo.color} font-medium border text-xs`}>
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300">
                            {getPaymentMethodLabel(order.paymentMethod)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                              {order.customerName || "Cliente"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{order.customerEmail || "Não informado"}</span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span>
                              {format(
                                new Date(order.createdAt),
                                "dd/MM/yyyy 'às' HH:mm",
                                {
                                  locale: ptBR,
                                },
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Listagem de produtos no card */}
                        {items && items.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/60 space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                              Produtos Comprados
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 bg-gray-50/50 dark:bg-gray-800/30 p-2 rounded-xl border border-gray-100/50 dark:border-gray-800/30">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name || "Produto"}
                                      className="w-10 h-10 object-cover rounded-lg border border-gray-100 dark:border-gray-700 flex-shrink-0"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                          "https://via.placeholder.com/100?text=Produto";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-750 flex-shrink-0">
                                      <ShoppingBag className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                                      {item.name || "Produto sem nome"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Qtd: {item.quantity} × {formatCurrency(item.price || 0)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Valor e Ação */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 lg:min-w-[180px] pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-800/60 lg:pl-6">
                        <div className="text-left lg:text-right">
                          <div className="text-xs text-muted-foreground">
                            Valor do Pedido
                          </div>
                          <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatCurrency(order.total)}
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg px-4"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="w-[95vw] sm:max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl max-h-[90vh] flex flex-col bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-0 shadow-2xl p-0 overflow-hidden">
                            <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Pedido #{selectedOrder?.orderNumber || order.orderNumber}
                              </DialogTitle>
                              <DialogDescription className="text-sm font-medium">
                                Informações e status do pedido
                              </DialogDescription>
                            </DialogHeader>

                            {selectedOrder && (
                              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Coluna 1: Comprador & Entrega */}
                                  <div className="space-y-6">
                                    {/* Informações do Cliente */}
                                    <div className="bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-850 dark:to-gray-800/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-4">
                                      <h4 className="font-bold text-base text-gray-850 dark:text-gray-200">
                                        Dados do Comprador
                                      </h4>
                                      <div className="space-y-3.5">
                                        <div className="flex items-center gap-2.5">
                                          <User className="h-4.5 w-4.5 text-blue-500 flex-shrink-0" />
                                          <div className="min-w-0">
                                            <div className="text-[10px] text-muted-foreground">Nome</div>
                                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate" title={selectedOrder.customerName || "Cliente"}>
                                              {selectedOrder.customerName || "Cliente"}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2.5">
                                          <Mail className="h-4.5 w-4.5 text-purple-500 flex-shrink-0" />
                                          <div className="min-w-0">
                                            <div className="text-[10px] text-muted-foreground">Email</div>
                                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate" title={selectedOrder.customerEmail || "Não informado"}>
                                              {selectedOrder.customerEmail || "Não informado"}
                                            </div>
                                          </div>
                                        </div>
                                        {selectedOrder.customerPhone && (
                                          <div className="flex items-center gap-2.5">
                                            <Phone className="h-4.5 w-4.5 text-green-500 flex-shrink-0" />
                                            <div>
                                              <div className="text-[10px] text-muted-foreground">Telefone</div>
                                              <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                {selectedOrder.customerPhone}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        {selectedOrder.customerCpf && (
                                          <div className="flex items-center gap-2.5">
                                            <Package className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                                            <div>
                                              <div className="text-[10px] text-muted-foreground">CPF</div>
                                              <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                                {selectedOrder.customerCpf}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2.5">
                                          <Calendar className="h-4.5 w-4.5 text-pink-500 flex-shrink-0" />
                                          <div>
                                            <div className="text-[10px] text-muted-foreground">Data do Pedido</div>
                                            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                              {format(
                                                new Date(selectedOrder.createdAt),
                                                "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                                                { locale: ptBR }
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Endereço de Entrega */}
                                    {selectedOrder.shippingAddress && selectedOrder.shippingAddress.street && (
                                      <div className="bg-gradient-to-br from-gray-50 to-pink-50/30 dark:from-gray-850 dark:to-gray-800/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-3">
                                        <h4 className="font-bold text-base text-gray-850 dark:text-gray-200">
                                          Endereço de Entrega
                                        </h4>
                                        <div className="flex gap-2.5">
                                          <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                          <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                            <p className="font-bold text-gray-800 dark:text-gray-200">
                                              {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.number}
                                            </p>
                                            {selectedOrder.shippingAddress.complement && (
                                              <p className="text-xs text-muted-foreground">
                                                {selectedOrder.shippingAddress.complement}
                                              </p>
                                            )}
                                            <p>
                                              {selectedOrder.shippingAddress.neighborhood}
                                            </p>
                                            <p>
                                              {selectedOrder.shippingAddress.city} - {selectedOrder.shippingAddress.state}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              CEP: {selectedOrder.shippingAddress.zipCode}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Coluna 2: Itens do Pedido */}
                                  <div className="space-y-6">
                                    {/* Produtos */}
                                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/60 p-5 rounded-2xl shadow-sm space-y-4">
                                      <h4 className="font-bold text-base text-gray-800 dark:text-gray-200">
                                        Produtos Comprados ({items.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {items.map((item, idx) => (
                                          <div
                                            key={idx}
                                            className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
                                          >
                                            {item.image ? (
                                              <img
                                                src={item.image}
                                                alt={item.name || "Produto"}
                                                className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0"
                                                onError={(e) => {
                                                  (e.target as HTMLImageElement).src =
                                                    "https://via.placeholder.com/100?text=Produto";
                                                }}
                                              />
                                            ) : (
                                              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-850 rounded-lg flex items-center justify-center border border-gray-300 dark:border-gray-700 flex-shrink-0">
                                                <ShoppingBag className="h-5 w-5 text-gray-400" />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="font-bold text-sm text-gray-850 dark:text-gray-200 truncate" title={item.name || "Produto"}>
                                                {item.name || "Produto sem nome"}
                                              </div>
                                              <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold bg-gray-200/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded flex-shrink-0">
                                                  {item.quantity}x
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                  {formatCurrency(item.price || 0)}
                                                </span>
                                              </div>
                                              {item.sku && (
                                                <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                                                  SKU: {item.sku}
                                                </div>
                                              )}
                                            </div>
                                            <div className="text-right flex flex-col justify-center flex-shrink-0">
                                              <div className="font-bold text-sm text-gray-855 dark:text-gray-100">
                                                {formatCurrency((item.price || 0) * (item.quantity || 1))}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Coluna 3: Status & Resumo */}
                                  <div className="space-y-6">
                                    {/* Status & Pagamento */}
                                    <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-850 dark:to-gray-800/30 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-4">
                                      <h4 className="font-bold text-base text-gray-850 dark:text-gray-200">
                                        Status & Pagamento
                                      </h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                            Status do Pagamento
                                          </div>
                                          <div className="mt-1">
                                            <Badge className={`${getStatusBadge(selectedOrder.paymentStatus).color} font-medium px-2.5 py-0.5 border text-xs`}>
                                              {getStatusBadge(selectedOrder.paymentStatus).label}
                                            </Badge>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                            Método
                                          </div>
                                          <div className="mt-1.5 font-bold text-sm text-gray-700 dark:text-gray-300">
                                            {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Resumo Financeiro */}
                                    <div className="bg-gradient-to-br from-gray-50 to-emerald-50/10 dark:from-gray-850 dark:to-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800/80 shadow-sm space-y-4">
                                      <h4 className="font-bold text-base text-gray-850 dark:text-gray-200">
                                        Resumo Financeiro
                                      </h4>
                                      <div className="space-y-2.5 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Subtotal:</span>
                                          <span className="font-semibold text-gray-850 dark:text-gray-200">
                                            {formatCurrency(selectedOrder.subtotal)}
                                          </span>
                                        </div>
                                        {selectedOrder.discount > 0 && (
                                          <div className="flex justify-between text-green-600 dark:text-green-400">
                                            <span>Desconto:</span>
                                            <span className="font-semibold">
                                              -{formatCurrency(selectedOrder.discount)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-muted-foreground">Frete:</span>
                                          <span className="font-semibold text-gray-850 dark:text-gray-200">
                                            {formatCurrency(selectedOrder.shipping)}
                                          </span>
                                        </div>
                                        {selectedOrder.tax > 0 && (
                                          <div className="flex justify-between">
                                            <span className="text-muted-foreground">Impostos:</span>
                                            <span className="font-semibold text-gray-850 dark:text-gray-200">
                                              {formatCurrency(selectedOrder.tax)}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex justify-between font-bold text-base pt-3 border-t border-gray-200 dark:border-gray-700">
                                          <span className="text-gray-850 dark:text-gray-200">Total do Pedido:</span>
                                          <span className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                            {formatCurrency(selectedOrder.total)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllOrdersPage;


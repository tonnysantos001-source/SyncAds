import { useEffect, useState } from "react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, statusFilter, orders]);

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
        color: "bg-yellow-100 text-yellow-800",
      },
      PROCESSING: {
        label: "Processando",
        variant: "default" as const,
        color: "bg-blue-100 text-blue-800",
      },
      PAID: {
        label: "Pago",
        variant: "default" as const,
        color: "bg-green-100 text-green-800",
      },
      FAILED: {
        label: "Falhou",
        variant: "destructive" as const,
        color: "bg-red-100 text-red-800",
      },
      REFUNDED: {
        label: "Reembolsado",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800",
      },
      CANCELLED: {
        label: "Cancelado",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800",
      },
    };
    return (
      statusMap[status] || {
        label: "Desconhecido",
        variant: "secondary" as const,
        color: "bg-gray-100 text-gray-800",
      }
    );
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os pedidos da sua loja
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pedidos
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">Todos os pedidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
            <Package className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {paidOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamentos confirmados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendentes
            </CardTitle>
            <PackageX className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando pagamento
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">Pedidos pagos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
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
          className="w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
        </Button>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Os pedidos aparecerão aqui assim que forem criados"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusBadge(order.paymentStatus);
            const items = getOrderItems(order);

            return (
              <Card
                key={order.id}
                className="overflow-hidden hover:shadow-lg transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Informações principais */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="font-mono text-lg font-bold">
                          #{order.orderNumber}
                        </div>
                        <Badge className={statusInfo.color}>
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {order.customerName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{order.customerEmail}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
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

                    {/* Valor e Ação */}
                    <div className="sm:text-right space-y-3 sm:min-w-[180px]">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          Total
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(order.total)}
                        </div>
                      </div>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl">
                              Pedido #{order.orderNumber}
                            </DialogTitle>
                            <DialogDescription>
                              Informações completas do pedido
                            </DialogDescription>
                          </DialogHeader>

                          {selectedOrder && (
                            <div className="space-y-6 pt-4">
                              {/* Status */}
                              <div>
                                <h4 className="font-semibold mb-3 text-lg">
                                  Status
                                </h4>
                                <div className="flex gap-2">
                                  <Badge className={statusInfo.color}>
                                    {statusInfo.label}
                                  </Badge>
                                </div>
                              </div>

                              {/* Cliente */}
                              <div>
                                <h4 className="font-semibold mb-3 text-lg">
                                  Informações do Cliente
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                  <div className="flex items-start gap-2">
                                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-sm text-muted-foreground">
                                        Nome
                                      </div>
                                      <div className="font-medium">
                                        {selectedOrder.customerName}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-sm text-muted-foreground">
                                        Email
                                      </div>
                                      <div className="font-medium">
                                        {selectedOrder.customerEmail}
                                      </div>
                                    </div>
                                  </div>
                                  {selectedOrder.customerPhone && (
                                    <div className="flex items-start gap-2">
                                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                      <div>
                                        <div className="text-sm text-muted-foreground">
                                          Telefone
                                        </div>
                                        <div className="font-medium">
                                          {selectedOrder.customerPhone}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="flex items-start gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                      <div className="text-sm text-muted-foreground">
                                        Data do Pedido
                                      </div>
                                      <div className="font-medium">
                                        {format(
                                          new Date(selectedOrder.createdAt),
                                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                                          {
                                            locale: ptBR,
                                          },
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Produtos */}
                              <div>
                                <h4 className="font-semibold mb-3 text-lg">
                                  Produtos ({items.length})
                                </h4>
                                <div className="space-y-3">
                                  {items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name || "Produto"}
                                          className="w-20 h-20 object-cover rounded-lg border"
                                          onError={(e) => {
                                            (e.target as HTMLImageElement).src =
                                              "https://via.placeholder.com/100?text=Produto";
                                          }}
                                        />
                                      ) : (
                                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center border">
                                          <ShoppingBag className="h-10 w-10 text-gray-400" />
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <div className="font-semibold text-base">
                                          {item.name || "Produto sem nome"}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                          Quantidade: {item.quantity}
                                        </div>
                                        {item.sku && (
                                          <div className="text-xs text-muted-foreground mt-1">
                                            SKU: {item.sku}
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-lg">
                                          {formatCurrency(
                                            (item.price || 0) *
                                              (item.quantity || 1),
                                          )}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {formatCurrency(item.price || 0)} / un
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Resumo Financeiro */}
                              <div>
                                <h4 className="font-semibold mb-3 text-lg">
                                  Resumo Financeiro
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span className="font-medium">
                                      {formatCurrency(selectedOrder.subtotal)}
                                    </span>
                                  </div>
                                  {selectedOrder.discount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                      <span>Desconto:</span>
                                      <span className="font-medium">
                                        -
                                        {formatCurrency(selectedOrder.discount)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm">
                                    <span>Frete:</span>
                                    <span className="font-medium">
                                      {formatCurrency(selectedOrder.shipping)}
                                    </span>
                                  </div>
                                  {selectedOrder.tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                      <span>Impostos:</span>
                                      <span className="font-medium">
                                        {formatCurrency(selectedOrder.tax)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200">
                                    <span>Total:</span>
                                    <span className="text-blue-600">
                                      {formatCurrency(selectedOrder.total)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Endereço de Entrega */}
                              {selectedOrder.shippingAddress &&
                                selectedOrder.shippingAddress.street && (
                                  <div>
                                    <h4 className="font-semibold mb-3 text-lg">
                                      Endereço de Entrega
                                    </h4>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                      <div className="flex items-start gap-2">
                                        <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                          <p className="font-medium">
                                            {
                                              selectedOrder.shippingAddress
                                                .street
                                            }
                                            ,{" "}
                                            {
                                              selectedOrder.shippingAddress
                                                .number
                                            }
                                          </p>
                                          {selectedOrder.shippingAddress
                                            .complement && (
                                            <p className="text-sm text-muted-foreground">
                                              {
                                                selectedOrder.shippingAddress
                                                  .complement
                                              }
                                            </p>
                                          )}
                                          <p className="text-sm">
                                            {
                                              selectedOrder.shippingAddress
                                                .neighborhood
                                            }{" "}
                                            -{" "}
                                            {selectedOrder.shippingAddress.city}
                                            /
                                            {
                                              selectedOrder.shippingAddress
                                                .state
                                            }
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            CEP:{" "}
                                            {
                                              selectedOrder.shippingAddress
                                                .zipCode
                                            }
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              {/* Método de Pagamento */}
                              <div>
                                <h4 className="font-semibold mb-3 text-lg">
                                  Pagamento
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <div className="text-sm text-muted-foreground">
                                    Método de Pagamento
                                  </div>
                                  <div className="font-medium">
                                    {selectedOrder.paymentMethod ||
                                      "Não especificado"}
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AllOrdersPage;

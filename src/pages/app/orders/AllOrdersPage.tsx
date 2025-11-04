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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  TrendingUp,
  PackageX,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ordersApi, Order } from "@/lib/api/ordersApi";
import { shopifySync } from "@/lib/api/shopifySync";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AllOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
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

      // Buscar pedidos da tabela Order principal
      const mainOrders = await ordersApi.getAll(user.id);

      // Buscar também pedidos da Shopify que ainda não foram sincronizados
      const { data: shopifyOrders } = await supabase
        .from("ShopifyOrder")
        .select("*")
        .eq("userId", user.id)
        .order("createdAt", { ascending: false });

      // Converter pedidos Shopify para formato padrão
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

      // Combinar e remover duplicatas
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

      toast({ title: "Pedidos sincronizados com sucesso!" });
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

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by status
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
      PENDING: { label: "Pendente", variant: "secondary" as const },
      PROCESSING: { label: "Processando", variant: "default" as const },
      PAID: { label: "Pago", variant: "default" as const },
      FAILED: { label: "Falhou", variant: "destructive" as const },
      REFUNDED: { label: "Reembolsado", variant: "secondary" as const },
      CANCELLED: { label: "Cancelado", variant: "secondary" as const },
    };
    return (
      statusMap[status] || {
        label: "Desconhecido",
        variant: "secondary" as const,
      }
    );
  };

  const getFulfillmentBadge = (status: Order["fulfillmentStatus"]) => {
    const statusMap = {
      PENDING: { label: "Pendente", variant: "secondary" as const },
      PROCESSING: { label: "Preparando", variant: "default" as const },
      SHIPPED: { label: "Enviado", variant: "default" as const },
      DELIVERED: { label: "Entregue", variant: "default" as const },
      CANCELLED: { label: "Cancelado", variant: "destructive" as const },
    };
    return (
      statusMap[status] || {
        label: "Desconhecido",
        variant: "secondary" as const,
      }
    );
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Pagos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paidOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pedidos Pendentes
            </CardTitle>
            <PackageX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
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
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Sincronizando..." : "Sincronizar Shopify"}
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
          <CardDescription>
            {filteredOrders.length} pedido(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                Nenhum pedido encontrado
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Aguardando o primeiro pedido"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Entrega</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-mono text-sm">
                        #{order.orderNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.customerName}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.customerEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatCurrency(order.total)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadge(order.paymentStatus).variant}
                      >
                        {getStatusBadge(order.paymentStatus).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          getFulfillmentBadge(order.fulfillmentStatus).variant
                        }
                      >
                        {getFulfillmentBadge(order.fulfillmentStatus).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AllOrdersPage;

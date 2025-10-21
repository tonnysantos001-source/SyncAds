import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ShoppingCart, Search, Eye, DollarSign, Package, TrendingUp, PackageX } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ordersApi, Order } from '@/lib/api/ordersApi';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AllOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
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
      if (!user?.organizationId) return;
      
      const data = await ordersApi.getAll(user.organizationId);
      setOrders(data);
      setFilteredOrders(data);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
          order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.paymentStatus === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: Order['paymentStatus']) => {
    const statusMap = {
      PENDING: { label: 'Pendente', variant: 'secondary' as const },
      PROCESSING: { label: 'Processando', variant: 'default' as const },
      PAID: { label: 'Pago', variant: 'default' as const },
      FAILED: { label: 'Falhou', variant: 'destructive' as const },
      REFUNDED: { label: 'Reembolsado', variant: 'secondary' as const },
      CANCELLED: { label: 'Cancelado', variant: 'secondary' as const },
    };
    return statusMap[status];
  };

  const getFulfillmentBadge = (status: Order['fulfillmentStatus']) => {
    const statusMap = {
      PENDING: { label: 'Pendente', variant: 'secondary' as const },
      PROCESSING: { label: 'Preparando', variant: 'default' as const },
      SHIPPED: { label: 'Enviado', variant: 'default' as const },
      DELIVERED: { label: 'Entregue', variant: 'default' as const },
      CANCELLED: { label: 'Cancelado', variant: 'destructive' as const },
    };
    return statusMap[status];
  };

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingOrders = orders.filter((o) => o.paymentStatus === 'PENDING').length;
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID').length;

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
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
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
            <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
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
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
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
              <h3 className="text-lg font-semibold">Nenhum pedido encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Aguardando o primeiro pedido'}
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
                      <div className="font-medium">{formatCurrency(order.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadge(order.paymentStatus).variant}>
                        {getStatusBadge(order.paymentStatus).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getFulfillmentBadge(order.fulfillmentStatus).variant}>
                        {getFulfillmentBadge(order.fulfillmentStatus).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
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

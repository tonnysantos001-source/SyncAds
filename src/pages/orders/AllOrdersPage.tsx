import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  total: number;
  items: number;
  createdAt: string;
  paymentMethod: string;
}

const statusConfig: Record<OrderStatus, { label: string; variant: string; icon: any }> = {
  PENDING: { label: 'Pendente', variant: 'warning', icon: Clock },
  PROCESSING: { label: 'Processando', variant: 'default', icon: Package },
  COMPLETED: { label: 'Completo', variant: 'success', icon: CheckCircle },
  CANCELLED: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
  REFUNDED: { label: 'Reembolsado', variant: 'secondary', icon: TrendingUp },
};

export default function AllOrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    revenue: 0,
  });

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const loadOrders = async () => {
    try {
      setLoading(true);

      // Buscar pedidos do Supabase
      const { data, error } = await supabase
        .from('Order')
        .select(`
          id,
          orderNumber,
          status,
          total,
          paymentMethod,
          createdAt,
          Customer (
            name,
            email
          )
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Transformar dados
      const transformedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber || `ORD-${order.id.substring(0, 8)}`,
        customerName: order.Customer?.name || 'Cliente Anônimo',
        customerEmail: order.Customer?.email || 'N/A',
        status: order.status,
        total: order.total || 0,
        items: 0, // TODO: Contar items do pedido
        createdAt: order.createdAt,
        paymentMethod: order.paymentMethod || 'N/A',
      }));

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const completed = orders.filter(o => o.status === 'COMPLETED').length;
    const revenue = orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0);

    setStats({ total, pending, completed, revenue });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    const matchesDate = () => {
      if (dateFilter === 'all') return true;
      const orderDate = new Date(order.createdAt);
      const now = new Date();

      switch (dateFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    };

    return matchesSearch && matchesStatus && matchesDate();
  });

  const exportToCSV = () => {
    const headers = ['Número', 'Cliente', 'Email', 'Status', 'Total', 'Data'];
    const csvData = filteredOrders.map(order => [
      order.orderNumber,
      order.customerName,
      order.customerEmail,
      statusConfig[order.status].label,
      `R$ ${order.total.toFixed(2)}`,
      new Date(order.createdAt).toLocaleDateString('pt-BR'),
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Todos os Pedidos</h1>
            <p className="text-muted-foreground">
              Gerencie e acompanhe todos os pedidos da sua loja
            </p>
          </div>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
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
              <p className="text-xs text-muted-foreground">Aguardando processamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Pedidos finalizados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.revenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Pedidos completos</p>
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
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

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PROCESSING">Processando</SelectItem>
                  <SelectItem value="COMPLETED">Completo</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                </SelectContent>
              </Select>

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
            <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
            <CardDescription>
              {filteredOrders.length === orders.length
                ? 'Mostrando todos os pedidos'
                : `Mostrando ${filteredOrders.length} de ${orders.length} pedidos`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Package className="h-12 w-12 animate-pulse text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Carregando pedidos...</p>
                </div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' || dateFilter !== 'all'
                      ? 'Nenhum pedido encontrado com os filtros aplicados'
                      : 'Nenhum pedido encontrado'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">Número</th>
                      <th className="text-left p-4 font-medium text-sm">Cliente</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Total</th>
                      <th className="text-left p-4 font-medium text-sm">Pagamento</th>
                      <th className="text-left p-4 font-medium text-sm">Data</th>
                      <th className="text-left p-4 font-medium text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => {
                      const StatusIcon = statusConfig[order.status].icon;
                      return (
                        <tr key={order.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">
                            <div className="font-medium">{order.orderNumber}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-sm text-muted-foreground">
                              {order.customerEmail}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={statusConfig[order.status].variant as any}
                              className="flex items-center gap-1 w-fit"
                            >
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[order.status].label}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <div className="font-medium">
                              R$ {order.total.toFixed(2)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{order.paymentMethod}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString('pt-BR')}
                            </div>
                          </td>
                          <td className="p-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/orders/${order.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

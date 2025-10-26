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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Search, DollarSign, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PixRecoveredTransaction {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  pixCopyPaste?: string;
  pixQrCode?: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  expiresAt?: string;
  paidAt?: string;
  createdAt: string;
}

const PixRecoveredPage = () => {
  const [transactions, setTransactions] = useState<PixRecoveredTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<PixRecoveredTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadPixTransactions();
  }, [user?.organizationId]);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, statusFilter, transactions]);

  const loadPixTransactions = async () => {
    try {
      if (!user?.organizationId) return;
      
      setLoading(true);
      
      // Buscar transações PIX e seus pedidos relacionados
      const { data: transactionsData, error } = await supabase
        .from('Transaction')
        .select(`
          *,
          Order:orderId (
            id,
            orderNumber,
            customerName,
            customerEmail
          )
        `)
        .eq('paymentMethod', 'PIX')
        .eq('organizationId', user.organizationId)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Transformar dados para o formato da interface
      const transformedData: PixRecoveredTransaction[] = (transactionsData || []).map(t => ({
        id: t.id,
        orderId: t.orderId,
        orderNumber: t.Order?.orderNumber || t.orderId.substring(0, 8),
        customerName: t.Order?.customerName || 'N/A',
        customerEmail: t.Order?.customerEmail || 'N/A',
        amount: t.amount,
        pixCopyPaste: t.pixCopyPaste,
        pixQrCode: t.pixQrCode,
        status: t.status as 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED',
        expiresAt: t.pixExpiresAt,
        paidAt: t.paidAt,
        createdAt: t.createdAt
      }));

      setTransactions(transformedData);
    } catch (error: any) {
      console.error('Erro ao carregar transações PIX:', error);
      toast({
        title: 'Erro ao carregar transações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((transaction) => transaction.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { label: 'Aguardando Pagamento', variant: 'secondary' as const, icon: Clock },
      PAID: { label: 'Pago', variant: 'default' as const, icon: CheckCircle },
      EXPIRED: { label: 'Expirado', variant: 'destructive' as const, icon: AlertCircle },
      CANCELLED: { label: 'Cancelado', variant: 'secondary' as const, icon: AlertCircle },
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.PENDING;
  };

  const totalPending = transactions.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + t.amount, 0);
  const totalRecovered = transactions.filter(t => t.status === 'PAID').reduce((sum, t) => sum + t.amount, 0);
  const totalExpired = transactions.filter(t => t.status === 'EXPIRED').reduce((sum, t) => sum + t.amount, 0);
  const recoveryRate = transactions.length > 0 
    ? ((transactions.filter(t => t.status === 'PAID').length / transactions.length) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">PIX Recuperados</h1>
        <p className="text-muted-foreground">
          Gerencie transações PIX e recupere vendas perdidas
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Pagamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.status === 'PENDING').length} transação(ões)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PIX Recuperados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecovered)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.status === 'PAID').length} pagamentos confirmados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalExpired)}</div>
            <p className="text-xs text-muted-foreground">
              {transactions.filter(t => t.status === 'EXPIRED').length} não recuperados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Recuperação</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recoveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de conversão de PIX
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert */}
      {totalPending > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem <strong>{formatCurrency(totalPending)}</strong> em PIX aguardando pagamento. 
            Considere enviar lembretes para os clientes.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente ou email..."
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
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="PENDING">Aguardando</SelectItem>
            <SelectItem value="PAID">Pago</SelectItem>
            <SelectItem value="EXPIRED">Expirado</SelectItem>
            <SelectItem value="CANCELLED">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadPixTransactions} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações PIX</CardTitle>
          <CardDescription>
            {filteredTransactions.length} transação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum PIX encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Aguardando primeira transação PIX'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const statusInfo = getStatusBadge(transaction.status);
                  const Icon = statusInfo.icon;
                  
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          #{transaction.orderNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(transaction.amount)}</div>
                        {transaction.paidAt && (
                          <div className="text-sm text-green-600">
                            Pago em {format(new Date(transaction.paidAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.expiresAt ? (
                          <div className="text-sm">
                            {format(new Date(transaction.expiresAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {transaction.status === 'PENDING' && transaction.pixCopyPaste && (
                            <Button variant="outline" size="sm" onClick={() => {
                              navigator.clipboard.writeText(transaction.pixCopyPaste!);
                              toast({ title: 'Chave PIX copiada!' });
                            }}>
                              Copiar PIX
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            Ver detalhes
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PixRecoveredPage;
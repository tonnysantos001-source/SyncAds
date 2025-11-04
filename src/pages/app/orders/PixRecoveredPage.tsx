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
import { CheckCircle, AlertCircle, Search, DollarSign, TrendingUp, TrendingDown, Clock, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { recoveryApi, RecoveredCart } from '@/lib/api/recoveryApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RecoveryStatus = 'PENDING' | 'RECOVERED' | 'EXPIRED' | 'FAILED';

const PixRecoveredPage = () => {
  const [recoveries, setRecoveries] = useState<RecoveredCart[]>([]);
  const [filteredRecoveries, setFilteredRecoveries] = useState<RecoveredCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadPixRecoveries();
  }, [user?.id]);

  useEffect(() => {
    filterRecoveries();
  }, [searchTerm, statusFilter, recoveries]);

  const loadPixRecoveries = async () => {
    try {
      if (!user?.id) return;

      setLoading(true);

      // Buscar todos os carrinhos recuperados via PIX
      const data = await recoveryApi.getPixRecovered(user.id);
      setRecoveries(data);
    } catch (error: any) {
      console.error('Erro ao carregar PIX recuperados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRecoveries = () => {
    let filtered = recoveries;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (recovery) =>
          recovery.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (recovery.orderId && recovery.orderId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      if (statusFilter === 'RECOVERED') {
        filtered = filtered.filter((r) => r.recovered);
      } else if (statusFilter === 'PENDING') {
        filtered = filtered.filter((r) => !r.recovered && (!r.pixExpiresAt || new Date(r.pixExpiresAt) > new Date()));
      } else if (statusFilter === 'EXPIRED') {
        filtered = filtered.filter((r) => !r.recovered && r.pixExpiresAt && new Date(r.pixExpiresAt) < new Date());
      }
    }

    setFilteredRecoveries(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getRecoveryStatus = (recovery: RecoveredCart): RecoveryStatus => {
    if (recovery.recovered) return 'RECOVERED';
    if (recovery.pixExpiresAt && new Date(recovery.pixExpiresAt) < new Date()) return 'EXPIRED';
    return 'PENDING';
  };

  const getStatusBadge = (status: RecoveryStatus) => {
    const statusMap = {
      PENDING: { label: 'Aguardando Pagamento', variant: 'secondary' as const, icon: Clock },
      RECOVERED: { label: 'Recuperado', variant: 'default' as const, icon: CheckCircle },
      EXPIRED: { label: 'Expirado', variant: 'destructive' as const, icon: AlertCircle },
      FAILED: { label: 'Falhou', variant: 'destructive' as const, icon: AlertCircle },
    };
    return statusMap[status] || statusMap.PENDING;
  };

  const totalPending = recoveries
    .filter(r => getRecoveryStatus(r) === 'PENDING')
    .reduce((sum, r) => sum + r.cartValue, 0);
  const totalRecovered = recoveries
    .filter(r => r.recovered)
    .reduce((sum, r) => sum + r.cartValue, 0);
  const totalExpired = recoveries
    .filter(r => getRecoveryStatus(r) === 'EXPIRED')
    .reduce((sum, r) => sum + r.cartValue, 0);
  const recoveryRate = recoveries.length > 0
    ? ((recoveries.filter(r => r.recovered).length / recoveries.length) * 100).toFixed(1)
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
              {recoveries.filter(r => getRecoveryStatus(r) === 'PENDING').length} aguardando
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
              {recoveries.filter(r => r.recovered).length} recuperados
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
              {recoveries.filter(r => getRecoveryStatus(r) === 'EXPIRED').length} expirados
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
            <SelectItem value="RECOVERED">Recuperado</SelectItem>
            <SelectItem value="EXPIRED">Expirado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadPixRecoveries} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recuperação de Carrinhos via PIX</CardTitle>
          <CardDescription>
            {filteredRecoveries.length} carrinho(s) encontrado(s)
          </CardDescription>
        </CardHeader>
</text>

<old_text line=246>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Nenhum PIX encontrado</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Aguardando primeira transação PIX'}
              </p>
            </div>
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
                  <TableHead>Carrinho</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecoveries.map((recovery) => {
                  const status = getRecoveryStatus(recovery);
                  const statusInfo = getStatusBadge(status);
                  const Icon = statusInfo.icon;

                  return (
                    <TableRow key={recovery.id}>
                      <TableCell>
                        <div className="font-mono text-sm">
                          #{recovery.cartId.substring(0, 8)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{recovery.customerEmail}</div>
                          {recovery.customerPhone && (
                            <div className="text-sm text-muted-foreground">
                              {recovery.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(recovery.cartValue)}</div>
                        {recovery.discountOffered > 0 && (
                          <div className="text-sm text-green-600">
                            Desconto: {formatCurrency(recovery.discountOffered)}
                          </div>
                        )}
                        {recovery.recoveredAt && (
                          <div className="text-sm text-green-600">
                            Recuperado em {format(new Date(recovery.recoveredAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {recovery.recoveryAttempts} tentativa(s)
                        </div>
                        {recovery.lastRecoveryAt && (
                          <div className="text-xs text-muted-foreground">
                            Última: {format(new Date(recovery.lastRecoveryAt), 'dd/MM HH:mm', { locale: ptBR })}
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
                        {recovery.pixExpiresAt ? (
                          <div className="text-sm">
                            {format(new Date(recovery.pixExpiresAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(recovery.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {status === 'PENDING' && recovery.pixCopyPaste && (
                            <Button variant="outline" size="sm" onClick={() => {
                              navigator.clipboard.writeText(recovery.pixCopyPaste!);
                              toast({ title: 'Chave PIX copiada!' });
                            }}>
                              Copiar PIX
                            </Button>
                          )}
                          {recovery.orderId && (
                            <Button variant="ghost" size="sm">
                              Ver pedido
                            </Button>
                          )}
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

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Search, TrendingUp, CreditCard, Calendar, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface BillingData {
  clientId: string;
  clientName: string;
  clientSlug: string;
  plan: string;
  status: string;
  mrr: number;
  totalRevenue: number;
  lastPayment: string | null;
  nextPayment: string | null;
}

export default function BillingPage() {
  const { toast } = useToast();
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      // Buscar todas organizações
      const { data: orgs, error } = await supabase
        .from('Organization')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Calcular MRR baseado no plano
      const planPrices: Record<string, number> = {
        FREE: 0,
        STARTER: 49.90,
        PRO: 199.90,
        ENTERPRISE: 999.90,
      };

      const billing: BillingData[] = (orgs || []).map((org) => ({
        clientId: org.id,
        clientName: org.name,
        clientSlug: org.slug,
        plan: org.plan,
        status: org.status,
        mrr: org.status === 'ACTIVE' ? planPrices[org.plan] || 0 : 0,
        totalRevenue: 0, // TODO: Calcular da tabela de pagamentos
        lastPayment: null,
        nextPayment: org.status === 'ACTIVE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
      }));

      setBillingData(billing);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar faturamento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = billingData.filter((item) =>
    item.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.clientSlug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotals = () => {
    return {
      totalMRR: billingData.reduce((acc, item) => acc + item.mrr, 0),
      activeClients: billingData.filter(item => item.status === 'ACTIVE').length,
      totalRevenue: billingData.reduce((acc, item) => acc + item.totalRevenue, 0),
      avgRevenuePerClient: billingData.length > 0 
        ? billingData.reduce((acc, item) => acc + item.mrr, 0) / billingData.filter(item => item.status === 'ACTIVE').length
        : 0,
    };
  };

  const totals = calculateTotals();

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100',
      STARTER: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      PRO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      ENTERPRISE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}>
        {plan}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Ativo' },
      TRIAL: { variant: 'secondary', label: 'Trial' },
      SUSPENDED: { variant: 'destructive', label: 'Suspenso' },
      CANCELLED: { variant: 'outline', label: 'Cancelado' },
    };
    const config = variants[status] || variants.TRIAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faturamento</h1>
          <p className="text-gray-500 dark:text-gray-400">Acompanhe a receita e pagamentos dos clientes</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Pagantes</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.activeClients}</div>
              <p className="text-xs text-muted-foreground">Com plano ativo</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {totals.avgRevenuePerClient.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Por cliente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARR Projetado</CardTitle>
              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(totals.totalMRR * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Receita anual</p>
            </CardContent>
          </Card>
        </div>

        {/* Billing Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Faturamento por Cliente</CardTitle>
                <CardDescription>Detalhes de pagamento e receita</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Receita Total</TableHead>
                    <TableHead>Próximo Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhum dado de faturamento encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((item) => (
                      <TableRow key={item.clientId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.clientName}</div>
                            <div className="text-sm text-gray-500">{item.clientSlug}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(item.plan)}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-600">
                            R$ {item.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          R$ {item.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {item.nextPayment ? (
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {new Date(item.nextPayment).toLocaleDateString('pt-BR')}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

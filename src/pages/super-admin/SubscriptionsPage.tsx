import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, CreditCard, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface Subscription {
  id: string;
  organizationId: string;
  plan: string;
  status: string;
  billingCycle: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  organization: {
    name: string;
    slug: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('Subscription')
        .select(`
          *,
          organization:Organization (
            name,
            slug
          )
        `)
        .order('startDate', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar assinaturas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'ACTIVE').length;
    const mrr = subscriptions
      .filter(s => s.status === 'ACTIVE')
      .reduce((acc, s) => acc + (s.amount || 0), 0);

    return { total, active, mrr };
  };

  const stats = calculateStats();

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Ativa' },
      TRIALING: { variant: 'secondary', label: 'Trial' },
      PAST_DUE: { variant: 'destructive', label: 'Atrasada' },
      CANCELLED: { variant: 'outline', label: 'Cancelada' },
    };
    const item = config[status] || config.ACTIVE;
    return <Badge variant={item.variant}>{item.label}</Badge>;
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      FREE: 'bg-gray-100 text-gray-800',
      STARTER: 'bg-blue-100 text-blue-800',
      PRO: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-emerald-100 text-emerald-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[plan] || colors.FREE}`}>
        {plan}
      </span>
    );
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assinaturas</h1>
          <p className="text-gray-500">Gerencie todas as assinaturas do sistema</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Assinaturas</CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} ativas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR (Receita Mensal)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita recorrente mensal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Trial para pago
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Assinaturas</CardTitle>
            <CardDescription>Lista completa de assinaturas do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma assinatura ainda
                </h3>
                <p className="text-gray-500">
                  As assinaturas aparecerão aqui quando forem criadas
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organização</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ciclo</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Próxima Cobrança</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sub.organization.name}</div>
                          <div className="text-sm text-gray-500">{sub.organization.slug}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell className="capitalize">{sub.billingCycle.toLowerCase()}</TableCell>
                      <TableCell>
                        {sub.currency} {sub.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {new Date(sub.startDate).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {sub.endDate 
                          ? new Date(sub.endDate).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

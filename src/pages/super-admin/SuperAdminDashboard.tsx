import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Bot, CreditCard, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface Stats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  totalAiConnections: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalAiConnections: 0,
  });
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Verificar se tabela Organization existe
      const { error: orgError } = await supabase
        .from('Organization')
        .select('*', { count: 'exact', head: true });

      if (orgError && orgError.message.includes('does not exist')) {
        setNeedsMigration(true);
        setLoading(false);
        return;
      }

      // Total organizations
      const { count: orgCount } = await supabase
        .from('Organization')
        .select('*', { count: 'exact', head: true });

      // Active organizations
      const { count: activeOrgCount } = await supabase
        .from('Organization')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // Total users
      const { count: userCount } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true });

      // Total AI connections
      const { count: aiCount } = await supabase
        .from('GlobalAiConnection')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalOrganizations: orgCount || 0,
        activeOrganizations: activeOrgCount || 0,
        totalUsers: userCount || 0,
        totalRevenue: 0,
        totalAiConnections: aiCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setNeedsMigration(true);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Organizações',
      value: stats.totalOrganizations,
      description: `${stats.activeOrganizations} ativas`,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Usuários',
      value: stats.totalUsers,
      description: 'Total no sistema',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Conexões de IA',
      value: stats.totalAiConnections,
      description: 'IAs configuradas',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      title: 'Receita (MRR)',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`,
      description: 'Receita mensal recorrente',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  if (needsMigration) {
    return (
      <SuperAdminLayout>
        <div className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Migration Necessária</AlertTitle>
            <AlertDescription>
              As tabelas do SaaS ainda não foram criadas. Execute a migration primeiro:
              <br /><br />
              <code className="bg-black/10 px-2 py-1 rounded text-sm">
                supabase_migrations/saas_architecture.sql
              </code>
              <br /><br />
              Veja instruções em: <strong>EXECUTAR_MIGRATION.md</strong>
            </AlertDescription>
          </Alert>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Organizações
              </CardTitle>
              <CardDescription>
                Gerenciar clientes e suas configurações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                onClick={() => navigate('/super-admin/organizations')}
              >
                Ver Organizações
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Conexões de IA
              </CardTitle>
              <CardDescription>
                Adicionar e atribuir IAs globais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                onClick={() => navigate('/super-admin/ai-connections')}
              >
                Gerenciar IAs
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assinaturas
              </CardTitle>
              <CardDescription>
                Ver pagamentos e status de contas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-red-600 hover:bg-red-700" 
                onClick={() => navigate('/super-admin/subscriptions')}
              >
                Ver Assinaturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

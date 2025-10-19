import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Bot, CreditCard, Users, TrendingUp, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  totalAiConnections: number;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalAiConnections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
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
        totalRevenue: 0, // TODO: Calculate from subscriptions
        totalAiConnections: aiCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Usuários',
      value: stats.totalUsers,
      description: 'Total no sistema',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Conexões de IA',
      value: stats.totalAiConnections,
      description: 'IAs configuradas',
      icon: Bot,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Receita (MRR)',
      value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`,
      description: 'Receita mensal recorrente',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Super Admin Panel
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Gerencie organizações, IAs e assinaturas
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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
          <Card>
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
              <Button className="w-full" onClick={() => window.location.href = '/super-admin/organizations'}>
                Ver Organizações
              </Button>
            </CardContent>
          </Card>

          <Card>
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
              <Button className="w-full" onClick={() => window.location.href = '/super-admin/ai-connections'}>
                Gerenciar IAs
              </Button>
            </CardContent>
          </Card>

          <Card>
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
              <Button className="w-full" onClick={() => window.location.href = '/super-admin/subscriptions'}>
                Ver Assinaturas
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

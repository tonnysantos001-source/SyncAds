import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, DollarSign, BarChart3, CreditCard, MessageSquare, ArrowRight, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface Stats {
  totalClients: number;
  activeClients: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalAiConnections: number;
  totalMessages: number;
  totalTokens: number;
  gatewaysConfigured: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    activeClients: 0,
    totalUsers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalAiConnections: 0,
    totalMessages: 0,
    totalTokens: 0,
    gatewaysConfigured: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // ✅ SIMPLIFICADO: Buscar apenas usuários (sem organizações)
      
      // Total users
      const { count: userCount } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true });

      // Active users (que estão isActive)
      const { count: activeUserCount } = await supabase
        .from('User')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true);

      // Total AI connections
      const { count: aiCount } = await supabase
        .from('GlobalAiConnection')
        .select('*', { count: 'exact', head: true });

      // Calcular mensagens
      const { count: messagesCount } = await supabase
        .from('ChatMessage')
        .select('*', { count: 'exact', head: true });

      // Total tokens usados
      const { data: tokensData } = await supabase
        .from('AiUsage')
        .select('totalTokens');

      const totalTokens = (tokensData || []).reduce((acc: number, usage: any) => acc + (usage.totalTokens || 0), 0);

      // MRR simples baseado em planos de usuários ativos
      const planPrices: Record<string, number> = {
        FREE: 0,
        STARTER: 49.90,
        PRO: 199.90,
        ENTERPRISE: 999.90,
      };

      const { data: activeUsersData } = await supabase
        .from('User')
        .select('plan')
        .eq('isActive', true);

      const mrr = (activeUsersData || []).reduce((acc: number, user: any) => acc + (planPrices[user.plan] || 0), 0);

      // Contar gateways configurados
      const { count: gatewaysCount } = await supabase
        .from('Gateway')
        .select('*', { count: 'exact', head: true })
        .eq('isActive', true);

      setStats({
        totalClients: userCount || 0, // Agora é total de usuários
        activeClients: activeUserCount || 0, // Usuários ativos
        totalUsers: userCount || 0,
        totalRevenue: mrr * 3, // Estimativa trimestral
        monthlyRevenue: mrr,
        totalAiConnections: aiCount || 0,
        totalMessages: messagesCount || 0,
        totalTokens: totalTokens,
        gatewaysConfigured: gatewaysCount || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Usuários',
      description: 'Gerenciar todos os usuários',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      stats: `${stats.totalUsers} usuários`,
      route: '/super-admin/clients',
    },
    {
      title: 'Faturamento',
      description: 'Receita e pagamentos',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      stats: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')} MRR`,
      route: '/super-admin/billing',
    },
    {
      title: 'Uso de IA',
      description: 'Mensagens e tokens processados',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500',
      stats: `${stats.totalMessages} mensagens`,
      route: '/super-admin/usage',
    },
    {
      title: 'Gateways',
      description: 'Meios de pagamento',
      icon: CreditCard,
      color: 'from-orange-500 to-red-500',
      stats: `${stats.gatewaysConfigured} configurados`,
      route: '/super-admin/gateways',
    },
  ];

  const statCards = [
    {
      title: 'Usuários Ativos',
      value: stats.activeClients,
      description: `${stats.totalUsers} total`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
      change: '+12%',
    },
    {
      title: 'MRR',
      value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR')}`,
      description: 'Receita mensal',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
      change: '+8%',
    },
    {
      title: 'Usuários',
      value: stats.totalUsers,
      description: 'Total no sistema',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      change: '+23%',
    },
    {
      title: 'Mensagens IA',
      value: stats.totalMessages,
      description: 'Chat processado',
      icon: MessageSquare,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
      change: '+45%',
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


  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Visão geral da plataforma</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="overflow-hidden">
                <div className={`h-2 ${stat.bgColor}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {stat.value}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                    <span className="text-xs font-medium text-green-600">{stat.change}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Acesso Rápido</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.route}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden relative"
                  onClick={() => navigate(action.route)}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${action.color}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <CardTitle className="mt-4">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {action.stats}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

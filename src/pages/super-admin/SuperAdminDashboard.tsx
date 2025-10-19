import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Bot, Users, TrendingUp, AlertCircle, DollarSign, BarChart3, CreditCard, MessageSquare, ArrowRight } from 'lucide-react';
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

      // Calcular mensagens
      const { count: messagesCount } = await supabase
        .from('ChatMessage')
        .select('*', { count: 'exact', head: true });

      // MRR simples baseado em planos ativos
      const planPrices: Record<string, number> = {
        FREE: 0,
        STARTER: 49.90,
        PRO: 199.90,
        ENTERPRISE: 999.90,
      };

      const { data: activeOrgsData } = await supabase
        .from('Organization')
        .select('plan')
        .eq('status', 'ACTIVE');

      const mrr = (activeOrgsData || []).reduce((acc, org) => acc + (planPrices[org.plan] || 0), 0);

      setStats({
        totalClients: orgCount || 0,
        activeClients: activeOrgCount || 0,
        totalUsers: userCount || 0,
        totalRevenue: mrr * 3, // Simulação de receita total (3 meses)
        monthlyRevenue: mrr,
        totalAiConnections: aiCount || 0,
        totalMessages: messagesCount || 0,
        totalTokens: 0, // TODO: Somar da tabela AiUsage
        gatewaysConfigured: 2, // TODO: Buscar da tabela PaymentGateway
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setNeedsMigration(true);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Clientes',
      description: 'Gerenciar todas as organizações',
      icon: Building2,
      color: 'from-blue-500 to-cyan-500',
      stats: `${stats.totalClients} clientes`,
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
      title: 'Clientes Ativos',
      value: stats.activeClients,
      description: `${stats.totalClients} total`,
      icon: Building2,
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

                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Criar Nova Organização</DialogTitle>
                    <DialogDescription>
                      Adicione um novo cliente ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome da Organização</Label>
                      <Input
                        id="name"
                        placeholder="Minha Empresa"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="slug">Slug (URL)</Label>
                      <Input
                        id="slug"
                        placeholder="minha-empresa"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="plan">Plano</Label>
                      <Select value={formData.plan} onValueChange={(value) => setFormData({ ...formData, plan: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">FREE</SelectItem>
                          <SelectItem value="STARTER">STARTER</SelectItem>
                          <SelectItem value="PRO">PRO</SelectItem>
                          <SelectItem value="ENTERPRISE">ENTERPRISE</SelectItem>
                          <SelectItem value="DEVELOPER">DEVELOPER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="maxUsers">Max Users</Label>
                        <Input
                          id="maxUsers"
                          type="number"
                          value={formData.maxUsers}
                          onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxCampaigns">Max Campanhas</Label>
                        <Input
                          id="maxCampaigns"
                          type="number"
                          value={formData.maxCampaigns}
                          onChange={(e) => setFormData({ ...formData, maxCampaigns: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maxChatMessages">Max Mensagens</Label>
                        <Input
                          id="maxChatMessages"
                          type="number"
                          value={formData.maxChatMessages}
                          onChange={(e) => setFormData({ ...formData, maxChatMessages: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button className="bg-red-600 hover:bg-red-700" onClick={createOrganization}>
                      Criar Organização
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar organizações..."
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
                    <TableHead>Organização</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Limites</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Nenhuma organização encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrganizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-sm text-gray-500">{org.slug}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getPlanBadge(org.plan)}</TableCell>
                        <TableCell>{getStatusBadge(org.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {org.maxUsers} users · {org.maxCampaigns} campanhas
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(org.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          {org.status === 'ACTIVE' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateOrganizationStatus(org.id, 'SUSPENDED')}
                            >
                              Suspender
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => updateOrganizationStatus(org.id, 'ACTIVE')}
                            >
                              Ativar
                            </Button>
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

        {/* Quick Link to AI Connections */}
        <Card className="mt-6 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Conexões de IA
            </CardTitle>
            <CardDescription>
              Gerenciar IAs globais e atribuir às organizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="bg-red-600 hover:bg-red-700" 
              onClick={() => navigate('/super-admin/ai-connections')}
            >
              Gerenciar Conexões de IA
            </Button>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

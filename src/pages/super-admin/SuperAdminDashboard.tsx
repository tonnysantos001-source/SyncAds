import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Bot, Users, TrendingUp, AlertCircle, Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface Stats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalRevenue: number;
  totalAiConnections: number;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxCampaigns: number;
  maxChatMessages: number;
  createdAt: string;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    activeOrganizations: 0,
    totalUsers: 0,
    totalRevenue: 0,
    totalAiConnections: 0,
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'FREE',
    maxUsers: 2,
    maxCampaigns: 5,
    maxChatMessages: 100,
  });

  useEffect(() => {
    loadStats();
    loadOrganizations();
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

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('Organization')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      console.error('Error loading organizations:', error);
    }
  };

  const createOrganization = async () => {
    try {
      const { error } = await supabase.from('Organization').insert({
        name: formData.name,
        slug: formData.slug,
        plan: formData.plan,
        status: 'TRIAL',
        maxUsers: formData.maxUsers,
        maxCampaigns: formData.maxCampaigns,
        maxChatMessages: formData.maxChatMessages,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (error) throw error;

      toast({
        title: '✅ Organização criada!',
        description: `${formData.name} foi criada com sucesso.`,
      });

      setIsDialogOpen(false);
      loadOrganizations();
      loadStats();
      
      setFormData({
        name: '',
        slug: '',
        plan: 'FREE',
        maxUsers: 2,
        maxCampaigns: 5,
        maxChatMessages: 100,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao criar organização',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const updateOrganizationStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('Organization')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Status atualizado',
        description: `Organização ${status === 'ACTIVE' ? 'ativada' : 'suspensa'}.`,
      });

      loadOrganizations();
      loadStats();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'default', label: 'Ativa' },
      TRIAL: { variant: 'secondary', label: 'Trial' },
      SUSPENDED: { variant: 'destructive', label: 'Suspensa' },
      CANCELLED: { variant: 'outline', label: 'Cancelada' },
    };
    const config = variants[status] || variants.TRIAL;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

        {/* Organizations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organizações
                </CardTitle>
                <CardDescription>Todos os clientes cadastrados no sistema</CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Organização
                  </Button>
                </DialogTrigger>
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

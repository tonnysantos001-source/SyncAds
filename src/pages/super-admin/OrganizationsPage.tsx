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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

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

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'FREE',
    maxUsers: 2,
    maxCampaigns: 5,
    maxChatMessages: 100,
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('Organization')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar organizações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
      });

      if (error) throw error;

      toast({
        title: '✅ Organização criada!',
        description: `${formData.name} foi criada com sucesso.`,
      });

      setIsDialogOpen(false);
      loadOrganizations();
      
      // Reset form
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
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Organizações</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Gerenciar todos os clientes do sistema
            </p>
          </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Organização
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Nova Organização</DialogTitle>
                  <DialogDescription>
                    Criar uma nova organização cliente no sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Organização</Label>
                    <Input
                      id="name"
                      placeholder="Ex: Acme Inc"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Slug (URL)</Label>
                    <Input
                      id="slug"
                      placeholder="acme-inc"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan">Plano</Label>
                    <Select
                      value={formData.plan}
                      onValueChange={(value) => setFormData({ ...formData, plan: value })}
                    >
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
                        onChange={(e) =>
                          setFormData({ ...formData, maxUsers: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxCampaigns">Max Campanhas</Label>
                      <Input
                        id="maxCampaigns"
                        type="number"
                        value={formData.maxCampaigns}
                        onChange={(e) =>
                          setFormData({ ...formData, maxCampaigns: parseInt(e.target.value) })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="maxChatMessages">Max Msgs</Label>
                      <Input
                        id="maxChatMessages"
                        type="number"
                        value={formData.maxChatMessages}
                        onChange={(e) =>
                          setFormData({ ...formData, maxChatMessages: parseInt(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={createOrganization}>Criar Organização</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Todas as Organizações</CardTitle>
                <CardDescription>{organizations.length} organizações cadastradas</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar organizações..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organização</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limites</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-gray-500">{org.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getPlanBadge(org.plan)}</TableCell>
                    <TableCell>{getStatusBadge(org.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>👥 {org.maxUsers} users</div>
                        <div>🎯 {org.maxCampaigns} campanhas</div>
                        <div>💬 {org.maxChatMessages} msgs</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(org.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {org.status === 'SUSPENDED' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrganizationStatus(org.id, 'ACTIVE')}
                          >
                            Ativar
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateOrganizationStatus(org.id, 'SUSPENDED')}
                          >
                            Suspender
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

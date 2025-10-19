import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Check, X, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

interface Gateway {
  id: string;
  name: string;
  provider: string;
  publicKey: string;
  isActive: boolean;
  createdAt: string;
  transactionsCount?: number;
}

const GATEWAY_PROVIDERS = [
  { value: 'stripe', label: 'Stripe', icon: '💳' },
  { value: 'mercadopago', label: 'Mercado Pago', icon: '🇧🇷' },
  { value: 'pagseguro', label: 'PagSeguro', icon: '🔒' },
  { value: 'paypal', label: 'PayPal', icon: '🅿️' },
  { value: 'asaas', label: 'Asaas', icon: '💰' },
];

export default function GatewaysPage() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    publicKey: '',
    secretKey: '',
  });

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      // TODO: Criar tabela PaymentGateway no banco
      // Por enquanto, dados mockados
      const mockGateways: Gateway[] = [
        {
          id: '1',
          name: 'Stripe Principal',
          provider: 'stripe',
          publicKey: 'pk_test_***************',
          isActive: true,
          createdAt: new Date().toISOString(),
          transactionsCount: 45,
        },
        {
          id: '2',
          name: 'Mercado Pago BR',
          provider: 'mercadopago',
          publicKey: 'TEST-***************',
          isActive: true,
          createdAt: new Date().toISOString(),
          transactionsCount: 23,
        },
      ];

      setGateways(mockGateways);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar gateways',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createGateway = async () => {
    try {
      if (!formData.name || !formData.provider || !formData.publicKey || !formData.secretKey) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Preencha todos os campos',
          variant: 'destructive',
        });
        return;
      }

      // TODO: Salvar no banco
      toast({
        title: '✅ Gateway adicionado!',
        description: `${formData.name} foi configurado com sucesso.`,
      });

      setIsDialogOpen(false);
      setFormData({
        name: '',
        provider: '',
        publicKey: '',
        secretKey: '',
      });

      loadGateways();
    } catch (error: any) {
      toast({
        title: 'Erro ao adicionar gateway',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleGatewayStatus = async (gatewayId: string, isActive: boolean) => {
    try {
      // TODO: Atualizar no banco
      toast({
        title: isActive ? 'Gateway ativado' : 'Gateway desativado',
        description: 'Status atualizado com sucesso',
      });

      loadGateways();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getProviderInfo = (provider: string) => {
    return GATEWAY_PROVIDERS.find(p => p.value === provider) || { label: provider, icon: '💳' };
  };

  const calculateStats = () => {
    return {
      total: gateways.length,
      active: gateways.filter(g => g.isActive).length,
      totalTransactions: gateways.reduce((acc, g) => acc + (g.transactionsCount || 0), 0),
    };
  };

  const stats = calculateStats();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gateways de Pagamento</h1>
            <p className="text-gray-500 dark:text-gray-400">Gerencie os meios de recebimento dos clientes</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Gateway
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Adicionar Gateway de Pagamento</DialogTitle>
                <DialogDescription>
                  Configure um novo meio de recebimento
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome do Gateway</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Stripe Principal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {GATEWAY_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          <div className="flex items-center gap-2">
                            <span>{provider.icon}</span>
                            <span>{provider.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="publicKey">Public Key</Label>
                  <Input
                    id="publicKey"
                    placeholder="pk_test_..."
                    value={formData.publicKey}
                    onChange={(e) => setFormData({ ...formData, publicKey: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="secretKey">Secret Key</Label>
                  <Input
                    id="secretKey"
                    type="password"
                    placeholder="sk_test_..."
                    value={formData.secretKey}
                    onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Esta chave será armazenada de forma segura e criptografada</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-purple-500" onClick={createGateway}>
                  Adicionar Gateway
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gateways Configurados</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total de meios de pagamento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gateways Ativos</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Recebendo pagamentos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transações</CardTitle>
              <Settings className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total processadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Gateways Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {gateways.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum gateway configurado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Adicione seu primeiro gateway de pagamento
                </p>
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Gateway
                </Button>
              </CardContent>
            </Card>
          ) : (
            gateways.map((gateway) => {
              const providerInfo = getProviderInfo(gateway.provider);
              return (
                <Card key={gateway.id} className="relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16 rounded-full ${
                    gateway.isActive ? 'bg-green-500/10' : 'bg-gray-500/10'
                  }`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl">{providerInfo.icon}</div>
                        <div>
                          <CardTitle className="text-lg">{gateway.name}</CardTitle>
                          <CardDescription>{providerInfo.label}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={gateway.isActive ? 'default' : 'outline'}>
                        {gateway.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Public Key</p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block overflow-hidden text-ellipsis">
                        {gateway.publicKey}
                      </code>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Transações</span>
                      <span className="font-medium">{gateway.transactionsCount || 0}</span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        size="sm"
                        onClick={() => {/* TODO: Editar gateway */}}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Configurar
                      </Button>
                      <Button
                        variant={gateway.isActive ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => toggleGatewayStatus(gateway.id, !gateway.isActive)}
                      >
                        {gateway.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}

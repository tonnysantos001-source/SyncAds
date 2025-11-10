import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Check,
  X,
  Zap,
  Crown,
  Star,
  MessageSquare,
  Image as ImageIcon,
  ShoppingBag,
  Globe,
  BarChart3,
  Headphones,
  Code,
  DollarSign,
  Percent,
  TrendingUp,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  interval: 'day' | 'week' | 'month' | 'year' | 'lifetime';
  intervalCount: number;
  features: string[];
  maxAiMessages: number;
  maxAiMessagesDaily: number;
  maxAiImagesDaily: number;
  maxProjects: number;
  maxIntegrations: number;
  maxCheckoutPages: number;
  maxProducts: number;
  hasCustomDomain: boolean;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
  transactionFeePercentage: number;
  transactionFeeFixed: number;
  active: boolean;
  isPopular: boolean;
  sortOrder: number;
  stripePriceId: string;
  stripeProductId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    subscriptions: number;
  };
}

interface Stats {
  totalPlans: number;
  activePlans: number;
  totalSubscriptions: number;
  totalMRR: number;
}

export default function PlansManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPlans: 0,
    activePlans: 0,
    totalSubscriptions: 0,
    totalMRR: 0,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    currency: 'BRL',
    interval: 'month' as const,
    intervalCount: 1,
    features: [] as string[],
    maxAiMessages: 0,
    maxAiMessagesDaily: 10,
    maxAiImagesDaily: 5,
    maxProjects: 1,
    maxIntegrations: 1,
    maxCheckoutPages: 1,
    maxProducts: 10,
    hasCustomDomain: false,
    hasAdvancedAnalytics: false,
    hasPrioritySupport: false,
    hasApiAccess: false,
    transactionFeePercentage: 0,
    transactionFeeFixed: 0,
    active: true,
    isPopular: false,
    sortOrder: 0,
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPlans(), loadStats()]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from('Plan')
      .select('*')
      .order('sortOrder', { ascending: true });

    if (error) throw error;

    // Buscar contagem de assinaturas por plano
    const plansWithCount = await Promise.all(
      (data || []).map(async (plan) => {
        const { count } = await supabase
          .from('Subscription')
          .select('*', { count: 'exact', head: true })
          .eq('planId', plan.id)
          .eq('status', 'active');

        return {
          ...plan,
          _count: { subscriptions: count || 0 },
        };
      })
    );

    setPlans(plansWithCount);
  };

  const loadStats = async () => {
    const { data: plansData } = await supabase.from('Plan').select('*');

    const { data: subsData } = await supabase
      .from('Subscription')
      .select('planId')
      .eq('status', 'active');

    const totalPlans = plansData?.length || 0;
    const activePlans = plansData?.filter(p => p.active).length || 0;
    const totalSubscriptions = subsData?.length || 0;

    // Calcular MRR
    let totalMRR = 0;
    if (subsData && plansData) {
      for (const sub of subsData) {
        const plan = plansData.find(p => p.id === sub.planId);
        if (plan) {
          totalMRR += plan.price;
        }
      }
    }

    setStats({
      totalPlans,
      activePlans,
      totalSubscriptions,
      totalMRR,
    });
  };

  const handleCreatePlan = async () => {
    try {
      const { error } = await supabase.from('Plan').insert({
        ...formData,
        features: JSON.stringify(formData.features),
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Plano criado com sucesso',
      });

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from('Plan')
        .update({
          ...formData,
          features: JSON.stringify(formData.features),
        })
        .eq('id', editingPlan.id);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Plano atualizado com sucesso',
      });

      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;

    try {
      const { error } = await supabase.from('Plan').delete().eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Plano excluído com sucesso',
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTogglePlan = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('Plan')
        .update({ active: !currentStatus })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: `Plano ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      currency: 'BRL',
      interval: 'month',
      intervalCount: 1,
      features: [],
      maxAiMessages: 0,
      maxAiMessagesDaily: 10,
      maxAiImagesDaily: 5,
      maxProjects: 1,
      maxIntegrations: 1,
      maxCheckoutPages: 1,
      maxProducts: 10,
      hasCustomDomain: false,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      hasApiAccess: false,
      transactionFeePercentage: 0,
      transactionFeeFixed: 0,
      active: true,
      isPopular: false,
      sortOrder: 0,
    });
    setNewFeature('');
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      interval: plan.interval,
      intervalCount: plan.intervalCount,
      features: Array.isArray(plan.features) ? plan.features : [],
      maxAiMessages: plan.maxAiMessages || 0,
      maxAiMessagesDaily: plan.maxAiMessagesDaily || 10,
      maxAiImagesDaily: plan.maxAiImagesDaily || 5,
      maxProjects: plan.maxProjects || 1,
      maxIntegrations: plan.maxIntegrations || 1,
      maxCheckoutPages: plan.maxCheckoutPages || 1,
      maxProducts: plan.maxProducts || 10,
      hasCustomDomain: plan.hasCustomDomain || false,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics || false,
      hasPrioritySupport: plan.hasPrioritySupport || false,
      hasApiAccess: plan.hasApiAccess || false,
      transactionFeePercentage: plan.transactionFeePercentage || 0,
      transactionFeeFixed: plan.transactionFeeFixed || 0,
      active: plan.active,
      isPopular: plan.isPopular,
      sortOrder: plan.sortOrder,
    });
    setIsDialogOpen(true);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  const getPlanIcon = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('enterprise')) return Crown;
    if (name.includes('pro')) return Star;
    if (name.includes('starter')) return Zap;
    return ShoppingBag;
  };

  const getIntervalLabel = (interval: string, count: number) => {
    const labels: Record<string, string> = {
      day: 'dia',
      week: 'semana',
      month: 'mês',
      year: 'ano',
      lifetime: 'vitalício',
    };
    return count > 1 ? `${count} ${labels[interval]}s` : labels[interval];
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestão de Planos
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Configure planos, limites e preços para seus usuários
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingPlan(null);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
                </DialogTitle>
                <DialogDescription>
                  Configure todos os detalhes e limites do plano
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informações Básicas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Plano *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ex: Plano Pro"
                      />
                    </div>
                    <div>
                      <Label>Slug (URL) *</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="Ex: pro"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descrição do plano"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Preço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Preço e Cobrança</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Preço (R$) *</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: parseFloat(e.target.value) })
                        }
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <Label>Intervalo</Label>
                      <Select
                        value={formData.interval}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, interval: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">Diário</SelectItem>
                          <SelectItem value="week">Semanal</SelectItem>
                          <SelectItem value="month">Mensal</SelectItem>
                          <SelectItem value="year">Anual</SelectItem>
                          <SelectItem value="lifetime">Vitalício</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Quantidade</Label>
                      <Input
                        type="number"
                        value={formData.intervalCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            intervalCount: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Limites Diários de IA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Limites Diários de IA</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mensagens IA por Dia</Label>
                      <Input
                        type="number"
                        value={formData.maxAiMessagesDaily}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAiMessagesDaily: parseInt(e.target.value),
                          })
                        }
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        0 = ilimitado
                      </p>
                    </div>
                    <div>
                      <Label>Imagens IA por Dia</Label>
                      <Input
                        type="number"
                        value={formData.maxAiImagesDaily}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAiImagesDaily: parseInt(e.target.value),
                          })
                        }
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        0 = ilimitado
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outros Limites */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Limites de Recursos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Páginas de Checkout</Label>
                      <Input
                        type="number"
                        value={formData.maxCheckoutPages}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxCheckoutPages: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Produtos</Label>
                      <Input
                        type="number"
                        value={formData.maxProducts}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxProducts: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Projetos</Label>
                      <Input
                        type="number"
                        value={formData.maxProjects}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxProjects: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Integrações</Label>
                      <Input
                        type="number"
                        value={formData.maxIntegrations}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxIntegrations: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Taxas de Transação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Taxas de Transação</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Taxa Percentual (%)</Label>
                      <Input
                        type="number"
                        value={formData.transactionFeePercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transactionFeePercentage: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        max={100}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <Label>Taxa Fixa (R$)</Label>
                      <Input
                        type="number"
                        value={formData.transactionFeeFixed}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transactionFeeFixed: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                </div>

                {/* Features Booleanas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Features Incluídas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Domínio Personalizado</Label>
                      <Switch
                        checked={formData.hasCustomDomain}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasCustomDomain: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Analytics Avançado</Label>
                      <Switch
                        checked={formData.hasAdvancedAnalytics}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasAdvancedAnalytics: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Suporte Prioritário</Label>
                      <Switch
                        checked={formData.hasPrioritySupport}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasPrioritySupport: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Acesso à API</Label>
                      <Switch
                        checked={formData.hasApiAccess}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasApiAccess: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Lista de Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Features Descritivas</h3>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Digite uma feature e pressione Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button type="button" onClick={addFeature}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                      >
                        <span className="text-sm">{feature}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configurações Adicionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <Label>Plano Ativo</Label>
                      <Switch
                        checked={formData.active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, active: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Marcar como Popular</Label>
                      <Switch
                        checked={formData.isPopular}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isPopular: checked })
                        }
                      />
                    </div>
                    <div>
                      <Label>Ordem de Exibição</Label>
                      <Input
                        type="number"
                        value={formData.sortOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sortOrder: parseInt(e.target.value),
                          })
                        }
                        min={0}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}>
                  {editingPlan ? 'Atualizar' : 'Criar'} Plano
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Planos</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePlans} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground">Total de assinantes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Receita mensal recorrente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">ARR</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats.totalMRR * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">Receita anual recorrente</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Info */}
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertTitle>Limites Diários de IA</AlertTitle>
          <AlertDescription>
            Configure quantas mensagens e imagens cada plano pode gerar por dia. Os contadores são reset

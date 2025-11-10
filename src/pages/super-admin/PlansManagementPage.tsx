import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  HiCurrencyDollar,
  HiUsers,
  HiPlus,
  HiPencil,
  HiTrash,
  HiXMark,
  HiChatBubbleBottomCenterText,
  HiShoppingBag,
  HiGlobeAlt,
  HiChartBar,
  HiPhone,
  HiCodeBracket,
  HiArrowTrendingUp,
  HiRocketLaunch,
  HiBolt,
  HiStar,
} from "react-icons/hi2";
import { IoRocketSharp, IoPower } from "react-icons/io5";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  interval: "day" | "week" | "month" | "year" | "lifetime";
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

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  gradient: string;
  delay?: number;
}

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  gradient,
  delay = 0,
}: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02 }}
  >
    <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl hover:border-gray-600 transition-all group cursor-pointer relative overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 group-hover:opacity-20 transition-opacity`}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <div
          className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
        >
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <p className="text-xs text-gray-400">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

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
    name: "",
    slug: "",
    description: "",
    price: 0,
    currency: "BRL",
    interval: "month" as const,
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
  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadPlans(), loadStats()]);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    const { data, error } = await supabase
      .from("PricingPlan")
      .select("*")
      .order("sortOrder", { ascending: true });

    if (error) throw error;

    // Buscar contagem de assinaturas por plano
    const plansWithCount = await Promise.all(
      (data || []).map(async (plan) => {
        const { count } = await supabase
          .from("Subscription")
          .select("*", { count: "exact", head: true })
          .eq("planId", plan.id)
          .eq("status", "active");

        return {
          ...plan,
          _count: { subscriptions: count || 0 },
        };
      }),
    );

    setPlans(plansWithCount);
  };

  const loadStats = async () => {
    const { data: plansData } = await supabase.from("PricingPlan").select("*");

    const { data: subsData } = await supabase
      .from("Subscription")
      .select("planId")
      .eq("status", "active");

    const totalPlans = plansData?.length || 0;
    const activePlans = plansData?.filter((p) => p.active).length || 0;
    const totalSubscriptions = subsData?.length || 0;

    // Calcular MRR
    let totalMRR = 0;
    if (subsData && plansData) {
      for (const sub of subsData) {
        const plan = plansData.find((p) => p.id === sub.planId);
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
      const { error } = await supabase.from("PricingPlan").insert({
        ...formData,
        features: JSON.stringify(formData.features),
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano criado com sucesso",
      });

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan) return;

    try {
      const { error } = await supabase
        .from("PricingPlan")
        .update({
          ...formData,
          features: JSON.stringify(formData.features),
        })
        .eq("id", editingPlan.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano atualizado com sucesso",
      });

      setIsDialogOpen(false);
      setEditingPlan(null);
      resetForm();
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const { error } = await supabase
        .from("PricingPlan")
        .delete()
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano excluído com sucesso",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTogglePlan = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("PricingPlan")
        .update({ active: !currentStatus })
        .eq("id", planId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Plano ${!currentStatus ? "ativado" : "desativado"} com sucesso`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: 0,
      currency: "BRL",
      interval: "month",
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
    setNewFeature("");
  };

  const openEditDialog = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || "",
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
      setNewFeature("");
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
    if (name.includes("enterprise")) return HiRocketLaunch;
    if (name.includes("pro")) return HiStar;
    if (name.includes("starter")) return HiBolt;
    return IoRocketSharp;
  };

  const getIntervalLabel = (interval: string, count: number) => {
    const labels: Record<string, string> = {
      day: "dia",
      week: "semana",
      month: "mês",
      year: "ano",
      lifetime: "vitalício",
    };
    return count > 1 ? `${count} ${labels[interval]}s` : labels[interval];
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full"
          />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
              Gestão de Planos
            </h1>
            <p className="text-gray-400 mt-1">
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
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
              >
                <HiPlus className="h-5 w-5 mr-2" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingPlan ? "Editar Plano" : "Criar Novo Plano"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure todos os detalhes e limites do plano
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Nome do Plano *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ex: Plano Pro"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Slug (URL) *</Label>
                      <Input
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="Ex: pro"
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-gray-300">Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descrição do plano"
                      rows={3}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                </div>

                {/* Preço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Preço e Cobrança
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-gray-300">Preço (R$) *</Label>
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        step={0.01}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Intervalo</Label>
                      <Select
                        value={formData.interval}
                        onValueChange={(value: any) =>
                          setFormData({ ...formData, interval: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="day">Diário</SelectItem>
                          <SelectItem value="week">Semanal</SelectItem>
                          <SelectItem value="month">Mensal</SelectItem>
                          <SelectItem value="year">Anual</SelectItem>
                          <SelectItem value="lifetime">Vitalício</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-gray-300">Quantidade</Label>
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
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Limites Diários de IA */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Limites Diários de IA
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="maxAiMessagesDaily"
                        className="text-gray-300"
                      >
                        Mensagens IA por Dia *
                      </Label>
                      <Input
                        id="maxAiMessagesDaily"
                        type="number"
                        value={formData.maxAiMessagesDaily}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAiMessagesDaily: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        0 = ilimitado | Mensagens de chat com IA por dia
                      </p>
                    </div>
                    <div>
                      <Label
                        htmlFor="maxAiImagesDaily"
                        className="text-gray-300"
                      >
                        Imagens IA por Dia *
                      </Label>
                      <Input
                        id="maxAiImagesDaily"
                        type="number"
                        value={formData.maxAiImagesDaily}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxAiImagesDaily: parseInt(e.target.value) || 0,
                          })
                        }
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        0 = ilimitado | Imagens geradas por IA por dia
                      </p>
                    </div>
                  </div>
                </div>

                {/* Outros Limites */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Limites de Recursos
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">
                        Páginas de Checkout
                      </Label>
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
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Produtos</Label>
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
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Projetos</Label>
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
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Integrações</Label>
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
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Taxas de Transação */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Taxas de Transação
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">
                        Taxa Percentual (%)
                      </Label>
                      <Input
                        type="number"
                        value={formData.transactionFeePercentage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transactionFeePercentage: parseFloat(
                              e.target.value,
                            ),
                          })
                        }
                        min={0}
                        max={100}
                        step={0.01}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Taxa Fixa (R$)</Label>
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
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Features Booleanas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Features Incluídas
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">
                        Domínio Personalizado
                      </Label>
                      <Switch
                        checked={formData.hasCustomDomain}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, hasCustomDomain: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">
                        Analytics Avançado
                      </Label>
                      <Switch
                        checked={formData.hasAdvancedAnalytics}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            hasAdvancedAnalytics: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">
                        Suporte Prioritário
                      </Label>
                      <Switch
                        checked={formData.hasPrioritySupport}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            hasPrioritySupport: checked,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">Acesso à API</Label>
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
                  <h3 className="text-lg font-semibold text-white">
                    Features Descritivas
                  </h3>
                  <div className="flex gap-2">
                    <Input
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      placeholder="Digite uma feature e pressione Enter"
                      className="bg-gray-800 border-gray-700 text-white"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addFeature();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={addFeature}
                      className="bg-gray-800 hover:bg-gray-700 border-gray-700"
                    >
                      <HiPlus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-800/50 border border-gray-700 rounded"
                      >
                        <span className="text-sm text-white">{feature}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                          className="hover:bg-gray-700"
                        >
                          <HiXMark className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configurações Adicionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Configurações
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">Plano Ativo</Label>
                      <Switch
                        checked={formData.active}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, active: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">
                        Marcar como Popular
                      </Label>
                      <Switch
                        checked={formData.isPopular}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isPopular: checked })
                        }
                      />
                    </div>
                    <div className="p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                      <Label className="text-gray-300">Ordem de Exibição</Label>
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
                        className="bg-gray-800 border-gray-700 text-white mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                >
                  {editingPlan ? "Atualizar" : "Criar"} Plano
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total de Planos"
            value={stats.totalPlans}
            description={`${stats.activePlans} ativos`}
            icon={HiShoppingBag}
            gradient="from-orange-500 to-red-500"
            delay={0.1}
          />
          <StatCard
            title="Assinaturas Ativas"
            value={stats.totalSubscriptions}
            description="Total de assinantes"
            icon={HiUsers}
            gradient="from-blue-500 to-cyan-500"
            delay={0.2}
          />
          <StatCard
            title="MRR"
            value={`R$ ${stats.totalMRR.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`}
            description="Receita mensal recorrente"
            icon={HiCurrencyDollar}
            gradient="from-green-500 to-emerald-500"
            delay={0.3}
          />
          <StatCard
            title="ARR"
            value={`R$ ${(stats.totalMRR * 12).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`}
            description="Receita anual recorrente"
            icon={HiArrowTrendingUp}
            gradient="from-purple-500 to-pink-500"
            delay={0.4}
          />
        </div>

        {/* Alert Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Alert className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <HiChatBubbleBottomCenterText className="h-4 w-4 text-purple-400" />
            <AlertTitle className="text-white">
              Limites Diários de IA
            </AlertTitle>
            <AlertDescription className="text-gray-400">
              Configure quantas mensagens e imagens cada plano pode gerar por
              dia. Os contadores são resetados automaticamente à meia-noite.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Plans Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Planos Disponíveis</CardTitle>
              <CardDescription className="text-gray-400">
                Gerenciar todos os planos de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              {plans.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">Nenhum plano configurado</p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
                  >
                    <HiPlus className="h-4 w-4 mr-2" />
                    Criar Primeiro Plano
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan, index) => {
                    const Icon = getPlanIcon(plan.name);
                    return (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={`border-gray-700/50 bg-gray-800/50 backdrop-blur-xl ${!plan.active ? "opacity-60" : ""}`}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`p-3 rounded-lg ${plan.active ? "bg-gradient-to-br from-orange-500/20 to-red-500/20" : "bg-gray-800"}`}
                                >
                                  <Icon
                                    className={`h-6 w-6 ${plan.active ? "text-orange-400" : "text-gray-500"}`}
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CardTitle className="text-xl text-white">
                                      {plan.name}
                                    </CardTitle>
                                    {plan.isPopular && (
                                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                        Popular
                                      </Badge>
                                    )}
                                    <Badge
                                      className={
                                        plan.active
                                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 border"
                                          : "bg-gray-700/50 text-gray-400 border-gray-600"
                                      }
                                    >
                                      {plan.active ? "Ativo" : "Inativo"}
                                    </Badge>
                                  </div>
                                  <CardDescription className="text-gray-400">
                                    {plan.description}
                                  </CardDescription>
                                  <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-white">
                                      R${" "}
                                      {plan.price.toLocaleString("pt-BR", {
                                        minimumFractionDigits: 2,
                                      })}
                                    </span>
                                    <span className="text-sm text-gray-400">
                                      /{" "}
                                      {getIntervalLabel(
                                        plan.interval,
                                        plan.intervalCount,
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleTogglePlan(plan.id, plan.active)
                                  }
                                  className="hover:bg-gray-700 text-gray-300"
                                >
                                  <IoPower
                                    className={`h-4 w-4 ${plan.active ? "text-red-400" : "text-green-400"}`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditDialog(plan)}
                                  className="hover:bg-gray-700 text-gray-300"
                                >
                                  <HiPencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePlan(plan.id)}
                                  className="hover:bg-gray-700 text-red-400"
                                >
                                  <HiTrash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  Msgs IA/dia
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {plan.maxAiMessagesDaily || "∞"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  Imgs IA/dia
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {plan.maxAiImagesDaily || "∞"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  Checkouts
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {plan.maxCheckoutPages}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-400 mb-1">
                                  Assinantes
                                </p>
                                <p className="text-lg font-semibold text-white">
                                  {plan._count?.subscriptions || 0}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {plan.hasCustomDomain && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-gray-600 text-gray-300"
                                >
                                  <HiGlobeAlt className="h-3 w-3" />
                                  Domínio Personalizado
                                </Badge>
                              )}
                              {plan.hasAdvancedAnalytics && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-gray-600 text-gray-300"
                                >
                                  <HiChartBar className="h-3 w-3" />
                                  Analytics Avançado
                                </Badge>
                              )}
                              {plan.hasPrioritySupport && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-gray-600 text-gray-300"
                                >
                                  <HiPhone className="h-3 w-3" />
                                  Suporte Prioritário
                                </Badge>
                              )}
                              {plan.hasApiAccess && (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1 border-gray-600 text-gray-300"
                                >
                                  <HiCodeBracket className="h-3 w-3" />
                                  Acesso API
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiArrowsRightLeft,
  HiClock,
  HiCurrencyDollar,
  HiExclamationCircle,
  HiChartBar,
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiBanknotes,
} from "react-icons/hi2";
import { IoPower } from "react-icons/io5";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { autoDetectGateway } from "@/lib/gateways/gatewayAutoDetect";

interface PaymentSplitRule {
  id: string;
  name: string;
  description: string;
  type: "frequency" | "percentage" | "value" | "time";
  frequencyEvery: number;
  frequencyTake: number;
  percentage: number | null;
  minValue: number | null;
  maxValue: number | null;
  adminGatewayId: string | null;
  isActive: boolean;
  priority: number;
  transactionCounter: number;
  totalTransactions: number;
  adminTransactions: number;
  clientTransactions: number;
  totalAdminRevenue: number;
  createdAt: string;
}

interface Stats {
  totalTransactions: number;
  adminTransactions: number;
  clientTransactions: number;
  adminRevenue: number;
  splitPercentage: number;
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

export default function PaymentSplitPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<PaymentSplitRule[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalTransactions: 0,
    adminTransactions: 0,
    clientTransactions: 0,
    adminRevenue: 0,
    splitPercentage: 0,
  });
  const [gateways, setGateways] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PaymentSplitRule | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "frequency" as "frequency" | "percentage" | "value" | "time",
    frequencyEvery: 10,
    frequencyTake: 2,
    percentage: 20,
    minValue: 0,
    maxValue: 0,
    adminGatewayId: "",
    isActive: true,
    priority: 0,
  });
  const [adminCredentials, setAdminCredentials] = useState({
    publicKey: "",
    secretKey: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [credentialsStatus, setCredentialsStatus] = useState<{
    configured: boolean;
    publicKey?: string;
    gatewayName?: string;
    gatewaySlug?: string;
  }>({ configured: false });

  useEffect(() => {
    loadData();
    loadAdminCredentials();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRules(), loadStats(), loadGateways()]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRules = async () => {
    const { data, error } = await supabase
      .from("PaymentSplitRule")
      .select("*")
      .order("priority", { ascending: false });

    if (!error && data) {
      setRules(data);
    }
  };

  const loadStats = async () => {
    const { data } = await supabase
      .from("PaymentSplitLog")
      .select("decision, adminRevenue");

    if (data) {
      const totalTransactions = data.length;
      const adminTransactions = data.filter(
        (log: any) => log.decision === "admin",
      ).length;
      const clientTransactions = data.filter(
        (log: any) => log.decision === "client",
      ).length;
      const adminRevenue = data.reduce(
        (sum: number, log: any) => sum + (log.adminRevenue || 0),
        0,
      );
      const splitPercentage =
        totalTransactions > 0
          ? (adminTransactions / totalTransactions) * 100
          : 0;

      setStats({
        totalTransactions,
        adminTransactions,
        clientTransactions,
        adminRevenue,
        splitPercentage,
      });
    }
  };

  const loadGateways = async () => {
    const { data } = await supabase
      .from("Gateway")
      .select("*")
      .eq("isActive", true)
      .order("name");
    if (data) setGateways(data);
  };

  const loadAdminCredentials = async () => {
    // Buscar configuração do gateway admin (Pague-X) no GatewayConfig
    const { data } = await supabase
      .from("GatewayConfig")
      .select("credentials")
      .eq("gatewayId", "ebac558d-e799-4246-b7fe-2c7c68393460") // ID do Pague-X
      .eq("userId", "admin") // Credenciais do admin
      .single();

    if (data?.credentials) {
      const creds = data.credentials as any;
      setCredentialsStatus({
        configured: true,
        publicKey: creds.publicKey?.substring(0, 20) + "***",
      });
      setAdminCredentials({
        publicKey: creds.publicKey || "",
        secretKey: creds.secretKey || "",
      });
    }
  };

  const handleSaveCredentials = async () => {
    if (!adminCredentials.publicKey || !adminCredentials.secretKey) {
      toast({
        title: "Erro",
        description: "Preencha Public Key e Secret Key",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Salvar no GatewayConfig
      const { error } = await supabase.from("GatewayConfig").upsert({
        gatewayId: "ebac558d-e799-4246-b7fe-2c7c68393460", // Pague-X
        userId: "admin",
        credentials: {
          publicKey: adminCredentials.publicKey,
          secretKey: adminCredentials.secretKey,
        },
        isActive: true,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Credenciais salvas com sucesso",
      });

      loadAdminCredentials();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!adminCredentials.publicKey && !adminCredentials.secretKey) {
      toast({
        title: "Erro",
        description: "Preencha pelo menos uma credencial antes de testar",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    try {
      // Auto-detectar gateway
      const result = await autoDetectGateway({
        publicKey: adminCredentials.publicKey,
        secretKey: adminCredentials.secretKey,
      });

      if (result.success && result.gateway) {
        toast({
          title: `${result.gateway.name} Detectado!`,
          description: result.message,
        });

        // Atualizar status com gateway detectado
        setCredentialsStatus({
          configured: true,
          publicKey: adminCredentials.publicKey?.substring(0, 20) + "***",
          gatewayName: result.gateway.name,
          gatewaySlug: result.gateway.slug,
        });
      } else {
        toast({
          title: "Gateway Não Detectado",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro de Conexão",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type as "frequency" | "percentage" | "value" | "time",
        frequencyEvery:
          (formData.type as string) === "frequency"
            ? formData.frequencyEvery
            : null,
        frequencyTake:
          (formData.type as string) === "frequency"
            ? formData.frequencyTake
            : null,
        percentage:
          (formData.type as string) === "percentage"
            ? formData.percentage
            : null,
        minValue:
          (formData.type as string) === "value" ? formData.minValue : null,
        maxValue:
          (formData.type as string) === "value" ? formData.maxValue : null,
        adminGatewayId: formData.adminGatewayId || null,
        isActive: formData.isActive,
        priority: formData.priority,
      };

      if (editingRule) {
        await supabase
          .from("PaymentSplitRule")
          .update(payload)
          .eq("id", editingRule.id);
        toast({
          title: "Sucesso!",
          description: "Regra atualizada com sucesso",
        });
      } else {
        await supabase.from("PaymentSplitRule").insert(payload);
        toast({ title: "Sucesso!", description: "Regra criada com sucesso" });
      }

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

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    await supabase
      .from("PaymentSplitRule")
      .update({ isActive: !currentStatus })
      .eq("id", ruleId);
    toast({
      title: "Sucesso!",
      description: `Regra ${!currentStatus ? "ativada" : "desativada"}`,
    });
    loadData();
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;
    await supabase.from("PaymentSplitRule").delete().eq("id", ruleId);
    toast({ title: "Sucesso!", description: "Regra excluída" });
    loadData();
  };

  const handleResetCounter = async (ruleId: string) => {
    await supabase
      .from("PaymentSplitRule")
      .update({ transactionCounter: 0 })
      .eq("id", ruleId);
    toast({ title: "Sucesso!", description: "Contador resetado" });
    loadData();
  };

  const openEdit = (rule: PaymentSplitRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      type: rule.type as "frequency" | "percentage" | "value" | "time",
      frequencyEvery: rule.frequencyEvery || 10,
      frequencyTake: rule.frequencyTake || 2,
      percentage: rule.percentage || 20,
      minValue: rule.minValue || 0,
      maxValue: rule.maxValue || 0,
      adminGatewayId: rule.adminGatewayId || "",
      isActive: rule.isActive,
      priority: rule.priority,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "frequency",
      frequencyEvery: 10,
      frequencyTake: 2,
      percentage: 20,
      minValue: 0,
      maxValue: 0,
      adminGatewayId: "",
      isActive: true,
      priority: 0,
    });
    setEditingRule(null);
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case "frequency":
        return HiArrowsRightLeft;
      case "percentage":
        return HiBanknotes;
      case "value":
        return HiCurrencyDollar;
      case "time":
        return HiClock;
      default:
        return HiChartBar;
    }
  };

  const getRuleDescription = (rule: PaymentSplitRule) => {
    switch (rule.type) {
      case "frequency":
        return `A cada ${rule.frequencyEvery} transações, ${rule.frequencyTake} vão para o admin`;
      case "percentage":
        return `${rule.percentage}% das transações para o admin`;
      case "value":
        return `Transações entre R$ ${rule.minValue || 0} e R$ ${rule.maxValue || "∞"}`;
      default:
        return rule.description || "";
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full"
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Split de Pagamento
            </h1>
            <p className="text-gray-400 mt-1">
              Controle a distribuição de transações entre seu gateway e o dos
              clientes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <HiPlus className="h-5 w-5 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingRule ? "Editar Regra" : "Criar Nova Regra"}
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Configure como as transações serão distribuídas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300">Nome da Regra</Label>
                  <Input
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData({ ...formData, name: e.target.value });
                    }}
                    placeholder="Ex: Split 20% Admin"
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData({ ...formData, description: e.target.value });
                    }}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Tipo de Regra</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="frequency">
                        Frequência (A cada X transações)
                      </SelectItem>
                      <SelectItem value="percentage">
                        Percentual (X% das transações)
                      </SelectItem>
                      <SelectItem value="value">
                        Valor (Transações acima de X reais)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === "frequency" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">
                        A cada quantas transações?
                      </Label>
                      <Input
                        type="number"
                        value={formData.frequencyEvery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            frequencyEvery: parseInt(e.target.value),
                          })
                        }
                        min={1}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">
                        Quantas vão para o admin?
                      </Label>
                      <Input
                        type="number"
                        value={formData.frequencyTake}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            frequencyTake: parseInt(e.target.value),
                          })
                        }
                        min={1}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                )}

                {((formData.type as string) === "percentage" ||
                  (formData.type as string) === "value") && (
                  <div>
                    <Label className="text-gray-300">
                      Percentual para o admin (%)
                    </Label>
                    <Input
                      type="number"
                      value={formData.percentage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData({
                          ...formData,
                          percentage: parseFloat(e.target.value),
                        })
                      }
                      min={0}
                      max={100}
                      step={0.1}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                )}

                {((formData.type as string) === "value" ||
                  (formData.type as string) === "percentage") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-300">Valor Mínimo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.minValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            minValue: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        step={0.01}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-300">Valor Máximo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.maxValue}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData({
                            ...formData,
                            maxValue: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        step={0.01}
                        className="bg-gray-800 border-gray-700 text-white"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-gray-300">Gateway do Admin</Label>
                  <Select
                    value={formData.adminGatewayId}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, adminGatewayId: value })
                    }
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Selecione um gateway" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {gateways.map((gateway) => (
                        <SelectItem key={gateway.id} value={gateway.id}>
                          {gateway.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-300">
                    Prioridade (maior = maior prioridade)
                  </Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    min={0}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                  <Label className="text-gray-300">Regra Ativa</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
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
                  onClick={handleSave}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
                >
                  {editingRule ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            title="Total"
            value={stats.totalTransactions}
            description="Transações processadas"
            icon={HiChartBar}
            gradient="from-cyan-500 to-blue-500"
            delay={0.1}
          />
          <StatCard
            title="Admin"
            value={stats.adminTransactions}
            description={`${stats.splitPercentage.toFixed(1)}% do total`}
            icon={HiCheckCircle}
            gradient="from-green-500 to-emerald-500"
            delay={0.2}
          />
          <StatCard
            title="Cliente"
            value={stats.clientTransactions}
            description={`${(100 - stats.splitPercentage).toFixed(1)}% do total`}
            icon={HiXCircle}
            gradient="from-blue-500 to-indigo-500"
            delay={0.3}
          />
          <StatCard
            title="Receita Admin"
            value={`R$ ${stats.adminRevenue.toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
            })}`}
            description="Via split"
            icon={HiCurrencyDollar}
            gradient="from-purple-500 to-pink-500"
            delay={0.4}
          />
        </div>

        {/* Gateway Admin Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">
                Gateway do Admin (Seu Gateway)
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure o gateway que receberá as transações quando o split
                direcionar para o admin. Use suas credenciais da Pague-X ou
                outro gateway compatível.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="border-gray-700/50 bg-gray-800/50">
                  <HiExclamationCircle className="h-4 w-4 text-cyan-400" />
                  <AlertTitle className="text-white">
                    Sistema Multi-Gateway com Auto-Detecção
                  </AlertTitle>
                  <AlertDescription className="text-gray-400">
                    O sistema detecta automaticamente qual gateway você está
                    usando. Suporta: Pague-X, Mercado Pago, PagSeguro, Stripe,
                    Asaas e outros. Insira suas credenciais e clique em "Testar
                    Conexão".
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Gateway</Label>
                    {credentialsStatus.configured &&
                    credentialsStatus.gatewayName ? (
                      <div className="flex items-center gap-2 p-3 border-0 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 ring-1 ring-green-200 dark:ring-green-800/50">
                        <HiCheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-semibold text-white">
                          {credentialsStatus.gatewayName}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 border-0 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm text-gray-400 ring-1 ring-gray-200 dark:ring-gray-700">
                        Auto-detectado após testar conexão
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Suportamos: Pague-X, Mercado Pago, PagSeguro, Stripe,
                      Asaas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Public Key</Label>
                    <Input
                      type="text"
                      placeholder="Sua Public Key da Pague-X"
                      className="font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      value={adminCredentials.publicKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAdminCredentials({
                          ...adminCredentials,
                          publicKey: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Secret Key</Label>
                    <Input
                      type="password"
                      placeholder="Sua Secret Key da Pague-X"
                      className="font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      value={adminCredentials.secretKey}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setAdminCredentials({
                          ...adminCredentials,
                          secretKey: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveCredentials} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <HiArrowPath className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <HiCheckCircle className="h-4 w-4 mr-2" />
                        Salvar Credenciais
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <>
                        <HiArrowPath className="h-4 w-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      "Testar Conexão"
                    )}
                  </Button>
                </div>

                {credentialsStatus.configured && (
                  <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 backdrop-blur-sm rounded-xl border-0 ring-1 ring-blue-200/50 dark:ring-blue-700/50 shadow-lg">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg">
                        <HiCurrencyDollar className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-white mb-1">
                          Gateway Configurado
                        </h4>
                        <p className="text-sm text-gray-300">
                          {credentialsStatus.gatewayName || "Gateway"} •
                          Configurado e ativo
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-mono">
                          Public Key: {credentialsStatus.publicKey}
                        </p>
                      </div>
                      <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-md">
                        Ativo
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alert */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Alert className="border-gray-700/50 bg-gray-800/50">
            <HiExclamationCircle className="h-5 w-5 text-cyan-400" />
            <AlertTitle className="text-white">Como funciona?</AlertTitle>
            <AlertDescription className="text-gray-400">
              O sistema distribui automaticamente as transações entre seu
              gateway (configurado acima) e o gateway do cliente. Configure
              regras baseadas em frequência, percentual ou valor.
            </AlertDescription>
          </Alert>
        </motion.div>

        {/* Rules Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="border-gray-700/50 bg-gray-900/50 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HiChartBar className="h-6 w-6 text-cyan-600" />
                Regras Configuradas
              </CardTitle>
              <CardDescription className="text-gray-400">
                Gerenciar regras de split de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rules.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-4 rounded-xl bg-gray-800 w-fit mx-auto mb-4">
                    <HiChartBar className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-6 text-lg font-medium">
                    Nenhuma regra configurada
                  </p>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <HiPlus className="h-5 w-5 mr-2" />
                    Criar Primeira Regra
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden border-gray-700/50">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-800/30">
                        <TableHead className="font-semibold text-gray-300">
                          Nome
                        </TableHead>
                        <TableHead className="font-semibold text-gray-300">
                          Tipo
                        </TableHead>
                        <TableHead className="font-semibold text-gray-300">
                          Configuração
                        </TableHead>
                        <TableHead className="font-semibold text-gray-300">
                          Contador
                        </TableHead>
                        <TableHead className="font-semibold text-gray-300">
                          Stats
                        </TableHead>
                        <TableHead className="font-semibold text-gray-300">
                          Status
                        </TableHead>
                        <TableHead className="text-right font-semibold text-gray-300">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((rule, index) => {
                        const Icon = getRuleIcon(rule.type);
                        return (
                          <motion.tr
                            key={rule.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors"
                          >
                            <TableCell>
                              <div className="font-semibold text-white">
                                {rule.name}
                              </div>
                              <div className="text-sm text-gray-400">
                                {rule.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="flex items-center gap-1 w-fit bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border-0">
                                <Icon className="h-3 w-3" />
                                {rule.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-300">
                              {getRuleDescription(rule)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-semibold text-white">
                                  {rule.transactionCounter}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetCounter(rule.id)}
                                  className="hover:bg-blue-500/10"
                                >
                                  <HiArrowPath className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm space-y-1">
                                <div className="font-medium text-white">
                                  Total: {rule.totalTransactions}
                                </div>
                                <div className="text-green-400 font-medium">
                                  Admin: {rule.adminTransactions}
                                </div>
                                <div className="text-blue-400 font-medium">
                                  Cliente: {rule.clientTransactions}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {rule.isActive ? (
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                                  Ativa
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-700 text-gray-300 border-0">
                                  Inativa
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleToggle(rule.id, rule.isActive)
                                  }
                                  className="hover:bg-gray-800/50 text-gray-400"
                                >
                                  <IoPower
                                    className={`h-4 w-4 ${rule.isActive ? "text-red-500" : "text-green-500"}`}
                                  />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEdit(rule)}
                                  className="hover:bg-blue-500/10 text-blue-400"
                                >
                                  <HiPencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(rule.id)}
                                  className="hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400"
                                >
                                  <HiTrash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}

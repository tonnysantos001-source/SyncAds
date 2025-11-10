import { useEffect, useState } from "react";
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
  Plus,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Shuffle,
  Clock,
  DollarSign,
  Percent,
  AlertCircle,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    type: "frequency" as const,
    frequencyEvery: 10,
    frequencyTake: 2,
    percentage: 20,
    minValue: 0,
    maxValue: 0,
    adminGatewayId: "",
    isActive: true,
    priority: 0,
  });

  useEffect(() => {
    loadData();
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
        (log) => log.decision === "admin",
      ).length;
      const clientTransactions = data.filter(
        (log) => log.decision === "client",
      ).length;
      const adminRevenue = data.reduce(
        (sum, log) => sum + (log.adminRevenue || 0),
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

  const handleSave = async () => {
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        frequencyEvery:
          formData.type === "frequency" ? formData.frequencyEvery : null,
        frequencyTake:
          formData.type === "frequency" ? formData.frequencyTake : null,
        percentage: formData.type === "percentage" ? formData.percentage : null,
        minValue: formData.type === "value" ? formData.minValue : null,
        maxValue: formData.type === "value" ? formData.maxValue : null,
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
      type: rule.type,
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
        return Shuffle;
      case "percentage":
        return Percent;
      case "value":
        return DollarSign;
      case "time":
        return Clock;
      default:
        return Activity;
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
              Split de Pagamento
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Controle a distribuição de transações entre seu gateway e o dos
              clientes
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Editar Regra" : "Criar Nova Regra"}
                </DialogTitle>
                <DialogDescription>
                  Configure como as transações serão distribuídas
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Nome da Regra</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Split 20% Admin"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Tipo de Regra</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                      <Label>A cada quantas transações?</Label>
                      <Input
                        type="number"
                        value={formData.frequencyEvery}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            frequencyEvery: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                    <div>
                      <Label>Quantas vão para o admin?</Label>
                      <Input
                        type="number"
                        value={formData.frequencyTake}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            frequencyTake: parseInt(e.target.value),
                          })
                        }
                        min={1}
                      />
                    </div>
                  </div>
                )}

                {formData.type === "percentage" && (
                  <div>
                    <Label>Percentual para o admin (%)</Label>
                    <Input
                      type="number"
                      value={formData.percentage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          percentage: parseFloat(e.target.value),
                        })
                      }
                      min={0}
                      max={100}
                      step={0.1}
                    />
                  </div>
                )}

                {formData.type === "value" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Valor Mínimo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.minValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minValue: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <Label>Valor Máximo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.maxValue}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxValue: parseFloat(e.target.value),
                          })
                        }
                        min={0}
                        step={0.01}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label>Gateway do Admin</Label>
                  <Select
                    value={formData.adminGatewayId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, adminGatewayId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      {gateways.map((gateway) => (
                        <SelectItem key={gateway.id} value={gateway.id}>
                          {gateway.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridade (maior = maior prioridade)</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value),
                      })
                    }
                    min={0}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Regra Ativa</Label>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  {editingRule ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                Transações processadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admin</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.adminTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.splitPercentage.toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Cliente</CardTitle>
              <XCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.clientTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                {(100 - stats.splitPercentage).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Admin
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R${" "}
                {stats.adminRevenue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </div>
              <p className="text-xs text-muted-foreground">Via split</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Como funciona?</AlertTitle>
          <AlertDescription>
            O sistema distribui automaticamente as transações entre seu gateway
            e o gateway do cliente. Configure regras baseadas em frequência,
            percentual ou valor.
          </AlertDescription>
        </Alert>

        {/* Rules Table */}
        <Card>
          <CardHeader>
            <CardTitle>Regras Configuradas</CardTitle>
            <CardDescription>
              Gerenciar regras de split de pagamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">Nenhuma regra configurada</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Configuração</TableHead>
                    <TableHead>Contador</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => {
                    const Icon = getRuleIcon(rule.type);
                    return (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <div className="font-medium">{rule.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {rule.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1 w-fit"
                          >
                            <Icon className="h-3 w-3" />
                            {rule.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {getRuleDescription(rule)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">
                              {rule.transactionCounter}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetCounter(rule.id)}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>Total: {rule.totalTransactions}</div>
                            <div className="text-green-600">
                              Admin: {rule.adminTransactions}
                            </div>
                            <div className="text-blue-600">
                              Cliente: {rule.clientTransactions}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={rule.isActive ? "default" : "secondary"}
                          >
                            {rule.isActive ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggle(rule.id, rule.isActive)
                              }
                            >
                              {rule.isActive ? (
                                <PowerOff className="h-4 w-4" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(rule)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

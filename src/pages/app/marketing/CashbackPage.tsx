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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Gift,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cashbackApi,
  Cashback,
  CashbackType,
  CashbackStatus,
} from "@/lib/api/cashbackApi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const CashbackPage = () => {
  const [rules, setRules] = useState<Cashback[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<Cashback | null>(null);
  const [formData, setFormData] = useState<Partial<Cashback>>({
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: 0,
    status: "ACTIVE",
    firstPurchaseOnly: false,
  });
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesData, statsData, customersData] = await Promise.all([
        cashbackApi.listRules(user!.id),
        cashbackApi.getStats(user!.id),
        cashbackApi.getTopCustomers(user!.id, 10, "available"),
      ]);

      setRules(rulesData);
      setStats(statsData);
      setTopCustomers(customersData);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!user?.id) return;
      if (!formData.name || !formData.value) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome e valor do cashback",
          variant: "destructive",
        });
        return;
      }

      const data = {
        ...formData,
        userId: user.id,
      } as Omit<Cashback, "id" | "createdAt" | "updatedAt">;

      if (editingRule) {
        await cashbackApi.updateRule(editingRule.id, formData);
        toast({ title: "Regra atualizada com sucesso!" });
      } else {
        await cashbackApi.createRule(data);
        toast({ title: "Regra criada com sucesso!" });
      }

      setShowDialog(false);
      setEditingRule(null);
      setFormData({
        name: "",
        description: "",
        type: "PERCENTAGE",
        value: 0,
        status: "ACTIVE",
        firstPurchaseOnly: false,
      });
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (rule: Cashback) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta regra?")) return;

    try {
      await cashbackApi.deleteRule(id);
      toast({ title: "Regra excluída com sucesso!" });
      loadData();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await cashbackApi.toggleRule(id, isActive);
      toast({ title: isActive ? "Regra ativada!" : "Regra desativada!" });
      loadData();
    } catch (error: any) {
      console.error("Erro ao alternar status:", error);
      toast({
        title: "Erro ao alternar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: CashbackStatus) => {
    const statusMap = {
      ACTIVE: {
        label: "Ativo",
        variant: "default" as const,
        icon: CheckCircle,
      },
      INACTIVE: {
        label: "Inativo",
        variant: "secondary" as const,
        icon: AlertCircle,
      },
      EXPIRED: {
        label: "Expirado",
        variant: "destructive" as const,
        icon: AlertCircle,
      },
      SCHEDULED: {
        label: "Agendado",
        variant: "secondary" as const,
        icon: AlertCircle,
      },
    };
    return statusMap[status] || statusMap.INACTIVE;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Cashback
          </h1>
          <p className="text-gray-600 font-medium">
            Crie regras de cashback e fidelize seus clientes
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Regras Ativas
              </CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRules}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalRules} regras
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Distribuído
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalEarned)}
              </div>
              <p className="text-xs text-muted-foreground">
                Cashback total gerado
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponível</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.totalAvailable)}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando uso</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.customersWithCashback}
              </div>
              <p className="text-xs text-muted-foreground">
                Média: {formatCurrency(stats.averageCashbackPerCustomer)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="customers">Top Clientes</TabsTrigger>
        </TabsList>

        {/* Regras de Cashback */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Regras de Cashback</CardTitle>
                <CardDescription>
                  {rules.length} regra(s) cadastrada(s)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">
                    Nenhuma regra cadastrada
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie sua primeira regra de cashback
                  </p>
                  <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Regra
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Primeira Compra</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => {
                      const statusInfo = getStatusBadge(rule.status);
                      const Icon = statusInfo.icon;

                      return (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{rule.name}</div>
                              {rule.description && (
                                <div className="text-sm text-muted-foreground">
                                  {rule.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {rule.type === "PERCENTAGE"
                                ? "Percentual"
                                : "Valor Fixo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {rule.type === "PERCENTAGE"
                                ? `${rule.value}%`
                                : formatCurrency(rule.value)}
                            </div>
                            {rule.minOrderValue && (
                              <div className="text-sm text-muted-foreground">
                                Min: {formatCurrency(rule.minOrderValue)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={statusInfo.variant}
                                className="gap-1"
                              >
                                <Icon className="h-3 w-3" />
                                {statusInfo.label}
                              </Badge>
                              <Switch
                                checked={rule.status === "ACTIVE"}
                                onCheckedChange={(checked) =>
                                  handleToggle(rule.id, checked)
                                }
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            {rule.firstPurchaseOnly ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(rule.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(rule)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(rule.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
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
        </TabsContent>

        {/* Top Clientes */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes com Mais Cashback</CardTitle>
              <CardDescription>
                Top 10 clientes com cashback disponível
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : topCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cliente com cashback ainda
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Total Ganho</TableHead>
                      <TableHead>Disponível</TableHead>
                      <TableHead>Usado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topCustomers.map((customer) => (
                      <TableRow key={customer.customerId}>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {customer.customerId.substring(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(customer.totalEarned)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-600">
                            {formatCurrency(customer.available)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-muted-foreground">
                            {formatCurrency(customer.used)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regra" : "Nova Regra de Cashback"}
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros da regra de cashback
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Regra *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Cashback 5% em todas as compras"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: CashbackType) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentual</SelectItem>
                    <SelectItem value="FIXED_AMOUNT">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="value">
                  Valor * {formData.type === "PERCENTAGE" && "(%)"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      value: parseFloat(e.target.value),
                    })
                  }
                  placeholder={formData.type === "PERCENTAGE" ? "5" : "10.00"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="minOrderValue">Valor Mínimo do Pedido</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  step="0.01"
                  value={formData.minOrderValue || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minOrderValue: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxCashbackAmount">Cashback Máximo</Label>
                <Input
                  id="maxCashbackAmount"
                  type="number"
                  step="0.01"
                  value={formData.maxCashbackAmount || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxCashbackAmount: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: CashbackStatus) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="SCHEDULED">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="firstPurchaseOnly"
                checked={formData.firstPurchaseOnly}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, firstPurchaseOnly: checked })
                }
              />
              <Label htmlFor="firstPurchaseOnly" className="cursor-pointer">
                Apenas primeira compra do cliente
              </Label>
            </div>

            {formData.type === "PERCENTAGE" && formData.value > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Exemplo: Em uma compra de R$ 100,00, o cliente receberá{" "}
                  {formatCurrency(100 * (formData.value / 100))} de cashback
                  {formData.maxCashbackAmount &&
                    ` (limitado a ${formatCurrency(formData.maxCashbackAmount)})`}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingRule(null);
                setFormData({
                  name: "",
                  description: "",
                  type: "PERCENTAGE",
                  value: 0,
                  status: "ACTIVE",
                  firstPurchaseOnly: false,
                });
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CashbackPage;

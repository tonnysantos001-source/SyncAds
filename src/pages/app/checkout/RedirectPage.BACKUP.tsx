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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  MousePointer,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Target,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  redirectApi,
  RedirectRule,
  RedirectTrigger,
  RedirectStatus,
} from "@/lib/api/redirectApi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const RedirectPage = () => {
  const [rules, setRules] = useState<RedirectRule[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RedirectRule | null>(null);
  const [formData, setFormData] = useState<Partial<RedirectRule>>({
    name: "",
    description: "",
    trigger: "POST_PURCHASE",
    destinationUrl: "",
    status: "ACTIVE",
    priority: 1,
    openInNewTab: true,
    showConfirmation: false,
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
      const [rulesData, statsData] = await Promise.all([
        redirectApi.listRules(user!.id),
        redirectApi.getAnalytics(user!.id),
      ]);

      setRules(rulesData);
      setStats(statsData);
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
      if (!formData.name || !formData.destinationUrl) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome e URL de destino",
          variant: "destructive",
        });
        return;
      }

      const data = {
        ...formData,
        userId: user.id,
      } as Omit<
        RedirectRule,
        "id" | "currentRedirects" | "conversions" | "createdAt" | "updatedAt"
      >;

      if (editingRule) {
        await redirectApi.updateRule(editingRule.id, formData);
        toast({ title: "Regra atualizada com sucesso!" });
      } else {
        await redirectApi.createRule(data);
        toast({ title: "Regra criada com sucesso!" });
      }

      setShowDialog(false);
      setEditingRule(null);
      resetForm();
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

  const handleEdit = (rule: RedirectRule) => {
    setEditingRule(rule);
    setFormData(rule);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta regra?")) return;

    try {
      await redirectApi.deleteRule(id);
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
      await redirectApi.toggleRule(id, isActive);
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger: "POST_PURCHASE",
      destinationUrl: "",
      status: "ACTIVE",
      priority: 1,
      openInNewTab: true,
      showConfirmation: false,
    });
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getTriggerLabel = (trigger: RedirectTrigger) => {
    const labels: Record<RedirectTrigger, string> = {
      POST_PURCHASE: "Pós-Compra",
      ABANDONED_CART: "Carrinho Abandonado",
      EXIT_INTENT: "Intenção de Saída",
      TIME_DELAY: "Tempo na Página",
      SCROLL_PERCENTAGE: "Rolagem de Página",
      IDLE: "Inatividade",
      FIRST_VISIT: "Primeira Visita",
      RETURNING_VISITOR: "Visitante Retornante",
    };
    return labels[trigger];
  };

  const getStatusBadge = (status: RedirectStatus) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Redirecionamentos
          </h1>
          <p className="text-muted-foreground">
            Configure redirecionamentos inteligentes para maximizar conversões
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Regras Ativas
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeRules}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalRules} regras
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Redirecionamentos
              </CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRedirects}</div>
              <p className="text-xs text-muted-foreground">Cliques totais</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalConversions}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa: {formatPercent(stats.conversionRate)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Gerada
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket: R$ {stats.averageOrderValue.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Regras de Redirecionamento */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Regras de Redirecionamento</CardTitle>
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
              <ExternalLink className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                Nenhuma regra cadastrada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie sua primeira regra de redirecionamento
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
                  <TableHead>Trigger</TableHead>
                  <TableHead>URL Destino</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Redirecionamentos
                  </TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Taxa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => {
                  const statusInfo = getStatusBadge(rule.status);
                  const Icon = statusInfo.icon;
                  const conversionRate =
                    rule.currentRedirects > 0
                      ? (rule.conversions / rule.currentRedirects) * 100
                      : 0;

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
                          {getTriggerLabel(rule.trigger)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <a
                          href={rule.destinationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {rule.destinationUrl.substring(0, 40)}...
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} className="gap-1">
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
                      <TableCell className="text-right">
                        {rule.currentRedirects}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">
                          {rule.conversions}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {formatPercent(conversionRate)}
                        </Badge>
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

      {/* Dialog Criar/Editar */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? "Editar Regra" : "Nova Regra de Redirecionamento"}
            </DialogTitle>
            <DialogDescription>
              Configure quando e para onde redirecionar seus usuários
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
                placeholder="Ex: Upsell pós-compra"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="trigger">Trigger *</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value: RedirectTrigger) =>
                    setFormData({ ...formData, trigger: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST_PURCHASE">Pós-Compra</SelectItem>
                    <SelectItem value="ABANDONED_CART">
                      Carrinho Abandonado
                    </SelectItem>
                    <SelectItem value="EXIT_INTENT">
                      Intenção de Saída
                    </SelectItem>
                    <SelectItem value="TIME_DELAY">Tempo na Página</SelectItem>
                    <SelectItem value="SCROLL_PERCENTAGE">
                      Rolagem de Página
                    </SelectItem>
                    <SelectItem value="IDLE">Inatividade</SelectItem>
                    <SelectItem value="FIRST_VISIT">Primeira Visita</SelectItem>
                    <SelectItem value="RETURNING_VISITOR">
                      Visitante Retornante
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value),
                    })
                  }
                  placeholder="1"
                />
              </div>
            </div>

            {/* Trigger específico: TIME_DELAY */}
            {formData.trigger === "TIME_DELAY" && (
              <div className="grid gap-2">
                <Label htmlFor="triggerDelay">Delay (segundos)</Label>
                <Input
                  id="triggerDelay"
                  type="number"
                  value={formData.triggerDelay || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      triggerDelay: parseInt(e.target.value),
                    })
                  }
                  placeholder="30"
                />
              </div>
            )}

            {/* Trigger específico: SCROLL_PERCENTAGE */}
            {formData.trigger === "SCROLL_PERCENTAGE" && (
              <div className="grid gap-2">
                <Label htmlFor="triggerScrollPercentage">
                  Porcentagem de Rolagem (%)
                </Label>
                <Input
                  id="triggerScrollPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.triggerScrollPercentage || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      triggerScrollPercentage: parseInt(e.target.value),
                    })
                  }
                  placeholder="75"
                />
              </div>
            )}

            {/* Trigger específico: IDLE */}
            {formData.trigger === "IDLE" && (
              <div className="grid gap-2">
                <Label htmlFor="triggerIdleTime">
                  Tempo de Inatividade (segundos)
                </Label>
                <Input
                  id="triggerIdleTime"
                  type="number"
                  value={formData.triggerIdleTime || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      triggerIdleTime: parseInt(e.target.value),
                    })
                  }
                  placeholder="60"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="destinationUrl">URL de Destino *</Label>
              <Input
                id="destinationUrl"
                type="url"
                value={formData.destinationUrl}
                onChange={(e) =>
                  setFormData({ ...formData, destinationUrl: e.target.value })
                }
                placeholder="https://example.com/oferta"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: RedirectStatus) =>
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

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="openInNewTab"
                  checked={formData.openInNewTab}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, openInNewTab: checked })
                  }
                />
                <Label htmlFor="openInNewTab" className="cursor-pointer">
                  Abrir em nova aba
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="showConfirmation"
                  checked={formData.showConfirmation}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, showConfirmation: checked })
                  }
                />
                <Label htmlFor="showConfirmation" className="cursor-pointer">
                  Mostrar confirmação antes de redirecionar
                </Label>
              </div>
            </div>

            {formData.showConfirmation && (
              <div className="grid gap-2">
                <Label htmlFor="confirmationMessage">
                  Mensagem de Confirmação
                </Label>
                <Textarea
                  id="confirmationMessage"
                  value={formData.confirmationMessage || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmationMessage: e.target.value,
                    })
                  }
                  placeholder="Deseja ser redirecionado para nossa oferta especial?"
                  rows={2}
                />
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta regra será acionada quando o trigger{" "}
                <strong>
                  {getTriggerLabel(formData.trigger || "POST_PURCHASE")}
                </strong>{" "}
                for detectado.
                {formData.openInNewTab
                  ? " O redirecionamento abrirá em nova aba."
                  : " O redirecionamento será na mesma janela."}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingRule(null);
                resetForm();
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

export default RedirectPage;

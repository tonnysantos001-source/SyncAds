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
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MousePointer,
  TrendingUp,
  Megaphone,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import {
  discountBannerApi,
  DiscountBanner,
  BannerType,
  BannerStatus,
  BannerTrigger,
} from "@/lib/api/discountBannerApi";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DiscountBannerPage = () => {
  const [banners, setBanners] = useState<DiscountBanner[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editingBanner, setEditingBanner] = useState<DiscountBanner | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<DiscountBanner>>({
    name: "",
    type: "HEADER",
    status: "ACTIVE",
    priority: 1,
    title: "",
    message: "",
    ctaText: "Saiba Mais",
    backgroundColor: "#EC4899",
    textColor: "#FFFFFF",
    buttonBackgroundColor: "#FFFFFF",
    buttonTextColor: "#EC4899",
    trigger: "ALWAYS",
    closable: true,
    showCloseButton: true,
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
      const [bannersData, statsData] = await Promise.all([
        discountBannerApi.list(user!.id),
        discountBannerApi.getStats(user!.id),
      ]);

      setBanners(bannersData);
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
      if (!formData.name || !formData.title || !formData.message) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome, título e mensagem",
          variant: "destructive",
        });
        return;
      }

      const data = {
        ...formData,
        userId: user.id,
      } as Omit<
        DiscountBanner,
        | "id"
        | "currentDisplays"
        | "impressions"
        | "clicks"
        | "conversions"
        | "createdAt"
        | "updatedAt"
      >;

      if (editingBanner) {
        await discountBannerApi.update(editingBanner.id, formData);
        toast({ title: "Banner atualizado com sucesso!" });
      } else {
        await discountBannerApi.create(data);
        toast({ title: "Banner criado com sucesso!" });
      }

      setShowDialog(false);
      setEditingBanner(null);
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

  const handleEdit = (banner: DiscountBanner) => {
    setEditingBanner(banner);
    setFormData(banner);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este banner?")) return;

    try {
      await discountBannerApi.delete(id);
      toast({ title: "Banner excluído com sucesso!" });
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
      await discountBannerApi.toggle(id, isActive);
      toast({ title: isActive ? "Banner ativado!" : "Banner desativado!" });
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

  const handleDuplicate = async (id: string) => {
    try {
      await discountBannerApi.duplicate(id);
      toast({ title: "Banner duplicado com sucesso!" });
      loadData();
    } catch (error: any) {
      console.error("Erro ao duplicar:", error);
      toast({
        title: "Erro ao duplicar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      type: "HEADER",
      status: "ACTIVE",
      priority: 1,
      title: "",
      message: "",
      ctaText: "Saiba Mais",
      backgroundColor: "#EC4899",
      textColor: "#FFFFFF",
      buttonBackgroundColor: "#FFFFFF",
      buttonTextColor: "#EC4899",
      trigger: "ALWAYS",
      closable: true,
      showCloseButton: true,
    });
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const getBannerTypeLabel = (type: BannerType) => {
    const labels: Record<BannerType, string> = {
      HEADER: "Topo",
      FOOTER: "Rodapé",
      POPUP: "Pop-up",
      STICKY: "Fixo",
      INLINE: "Inline",
    };
    return labels[type];
  };

  const getTriggerLabel = (trigger: BannerTrigger) => {
    const labels: Record<BannerTrigger, string> = {
      ALWAYS: "Sempre",
      FIRST_VISIT: "Primeira Visita",
      EXIT_INTENT: "Intenção de Saída",
      TIME_DELAY: "Tempo de Delay",
      SCROLL_PERCENTAGE: "Rolagem",
    };
    return labels[trigger];
  };

  const getStatusBadge = (status: BannerStatus) => {
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

  // Preview Component
  const BannerPreview = ({ data }: { data: Partial<DiscountBanner> }) => {
    return (
      <div
        className="relative p-4 rounded-lg"
        style={{
          backgroundColor: data.backgroundColor || "#EC4899",
          color: data.textColor || "#FFFFFF",
        }}
      >
        {data.showCloseButton && (
          <button className="absolute top-2 right-2 text-white/70 hover:text-white">
            ×
          </button>
        )}
        <div className="text-center">
          <h3 className="text-lg font-bold mb-2">
            {data.title || "Título do Banner"}
          </h3>
          <p className="text-sm mb-3">{data.message || "Mensagem do banner"}</p>
          {data.ctaText && (
            <button
              className="px-4 py-2 rounded font-medium"
              style={{
                backgroundColor: data.buttonBackgroundColor || "#FFFFFF",
                color: data.buttonTextColor || "#EC4899",
              }}
            >
              {data.ctaText}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Faixas de Desconto
          </h1>
          <p className="text-gray-600 dark:text-gray-300 font-medium">
            Crie banners promocionais para aumentar suas conversões
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Banner
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Banners Ativos
              </CardTitle>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeBanners}</div>
              <p className="text-xs text-muted-foreground">
                de {stats.totalBanners} banners
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Impressões
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalImpressions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Visualizações</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Cliques
              </CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalClicks.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                CTR: {formatPercent(stats.averageCTR)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalConversions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Taxa: {formatPercent(stats.averageConversionRate)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Banners List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Banners Cadastrados</CardTitle>
            <CardDescription>
              {banners.length} banner(s) cadastrado(s)
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
          ) : banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">
                Nenhum banner cadastrado
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie seu primeiro banner promocional
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Banner
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Impressões</TableHead>
                  <TableHead className="text-right">Cliques</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => {
                  const statusInfo = getStatusBadge(banner.status);
                  const Icon = statusInfo.icon;
                  const ctr =
                    banner.impressions > 0
                      ? (banner.clicks / banner.impressions) * 100
                      : 0;

                  return (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{banner.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {banner.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getBannerTypeLabel(banner.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <Icon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                          <Switch
                            checked={banner.status === "ACTIVE"}
                            onCheckedChange={(checked) =>
                              handleToggle(banner.id, checked)
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {banner.impressions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {banner.clicks.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{formatPercent(ctr)}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">
                          {banner.conversions.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(banner)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(banner.id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(banner.id)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "Editar Banner" : "Novo Banner Promocional"}
            </DialogTitle>
            <DialogDescription>
              Configure o visual e comportamento do banner
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-6 py-4">
            {/* Formulário */}
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Banner *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ex: Frete Grátis Black Friday"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: BannerType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HEADER">Topo</SelectItem>
                      <SelectItem value="FOOTER">Rodapé</SelectItem>
                      <SelectItem value="POPUP">Pop-up</SelectItem>
                      <SelectItem value="STICKY">Fixo</SelectItem>
                      <SelectItem value="INLINE">Inline</SelectItem>
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
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="🎉 FRETE GRÁTIS ACIMA DE R$ 99"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="message">Mensagem *</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  placeholder="Aproveite agora e ganhe frete grátis!"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ctaText">Texto do Botão</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaText: e.target.value })
                    }
                    placeholder="Saiba Mais"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ctaLink">Link do Botão</Label>
                  <Input
                    id="ctaLink"
                    value={formData.ctaLink || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, ctaLink: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backgroundColor: e.target.value,
                        })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          backgroundColor: e.target.value,
                        })
                      }
                      placeholder="#EC4899"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="textColor">Cor do Texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      type="color"
                      value={formData.textColor}
                      onChange={(e) =>
                        setFormData({ ...formData, textColor: e.target.value })
                      }
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={formData.textColor}
                      onChange={(e) =>
                        setFormData({ ...formData, textColor: e.target.value })
                      }
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="trigger">Quando Exibir</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(value: BannerTrigger) =>
                    setFormData({ ...formData, trigger: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALWAYS">Sempre</SelectItem>
                    <SelectItem value="FIRST_VISIT">Primeira Visita</SelectItem>
                    <SelectItem value="EXIT_INTENT">
                      Intenção de Saída
                    </SelectItem>
                    <SelectItem value="TIME_DELAY">Tempo de Delay</SelectItem>
                    <SelectItem value="SCROLL_PERCENTAGE">Rolagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="closable"
                    checked={formData.closable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, closable: checked })
                    }
                  />
                  <Label htmlFor="closable" className="cursor-pointer">
                    Permitir fechar
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="showCloseButton"
                    checked={formData.showCloseButton}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, showCloseButton: checked })
                    }
                  />
                  <Label htmlFor="showCloseButton" className="cursor-pointer">
                    Mostrar botão de fechar
                  </Label>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div>
                <Label>Preview</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Visualização em tempo real
                </p>
              </div>
              <BannerPreview data={formData} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingBanner(null);
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

export default DiscountBannerPage;

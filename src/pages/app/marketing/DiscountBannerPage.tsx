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
  Zap,
  Target,
  DollarSign,
  BarChart3,
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

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
  subtitle?: string;
}

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
  delay = 0,
  subtitle,
}: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <div
          className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl`}
        />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

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
      {/* Header com animação */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Faixas de Desconto
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
            Crie banners promocionais para aumentar suas conversões
          </p>
        </div>
        <Button
          onClick={() => setShowDialog(true)}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Banner
        </Button>
      </motion.div>

      {/* Métricas com animação */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard
            title="Banners Ativos"
            value={stats.activeBanners}
            icon={Megaphone}
            color="bg-orange-500"
            delay={0.1}
            subtitle={`de ${stats.totalBanners} banners`}
          />
          <MetricCard
            title="Total de Impressões"
            value={stats.totalImpressions.toLocaleString()}
            icon={Eye}
            color="bg-blue-500"
            delay={0.2}
            subtitle="Visualizações totais"
          />
          <MetricCard
            title="Total de Cliques"
            value={stats.totalClicks.toLocaleString()}
            icon={MousePointer}
            color="bg-purple-500"
            delay={0.3}
            subtitle={`CTR: ${formatPercent(stats.averageCTR)}`}
          />
          <MetricCard
            title="Conversões"
            value={stats.totalConversions.toLocaleString()}
            icon={TrendingUp}
            color="bg-green-500"
            delay={0.4}
            subtitle={`Taxa: ${formatPercent(stats.averageConversionRate)}`}
          />
        </div>
      )}

      {/* Banners List com animação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Banners Cadastrados
              </CardTitle>
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
                <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 mb-4">
                  <Megaphone className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Nenhum banner cadastrado
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md">
                  Crie seu primeiro banner promocional e aumente suas conversões
                </p>
                <Button onClick={() => setShowDialog(true)} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Banner
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
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
                    {banners.map((banner, index) => {
                      const statusInfo = getStatusBadge(banner.status);
                      const Icon = statusInfo.icon;
                      const ctr =
                        banner.impressions > 0
                          ? (banner.clicks / banner.impressions) * 100
                          : 0;

                      return (
                        <motion.tr
                          key={banner.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{banner.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {banner.title}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {getBannerTypeLabel(banner.type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant={statusInfo.variant}
                                className={`gap-1 ${banner.status === "ACTIVE" ? "bg-green-500 hover:bg-green-600" : ""}`}
                              >
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
                            <Badge variant="outline">
                              {formatPercent(ctr)}
                            </Badge>
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
                                size="icon"
                                onClick={() => {
                                  setEditingBanner(banner);
                                  setFormData(banner);
                                  setShowDialog(true);
                                }}
                                className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicate(banner.id)}
                                className="hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(banner.id)}
                                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
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


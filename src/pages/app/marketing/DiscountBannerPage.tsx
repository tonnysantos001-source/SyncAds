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
import { shopifyDiscountsApi } from "@/lib/api/shopifyDiscounts";
import { marketingApi } from "@/lib/api/marketingApi";
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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [formData, setFormData] = useState<Partial<DiscountBanner>>({
    name: "",
    type: "HEADER",
    status: "ACTIVE",
    priority: 1,
    title: "",
    message: "",
    discountCode: "",
    ctaText: "Saiba Mais",
    ctaLink: "",
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
      loadCoupons();
    }
  }, [user?.id]);

  const loadCoupons = async () => {
    if (!user?.id) return;
    try {
      const [localData, shopifyData] = await Promise.all([
        marketingApi.coupons.getAll(user.id).catch(() => []),
        shopifyDiscountsApi.listFromShopify(user.id).catch(() => []),
      ]);

      const consolidated = [
        ...localData.map((c) => ({
          code: c.code,
          name: c.name,
          type: c.type,
          value: c.value,
          isLocal: true,
        })),
        ...shopifyData.map((c) => ({
          code: c.code,
          name: c.title || c.code,
          type: c.type,
          value: c.value,
          isLocal: false,
        })),
      ];
      setCoupons(consolidated);
    } catch (error) {
      console.error("Erro ao carregar cupons:", error);
    }
  };

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
      discountCode: "",
      ctaText: "Saiba Mais",
      ctaLink: "",
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

  // Preview Component - Mockup de Checkout de Alta Fidelidade
  const BannerPreview = ({ data }: { data: Partial<DiscountBanner> }) => {
    const isHeader = data.type === "HEADER";
    const isFooter = data.type === "FOOTER";
    const isPopup = data.type === "POPUP";

    return (
      <div className="max-w-[360px] mx-auto w-full border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-xl flex flex-col h-[480px] relative">
        {/* Mock browser header */}
        <div className="bg-slate-50 dark:bg-slate-950 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
          </div>
          <div className="bg-slate-200/50 dark:bg-slate-900/60 rounded-md px-3 py-0.5 text-[10px] text-slate-500 w-64 text-center truncate mx-auto select-none">
            syncads.com.br/checkout/preview
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 p-4 text-xs">
          {/* HEADER Discount Banner inside mock checkout */}
          {isHeader && (
            <div
              className="w-full p-3 rounded-lg mb-4 text-center transition-all duration-300 relative shadow-sm border border-white/5"
              style={{
                backgroundColor: data.backgroundColor || "#EC4899",
                color: data.textColor || "#FFFFFF",
              }}
            >
              {data.showCloseButton && (
                <span className="absolute top-1.5 right-2 text-xs opacity-75">×</span>
              )}
              <div className="font-bold text-[12px] truncate uppercase tracking-wider">{data.title || "TÍTULO DO BANNER"}</div>
              <div className="text-[10px] opacity-90 mt-0.5">{data.message || "Aproveite esta oferta imperdível!"}</div>
              {data.ctaText && (
                <button
                  className="mt-2 px-4 py-1 rounded-md text-[10px] font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: data.buttonBackgroundColor || "#FFFFFF",
                    color: data.buttonTextColor || "#EC4899",
                  }}
                >
                  {data.ctaText}
                </button>
              )}
            </div>
          )}

          {/* Checkout Content Placeholder */}
          <div className="flex-1 space-y-4 opacity-40 select-none pointer-events-none">
            {/* Header / Logo */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="h-4 w-20 bg-slate-300 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-12 bg-slate-300 dark:bg-slate-800 rounded"></div>
            </div>
            {/* Split Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-3">
                <div className="h-3 w-1/2 bg-slate-300 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg"></div>
                <div className="h-3 w-1/3 bg-slate-300 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg"></div>
              </div>
              <div className="col-span-1 bg-slate-100 dark:bg-slate-900/40 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <div className="h-3.5 w-full bg-slate-300 dark:bg-slate-800 rounded"></div>
                <div className="h-3 w-2/3 bg-slate-300 dark:bg-slate-800 rounded"></div>
                <div className="h-6 w-full bg-slate-300 dark:bg-slate-800 rounded mt-4"></div>
              </div>
            </div>
          </div>

          {/* POPUP Discount Banner Modal Overlay */}
          {isPopup && (
            <div className="absolute inset-0 bg-black/55 flex items-center justify-center p-6 backdrop-blur-[1px] z-50">
              <div
                className="p-5 rounded-xl text-center max-w-[260px] w-full shadow-2xl transition-all duration-300 relative border border-white/10"
                style={{
                  backgroundColor: data.backgroundColor || "#EC4899",
                  color: data.textColor || "#FFFFFF",
                }}
              >
                {data.showCloseButton && (
                  <span className="absolute top-2 right-3 text-xs font-bold opacity-75 cursor-pointer">×</span>
                )}
                <div className="font-extrabold text-xs mb-1 uppercase tracking-wider">{data.title || "TÍTULO DO BANNER"}</div>
                <p className="text-[10px] opacity-90 leading-relaxed mb-4">{data.message || "Aproveite esta oferta especial!"}</p>
                {data.ctaText && (
                  <button
                    className="w-full py-2 px-4 rounded-lg text-[10px] font-black tracking-wide uppercase transition-transform hover:scale-105 active:scale-95 shadow-md"
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
          )}

          {/* FOOTER Discount Banner inside mock checkout */}
          {isFooter && (
            <div
              className="w-full p-3 rounded-lg mt-4 text-center transition-all duration-300 relative shadow-sm border border-white/5"
              style={{
                backgroundColor: data.backgroundColor || "#EC4899",
                color: data.textColor || "#FFFFFF",
              }}
            >
              {data.showCloseButton && (
                <span className="absolute top-1.5 right-2 text-xs opacity-75">×</span>
              )}
              <div className="font-bold text-[12px] truncate uppercase tracking-wider">{data.title || "TÍTULO DO BANNER"}</div>
              <div className="text-[10px] opacity-90 mt-0.5">{data.message || "Aproveite esta oferta imperdível!"}</div>
              {data.ctaText && (
                <button
                  className="mt-2 px-4 py-1 rounded-md text-[10px] font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: data.buttonBackgroundColor || "#FFFFFF",
                    color: data.buttonTextColor || "#EC4899",
                  }}
                >
                  {data.ctaText}
                </button>
              )}
            </div>
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
        <DialogContent
          className="h-[90vh] max-h-[820px] flex flex-col bg-slate-900 border-slate-800 text-white p-0 overflow-hidden"
          style={{ maxWidth: '1200px', width: '95vw' }}
        >

          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-white">
              {editingBanner ? "Editar Banner Promocional" : "Novo Banner Promocional"}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure o design, conteúdo e regras de comportamento do seu banner de desconto.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 px-6 py-4 overflow-hidden">
            {/* Formulário (Col 7) */}
            <div className="lg:col-span-7 overflow-y-auto overflow-x-hidden pr-3 space-y-6 h-full pb-8">
              {/* Seção 1: Informações Básicas */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Geral</h3>
                
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-slate-300">Nome do Banner *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Frete Grátis Black Friday"
                    className="bg-slate-950 border-slate-800 text-white focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type" className="text-slate-300">Tipo / Posicionamento *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: BannerType) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-950 border-slate-800 text-white">
                        <SelectItem value="HEADER">Topo (Barra de Aviso)</SelectItem>
                        <SelectItem value="FOOTER">Rodapé</SelectItem>
                        <SelectItem value="POPUP">Pop-up (Overlay)</SelectItem>
                        <SelectItem value="STICKY">Fixo</SelectItem>
                        <SelectItem value="INLINE">Inline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority" className="text-slate-300">Prioridade de Exibição</Label>
                    <Input
                      id="priority"
                      type="number"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priority: parseInt(e.target.value) || 1,
                        })
                      }
                      className="bg-slate-950 border-slate-800 text-white focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Conteúdo */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Conteúdo</h3>

                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-slate-300">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Ex: 🎉 GANHE 10% DE DESCONTO AGORA!"
                    className="bg-slate-950 border-slate-800 text-white focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="message" className="text-slate-300">Mensagem de Descrição *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Use o cupom abaixo e garanta um desconto especial no checkout."
                    rows={2}
                    className="bg-slate-950 border-slate-800 text-white focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ctaText" className="text-slate-300">Texto do Botão (CTA)</Label>
                    <Input
                      id="ctaText"
                      value={formData.ctaText || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaText: e.target.value })
                      }
                      placeholder="Ex: Aplicar Desconto"
                      className="bg-slate-950 border-slate-800 text-white focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ctaLink" className="text-slate-300">Link de Redirecionamento (Opcional)</Label>
                    <Input
                      id="ctaLink"
                      value={formData.ctaLink || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaLink: e.target.value })
                      }
                      placeholder="https://..."
                      className="bg-slate-950 border-slate-800 text-white focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Conexão com Integrações e Cupons */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Sincronização e Cupons</h3>

                <div className="grid gap-2">
                  <Label htmlFor="discountCode" className="text-slate-300">Cupom Vinculado (Opcional)</Label>
                  <Select
                    value={formData.discountCode || "none"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discountCode: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white w-full">
                      <SelectValue placeholder="Selecione um cupom para vincular" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                      <SelectItem value="none">Nenhum cupom (Apenas texto informativo)</SelectItem>
                      {coupons.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.code} ({c.isLocal ? "Local" : "Shopify"}) {c.value > 0 ? `- ${c.value}%` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-slate-400">
                    Selecione um cupom sincronizado da sua loja **Shopify** ou criado localmente. Ao clicar no banner ou botão, este cupom será aplicado automaticamente no checkout do cliente!
                  </p>
                </div>
              </div>

              {/* Seção 4: Visual e Cores */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Cores e Estilo</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="backgroundColor" className="text-slate-300">Cor de Fundo do Banner</Label>
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
                        className="w-12 h-10 p-1 bg-slate-950 border-slate-800"
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
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="textColor" className="text-slate-300">Cor do Texto do Banner</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={formData.textColor}
                        onChange={(e) =>
                          setFormData({ ...formData, textColor: e.target.value })
                        }
                        className="w-12 h-10 p-1 bg-slate-950 border-slate-800"
                      />
                      <Input
                        value={formData.textColor}
                        onChange={(e) =>
                          setFormData({ ...formData, textColor: e.target.value })
                        }
                        placeholder="#FFFFFF"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="buttonBackgroundColor" className="text-slate-300">Fundo do Botão (CTA)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonBackgroundColor"
                        type="color"
                        value={formData.buttonBackgroundColor || "#FFFFFF"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buttonBackgroundColor: e.target.value,
                          })
                        }
                        className="w-12 h-10 p-1 bg-slate-950 border-slate-800"
                      />
                      <Input
                        value={formData.buttonBackgroundColor || "#FFFFFF"}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buttonBackgroundColor: e.target.value,
                          })
                        }
                        placeholder="#FFFFFF"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="buttonTextColor" className="text-slate-300">Texto do Botão (CTA)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="buttonTextColor"
                        type="color"
                        value={formData.buttonTextColor || "#EC4899"}
                        onChange={(e) =>
                          setFormData({ ...formData, buttonTextColor: e.target.value })
                        }
                        className="w-12 h-10 p-1 bg-slate-950 border-slate-800"
                      />
                      <Input
                        value={formData.buttonTextColor || "#EC4899"}
                        onChange={(e) =>
                          setFormData({ ...formData, buttonTextColor: e.target.value })
                        }
                        placeholder="#EC4899"
                        className="bg-slate-950 border-slate-800 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 5: Comportamento */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-950/40 border border-slate-800">
                <h3 className="text-sm font-semibold text-orange-500 uppercase tracking-wider">Regras de Exibição</h3>

                <div className="grid gap-2">
                  <Label htmlFor="trigger" className="text-slate-300">Quando exibir o Banner</Label>
                  <Select
                    value={formData.trigger}
                    onValueChange={(value: BannerTrigger) =>
                      setFormData({ ...formData, trigger: value })
                    }
                  >
                    <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                      <SelectItem value="ALWAYS">Sempre (Ao carregar a página)</SelectItem>
                      <SelectItem value="FIRST_VISIT">Apenas na Primeira Visita</SelectItem>
                      <SelectItem value="EXIT_INTENT">Intenção de Saída (Mouse fora da tela)</SelectItem>
                      <SelectItem value="TIME_DELAY">Delay de Tempo (Segundos)</SelectItem>
                      <SelectItem value="SCROLL_PERCENTAGE">Porcentagem de Rolagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center space-x-3">
                    <Switch
                      id="closable"
                      checked={formData.closable}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, closable: checked })
                      }
                      className="data-[state=checked]:bg-orange-500"
                    />
                    <Label htmlFor="closable" className="cursor-pointer text-slate-300">Permitir Fechar</Label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Switch
                      id="showCloseButton"
                      checked={formData.showCloseButton}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, showCloseButton: checked })
                      }
                      className="data-[state=checked]:bg-orange-500"
                    />
                    <Label htmlFor="showCloseButton" className="cursor-pointer text-slate-300">Mostrar Botão de Fechar</Label>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview (Col 5) */}
            <div className="lg:col-span-5 h-full flex flex-col justify-start">
              <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-xl space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Visualização em Tempo Real</h3>
                  <p className="text-[11px] text-slate-400">
                    Veja como o banner ficará posicionado e estilizado no checkout.
                  </p>
                </div>
                <BannerPreview data={formData} />
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-800 bg-slate-950/20 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingBanner(null);
                resetForm();
              }}
              className="bg-transparent border-slate-850 hover:bg-slate-800 text-white"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold">
              Salvar Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountBannerPage;


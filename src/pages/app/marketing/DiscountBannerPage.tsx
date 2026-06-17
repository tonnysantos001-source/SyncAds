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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
      <div 
        className="w-[360px] mx-auto rounded-[2.5rem] border-[10px] border-[#1e293b] dark:border-slate-800 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col h-[550px] relative overflow-hidden bg-white dark:bg-slate-950 transition-all duration-300 ring-4 ring-slate-900/10 dark:ring-white/5"
      >
        {/* Phone Simulation Side Buttons */}
        <div className="absolute -left-[11px] top-16 w-[2px] h-6 bg-[#334155] rounded-l-sm" /> {/* Vol Up */}
        <div className="absolute -left-[11px] top-24 w-[2px] h-6 bg-[#334155] rounded-l-sm" /> {/* Vol Down */}
        <div className="absolute -right-[11px] top-20 w-[2px] h-8 bg-[#334155] rounded-r-sm" /> {/* Power */}

        {/* Dynamic Island / Status Bar UI */}
        <div className="sticky top-0 left-0 right-0 h-10 flex items-center justify-between px-5 z-[100] bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-900 flex-shrink-0 pointer-events-none">
          {/* Clock */}
          <span className="text-[10px] font-bold text-gray-900 dark:text-gray-100">9:41</span>
          
          {/* Dynamic Island Pill */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 w-[72px] h-[20px] bg-black rounded-[10px] flex items-center justify-between px-2.5 shadow-md">
             {/* Camera Lens dot */}
             <div className="w-[8px] h-[2px] bg-zinc-800 rounded-full" />
             <div className="w-1.5 h-1.5 rounded-full bg-[#0a0a0a] border border-white/5" />
          </div>

          {/* Icons (WiFi, Signal, Battery) */}
          <div className="flex items-center gap-1 scale-90 origin-right">
             <svg width="15" height="10" viewBox="0 0 15 10" fill="none" className="text-gray-900 dark:text-gray-100 fill-current">
                <path d="M0 7.5V10H2V7.5H0ZM3.25 5V10H5.25V5H3.25ZM6.5 2.5V10H8.5V2.5H6.5ZM9.75 0V10H11.75V0H9.75Z"/>
             </svg>
             <svg width="15" height="11" viewBox="0 0 15 11" fill="none" className="text-gray-900 dark:text-gray-100 fill-current">
                <path d="M7.5 11L15 2.5C14.7 2.2 12 0 7.5 0C3 0 0.3 2.2 0 2.5L7.5 11ZM7.5 1.5C10.5 1.5 12.5 2.8 13.5 3.5L7.5 10.3L1.5 3.5C2.5 2.8 4.5 1.5 7.5 1.5Z"/>
             </svg>
             <div className="w-[18px] h-[9px] border border-gray-400 dark:border-gray-500 rounded-[2px] relative p-[0.5px]">
                <div className="h-full w-[90%] bg-gray-800 dark:bg-gray-200 rounded-[0.5px]" />
                <div className="absolute -right-[2px] top-[2px] w-[1px] h-[3px] bg-gray-400 dark:bg-gray-500 rounded-r-[0.5px]" />
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 p-4 text-xs">
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
                <span className="absolute top-1 right-2 text-xs opacity-75 cursor-pointer">×</span>
              )}
              <div className="font-bold text-xs truncate uppercase tracking-wider">{data.title || "TÍTULO DO BANNER"}</div>
              <div className="text-[10px] opacity-90 mt-1 leading-tight">{data.message || "Aproveite esta oferta imperdível!"}</div>
              {data.ctaText && (
                <button
                  className="mt-2 px-4 py-1 rounded text-[10px] font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
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

          {/* Checkout Content Placeholder - Flex layout to fit without scrolling */}
          <div className="flex-1 flex flex-col justify-between select-none pointer-events-none my-1">
            {/* Header / Logo */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="h-4 w-20 bg-slate-300 dark:bg-slate-800 rounded"></div>
              <div className="h-4 w-10 bg-slate-300 dark:bg-slate-800 rounded"></div>
            </div>
            
            {/* Delivery address mockup */}
            <div className="space-y-2">
              <div className="h-3 w-1/2 bg-slate-350 dark:bg-slate-800 rounded"></div>
              <div className="h-14 w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md flex flex-col justify-center px-3 gap-2">
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-800 rounded"></div>
                <div className="h-2 w-2/3 bg-slate-300 dark:bg-slate-800 rounded"></div>
              </div>
            </div>

            {/* Payment method mockup */}
            <div className="space-y-2">
              <div className="h-3 w-1/3 bg-slate-350 dark:bg-slate-800 rounded"></div>
              <div className="h-14 w-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md flex flex-col justify-center px-3 gap-2">
                <div className="h-2 w-full bg-slate-300 dark:bg-slate-800 rounded"></div>
                <div className="h-2 w-1/2 bg-slate-300 dark:bg-slate-800 rounded"></div>
              </div>
            </div>

            {/* Pay Button */}
            <div className="pt-2">
              <div className="h-9 w-full bg-slate-400 dark:bg-slate-800 rounded-md"></div>
            </div>
          </div>

          {/* POPUP Discount Banner Modal Overlay */}
          {isPopup && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-5 backdrop-blur-[2px] z-50">
              <div
                className="p-4.5 rounded-xl text-center max-w-[250px] w-full shadow-2xl transition-all duration-300 relative border border-white/10"
                style={{
                  backgroundColor: data.backgroundColor || "#EC4899",
                  color: data.textColor || "#FFFFFF",
                }}
              >
                {data.showCloseButton && (
                  <span className="absolute top-1.5 right-2.5 text-sm font-bold opacity-75 cursor-pointer">×</span>
                )}
                <div className="font-extrabold text-xs mb-1 uppercase tracking-wider">{data.title || "TÍTULO DO BANNER"}</div>
                <p className="text-[10px] opacity-90 leading-tight mb-3">{data.message || "Aproveite esta oferta especial!"}</p>
                {data.ctaText && (
                  <button
                    className="w-full py-1.5 px-4 rounded text-[10px] font-black tracking-wide uppercase transition-transform hover:scale-105 active:scale-95 shadow-md"
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
                <span className="absolute top-1 right-2 text-xs opacity-75 cursor-pointer">×</span>
              )}
              <div className="font-bold text-xs truncate uppercase tracking-wider">{data.title || "TÍTULO DO BANNER"}</div>
              <div className="text-[10px] opacity-90 mt-1 leading-tight">{data.message || "Aproveite esta oferta imperdível!"}</div>
              {data.ctaText && (
                <button
                  className="mt-2 px-4 py-1 rounded text-[10px] font-bold transition-transform hover:scale-105 active:scale-95 shadow-sm"
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
          className="h-[85vh] max-h-[750px] flex flex-col bg-[#0b0f19] border border-slate-800/80 text-white p-0 overflow-hidden rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.15)] transition-all duration-300"
          style={{ maxWidth: '1020px', width: '95vw' }}
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
            <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
              <Tabs defaultValue="general" className="w-full flex flex-col h-full">
                <TabsList className="grid w-full grid-cols-3 bg-[#030712]/60 p-1 rounded-xl border border-slate-800/60 mb-4 flex-shrink-0">
                  <TabsTrigger value="general" className="text-xs font-semibold py-2 rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/10">
                    ⚙️ Geral & Regras
                  </TabsTrigger>
                  <TabsTrigger value="content" className="text-xs font-semibold py-2 rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/10">
                    📝 Conteúdo & Cupom
                  </TabsTrigger>
                  <TabsTrigger value="design" className="text-xs font-semibold py-2 rounded-lg transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/10">
                    🎨 Design & Cores
                  </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2 pb-6 space-y-4">
                  {/* ABA 1: GERAL & REGRAS */}
                  <TabsContent value="general" className="space-y-4 outline-none mt-0">
                    {/* Seção 1: Informações Básicas */}
                    <div className="space-y-4 p-5 rounded-2xl bg-[#0d1527]/30 border border-slate-800/60 hover:border-slate-700/30 transition-all">
                      <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Geral</h3>
                      
                      <div className="grid gap-1.5">
                        <Label htmlFor="name" className="text-xs text-slate-300">Nome do Banner *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Ex: Frete Grátis Black Friday"
                          className="h-10 bg-[#030712] border-slate-850 text-white focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-xs rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="type" className="text-xs text-slate-300">Tipo / Posicionamento *</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value: BannerType) =>
                              setFormData({ ...formData, type: value })
                            }
                          >
                            <SelectTrigger className="h-10 bg-[#030712] border-slate-855 text-white text-xs rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                              <SelectItem value="HEADER">Topo (Barra de Aviso)</SelectItem>
                              <SelectItem value="FOOTER">Rodapé</SelectItem>
                              <SelectItem value="POPUP">Pop-up (Overlay)</SelectItem>
                              <SelectItem value="STICKY">Fixo</SelectItem>
                              <SelectItem value="INLINE">Inline</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-1.5">
                          <Label htmlFor="priority" className="text-xs text-slate-300">Prioridade de Exibição</Label>
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
                            className="h-10 bg-[#030712] border-slate-850 text-white focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 5: Comportamento / Regras de Exibição */}
                    <div className="space-y-4 p-5 rounded-2xl bg-[#0d1527]/30 border border-slate-800/60 hover:border-slate-700/30 transition-all">
                      <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Regras de Exibição</h3>

                      <div className="grid gap-1.5">
                        <Label htmlFor="trigger" className="text-xs text-slate-300">Quando exibir o Banner</Label>
                        <Select
                          value={formData.trigger}
                          onValueChange={(value: BannerTrigger) =>
                            setFormData({ ...formData, trigger: value })
                          }
                        >
                          <SelectTrigger className="h-10 bg-[#030712] border-slate-850 text-white text-xs rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                            <SelectItem value="ALWAYS">Sempre (Ao carregar a página)</SelectItem>
                            <SelectItem value="FIRST_VISIT">Apenas na Primeira Visita</SelectItem>
                            <SelectItem value="EXIT_INTENT">Intenção de Saída (Mouse fora da tela)</SelectItem>
                            <SelectItem value="TIME_DELAY">Delay de Tempo (Segundos)</SelectItem>
                            <SelectItem value="SCROLL_PERCENTAGE">Porcentagem de Rolagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="flex items-center space-x-3">
                          <Switch
                            id="closable"
                            checked={formData.closable}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, closable: checked })
                            }
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-pink-500"
                          />
                          <Label htmlFor="closable" className="cursor-pointer text-xs text-slate-300 font-medium">Permitir Fechar</Label>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Switch
                            id="showCloseButton"
                            checked={formData.showCloseButton}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, showCloseButton: checked })
                            }
                            className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-orange-500 data-[state=checked]:to-pink-500"
                          />
                          <Label htmlFor="showCloseButton" className="cursor-pointer text-xs text-slate-300 font-medium">Mostrar Botão</Label>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ABA 2: CONTEÚDO & CUPOM */}
                  <TabsContent value="content" className="space-y-4 outline-none mt-0">
                    {/* Seção 2: Conteúdo */}
                    <div className="space-y-4 p-5 rounded-2xl bg-[#0d1527]/30 border border-slate-800/60 hover:border-slate-700/30 transition-all">
                      <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Conteúdo</h3>

                      <div className="grid gap-1.5">
                        <Label htmlFor="title" className="text-xs text-slate-300">Título *</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          placeholder="Ex: 🎉 GANHE 10% DE DESCONTO AGORA!"
                          className="h-10 bg-[#030712] border-slate-850 text-white focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-xs rounded-lg"
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="message" className="text-xs text-slate-300">Mensagem de Descrição *</Label>
                        <Textarea
                          id="message"
                          value={formData.message}
                          onChange={(e) =>
                            setFormData({ ...formData, message: e.target.value })
                          }
                          placeholder="Use o cupom abaixo e garanta um desconto especial no checkout."
                          rows={2}
                          className="bg-[#030712] border-slate-850 text-white focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-xs rounded-lg resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="ctaText" className="text-xs text-slate-300">Texto do Botão (CTA)</Label>
                          <Input
                            id="ctaText"
                            value={formData.ctaText || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, ctaText: e.target.value })
                            }
                            placeholder="Ex: Aplicar Desconto"
                            className="h-10 bg-[#030712] border-slate-850 text-white focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-xs rounded-lg"
                          />
                        </div>

                        <div className="grid gap-1.5">
                          <Label htmlFor="ctaLink" className="text-xs text-slate-300">Link de Redirecionamento</Label>
                          <Input
                            id="ctaLink"
                            value={formData.ctaLink || ""}
                            onChange={(e) =>
                              setFormData({ ...formData, ctaLink: e.target.value })
                            }
                            placeholder="https://..."
                            className="h-10 bg-[#030712] border-slate-850 text-white focus-visible:ring-1 focus-visible:ring-orange-500/50 focus-visible:border-orange-500/50 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Conexão com Integrações e Cupons */}
                    <div className="space-y-4 p-5 rounded-2xl bg-[#0d1527]/30 border border-slate-800/60 hover:border-slate-700/30 transition-all">
                      <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Sincronização e Cupons</h3>

                      <div className="grid gap-1.5">
                        <Label htmlFor="discountCode" className="text-xs text-slate-300">Cupom Vinculado (Opcional)</Label>
                        <Select
                          value={formData.discountCode || "none"}
                          onValueChange={(value) =>
                            setFormData({ ...formData, discountCode: value === "none" ? "" : value })
                          }
                        >
                          <SelectTrigger className="h-10 bg-[#030712] border-slate-855 text-white w-full text-xs rounded-lg">
                            <SelectValue placeholder="Selecione um cupom para vincular" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-950 border-slate-800 text-white text-xs">
                            <SelectItem value="none">Nenhum cupom (Apenas texto informativo)</SelectItem>
                            {coupons.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.code} ({c.isLocal ? "Local" : "Shopify"}) {c.value > 0 ? `- ${c.value}%` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Ao clicar no banner ou botão, este cupom será aplicado automaticamente no checkout do cliente!
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* ABA 3: DESIGN & CORES */}
                  <TabsContent value="design" className="space-y-4 outline-none mt-0">
                    {/* Seção 4: Visual e Cores */}
                    <div className="space-y-4 p-5 rounded-2xl bg-[#0d1527]/30 border border-slate-800/60 hover:border-slate-700/30 transition-all">
                      <h3 className="text-xs font-semibold text-orange-500 uppercase tracking-wider">Cores e Estilo</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="backgroundColor" className="text-xs text-slate-300">Cor de Fundo do Banner</Label>
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
                              className="w-10 h-10 p-0.5 bg-[#030712] border-slate-850 rounded-lg cursor-pointer"
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
                              className="h-10 bg-[#030712] border-slate-855 text-white text-xs rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid gap-1.5">
                          <Label htmlFor="textColor" className="text-xs text-slate-300">Cor do Texto do Banner</Label>
                          <div className="flex gap-2">
                            <Input
                              id="textColor"
                              type="color"
                              value={formData.textColor}
                              onChange={(e) =>
                                setFormData({ ...formData, textColor: e.target.value })
                              }
                              className="w-10 h-10 p-0.5 bg-[#030712] border-slate-850 rounded-lg cursor-pointer"
                            />
                            <Input
                              value={formData.textColor}
                              onChange={(e) =>
                                setFormData({ ...formData, textColor: e.target.value })
                              }
                              placeholder="#FFFFFF"
                              className="h-10 bg-[#030712] border-slate-855 text-white text-xs rounded-lg"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-1.5">
                          <Label htmlFor="buttonBackgroundColor" className="text-xs text-slate-300">Fundo do Botão (CTA)</Label>
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
                              className="w-10 h-10 p-0.5 bg-[#030712] border-slate-850 rounded-lg cursor-pointer"
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
                              className="h-10 bg-[#030712] border-slate-855 text-white text-xs rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="grid gap-1.5">
                          <Label htmlFor="buttonTextColor" className="text-xs text-slate-300">Texto do Botão (CTA)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="buttonTextColor"
                              type="color"
                              value={formData.buttonTextColor || "#EC4899"}
                              onChange={(e) =>
                                setFormData({ ...formData, buttonTextColor: e.target.value })
                              }
                              className="w-10 h-10 p-0.5 bg-[#030712] border-slate-850 rounded-lg cursor-pointer"
                            />
                            <Input
                              value={formData.buttonTextColor || "#EC4899"}
                              onChange={(e) =>
                                setFormData({ ...formData, buttonTextColor: e.target.value })
                              }
                              placeholder="#EC4899"
                              className="h-10 bg-[#030712] border-slate-855 text-white text-xs rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* Preview (Col 5) */}
            <div className="lg:col-span-5 flex flex-col justify-center items-center space-y-3 h-full bg-[#030712]/30 rounded-2xl border border-slate-850/60 p-4 self-center overflow-hidden">
              <div className="text-center flex-shrink-0">
                <h3 className="text-xs font-bold text-slate-200 tracking-wide uppercase">Visualização em Tempo Real</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Veja como o banner ficará no checkout.
                </p>
              </div>
              <BannerPreview data={formData} />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-800 bg-[#030712]/40 flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setEditingBanner(null);
                resetForm();
              }}
              className="bg-transparent border-slate-800 hover:bg-slate-800 text-white"
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-bold shadow-lg shadow-orange-500/20">
              Salvar Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiscountBannerPage;


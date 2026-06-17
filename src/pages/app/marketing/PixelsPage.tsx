import React, { useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Edit,
  Power,
  Activity,
  CheckCircle2,
  XCircle,
  Info,
  ExternalLink,
  Target,
  Zap,
  BarChart3,
  Eye,
  Code2,
  Clock,
  TrendingUp,
  Copy,
  Check,
} from "lucide-react";
import { usePixels } from "@/hooks/usePixels";
import {
  PIXEL_PLATFORMS,
  PIXEL_EVENT_LABELS,
  validatePixelId,
  getPlatformColor,
} from "@/types/pixel";
import type {
  PixelPlatform,
  PixelConfig,
  CreatePixelConfigInput,
} from "@/types/pixel";

// ─── Helper: formatar data relativa ───────────────────────────────────────────
function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "Nunca";
  const diff = Date.now() - new Date(isoDate).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Agora mesmo";
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

// ─── Helper: gerar snippet de código do pixel ─────────────────────────────────
function generatePixelSnippet(platform: PixelPlatform, pixelId: string): string {
  switch (platform) {
    case "FACEBOOK":
      return `<!-- Meta Pixel (${pixelId}) -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '${pixelId}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
</noscript>`;

    case "TIKTOK":
      return `<!-- TikTok Pixel (${pixelId}) -->
<script>
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.load('${pixelId}');
    ttq.page();
  }(window, document, 'ttq');
</script>`;

    case "GOOGLE_ADS":
      return `<!-- Google Ads Tag (${pixelId}) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${pixelId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${pixelId}');
</script>`;

    default:
      return "";
  }
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
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
}: MetricCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
  >
    <Card className="relative overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full blur-3xl`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {value}
        </div>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  </motion.div>
);

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const PixelsPage: React.FC = () => {
  const {
    pixelConfigs,
    loading,
    creating,
    updating,
    deleting,
    stats,
    createPixelConfig,
    updatePixelConfig,
    deletePixelConfig,
    togglePixelConfig,
    hasPixelForPlatform,
  } = usePixels();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSnippetDialogOpen, setIsSnippetDialogOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PixelPlatform | null>(null);
  const [selectedPixelConfig, setSelectedPixelConfig] = useState<PixelConfig | null>(null);
  const [snippetConfig, setSnippetConfig] = useState<PixelConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [snippetCopied, setSnippetCopied] = useState(false);

  // Form states
  const [formData, setFormData] = useState<CreatePixelConfigInput>({
    platform: "FACEBOOK",
    pixelId: "",
    name: "",
    isActive: true,
    events: ["page_view", "initiate_checkout", "add_payment_info", "purchase"],
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  // Total de eventos disparados entre todos os pixels
  const totalEventsFired = pixelConfigs.reduce((sum, c) => sum + (c.eventCount || 0), 0);

  const handleOpenCreateDialog = (platform: PixelPlatform) => {
    setSelectedPlatform(platform);
    setFormData({
      platform,
      pixelId: "",
      name: "",
      isActive: true,
      events: PIXEL_PLATFORMS[platform].availableEvents.slice(0, 4),
    });
    setValidationError(null);
    setIsCreateDialogOpen(true);
  };

  const handleOpenEditDialog = (config: PixelConfig) => {
    setSelectedPixelConfig(config);
    setFormData({
      platform: config.platform,
      pixelId: config.pixelId,
      name: config.name || "",
      isActive: config.isActive,
      events: config.events,
    });
    setValidationError(null);
    setIsEditDialogOpen(true);
  };

  const handleOpenSnippetDialog = (config: PixelConfig) => {
    setSnippetConfig(config);
    setSnippetCopied(false);
    setIsSnippetDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsSnippetDialogOpen(false);
    setSelectedPlatform(null);
    setSelectedPixelConfig(null);
    setSnippetConfig(null);
    setValidationError(null);
  };

  const handleCopySnippet = async () => {
    if (!snippetConfig) return;
    try {
      await navigator.clipboard.writeText(
        generatePixelSnippet(snippetConfig.platform, snippetConfig.pixelId)
      );
      setSnippetCopied(true);
      setTimeout(() => setSnippetCopied(false), 3000);
    } catch (e) {
      console.error("Erro ao copiar snippet:", e);
    }
  };

  const handleCreatePixel = async () => {
    if (!validatePixelId(formData.platform, formData.pixelId)) {
      setValidationError("ID de pixel inválido para esta plataforma. Verifique o formato correto.");
      return;
    }
    const result = await createPixelConfig(formData);
    if (result) handleCloseDialogs();
  };

  const handleUpdatePixel = async () => {
    if (!selectedPixelConfig) return;
    if (formData.pixelId && formData.pixelId !== selectedPixelConfig.pixelId) {
      if (!validatePixelId(formData.platform, formData.pixelId)) {
        setValidationError("ID de pixel inválido para esta plataforma. Verifique o formato correto.");
        return;
      }
    }
    const result = await updatePixelConfig(selectedPixelConfig.id, {
      pixelId: formData.pixelId,
      name: formData.name,
      isActive: formData.isActive,
      events: formData.events,
    });
    if (result) handleCloseDialogs();
  };

  const handleDeletePixel = async (id: string) => {
    if (window.confirm("Tem certeza que deseja remover este pixel? Esta ação não pode ser desfeita.")) {
      await deletePixelConfig(id);
    }
  };

  const filteredPixelConfigs = pixelConfigs.filter(
    (config) =>
      config.pixelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Carregando pixels...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Pixels de Rastreamento
        </h1>
        <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
          Gerencie seus pixels do Meta, TikTok e Google Ads — integrados automaticamente ao seu checkout
        </p>
      </motion.div>

      {/* Métricas */}
      <div className="grid gap-6 md:grid-cols-4">
        <MetricCard title="Total de Pixels" value={stats.total} icon={Target} color="bg-indigo-500" delay={0.1} subtitle="Pixels configurados" />
        <MetricCard title="Pixels Ativos" value={stats.active} icon={Zap} color="bg-green-500" delay={0.2} subtitle="Rastreando eventos" />
        <MetricCard title="Eventos Disparados" value={totalEventsFired} icon={TrendingUp} color="bg-purple-500" delay={0.3} subtitle="Total acumulado" />
        <MetricCard title="Plataformas" value={3} icon={BarChart3} color="bg-blue-500" delay={0.4} subtitle="Meta · TikTok · Google" />
      </div>

      {/* Alerta informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Integrado com o Checkout</AlertTitle>
        <AlertDescription>
          Os pixels cadastrados aqui são disparados automaticamente no checkout público:
          <strong> PageView</strong> ao entrar, <strong>InitiateCheckout</strong> ao avançar para pagamento,
          <strong> AddPaymentInfo</strong> ao clicar em pagar, e <strong>Purchase</strong> após confirmação.
        </AlertDescription>
      </Alert>

      {/* Plataformas Disponíveis */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Plataformas Disponíveis
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.values(PIXEL_PLATFORMS).map((platform) => {
            const hasPixel = hasPixelForPlatform(platform.platform);
            return (
              <Card key={platform.platform} className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: platform.color + "20" }}>
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{platform.name}</CardTitle>
                        {hasPixel && (
                          <Badge variant="secondary" className="mt-1">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Configurado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{platform.description}</p>
                  <div className="flex items-center justify-between">
                    <a href={platform.documentation} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                      Documentação
                    </a>
                    <Button size="sm" onClick={() => handleOpenCreateDialog(platform.platform)} disabled={creating} variant={hasPixel ? "outline" : "default"}>
                      <Plus className="w-4 h-4 mr-1" />
                      {hasPixel ? "Adicionar Outro" : "Cadastrar Pixel"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      <Separator />

      {/* Lista de Pixels Cadastrados */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Pixels Cadastrados
          </h2>
          <Input
            type="text"
            placeholder="Buscar pixels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg"
          />
        </div>

        {filteredPixelConfigs.length === 0 ? (
          <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
            <CardContent className="py-12 text-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 mx-auto w-fit">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum pixel cadastrado</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {searchTerm
                  ? "Nenhum pixel encontrado com esse filtro."
                  : "Cadastre seu primeiro pixel para começar a rastrear conversões e otimizar suas campanhas."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredPixelConfigs.map((config, index) => {
              const platformMeta = PIXEL_PLATFORMS[config.platform];
              return (
                <motion.div
                  key={config.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        {/* Ícone + Info */}
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                            style={{ backgroundColor: platformMeta.color + "20" }}
                          >
                            {platformMeta.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-semibold text-lg">{config.name || platformMeta.name}</h3>
                              <Badge variant={config.isActive ? "default" : "secondary"}>
                                {config.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2 font-mono">
                              ID: {config.pixelId}
                            </p>

                            {/* Métricas de eventos */}
                            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Activity className="w-3 h-3" />
                                <strong className="text-foreground">{config.eventCount ?? 0}</strong> eventos disparados
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Último: <strong className="text-foreground">{formatRelativeTime(config.lastFiredAt)}</strong>
                              </span>
                            </div>

                            {/* Tags de eventos */}
                            <div className="flex flex-wrap gap-1">
                              {config.events.slice(0, 5).map((event) => (
                                <Badge key={event} variant="outline" className="text-xs">
                                  {PIXEL_EVENT_LABELS[event as keyof typeof PIXEL_EVENT_LABELS] || event}
                                </Badge>
                              ))}
                              {config.events.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{config.events.length - 5}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Ver código */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenSnippetDialog(config)}
                            title="Ver código do pixel"
                            className="hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950"
                          >
                            <Code2 className="w-4 h-4" />
                          </Button>
                          {/* Ativar/Desativar */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => togglePixelConfig(config.id, !config.isActive)}
                            disabled={updating}
                            title={config.isActive ? "Desativar" : "Ativar"}
                            className="hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                          >
                            <Power className={`w-4 h-4 ${config.isActive ? "text-green-600" : "text-gray-400"}`} />
                          </Button>
                          {/* Editar */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEditDialog(config)}
                            disabled={updating}
                            title="Editar"
                            className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {/* Remover */}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePixel(config.id)}
                            disabled={deleting}
                            title="Remover"
                            className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ─── Dialog de Criação ──────────────────────────────────────────────── */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cadastrar Pixel {selectedPlatform && PIXEL_PLATFORMS[selectedPlatform].name}
            </DialogTitle>
            <DialogDescription>
              Configure um novo pixel para rastrear conversões no seu checkout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pixelId">Pixel ID <span className="text-red-500">*</span></Label>
              <Input
                id="pixelId"
                placeholder={
                  selectedPlatform === "FACEBOOK"
                    ? "1234567890123456"
                    : selectedPlatform === "TIKTOK"
                    ? "CXXXXXXXXXXXXXXXXX"
                    : "AW-1234567890 ou G-XXXXXXXXXX"
                }
                value={formData.pixelId}
                onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
              />
              {selectedPlatform && (
                <p className="text-xs text-muted-foreground">
                  Formato esperado:{" "}
                  {selectedPlatform === "FACEBOOK" && "15-16 dígitos"}
                  {selectedPlatform === "TIKTOK" && "Código alfanumérico de 15-20 caracteres"}
                  {selectedPlatform === "GOOGLE_ADS" && "AW-XXXXXXXXXX ou G-XXXXXXXXXX"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Nome (Opcional)</Label>
              <Input
                id="name"
                placeholder="Ex: Pixel Principal, Pixel de Remarketing..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Ativar pixel imediatamente</Label>
            </div>
            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>Cancelar</Button>
            <Button onClick={handleCreatePixel} disabled={creating || !formData.pixelId}>
              {creating ? "Cadastrando..." : "Cadastrar Pixel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog de Edição ───────────────────────────────────────────────── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pixel</DialogTitle>
            <DialogDescription>Atualize as configurações do seu pixel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-pixelId">Pixel ID</Label>
              <Input
                id="edit-pixelId"
                value={formData.pixelId}
                onChange={(e) => setFormData({ ...formData, pixelId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Nome do pixel"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="edit-isActive">Pixel ativo</Label>
            </div>
            {validationError && (
              <Alert variant="destructive">
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>Cancelar</Button>
            <Button onClick={handleUpdatePixel} disabled={updating}>
              {updating ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Dialog de Snippet ──────────────────────────────────────────────── */}
      <Dialog open={isSnippetDialogOpen} onOpenChange={setIsSnippetDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" />
              Código do Pixel — {snippetConfig && PIXEL_PLATFORMS[snippetConfig.platform].name}
            </DialogTitle>
            <DialogDescription>
              Cole este snippet no <code>&lt;head&gt;</code> do seu site externo. No checkout da SyncAds,
              o pixel é integrado automaticamente.
            </DialogDescription>
          </DialogHeader>
          {snippetConfig && (
            <div className="space-y-3">
              <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-lg overflow-x-auto leading-relaxed font-mono border border-gray-800 max-h-72 overflow-y-auto">
                {generatePixelSnippet(snippetConfig.platform, snippetConfig.pixelId)}
              </pre>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3" />
                  {snippetConfig.eventCount ?? 0} eventos disparados via checkout
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Último disparo: {formatRelativeTime(snippetConfig.lastFiredAt)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>Fechar</Button>
            <Button onClick={handleCopySnippet} className="gap-2">
              {snippetCopied ? (
                <><Check className="w-4 h-4" /> Copiado!</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar Código</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PixelsPage;

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail,
  Save,
  Send,
  Sparkles,
  ToggleLeft,
  Smartphone,
  Laptop,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { emailApi, EmailConfig, EmailEvent, EmailTemplateType } from "@/lib/api/emailApi";
import { ImageUploadField } from "@/components/checkout/ImageUploadField";

// Dados informativos dos placeholders suportados
const PLACEHOLDERS = [
  { tag: "{nome_cliente}", desc: "Nome completo do cliente" },
  { tag: "{numero_pedido}", desc: "Código/número do pedido (ex: #1004)" },
  { tag: "{valor_total}", desc: "Valor final da compra (ex: R$ 159,90)" },
  { tag: "{codigo_pix}", desc: "Chave copia e cola do Pix (apenas em Pix)" },
  { tag: "{link_pedido}", desc: "Link para o cliente acompanhar o pedido" },
];

const EmailsPage = () => {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EmailEvent>("ORDER_CONFIRMATION");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    loadEmailConfigs();
  }, [user?.id]);

  const loadEmailConfigs = async () => {
    try {
      if (!user?.id) return;
      setLoading(true);
      const data = await emailApi.getConfigs(user.id);
      setConfigs(data);
    } catch (error: any) {
      console.error("Erro ao carregar configurações de e-mail:", error);
      toast({
        title: "Erro ao carregar",
        description: error.message || "Não foi possível buscar as configurações de e-mail.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = configs.find((c) => c.event === activeEvent) || {
    event: activeEvent,
    isActive: true,
    subject: "",
    templateType: "clean" as EmailTemplateType,
    bodyText: "",
    userId: user?.id || "",
  };

  const updateCurrentConfig = (updates: Partial<EmailConfig>) => {
    setConfigs((prev) =>
      prev.map((c) => (c.event === activeEvent ? { ...c, ...updates } : c))
    );
  };

  const handleSave = async () => {
    try {
      if (!user?.id) return;
      setSaving(true);
      
      const configToSave = {
        ...currentConfig,
        userId: user.id
      } as EmailConfig;

      const saved = await emailApi.saveConfig(configToSave);
      
      // Atualizar lista local com o registro retornado do banco
      setConfigs((prev) =>
        prev.map((c) => (c.event === activeEvent ? saved : c))
      );

      toast({
        title: "Configuração salva!",
        description: "As alterações do e-mail foram salvas e aplicadas.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar e-mail:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!testEmailAddress) {
      toast({
        title: "E-mail inválido",
        description: "Digite um endereço de e-mail válido para testar.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!user?.id) return;
      setTesting(true);
      await emailApi.sendTestEmail(user.id, activeEvent, testEmailAddress);
      
      toast({
        title: "E-mail de teste enviado!",
        description: `Enviamos o teste do evento ${getEventLabel(activeEvent)} para ${testEmailAddress}.`,
      });
      setIsTestModalOpen(false);
    } catch (error: any) {
      console.error("Erro ao enviar e-mail de teste:", error);
      toast({
        title: "Erro ao enviar teste",
        description: error.message || "Verifique as configurações e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getEventLabel = (event: EmailEvent) => {
    const labels: Record<EmailEvent, string> = {
      ORDER_CONFIRMATION: "Confirmação de Pedido",
      PAYMENT_APPROVED: "Pagamento Aprovado",
      ORDER_CANCELLED: "Pedido Cancelado",
      CART_RECOVERY: "Recuperação de Carrinho",
      PIX_RECOVERY: "Recuperação de PIX",
    };
    return labels[event] || event;
  };

  const getEventDescription = (event: EmailEvent) => {
    const desc: Record<EmailEvent, string> = {
      ORDER_CONFIRMATION: "Enviado logo após o cliente finalizar uma compra no checkout.",
      PAYMENT_APPROVED: "Enviado quando o gateway de pagamento aprova e confirma a transação.",
      ORDER_CANCELLED: "Enviado se o pedido for negado, recusado ou cancelado no gateway.",
      CART_RECOVERY: "Enviado para clientes que deixaram produtos no checkout e abandonaram o site.",
      PIX_RECOVERY: "Enviado para lembrar o cliente de pagar o PIX pendente e acelerar a conversão.",
    };
    return desc[event] || "";
  };

  // Processar texto dinâmico para pré-visualização
  const renderPreviewText = (text: string) => {
    if (!text) return "";
    return text
      .replace(/{nome_cliente}/g, "Tonny Santos")
      .replace(/{numero_pedido}/g, "10492")
      .replace(/{valor_total}/g, "R$ 149,90")
      .replace(
        /{codigo_pix}/g,
        "00020101021226830014br.gov.bcb.pix2561api.itau.com/pix/v2/cobv/050a49bd1c424a87b1c43b9d3129883"
      )
      .replace(/{link_pedido}/g, "#");
  };

  // Renderizar o layout de e-mail simulado de acordo com o templateType
  const renderEmailPreview = () => {
    const logoUrl = currentConfig.headerLogo || "https://syncads.com.br/logo.png";
    const headerText = currentConfig.headerText || getEventLabel(activeEvent);
    const bodyProcessed = renderPreviewText(currentConfig.bodyText);
    const buttonText = currentConfig.buttonText || "Visualizar";
    const footerText = currentConfig.footerText || "SyncAds — Vendas Inteligentes";

    const isPix = activeEvent === "PIX_RECOVERY";

    // Layout 1: CLEAN
    if (currentConfig.templateType === "clean") {
      return (
        <div className="bg-slate-50 p-6 font-sans text-slate-800 text-sm h-full overflow-y-auto">
          <div className="max-w-md mx-auto bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="p-6 text-center border-b border-slate-50">
              {currentConfig.headerLogo ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 mx-auto object-contain mb-3"
                  onError={(e) => {
                    // Fallback se imagem falhar
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-10 h-10 bg-slate-900 text-white font-bold rounded-lg flex items-center justify-center mx-auto mb-2 text-lg">
                  S
                </div>
              )}
              <h2 className="text-xl font-bold text-slate-800">{headerText}</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="whitespace-pre-line text-slate-600 leading-relaxed">
                {bodyProcessed}
              </p>

              {/* Botão */}
              {currentConfig.buttonText && (
                <div className="py-4 text-center">
                  <a
                    href="#test"
                    onClick={(e) => e.preventDefault()}
                    className="inline-block bg-slate-900 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all hover:bg-slate-800 shadow-sm"
                  >
                    {buttonText}
                  </a>
                </div>
              )}

              {/* Tabela de Produtos Mock */}
              <div className="border-t border-slate-100 pt-4 mt-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Resumo do Pedido
                </p>
                <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50">
                  <span className="text-slate-600">1x Combo SyncAds Premium</span>
                  <span className="font-semibold text-slate-800">R$ 149,90</span>
                </div>
                <div className="flex items-center justify-between text-xs py-2 font-bold text-slate-800 pt-3">
                  <span>Total</span>
                  <span>R$ 149,90</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100 text-xs text-slate-400">
              <p>{footerText}</p>
              <p className="mt-1 text-[10px]">
                Você recebeu este e-mail transacional referente à sua atividade em nossa loja.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Layout 2: MODERN
    if (currentConfig.templateType === "modern") {
      return (
        <div className="bg-[#0f172a] p-6 font-sans text-slate-300 text-sm h-full overflow-y-auto">
          <div className="max-w-md mx-auto bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
            {/* Top Accent Line */}
            <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

            {/* Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-800/60">
              <span className="font-bold text-white tracking-wide text-lg flex items-center gap-2">
                {currentConfig.headerLogo ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-7 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  "SyncAds"
                )}
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Transação Segura
              </Badge>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {headerText}
              </h2>
              
              <p className="whitespace-pre-line text-slate-400 leading-relaxed">
                {bodyProcessed}
              </p>

              {/* Botão */}
              {currentConfig.buttonText && (
                <div className="py-2">
                  <a
                    href="#test"
                    onClick={(e) => e.preventDefault()}
                    className="inline-flex items-center justify-center w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-all hover:brightness-110 shadow-lg shadow-emerald-500/10"
                  >
                    {buttonText}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </div>
              )}

              {/* Pix Copy and Paste Box (Apenas visualização do Pix) */}
              {isPix && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                  <span className="text-xs font-semibold text-emerald-400">
                    Cópia e Cola PIX
                  </span>
                  <div className="font-mono text-xs text-slate-400 truncate bg-slate-900 p-2.5 rounded border border-slate-800">
                    00020101021226830014br.gov.bcb.pix2561api...
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-950 text-center border-t border-slate-800/80 text-xs text-slate-500 space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span className="font-medium">Pagamento 100% Protegido</span>
              </div>
              <p>{footerText}</p>
            </div>
          </div>
        </div>
      );
    }

    // Layout 3: PREMIUM
    return (
      <div className="bg-slate-100 p-6 font-sans text-slate-800 text-sm h-full overflow-y-auto">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-center text-white relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="relative z-10 space-y-3">
              {currentConfig.headerLogo ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-10 mx-auto object-contain brightness-0 invert"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white font-extrabold rounded-xl flex items-center justify-center mx-auto text-xl">
                  S
                </div>
              )}
              <h2 className="text-2xl font-black tracking-tight">{headerText}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <p className="whitespace-pre-line text-slate-600 leading-relaxed text-base">
              {bodyProcessed}
            </p>

            {/* Botão */}
            {currentConfig.buttonText && (
              <div className="text-center py-2">
                <a
                  href="#test"
                  onClick={(e) => e.preventDefault()}
                  className="inline-block bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-8 py-3 rounded-xl text-sm transition-all hover:shadow-lg shadow-violet-500/20"
                >
                  {buttonText}
                </a>
              </div>
            )}

            {/* Premium Details Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Detalhes da Transação
              </span>
              <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-600">
                <span>Pedido</span>
                <span className="font-semibold text-slate-900 text-right">#10492</span>
                <span>Cliente</span>
                <span className="font-semibold text-slate-900 text-right">Tonny Santos</span>
                <span>Total da Compra</span>
                <span className="font-bold text-violet-600 text-right">R$ 149,90</span>
              </div>
            </div>
          </div>

          {/* Security & Badges */}
          <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-4 w-4 text-indigo-600" /> Compra Garantida
            </span>
            <span>Suporte 24h</span>
          </div>

          {/* Footer */}
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-100/50 border-t border-slate-100">
            <p className="font-medium text-slate-500">{footerText}</p>
            <p className="mt-1">SyncAds IA Checkout Systems Ltda.</p>
          </div>
        </div>
      </div>
    );
  };

  const currentEventName = getEventLabel(activeEvent);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
            E-mails do Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Configure modelos e personalize o envio de e-mails transacionais e de recuperação
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex gap-2"
        >
          <Button
            variant="outline"
            onClick={() => setIsTestModalOpen(true)}
            className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-700 dark:text-gray-300 font-semibold"
            disabled={loading || configs.length === 0}
          >
            <Send className="h-4 w-4 mr-2" />
            Enviar Teste
          </Button>

          <Button
            onClick={handleSave}
            disabled={loading || saving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:shadow-lg shadow-violet-500/20"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar E-mail
          </Button>
        </motion.div>
      </div>

      {/* Grid Central */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 border-0 shadow-lg">
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardContent className="p-6 space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Menu de Eventos à Esquerda */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
              Eventos Disponíveis
            </h3>
            <div className="space-y-1">
              {(["ORDER_CONFIRMATION", "PAYMENT_APPROVED", "ORDER_CANCELLED", "CART_RECOVERY", "PIX_RECOVERY"] as EmailEvent[]).map((event) => {
                const isSelected = activeEvent === event;
                const config = configs.find((c) => c.event === event);
                const isActive = config ? config.isActive : true;

                return (
                  <button
                    key={event}
                    onClick={() => setActiveEvent(event)}
                    className={`w-full text-left p-3.5 rounded-xl transition-all duration-300 flex items-start justify-between border ${
                      isSelected
                        ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/10 border-violet-500/30 text-violet-700 dark:text-violet-300 font-bold"
                        : "bg-white/50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 font-medium"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Mail className={`h-4 w-4 ${isSelected ? "text-violet-500" : "text-gray-400"}`} />
                        <span className="text-sm">{getEventLabel(event)}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 line-clamp-1">
                        {getEventDescription(event)}
                      </span>
                    </div>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={`text-[9px] px-1.5 py-0 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/10"
                      }`}
                    >
                      {isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </button>
                );
              })}
            </div>
            
            {/* Box Informativa */}
            <Card className="border-0 bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/10 dark:to-blue-950/10 shadow-sm mt-6">
              <CardContent className="p-4 space-y-2 flex items-start gap-2.5">
                <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                  <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Dica de Conversão</p>
                  E-mails de recuperação de carrinho e PIX geram em média de 12% a 18% de aumento no faturamento direto da sua loja. Personalize a copy para fazer ofertas especiais!
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form de Configuração no Centro */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg">
              <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold">{currentEventName}</CardTitle>
                    <CardDescription>{getEventDescription(activeEvent)}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="active-toggle" className="text-xs text-muted-foreground">
                      Status de envio:
                    </Label>
                    <Switch
                      id="active-toggle"
                      checked={currentConfig.isActive}
                      onCheckedChange={(checked) => updateCurrentConfig({ isActive: checked })}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Seleção do Template */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-violet-500" />
                    Modelo Visual do E-mail
                  </Label>
                  <Select
                    value={currentConfig.templateType}
                    onValueChange={(val: EmailTemplateType) => updateCurrentConfig({ templateType: val })}
                  >
                    <SelectTrigger className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50">
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Mínimo / Clean (Fundo Claro)</SelectItem>
                      <SelectItem value="modern">Moderno (Fundo Escuro e Detalhes Emerald)</SelectItem>
                      <SelectItem value="premium">Premium (Cabeçalho com Degradê e Detalhes Violeta)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Assunto do E-mail */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Assunto do E-mail</Label>
                  <Input
                    placeholder="Assunto que aparece na caixa de entrada do cliente"
                    value={currentConfig.subject}
                    onChange={(e) => updateCurrentConfig({ subject: e.target.value })}
                    className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50"
                  />
                </div>

                {/* Logo URL */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Logo da Loja</Label>
                  <ImageUploadField
                    label="Carregar Logo"
                    description="Tamanho recomendado: 200x50px ou proporção semelhante (máx. 2MB, formatos PNG, JPG, SVG, WEBP)."
                    value={currentConfig.headerLogo || ""}
                    onChange={(url) => updateCurrentConfig({ headerLogo: url })}
                    bucket="checkout-images"
                    path="logos"
                    maxSizeMB={2}
                    acceptedFormats={[
                      "image/png",
                      "image/jpeg",
                      "image/jpg",
                      "image/webp",
                      "image/svg+xml",
                      "image/gif",
                    ]}
                  />
                </div>

                {/* Header Text */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Título do Cabeçalho</Label>
                  <Input
                    placeholder="ex: Seu pagamento foi aprovado!"
                    value={currentConfig.headerText || ""}
                    onChange={(e) => updateCurrentConfig({ headerText: e.target.value })}
                    className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50"
                  />
                </div>

                {/* Corpo do E-mail */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Mensagem (Corpo do E-mail)</Label>
                  <Textarea
                    placeholder="Escreva a mensagem aqui..."
                    value={currentConfig.bodyText}
                    onChange={(e) => updateCurrentConfig({ bodyText: e.target.value })}
                    rows={8}
                    className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 leading-relaxed font-sans"
                  />
                </div>

                {/* Botão de Ação Rápida */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      Texto do Botão
                    </Label>
                    <Input
                      placeholder="ex: Ir para o Pedido"
                      value={currentConfig.buttonText || ""}
                      onChange={(e) => updateCurrentConfig({ buttonText: e.target.value })}
                      className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      URL do Botão (Opcional)
                    </Label>
                    <Input
                      placeholder="Deixe em branco para usar o link dinâmico"
                      value={currentConfig.buttonUrl || ""}
                      onChange={(e) => updateCurrentConfig({ buttonUrl: e.target.value })}
                      className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 text-xs"
                    />
                  </div>
                </div>

                {/* Rodapé do E-mail */}
                <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-4">
                  <Label className="text-sm font-semibold">Texto do Rodapé</Label>
                  <Input
                    placeholder="ex: Obrigado pela preferência! Equipe SyncAds"
                    value={currentConfig.footerText || ""}
                    onChange={(e) => updateCurrentConfig({ footerText: e.target.value })}
                    className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulador / Preview Visual à Direita */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                Pré-visualização
              </span>
              <div className="bg-white/50 dark:bg-gray-900/50 p-0.5 rounded-lg border border-gray-100 dark:border-gray-800 flex">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`p-1.5 rounded-md transition-all ${
                    previewDevice === "desktop"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  }`}
                  title="Desktop"
                >
                  <Laptop className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`p-1.5 rounded-md transition-all ${
                    previewDevice === "mobile"
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  }`}
                  title="Smartphone"
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Simulador de Viewport */}
            <div
              className={`border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 bg-slate-100 mx-auto ${
                previewDevice === "mobile" ? "max-w-[375px] h-[550px]" : "w-full h-[650px]"
              }`}
            >
              {/* Fake Email client bar */}
              <div className="bg-slate-200 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-300 dark:border-slate-800 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                <div className="ml-3 bg-white dark:bg-gray-950/80 px-3 py-1 rounded border border-slate-300/60 dark:border-slate-800 text-[10px] w-full truncate max-w-[240px]">
                  Assunto: {currentConfig.subject || "(sem assunto)"}
                </div>
              </div>
              {/* Email Body */}
              <div className="h-[calc(100%-32px)]">
                {renderEmailPreview()}
              </div>
            </div>

            {/* Guia de Tags de Placeholders */}
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-md">
              <CardContent className="p-4 space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Tags Dinâmicas Disponíveis
                </h4>
                <div className="space-y-2 max-h-[140px] overflow-y-auto text-xs">
                  {PLACEHOLDERS.map((p) => {
                    const isPixOnly = p.tag === "{codigo_pix}";
                    if (isPixOnly && activeEvent !== "PIX_RECOVERY") return null;

                    return (
                      <div
                        key={p.tag}
                        onClick={() => {
                          updateCurrentConfig({
                            bodyText: currentConfig.bodyText + " " + p.tag,
                          });
                          toast({
                            description: `Tag ${p.tag} inserida no corpo do e-mail.`,
                          });
                        }}
                        className="flex items-start justify-between p-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border border-transparent hover:border-gray-100 dark:hover:border-gray-800 transition-all"
                      >
                        <code className="text-violet-600 dark:text-violet-400 font-mono font-bold bg-violet-500/10 px-1 py-0.5 rounded text-[10px]">
                          {p.tag}
                        </code>
                        <span className="text-[10px] text-muted-foreground text-right">
                          {p.desc}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal / Dialog de Envio de Teste */}
      <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
        <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-violet-500" />
              Enviar E-mail de Teste
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 text-xs">
              Veja como o e-mail de <strong>{currentEventName}</strong> chega na sua caixa de entrada real.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="test-email" className="text-gray-700 dark:text-gray-300 text-xs font-semibold">
                Destinatário (E-mail de teste)
              </Label>
              <Input
                id="test-email"
                type="email"
                placeholder="seuemail@exemplo.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-950/50 text-sm dark:text-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsTestModalOpen(false)}
              className="border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={testing}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold hover:shadow-lg shadow-violet-500/20"
            >
              {testing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailsPage;

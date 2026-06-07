import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Palette,
  Layout,
  Zap,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuthStore } from "@/store/authStore";
import { checkoutApi, CheckoutCustomization } from "@/lib/api/checkoutApi";
import { DEFAULT_CHECKOUT_THEME } from "@/config/defaultCheckoutTheme";
import { supabase } from "@/lib/supabase";
import PublicCheckoutPage from "@/pages/public/PublicCheckoutPage";
import { CheckoutCustomizationSidebar } from "@/components/checkout/CheckoutCustomizationSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  useCheckoutConfigStore,
  selectCheckoutConfig,
} from "@/store/checkoutConfigStore";
import { legacyThemeToConfig } from "@/types/checkout-config.types";

// Limpa chaves antigas do localStorage (evita dados corrompidos de versões anteriores)
try {
  localStorage.removeItem('checkout-config-v1');
} catch (_) { /* silencioso */ }


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

const CheckoutCustomizePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  // ── Zustand store (source of truth para configuração) ──────────────────
  const storeConfig   = useCheckoutConfigStore(selectCheckoutConfig);
  const loadConfig    = useCheckoutConfigStore((s) => s.loadConfig);
  const updateConfig  = useCheckoutConfigStore((s) => s.updateConfig);
  const switchTemplate = useCheckoutConfigStore((s) => s.switchTemplate);
  // ──────────────────────────────────────────────────────────────────────

  const [expandedSections, setExpandedSections] = useState<string[]>(["CABECALHO"]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(true);
  // customization: dados brutos do Supabase (legado) — mantido para compatibilidade de persistência
  const [customization, setCustomization] = useState<CheckoutCustomization | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);
  const [activeTemplateSlug, setActiveTemplateSlug] = useState<string>('minimal');
  const UI_VERSION = "v5.0-STORE";
  const [isActivating, setIsActivating] = useState(false);

  // Detectar mudanças no storeConfig (via updateConfig do Zustand) → habilitar botão salvar
  const prevStoreConfigRef = useRef<typeof storeConfig | null>(null);
  useEffect(() => {
    if (prevStoreConfigRef.current !== null && prevStoreConfigRef.current !== storeConfig) {
      setHasChanges(true);
    }
    prevStoreConfigRef.current = storeConfig;
  }, [storeConfig]);

  // ✨ Preview reativo: injeta storeConfig no tema para que o TemplateRenderer
  // use o config do store diretamente (bypassa legacyThemeToConfig em modo preview)
  const previewTheme = useMemo(() => ({
    ...(customization?.theme || DEFAULT_CHECKOUT_THEME),
    templateSlug: activeTemplateSlug,
    _checkoutConfig: storeConfig,    // ← portador do config reativo
  }), [customization?.theme, storeConfig, activeTemplateSlug]);

  // Detectar e aplicar dark mode do sistema
  useEffect(() => {
    const isDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) {
        console.log("❌ Sem user.id");
        return;
      }

      console.log("🚀 Iniciando carregamento do checkout customizer...");
      await loadCustomization();

      // ✅ Usar ID local de preview — não cria Order no banco
      // (evita violação de constraint CHECK no campo status)
      setPreviewOrderId("preview-local");
      setLoading(false);
    };

    if (user?.id) {
      run();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadCustomization = async () => {
    try {
      setLoading(true);
      const data = await checkoutApi.loadCustomization(user!.id);
      const rawTheme = data?.theme ?? (DEFAULT_CHECKOUT_THEME as Record<string, unknown>);
      const slug = (rawTheme.templateSlug as string) || 'minimal';

      if (data) {
        setCustomization(data);
      } else {
        setCustomization({
          id: `draft-${Date.now()}`,
          userId: user!.id,
          name: "Checkout Principal",
          theme: DEFAULT_CHECKOUT_THEME as Record<string, unknown>,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // ✅ Sincronizar store com dados do banco
      loadConfig(legacyThemeToConfig(rawTheme, slug));
      setActiveTemplateSlug(slug);

      // ✅ Inicializar banner URLs no store para que apagos sejam rastreados
      // (sem isso, ao apagar uma imagem o store fica com undefined e o ?? usa o valor antigo do DB)
      if (data) {
        updateConfig({
          banner: {
            desktopUrl: (rawTheme.bannerTopUrl as string | null) ?? null,
            leftTopUrl: (rawTheme.bannerLeftUrl as string | null) ?? null,
            rightTopUrl: (rawTheme.bannerRightUrl as string | null) ?? null,
            mobileUrl: (rawTheme.bannerMobileUrl as string | null) ?? null,
          },
        });
      }
    } catch (error) {
      console.error("Erro ao carregar personalização:", error);
      toast({
        title: "Erro ao carregar personalização",
        description: "Não foi possível carregar as configurações do checkout",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = async (slug: string) => {
    if (!customization || !user?.id) return;
    setIsActivating(true);
    try {
      // ✅ Atualiza store com defaults corretos do novo template
      switchTemplate(slug);

      const isDraft = !customization.id || customization.id.startsWith('draft-');
      // Persiste no banco usando o tema legado mesclado com o novo slug
      const newTheme = { ...customization.theme, templateSlug: slug, activeTemplateSlug: slug };

      let savedData: CheckoutCustomization | null = null;
      if (isDraft) {
        const { data, error } = await supabase
          .from('CheckoutCustomization')
          .insert({
            userId: user.id,
            name: customization.name || 'Checkout Principal',
            theme: newTheme,
            isActive: true,
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      } else {
        const { data, error } = await supabase
          .from('CheckoutCustomization')
          .update({ theme: newTheme, updatedAt: new Date().toISOString() })
          .eq('id', customization.id)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      }

      setCustomization({ ...customization, ...(savedData ?? {}), theme: newTheme });
      setActiveTemplateSlug(slug);
      setHasChanges(false);
      setPreviewKey((prev) => prev + 1);
      toast({ title: "✅ Template ativado!", description: "O checkout público agora usa este template." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Não foi possível ativar o template.";
      console.error('handleUseTemplate error:', e);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setIsActivating(false);
    }
  };

  const handleSave = async () => {
    if (!customization) {
      toast({ title: "Erro", description: "Configurações não encontradas.", variant: "destructive" });
      return;
    }
    if (!user?.id) {
      toast({ title: "Erro", description: "Você precisa estar logado para salvar.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // ✅ Usa store como source of truth — mescla com theme legado para retrocompatibilidade
      const mergedTheme = {
        ...customization.theme,
        // Campos canônicos do store (sobrescrevem os legados)
        noticeBarEnabled: storeConfig.noticeBar.enabled,
        noticeBarText: storeConfig.noticeBar.message,
        noticeBarBackgroundColor: storeConfig.noticeBar.bgColor,
        noticeBarTextColor: storeConfig.noticeBar.textColor,
        primaryColor: storeConfig.buttons.primaryBg,
        primaryButtonBackgroundColor: storeConfig.buttons.primaryBg,
        checkoutButtonBackgroundColor: storeConfig.buttons.checkoutBg,
        fontFamily: storeConfig.typography.fontFamily,
        logoUrl: storeConfig.header.logoUrl,
        storeName: storeConfig.header.storeName,
        footerBackgroundColor: storeConfig.footer.bgColor,
        footerTextColor: storeConfig.footer.textColor,
        useVisible: storeConfig.scarcity.enabled,
        expirationTime: storeConfig.scarcity.durationMinutes,
        templateSlug: storeConfig.templateSlug,
        // Banner zones (zonas de imagem dos templates — DropZone)
        // IMPORTANTE: usar in-check em vez de ?? para que null (apagado) não seja substituído
        // pelo valor antigo de customization.theme. null = explicitamente apagado pelo usuário.
        bannerTopUrl: (() => {
          const st = storeConfig.banner;
          // Se o store tem um valor (incluindo null = apagado), usa ele; caso contrário mantém o do DB
          if (st && st.desktopUrl !== undefined) return st.desktopUrl;  // null ou url
          return customization.theme?.bannerTopUrl ?? null;
        })(),
        bannerLeftUrl: (() => {
          const st = storeConfig.banner;
          if (st && st.leftTopUrl !== undefined) return st.leftTopUrl;
          return customization.theme?.bannerLeftUrl ?? null;
        })(),
        bannerRightUrl: (() => {
          const st = storeConfig.banner;
          if (st && st.rightTopUrl !== undefined) return st.rightTopUrl;
          return customization.theme?.bannerRightUrl ?? null;
        })(),
        bannerMobileUrl: (() => {
          const st = storeConfig.banner;
          if (st && st.mobileUrl !== undefined) return st.mobileUrl;
          return customization.theme?.bannerMobileUrl ?? null;
        })(),
        // Payload novo (checkoutConfig completo para leitura futura)
        _checkoutConfig: storeConfig,
      };

      console.log(`💾 [${UI_VERSION}] Salvando config...`, mergedTheme);

      const isDraft = !customization.id || customization.id.startsWith('draft-');

      if (isDraft) {
        const { data, error } = await supabase
          .from('CheckoutCustomization')
          .insert({
            userId: user.id,
            name: customization.name || 'Checkout Principal',
            theme: mergedTheme,
            isActive: true,
            updatedAt: new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        setCustomization({ ...customization, ...data, theme: mergedTheme });
      } else {
        const { error } = await supabase
          .from('CheckoutCustomization')
          .update({
            theme: mergedTheme,
            name: customization.name,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', customization.id);
        if (error) throw error;
        setCustomization({ ...customization, theme: mergedTheme });
      }

      setHasChanges(false);
      toast({
        title: "✅ Salvo!",
        description: `Configurações (${UI_VERSION}) salvas com sucesso.`,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Erro de conexão com o Supabase.";
      console.error("❌ Erro fatal ao salvar:", error);
      toast({ title: "Falha Crítica", description: msg, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Mantido para compatibilidade com o preview legado.
   * As edições finas agora fluem pelo Zustand store via Sidebar.
   */
  const updateTheme = (updates: Partial<Record<string, unknown>>) => {
    if (!customization) return;
    setCustomization({
      ...customization,
      theme: { ...customization.theme, ...updates },
    });
    setHasChanges(true);
    setPreviewKey((prev) => prev + 1);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-850 dark:to-purple-900/40">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Carregando personalização...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-850 dark:to-purple-900/40">
      {/* Marcador de Versão para Debug */}
      <div className="fixed top-4 left-4 z-50 bg-black/80 text-white px-2 py-1 rounded text-[10px] font-mono pointer-events-none">
        {UI_VERSION}
      </div>

      {/* Sidebar de Personalização — envolvida em ErrorBoundary local */}
      <ErrorBoundary>
        <CheckoutCustomizationSidebar
          expandedSections={expandedSections}
          onToggleSection={toggleSection}
          activeTemplateSlug={activeTemplateSlug}
          onSelectTemplate={(slug, version) => {
            // Limpar dados corrompidos antes de trocar template
            try { localStorage.removeItem('checkout-config-v1'); } catch (_) {}
            switchTemplate(slug, version);
            setActiveTemplateSlug(slug);
            setCustomization((prev) => 
              prev ? { ...prev, theme: { ...prev.theme, templateSlug: slug } } : prev
            );
            setHasChanges(true);
            setPreviewKey((prev) => prev + 1);
          }}
          onAnyChange={() => {
            setHasChanges(true);
            // ✔ Não precisa mais de setPreviewKey — o previewTheme é reativo via storeConfig
          }}
        />
      </ErrorBoundary>

      {/* Área Principal - Header + Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 px-6 py-3 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/checkout/gateways")}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              {/* Toggle Preview */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-2"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Ocultar Preview
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Mostrar Preview
                  </>
                )}
              </Button>

              {/* Preview Mode Toggle */}
              {showPreview && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
                  <Button
                    size="sm"
                    variant={previewMode === "desktop" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("desktop")}
                    className={cn(
                      "gap-2",
                      previewMode === "desktop" &&
                        "bg-violet-500 hover:bg-violet-600",
                    )}
                  >
                    <Monitor className="h-4 w-4" />
                    Desktop
                  </Button>
                  <Button
                    size="sm"
                    variant={previewMode === "mobile" ? "default" : "ghost"}
                    onClick={() => setPreviewMode("mobile")}
                    className={cn(
                      "gap-2",
                      previewMode === "mobile" &&
                        "bg-violet-500 hover:bg-violet-600",
                    )}
                  >
                    <Smartphone className="h-4 w-4" />
                    Mobile
                  </Button>
                </div>
              )}

              {/* Usar este Checkout Button */}
              <Button
                onClick={() => {
                  const currentSlug = customization?.theme?.templateSlug || 'minimal';
                  handleUseTemplate(currentSlug);
                }}
                disabled={isActivating}
                variant="outline"
                className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30 font-semibold transition-all duration-200"
              >
                {isActivating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Usar este Checkout
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>

              {hasChanges && (
                <Badge
                  variant="default"
                  className="bg-amber-500 text-white animate-pulse"
                >
                  Não salvo
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Preview Area - Background unificado azul marinho (#0f172a) */}
        {showPreview ? (
          <div className={cn("flex-1 overflow-y-auto overflow-x-hidden bg-[#0f172a]", previewMode === "mobile" ? "p-4 pt-12" : "p-8 pt-16")}>
             {/* Global style to hide the scrollbar track and make it look premium */}
             <style dangerouslySetInnerHTML={{ __html: `
                ::-webkit-scrollbar {
                  width: 8px;
                }
                ::-webkit-scrollbar-track {
                  background: #0f172a;
                }
                ::-webkit-scrollbar-thumb {
                  background: #1e293b;
                  border-radius: 4px;
                }
                ::-webkit-scrollbar-thumb:hover {
                  background: #334155;
                }
             `}} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center placeholder-preview w-full"
            >
              <Card
                className={cn(
                  "shadow-2xl transition-all duration-300 mx-auto relative",
                  previewMode === "desktop"
                    // Desktop: sem overflow-hidden — o Card cresce com o conteúdo e a área externa faz scroll
                    ? "w-full max-w-[1400px] h-auto rounded-2xl bg-white overflow-visible"
                    // Mobile: frame do phone com borda arredondada — o clip é feito pelo frame
                    : "w-[390px] rounded-[3rem] border-[10px] border-[#1e293b] shadow-[0_0_0_2px_rgba(255,255,255,0.05),0_20px_50px_-12px_rgba(0,0,0,0.5)] mb-12 overflow-hidden bg-white",
                )}
              >
                {/* Physical Buttons Simulation (Only Mobile) */}
                {previewMode === "mobile" && (
                  <>
                    {/* Left side: Mute & Volume */}
                    <div className="absolute -left-[12px] top-28 w-[3px] h-6 bg-[#334155] rounded-l-md" /> {/* Mute */}
                    <div className="absolute -left-[12px] top-40 w-[3px] h-14 bg-[#334155] rounded-l-md" /> {/* Vol Up */}
                    <div className="absolute -left-[12px] top-56 w-[3px] h-14 bg-[#334155] rounded-l-md" /> {/* Vol Down */}
                    {/* Right side: Power */}
                    <div className="absolute -right-[12px] top-48 w-[3px] h-20 bg-[#334155] rounded-r-md" />
                  </>
                )}
                <div
                  className={cn(
                    "w-full relative",
                    previewMode === "mobile"
                      // Mobile: área scrollável de altura fixa simulando a tela do celular
                      ? "h-[700px] overflow-y-auto overflow-x-hidden"
                      // Desktop: sem restrição de altura — cresce com o conteúdo
                      : "h-auto overflow-visible",
                  )}
                >
                  {/* Dynamic Island / Status Bar UI — fundo branco para compatibilidade com todos os templates */}
                  {previewMode === "mobile" && (
                    <div className="sticky top-0 left-0 right-0 h-12 flex items-center justify-between px-6 z-[100] bg-white border-b border-gray-100 flex-shrink-0 pointer-events-none">
                      {/* Clock */}
                      <span className="text-[11px] font-bold text-gray-900">9:41</span>
                      
                      {/* Dynamic Island Pill */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[100px] h-[26px] bg-black rounded-[14px] flex items-center justify-between px-3 ring-1 ring-black/10 shadow-md">
                         {/* Mute/Action Indicator dot */}
                         <div className="w-[14px] h-[2px] bg-zinc-800 rounded-full" />
                         {/* Camera Lens */}
                         <div className="w-3 h-3 rounded-full bg-[#0a0a0a] border border-white/5 flex items-center justify-center">
                            <div className="w-1 h-1 bg-blue-500/20 blur-[1px] rounded-full" />
                         </div>
                      </div>

                      {/* Icons (WiFi, Signal, Battery) — dark for white background */}
                      <div className="flex items-center gap-1">
                         <svg width="15" height="10" viewBox="0 0 15 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 7.5V10H2V7.5H0ZM3.25 5V10H5.25V5H3.25ZM6.5 2.5V10H8.5V2.5H6.5ZM9.75 0V10H11.75V0H9.75Z" fill="#111827" fillOpacity="0.9"/>
                         </svg>
                         <svg width="15" height="11" viewBox="0 0 15 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7.5 11L15 2.5C14.7 2.2 12 0 7.5 0C3 0 0.3 2.2 0 2.5L7.5 11ZM7.5 1.5C10.5 1.5 12.5 2.8 13.5 3.5L7.5 10.3L1.5 3.5C2.5 2.8 4.5 1.5 7.5 1.5Z" fill="#111827" fillOpacity="0.9"/>
                         </svg>
                         <div className="w-[20px] h-[10px] border border-gray-400 rounded-[2.5px] relative p-[1px]">
                            <div className="h-full w-[90%] bg-gray-800 rounded-[1px]" />
                            <div className="absolute -right-[3px] top-[2.5px] w-[1.5px] h-[3px] bg-gray-400 rounded-r-[1px]" />
                         </div>
                      </div>
                    </div>
                  )}
                  {previewOrderId ? (
                    <>
                      <div className="hidden">
                        {console.log(
                          "🎨 Renderizando PublicCheckoutPage com orderId:",
                          previewOrderId,
                        )}
                        {console.log(
                          "🎨 Theme injetado:",
                          customization?.theme,
                        )}
                        {console.log("🎨 Preview mode:", true)}
                      </div>
                      <ErrorBoundary>
                        <PublicCheckoutPage
                          key={activeTemplateSlug}
                          injectedOrderId={previewOrderId}
                          injectedTheme={previewTheme}
                          previewMode={true}
                          isMobile={previewMode === "mobile"}
                          onUpdateTheme={(overrides) => updateTheme(overrides)}
                        />
                      </ErrorBoundary>
                      
                      {/* Home Indicator (iOS Style) */}
                      {previewMode === "mobile" && (
                        <div className="flex justify-center pb-3 pt-8 flex-shrink-0 sticky bottom-0 left-0 right-0 bg-transparent pointer-events-none">
                          <div className="w-32 h-1.5 bg-white/20 rounded-full shadow-sm" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="text-center p-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl max-w-md">
                          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Loader2 className="h-8 w-8 text-white animate-spin" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            Carregando Preview
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Preparando visualização do checkout...
                          </p>
                          <div className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <p className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Paleta de cores moderna implementada
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              Upload de imagens funcional
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                              78 opções de personalização ativas
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-yellow-500" />
                              Preview visual em breve
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <div className="text-center">
              <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
                Preview oculto
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Clique em "Mostrar Preview" para visualizar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de Status */}
      <motion.div
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-2xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                hasChanges
                  ? "bg-amber-500 animate-pulse"
                  : "bg-green-500 animate-pulse",
              )}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {hasChanges ? "Alterações pendentes" : "Tudo salvo"}
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default CheckoutCustomizePage;


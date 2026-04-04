import React, { useState, useEffect } from "react";
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

  const [expandedSections, setExpandedSections] = useState<string[]>([
    "CABECALHO",
  ]);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [showPreview, setShowPreview] = useState(true);
  const [customization, setCustomization] =
    useState<CheckoutCustomization | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

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

      console.log("🚀 Iniciando carregamento do preview...");
      await loadCustomization();

      if (!previewOrderId) {
        console.log("📦 Criando pedido de preview...");
        try {
          // Primeiro, tentar buscar um pedido PREVIEW existente
          const { data: existingOrders, error: searchError } = await supabase
            .from("Order")
            .select("id")
            .eq("status", "PREVIEW")
            .eq("userId", user.id)
            .limit(1);

          if (!searchError && existingOrders && existingOrders.length > 0) {
            console.log("✅ Usando pedido existente:", existingOrders[0].id);
            const orderId = existingOrders[0].id;
            console.log("✅ OrderId type:", typeof orderId);
            console.log("✅ OrderId value:", orderId);
            setPreviewOrderId(orderId);
            setLoading(false);
            return;
          }

          console.log("🆕 Nenhum pedido preview encontrado, criando novo...");

          // Criar pedido de preview diretamente
          const previewProducts = [
            {
              id: "preview-product-1",
              productId: "preview-product-1",
              variantId: "preview-variant-1",
              name: "Produto de Demonstração 1",
              price: 199.99,
              quantity: 1,
              image:
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
              sku: "DEMO-001",
            },
            {
              id: "preview-product-2",
              productId: "preview-product-2",
              variantId: "preview-variant-2",
              name: "Produto de Demonstração 2",
              price: 149.99,
              quantity: 2,
              image:
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
              sku: "DEMO-002",
            },
          ];

          const subtotal = 499.97;
          const shipping = 29.99;
          const total = 529.96;

          const { data: order, error } = await supabase
            .from("Order")
            .insert({
              userId: user.id,
              orderNumber: `PREVIEW-${Date.now()}`,
              status: "PREVIEW",
              paymentStatus: "PENDING",
              paymentMethod: "PIX",
              items: previewProducts,
              subtotal: subtotal,
              shipping: shipping,
              tax: 0,
              discount: 0,
              total: total,
              customerName: "Cliente de Demonstração",
              customerEmail: "demo@exemplo.com",
              customerPhone: "(11) 99999-9999",
              metadata: {
                isPreview: true,
                originalProducts: previewProducts,
                createdBy: "checkout-customizer",
              },
            })
            .select()
            .single();

          if (!error && order) {
            console.log("✅ Preview order criado com sucesso:", order.id);
            console.log("✅ Order completo:", JSON.stringify(order, null, 2));
            setPreviewOrderId(order.id);
            console.log("✅ previewOrderId setado para:", order.id);
            setLoading(false);
          } else {
            console.error("❌ Erro ao criar preview order:", error);
            console.error("❌ Detalhes:", JSON.stringify(error, null, 2));

            // FALLBACK: Buscar qualquer pedido do usuário
            console.log("🔄 Tentando fallback: buscar qualquer pedido...");
            const { data: anyOrder } = await supabase
              .from("Order")
              .select("id")
              .eq("userId", user.id)
              .limit(1)
              .single();

            if (anyOrder) {
              console.log("✅ Usando pedido fallback:", anyOrder.id);
              setPreviewOrderId(anyOrder.id);
              setLoading(false);
            } else {
              console.error("❌ Nenhum pedido disponível para preview");
              setLoading(false);
            }
          }
        } catch (e) {
          console.error("❌ Exceção ao criar preview order:", e);
          setLoading(false);
        }
      } else {
        console.log("ℹ️ previewOrderId já existe:", previewOrderId);
        setLoading(false);
      }
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
      if (data) {
        setCustomization(data);
      } else {
        // Criar uma personalização default em memória se não existir
        setCustomization({
          id: `draft-${Date.now()}`,
          userId: user!.id,
          name: "Checkout Principal",
          theme: DEFAULT_CHECKOUT_THEME as any,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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

  const handleSave = async () => {
    if (!customization || !user?.id) return;

    setIsSaving(true);
    try {
      await checkoutApi.saveCustomization(customization);
      setHasChanges(false);
      toast({
        title: "Personalização salva!",
        description: "Suas configurações foram salvas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao salvar personalização:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateTheme = (updates: Partial<CheckoutCustomization["theme"]>) => {
    if (!customization) return;

    setCustomization({
      ...customization,
      theme: {
        ...customization.theme,
        ...updates,
      },
    });
    setHasChanges(true);
    // Força atualização do preview
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
      {/* Sidebar de Personalização */}
      <CheckoutCustomizationSidebar
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        customization={customization}
        onUpdateTheme={updateTheme}
      />

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

        {/* Preview Area */}
        {showPreview ? (
          <div className="flex-1 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="h-full flex items-center justify-center"
            >
              <Card
                className={cn(
                  "bg-white dark:bg-gray-900 shadow-2xl overflow-hidden transition-all duration-300",
                  previewMode === "desktop"
                    ? "w-full max-w-6xl h-full rounded-2xl"
                    : "w-[390px] h-[844px] rounded-3xl",
                )}
              >
                <div
                  className={cn(
                    "h-full w-full overflow-y-auto overflow-x-hidden",
                    previewMode === "mobile" && "scale-100",
                  )}
                >
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
                      <PublicCheckoutPage
                        key={previewKey}
                        injectedOrderId={previewOrderId}
                        injectedTheme={customization?.theme || null}
                        previewMode={true}
                        isMobile={previewMode === "mobile"}
                      />
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


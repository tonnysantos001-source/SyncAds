import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/authStore";
import { useIntegrationsStore } from "@/store/integrationsStore";
import { useToast } from "@/components/ui/use-toast";
import { shopifyIntegrationApi } from "@/lib/api/shopifyIntegrationApi";
import { woocommerceIntegrationApi } from "@/lib/api/woocommerceIntegrationApi";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  ShoppingBag,
  Store,
  Package,
  ShoppingCart,
  Zap,
  ChevronDown,
  ChevronUp,
  Lock,
} from "lucide-react";

interface IntegrationField {
  id: string;
  label: string;
  placeholder: string;
  type: "text" | "password" | "url";
  required: boolean;
  helpText?: string;
}

interface ManualStep {
  step: number;
  title: string;
  description: string;
  link?: string;
  linkText?: string;
}

interface IntegrationConfig {
  id: string;
  name: string;
  icon: any;
  description: string;
  fields: IntegrationField[];
  manual: ManualStep[];
  longDescription?: string;
}

const INTEGRATIONS_CONFIG: Record<string, IntegrationConfig> = {
  shopify: {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    description:
      "Conecte sua loja Shopify para sincronizar produtos, pedidos e clientes automaticamente.",
    longDescription:
      "A integração com Shopify permite sincronizar automaticamente todos os seus produtos, pedidos, clientes e dados de estoque entre sua loja e o SyncAds. Com isso, você pode gerenciar tudo em um só lugar.",
    fields: [
      {
        id: "shopDomain",
        label: "Domínio da Loja Shopify",
        placeholder: "minhaloja.myshopify.com",
        type: "text",
        required: true,
        helpText: "Digite o domínio da sua loja (ex: minhaloja.myshopify.com)",
      },
      {
        id: "accessToken",
        label: "Access Token (Token de acesso da API Admin)",
        placeholder: "shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        type: "password",
        required: false,
        helpText: "Token de acesso do app personalizado (começa com shpat_) — opcional se usar conexão 1 clique",
      },
      {
        id: "apiKey",
        label: "ID do cliente (API Key / Client ID)",
        placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        type: "text",
        required: false,
        helpText: "ID do cliente encontrado nas credenciais do app no Dev Dashboard da Shopify",
      },
      {
        id: "apiSecret",
        label: "Chave secreta (API Secret / Client Secret)",
        placeholder: "shpss_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        type: "password",
        required: false,
        helpText: "Chave secreta encontrada nas credenciais do app no Dev Dashboard da Shopify",
      },
    ],
    manual: [],
  },
  woocommerce: {
    id: "woocommerce",
    name: "WooCommerce",
    icon: ShoppingCart,
    description: "Integre sua loja WooCommerce com facilidade.",
    longDescription:
      "Conecte sua loja WooCommerce para sincronizar produtos, pedidos e estoque.",
    fields: [
      {
        id: "siteUrl",
        label: "URL do Site",
        placeholder: "https://minhaloja.com",
        type: "url",
        required: true,
        helpText: "URL completa do seu site WooCommerce",
      },
      {
        id: "consumerKey",
        label: "Consumer Key",
        placeholder: "ck_xxxxxxxxxxxxx",
        type: "text",
        required: true,
        helpText: "Chave do consumidor da API REST",
      },
      {
        id: "consumerSecret",
        label: "Consumer Secret",
        placeholder: "cs_xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText: "Segredo do consumidor da API REST",
      },
    ],
    manual: [
      {
        step: 1,
        title: "Acesse WooCommerce",
        description:
          "No WordPress admin, vá em WooCommerce > Configurações > Avançado > API REST",
      },
      {
        step: 2,
        title: "Crie Chaves API",
        description:
          "Clique em 'Adicionar chave' e gere Consumer Key e Consumer Secret",
      },
    ],
  },
};

const IntegrationDetailPage: React.FC = () => {
  const { integrationId } = useParams<{ integrationId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { isIntegrationConnected, loadIntegrations } = useIntegrationsStore();
  const { toast } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showManualFields, setShowManualFields] = useState(false);
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);

  const config = integrationId ? INTEGRATIONS_CONFIG[integrationId] : null;

  useEffect(() => {
    if (integrationId) {
      setIsConnected(isIntegrationConnected(integrationId));
    }
  }, [integrationId, isIntegrationConnected]);

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <XCircle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">Integração não encontrada</h2>
        <Button onClick={() => navigate("/integrations")}>
          Voltar para Integrações
        </Button>
      </div>
    );
  }

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  // ===== SHOPIFY 1-CLICK OAUTH =====
  const handleShopifyOAuth = async () => {
    if (!user) return;

    let domain = shopifyDomain.trim();
    if (!domain) {
      toast({
        title: "Campo obrigatório",
        description: "Digite o domínio da sua loja Shopify",
        variant: "destructive",
      });
      return;
    }

    // Normalizar domínio
    if (!domain.includes(".myshopify.com")) {
      domain = `${domain}.myshopify.com`;
    }

    setIsOAuthLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth?action=install&shop=${domain}&userId=${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${session.data.session?.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success && result.authUrl) {
        // Redirecionar para autorização da Shopify
        window.location.href = result.authUrl;
      } else {
        throw new Error(result.error || "Erro ao gerar URL de autorização");
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro ao conectar",
        description: error.message || "Não foi possível iniciar a conexão. Verifique o domínio e tente novamente.",
        variant: "destructive",
      });
      setIsOAuthLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user) return;

    // Validar campos obrigatórios
    const missingFields = config.fields
      .filter((field) => field.required && !formData[field.id])
      .map((field) => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: `Preencha: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let result: any;

      // Shopify
      if (config.id === "shopify") {
        result = await shopifyIntegrationApi.connect(
          formData.shopDomain,
          formData.accessToken,
          formData.apiKey,
          formData.apiSecret,
        );
      }

      // WooCommerce
      if (config.id === "woocommerce") {
        result = await woocommerceIntegrationApi.connect(
          formData.siteUrl,
          formData.consumerKey,
          formData.consumerSecret,
        );
      }

      if (result && result.success) {
        setIsConnected(true);
        toast({
          title: "✅ Conectado com Sucesso!",
          description: `${config.name} foi conectado com sucesso.`,
        });
        await loadIntegrations(user.id);
      } else {
        throw new Error(result?.error || "Erro ao conectar");
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro ao Conectar",
        description:
          error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (config.id === "shopify") {
        await shopifyIntegrationApi.disconnect();
      } else if (config.id === "woocommerce") {
        await woocommerceIntegrationApi.disconnect();
      }

      setIsConnected(false);
      setFormData({});
      toast({
        title: "Desconectado",
        description: `${config.name} foi desconectado.`,
      });
      await loadIntegrations(user.id);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível desconectar.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const Icon = config.icon;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/integrations")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{config.name}</CardTitle>
                <CardDescription className="mt-1">
                  {config.description}
                </CardDescription>
              </div>
            </div>
            <div>
              {isConnected ? (
                <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Ativo
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="bg-red-500/10 text-red-700 border-red-500/20 gap-1"
                >
                  <XCircle className="h-3 w-3" />
                  Inativo
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        {config.longDescription && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {config.longDescription}
            </p>
          </CardContent>
        )}
      </Card>

      {/* ===== SHOPIFY: CONEXÃO EM 1 CLIQUE ===== */}
      {config.id === "shopify" && !isConnected && (
        <div className="space-y-4">
          {/* Card principal de conexão OAuth */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5 text-green-600" />
                Conectar com Shopify — 1 Clique
              </CardTitle>
              <CardDescription className="text-sm text-green-700 dark:text-green-400">
                Digite o domínio da sua loja e clique em conectar. Você será redirecionado para autorizar o SyncAds na Shopify automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Campo de domínio */}
              <div className="space-y-2">
                <Label htmlFor="shopify-domain-oauth" className="font-medium">
                  Domínio da Loja Shopify <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none pointer-events-none">
                      🏪
                    </span>
                    <Input
                      id="shopify-domain-oauth"
                      type="text"
                      placeholder="minhaloja.myshopify.com"
                      value={shopifyDomain}
                      onChange={(e) => setShopifyDomain(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleShopifyOAuth(); }}
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Encontre em: Configurações → Domínios no seu painel Shopify (ex: <code className="bg-muted px-1 rounded">minha-loja.myshopify.com</code>)
                </p>
              </div>

              {/* Botão de conexão OAuth */}
              <Button
                onClick={handleShopifyOAuth}
                disabled={isOAuthLoading}
                className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 gap-3 shadow-lg shadow-green-200 dark:shadow-none"
              >
                {isOAuthLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Redirecionando para Shopify...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5" />
                    Conectar com Shopify
                  </>
                )}
              </Button>

              {/* Explicação segurança */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-white/60 dark:bg-white/5 rounded-lg p-3">
                <Lock className="h-4 w-4 shrink-0 mt-0.5 text-green-600" />
                <span>
                  Conexão segura via OAuth oficial da Shopify. Você será direcionado para a tela de autorização da Shopify e, após confirmar, voltará automaticamente para o SyncAds já conectado.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Separador */}
          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs text-muted-foreground">
              ou use credenciais manuais
            </span>
          </div>

          {/* Opção manual — colapsável */}
          <Card className="border border-dashed">
            <button
              className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-lg"
              onClick={() => setShowManualFields((v) => !v)}
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Lock className="h-4 w-4" />
                Inserir credenciais manualmente (avançado)
              </div>
              {showManualFields ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {showManualFields && (
              <CardContent className="pt-0 space-y-4 border-t">
                <p className="text-xs text-muted-foreground pt-4">
                  Preencha os campos abaixo com as credenciais do app personalizado criado no{" "}
                  <a href="https://partners.shopify.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    Dev Dashboard da Shopify
                  </a>.
                </p>
                {config.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={`manual-${field.id}`}>
                      {field.label}
                    </Label>
                    <div className="relative">
                      <Input
                        id={`manual-${field.id}`}
                        type={
                          field.type === "password"
                            ? showPassword[field.id] ? "text" : "password"
                            : field.type
                        }
                        placeholder={field.placeholder}
                        value={formData[field.id] || ""}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className="pr-10"
                      />
                      {field.type === "password" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                          onClick={() =>
                            setShowPassword((prev) => ({
                              ...prev,
                              [field.id]: !prev[field.id],
                            }))
                          }
                        >
                          {showPassword[field.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    {field.helpText && (
                      <p className="text-xs text-muted-foreground">{field.helpText}</p>
                    )}
                  </div>
                ))}
                <Button
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Conectando...</>
                  ) : (
                    "Conectar com Credenciais Manuais"
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* ===== SHOPIFY: INSTRUÇÕES DE INSTALAÇÃO DO SCRIPT ===== */}
      {config.id === "shopify" && (
        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Script do Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Após conectar, faça upload do arquivo{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">shopify-checkout-redirect.js</code>{" "}
                em <strong>Assets</strong> no editor do tema Shopify.
              </p>
              <Button
                variant="default"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() =>
                  window.open(
                    "/shopify-checkout-redirect.js",
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
                Baixar Script
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-5 w-5 text-purple-600" />
                Inserir no Tema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Abra <strong>Layout/theme.liquid</strong> e cole este código acima de{" "}
                <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded text-xs">&lt;/body&gt;</code>.
              </p>
              <div className="bg-gray-900 rounded p-2 mb-2">
                <code className="text-xs text-green-400 font-mono break-all">
                  {`<script src="{{ 'shopify-checkout-redirect.js' | asset_url }}" defer></script>`}
                </code>
              </div>
              <Button
                variant="default"
                className="w-full gap-2 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `<script src="{{ 'shopify-checkout-redirect.js' | asset_url }}" defer></script>`,
                  );
                  toast({
                    title: "✅ Código Copiado!",
                    description: "Cole no theme.liquid acima da tag </body>",
                  });
                }}
              >
                <Copy className="h-4 w-4" />
                Copiar Código
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Instruções Compactas (outras integrações, não-Shopify) */}
      {config.manual.length > 0 && !isConnected && config.id !== "shopify" && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm space-y-3">
            {config.manual.map((step) => (
              <div key={step.step} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {step.step}
                </span>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium text-xs">
                    {step.title}
                  </p>
                  <p className="text-gray-600 text-xs">{step.description}</p>
                  {step.link && (
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                    >
                      {step.linkText}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      {/* Campos de Configuração — Integrações não-Shopify */}
      {!isConnected && config.fields.length > 0 && config.id !== "shopify" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Credenciais</CardTitle>
            <CardDescription>
              Preencha todos os campos obrigatórios para conectar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <div className="relative">
                  <Input
                    id={field.id}
                    type={
                      field.type === "password"
                        ? showPassword[field.id]
                          ? "text"
                          : "password"
                        : field.type
                    }
                    placeholder={field.placeholder}
                    value={formData[field.id] || ""}
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.value)
                    }
                    onPaste={(e) => {
                      if (field.type === "password") {
                        e.preventDefault();
                        const pasted = e.clipboardData.getData("text");
                        handleInputChange(field.id, pasted);
                      }
                    }}
                    className="pr-10"
                  />
                  {field.type === "password" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          [field.id]: !prev[field.id],
                        }))
                      }
                    >
                      {showPassword[field.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ações — Integrações não-Shopify ou quando já está conectado */}
      {(config.id !== "shopify" || isConnected) && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              {isConnected ? (
                <>
                  <Button
                    onClick={handleDisconnect}
                    disabled={isLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Desconectando...
                      </>
                    ) : (
                      "Desconectar"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/integrations")}
                  >
                    Voltar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleConnect}
                    disabled={isLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      "Conectar"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/integrations")}
                  >
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default IntegrationDetailPage;


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
import { vtexIntegrationApi } from "@/lib/api/vtexIntegrationApi";
import { nuvemshopIntegrationApi } from "@/lib/api/nuvemshopIntegrationApi";
import { woocommerceIntegrationApi } from "@/lib/api/woocommerceIntegrationApi";
import { mercadolivreIntegrationApi } from "@/lib/api/mercadolivreIntegrationApi";
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
        label: "Domínio da Loja",
        placeholder: "minhaloja.myshopify.com",
        type: "text",
        required: true,
        helpText: "Digite o domínio da sua loja Shopify",
      },
      {
        id: "accessToken",
        label: "Access Token",
        placeholder: "shpat_xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText: "Token de acesso da Admin API",
      },
      {
        id: "apiKey",
        label: "API Key",
        placeholder: "xxxxxxxxxxxxx",
        type: "text",
        required: true,
        helpText: "Client ID do seu App",
      },
      {
        id: "apiSecret",
        label: "API Secret",
        placeholder: "shpss_xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText: "Client Secret do seu App",
      },
    ],
    manual: [
      {
        step: 1,
        title: "Configure as Credenciais",
        description:
          "Preencha os campos acima com as credenciais do seu App Shopify",
      },
      {
        step: 2,
        title: "Instale o Script no Tema",
        description:
          "Adicione o script de checkout no arquivo theme.liquid da sua loja",
        link: "https://syncads-dun.vercel.app/shopify-checkout-redirect.js",
        linkText: "Ver Script",
      },
    ],
  },
  vtex: {
    id: "vtex",
    name: "VTEX",
    icon: Store,
    description:
      "Integre sua loja VTEX para gerenciar produtos e pedidos em tempo real.",
    longDescription:
      "A integração VTEX permite que você sincronize automaticamente produtos, pedidos e estoque da sua loja VTEX com o SyncAds.",
    fields: [
      {
        id: "accountName",
        label: "Account Name",
        placeholder: "minhaloja",
        type: "text",
        required: true,
        helpText: "Nome da sua conta VTEX",
      },
      {
        id: "appKey",
        label: "App Key",
        placeholder: "vtexappkey-xxxxx",
        type: "text",
        required: true,
        helpText: "Chave de aplicação VTEX",
      },
      {
        id: "appToken",
        label: "App Token",
        placeholder: "xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText: "Token de acesso da aplicação",
      },
    ],
    manual: [
      {
        step: 1,
        title: "Acesse o Admin VTEX",
        description: "Entre no painel administrativo da sua loja VTEX",
      },
      {
        step: 2,
        title: "Gere App Key e App Token",
        description:
          'Vá em "Configurações da Conta" > "Chaves de aplicação" > "Gerenciar minhas chaves"',
      },
      {
        step: 3,
        title: "Configure Permissões",
        description:
          "Crie uma nova chave com permissões de Catalog, Orders e OMS",
      },
    ],
  },
  nuvemshop: {
    id: "nuvemshop",
    name: "Nuvemshop",
    icon: Package,
    description:
      "Conecte sua loja Nuvemshop para sincronização automática de dados.",
    longDescription:
      "Sincronize produtos, pedidos e clientes da sua Nuvemshop automaticamente.",
    fields: [
      {
        id: "storeId",
        label: "Store ID",
        placeholder: "123456",
        type: "text",
        required: true,
        helpText: "ID da sua loja Nuvemshop",
      },
      {
        id: "storeName",
        label: "Nome da Loja",
        placeholder: "Minha Loja",
        type: "text",
        required: false,
        helpText: "Nome da sua loja (opcional)",
      },
      {
        id: "accessToken",
        label: "Access Token",
        placeholder: "xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText: "Token de acesso gerado no admin",
      },
    ],
    manual: [
      {
        step: 1,
        title: "Acesse Aplicativos",
        description: "No admin da Nuvemshop, vá em 'Meus aplicativos'",
      },
      {
        step: 2,
        title: "Gere Access Token",
        description: "Crie um novo aplicativo e copie o Access Token gerado",
      },
    ],
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
  "mercado-livre": {
    id: "mercado-livre",
    name: "Mercado Livre",
    icon: ShoppingBag,
    description: "Conecte sua conta do Mercado Livre.",
    longDescription:
      "Integração OAuth com Mercado Livre para gerenciar anúncios e vendas.",
    fields: [],
    manual: [
      {
        step: 1,
        title: "Conectar via OAuth",
        description:
          "Clique em 'Conectar' para autorizar via OAuth do Mercado Livre",
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

      // VTEX
      if (config.id === "vtex") {
        result = await vtexIntegrationApi.connect(
          formData.accountName,
          formData.appKey,
          formData.appToken,
        );
      }

      // Nuvemshop
      if (config.id === "nuvemshop") {
        result = await nuvemshopIntegrationApi.connect(
          formData.storeId,
          formData.storeName || "Minha Loja",
          formData.accessToken,
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

      // Mercado Livre OAuth
      if (config.id === "mercado-livre") {
        result = await mercadolivreIntegrationApi.startOAuth();
        if (result.success && result.authUrl) {
          window.location.href = result.authUrl;
          return;
        }
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

      {/* Alerta Crítico para Shopify */}

      {/* Instruções Shopify - Sempre Visíveis */}
      {config.id === "shopify" && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Card 1: Baixar Script */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Passo 1: Baixar Script
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Baixe o arquivo{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  shopify-checkout-redirect.js
                </code>{" "}
                e faça upload em: <strong>Assets</strong> →{" "}
                <strong>Add a new asset</strong> no editor do seu tema Shopify.
              </p>
              <Button
                variant="default"
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() =>
                  window.open(
                    "https://syncads-dun.vercel.app/shopify-checkout-redirect.js",
                    "_blank",
                  )
                }
              >
                <ExternalLink className="h-4 w-4" />
                Abrir Script
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Copiar Código */}
          <Card className="border-2 border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Copy className="h-5 w-5 text-green-600" />
                Passo 2: Inserir no Tema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Abra <strong>Layout/theme.liquid</strong> e cole este código
                logo <strong>acima da tag</strong>{" "}
                <code className="bg-gray-100 px-1 rounded text-xs">
                  &lt;/body&gt;
                </code>{" "}
                no final do arquivo.
              </p>
              <div className="bg-gray-900 rounded p-2 mb-2">
                <code className="text-xs text-green-400 font-mono break-all">
                  {`<script src="{{ 'shopify-checkout-redirect.js' | asset_url }}" defer></script>`}
                </code>
              </div>
              <Button
                variant="default"
                className="w-full gap-2 bg-green-600 hover:bg-green-700"
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

      {/* Instruções Compactas (outras integrações) */}
      {config.manual.length > 0 && !isConnected && config.id !== "shopify" && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm space-y-3">
            {config.manual.map((step, index) => (
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

      {/* Campos de Configuração */}
      {!isConnected && config.fields.length > 0 && (
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

      {/* Ações */}
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
    </div>
  );
};

export default IntegrationDetailPage;


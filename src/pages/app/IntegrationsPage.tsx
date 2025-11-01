import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  ShoppingBag,
  Store,
  Package,
  TrendingUp,
  Facebook,
  BarChart3,
  MessageSquare,
  Radio,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  icon: any;
  category: string;
  description: string;
  fields: IntegrationField[];
  manual: ManualStep[];
  comingSoon?: boolean;
}

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

const INTEGRATIONS: Integration[] = [
  {
    id: "shopify",
    name: "Shopify",
    icon: ShoppingBag,
    category: "ecommerce",
    description:
      "Conecte sua loja Shopify para sincronizar produtos, pedidos e clientes automaticamente.",
    fields: [
      {
        id: "shopDomain",
        label: "Nome da Loja",
        placeholder: "minhaloja.myshopify.com",
        type: "text",
        required: true,
        helpText:
          "Digite o domínio completo da sua loja (ex: minhaloja.myshopify.com)",
      },
      {
        id: "accessToken",
        label: "Token de Acesso da Admin API",
        placeholder: "shpat_xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText:
          "Token gerado no Admin da Shopify com permissões de leitura/escrita",
      },
      {
        id: "apiKey",
        label: "Chave de API (API Key)",
        placeholder: "xxxxxxxxxxxxx",
        type: "text",
        required: true,
        helpText: "Client ID do seu App Shopify",
      },
      {
        id: "apiSecret",
        label: "Chave Secreta da API (API Secret Key)",
        placeholder: "shpss_xxxxxxxxxxxxx",
        type: "password",
        required: true,
        helpText: "Client Secret do seu App Shopify",
      },
    ],
    manual: [
      {
        step: 1,
        title: "Acesse o Shopify Partners",
        description:
          "Vá até https://partners.shopify.com e faça login com sua conta",
        link: "https://partners.shopify.com",
        linkText: "Acessar Shopify Partners",
      },
      {
        step: 2,
        title: "Crie um App Personalizado",
        description:
          'Na seção "Apps", clique em "Criar app" e escolha "App personalizado". Dê um nome para o app.',
      },
      {
        step: 3,
        title: "⚠️ IMPORTANTE: Configure as URLs de Redirecionamento",
        description: `Adicione EXATAMENTE esta URL no campo "Allowed redirection URL(s)": ${window.location.origin}/integrations/callback - Este é o erro mais comum! Sem isso você verá erro "OAuth invalid_request".`,
      },
      {
        step: 4,
        title: "Defina os Escopos (Scopes)",
        description:
          "Marque as permissões: read_products, write_products, read_orders, write_orders, read_customers, write_customers",
      },
      {
        step: 5,
        title: "Copie as Credenciais",
        description:
          "Após criar o app, copie: Client ID (API Key), Client Secret (API Secret Key) e gere um Access Token na aba 'API credentials'",
      },
      {
        step: 6,
        title: "Cole as Credenciais Abaixo",
        description:
          "Preencha todos os campos abaixo com as credenciais copiadas e clique em 'Conectar'",
      },
    ],
  },
  {
    id: "vtex",
    name: "VTEX",
    icon: Store,
    category: "ecommerce",
    description:
      "Integre sua loja VTEX para gerenciar produtos e pedidos em tempo real.",
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
      },
      {
        id: "appToken",
        label: "App Token",
        placeholder: "xxxxxxxxxxxxx",
        type: "password",
        required: true,
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
  {
    id: "nuvemshop",
    name: "Nuvemshop",
    icon: Package,
    category: "ecommerce",
    description:
      "Conecte sua loja Nuvemshop para sincronização automática de dados.",
    fields: [
      {
        id: "storeId",
        label: "Store ID",
        placeholder: "123456",
        type: "text",
        required: true,
      },
      {
        id: "accessToken",
        label: "Access Token",
        placeholder: "xxxxxxxxxxxxx",
        type: "password",
        required: true,
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
  {
    id: "woocommerce",
    name: "WooCommerce",
    icon: ShoppingBag,
    category: "ecommerce",
    description: "Integre sua loja WooCommerce com facilidade.",
    fields: [
      {
        id: "siteUrl",
        label: "URL do Site",
        placeholder: "https://minhaloja.com",
        type: "url",
        required: true,
      },
      {
        id: "consumerKey",
        label: "Consumer Key",
        placeholder: "ck_xxxxxxxxxxxxx",
        type: "text",
        required: true,
      },
      {
        id: "consumerSecret",
        label: "Consumer Secret",
        placeholder: "cs_xxxxxxxxxxxxx",
        type: "password",
        required: true,
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
  {
    id: "mercado-livre",
    name: "Mercado Livre",
    icon: ShoppingBag,
    category: "marketplace",
    description: "Conecte sua conta do Mercado Livre.",
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
  {
    id: "google-ads",
    name: "Google Ads",
    icon: TrendingUp,
    category: "ads",
    description: "Gerencie suas campanhas do Google Ads.",
    fields: [],
    manual: [],
    comingSoon: true,
  },
  {
    id: "meta-ads",
    name: "Meta Ads",
    icon: Facebook,
    category: "ads",
    description: "Conecte Facebook e Instagram Ads.",
    fields: [],
    manual: [],
    comingSoon: true,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    icon: BarChart3,
    category: "analytics",
    description: "Analise dados do Google Analytics.",
    fields: [],
    manual: [],
    comingSoon: true,
  },
  {
    id: "rd-station",
    name: "RD Station",
    icon: Radio,
    category: "marketing",
    description: "Integre com RD Station Marketing.",
    fields: [],
    manual: [],
    comingSoon: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    icon: MessageSquare,
    category: "messaging",
    description: "Conecte WhatsApp Business API.",
    fields: [],
    manual: [],
    comingSoon: true,
  },
];

const IntegrationDetailCard: React.FC<{ integration: Integration }> = ({
  integration,
}) => {
  const user = useAuthStore((state) => state.user);
  const { isIntegrationConnected, loadIntegrations } = useIntegrationsStore();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsConnected(isIntegrationConnected(integration.id));
  }, [integration.id, isIntegrationConnected]);

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleConnect = async () => {
    if (!user || integration.comingSoon) return;

    // Validar campos obrigatórios
    const missingFields = integration.fields
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
      // Shopify
      if (integration.id === "shopify") {
        const result = await shopifyIntegrationApi.connect(
          formData.shopDomain,
          formData.accessToken,
          formData.apiKey,
          formData.apiSecret,
        );

        if (result.success) {
          setIsConnected(true);
          toast({
            title: "✅ Shopify Conectado!",
            description: "Sua loja foi conectada com sucesso.",
          });
          await loadIntegrations(user.id);
        } else {
          throw new Error(result.error || "Erro ao conectar");
        }
      }

      // VTEX
      if (integration.id === "vtex") {
        const result = await vtexIntegrationApi.connect(
          formData.accountName,
          formData.appKey,
          formData.appToken,
        );

        if (result.success) {
          setIsConnected(true);
          toast({
            title: "✅ VTEX Conectado!",
            description: "Sua loja foi conectada com sucesso.",
          });
          await loadIntegrations(user.id);
        } else {
          throw new Error(result.error || "Erro ao conectar");
        }
      }

      // Nuvemshop
      if (integration.id === "nuvemshop") {
        const result = await nuvemshopIntegrationApi.connect(
          formData.storeId,
          formData.storeName || "Minha Loja",
          formData.accessToken,
        );

        if (result.success) {
          setIsConnected(true);
          toast({
            title: "✅ Nuvemshop Conectado!",
            description: "Sua loja foi conectada com sucesso.",
          });
          await loadIntegrations(user.id);
        } else {
          throw new Error(result.error || "Erro ao conectar");
        }
      }

      // WooCommerce
      if (integration.id === "woocommerce") {
        const result = await woocommerceIntegrationApi.connect(
          formData.siteUrl,
          formData.consumerKey,
          formData.consumerSecret,
        );

        if (result.success) {
          setIsConnected(true);
          toast({
            title: "✅ WooCommerce Conectado!",
            description: "Sua loja foi conectada com sucesso.",
          });
          await loadIntegrations(user.id);
        } else {
          throw new Error(result.error || "Erro ao conectar");
        }
      }

      // Mercado Livre OAuth
      if (integration.id === "mercado-livre") {
        const result = await mercadolivreIntegrationApi.startOAuth();
        if (result.success && result.authUrl) {
          window.location.href = result.authUrl;
        } else {
          throw new Error(result.error || "Erro ao conectar");
        }
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
      if (integration.id === "shopify") {
        await shopifyIntegrationApi.disconnect();
      }

      setIsConnected(false);
      setFormData({});
      toast({
        title: "Desconectado",
        description: `${integration.name} foi desconectado.`,
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

  const Icon = integration.icon;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{integration.name}</CardTitle>
              <CardDescription className="mt-1">
                {integration.description}
              </CardDescription>
            </div>
          </div>
          <div>
            {integration.comingSoon ? (
              <Badge
                variant="outline"
                className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20"
              >
                Em Breve
              </Badge>
            ) : isConnected ? (
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

      <CardContent className="space-y-6">
        {/* Alerta Crítico para Shopify */}
        {integration.id === "shopify" && !isConnected && (
          <Alert className="bg-yellow-50 border-yellow-300">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-sm">
              <strong className="font-bold text-yellow-900">
                ⚠️ ATENÇÃO - Antes de conectar:
              </strong>
              <br />
              No Shopify Partners, você DEVE adicionar a URL de
              redirecionamento:
              <div className="mt-2 p-2 bg-yellow-100 rounded font-mono text-xs break-all flex items-center justify-between gap-2">
                <span className="flex-1">
                  {window.location.origin}/integrations/callback
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 hover:bg-yellow-200"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/integrations/callback`,
                    );
                    toast({
                      title: "✅ URL Copiada!",
                      description:
                        "Cole esta URL no campo 'Allowed redirection URL(s)' no Shopify Partners.",
                    });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-yellow-800">
                O erro "OAuth invalid_request" acontece quando esta URL não está
                configurada corretamente no seu App Shopify.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Manual de Configuração */}
        {integration.manual.length > 0 && !isConnected && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-sm">Manual de Configuração</h3>
            </div>
            <div className="space-y-3">
              {integration.manual.map((step) => (
                <Alert key={step.step} className="bg-blue-50 border-blue-200">
                  <div className="flex gap-3">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full ${
                        step.title.includes("⚠️") ||
                        step.title.includes("IMPORTANTE")
                          ? "bg-yellow-500"
                          : "bg-blue-500"
                      } text-white text-xs font-bold flex items-center justify-center`}
                    >
                      {step.step}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p
                        className={`font-medium text-sm ${
                          step.title.includes("⚠️") ||
                          step.title.includes("IMPORTANTE")
                            ? "text-yellow-900"
                            : ""
                        }`}
                      >
                        {step.title}
                      </p>
                      <AlertDescription
                        className={`text-xs ${
                          step.title.includes("⚠️") ||
                          step.title.includes("IMPORTANTE")
                            ? "text-yellow-800 font-medium"
                            : ""
                        }`}
                      >
                        {step.description}
                      </AlertDescription>
                      {step.link && (
                        <a
                          href={step.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                        >
                          {step.linkText || "Abrir link"}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Campos de Configuração */}
        {!integration.comingSoon &&
          !isConnected &&
          integration.fields.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Credenciais</h3>
              {integration.fields.map((field) => (
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(field.id, e.target.value)
                      }
                      className="pr-20"
                    />
                    {field.type === "password" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                        onClick={() =>
                          setShowPassword((prev: Record<string, boolean>) => ({
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
                    {formData[field.id] && field.type === "text" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                        onClick={() => {
                          navigator.clipboard.writeText(formData[field.id]);
                          toast({ title: "Copiado!" });
                        }}
                      >
                        <Copy className="h-4 w-4" />
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
            </div>
          )}

        {/* Status e Ações */}
        {!integration.comingSoon && (
          <div className="flex gap-3 pt-4">
            {isConnected ? (
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
            ) : (
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
            )}
          </div>
        )}

        {integration.comingSoon && (
          <Alert>
            <AlertDescription className="text-sm">
              Esta integração estará disponível em breve. Deixe sua sugestão no
              chat!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

const IntegrationsPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const loadIntegrations = useIntegrationsStore(
    (state) => state.loadIntegrations,
  );

  useEffect(() => {
    if (user) {
      loadIntegrations(user.id);
    }
  }, [user, loadIntegrations]);

  const categories = [
    { id: "all", label: "Todas", icon: Package },
    { id: "ecommerce", label: "E-commerce", icon: ShoppingBag },
    { id: "marketplace", label: "Marketplace", icon: Store },
    { id: "ads", label: "Anúncios", icon: TrendingUp },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "marketing", label: "Marketing", icon: Radio },
    { id: "messaging", label: "Mensagens", icon: MessageSquare },
  ];

  return (
    <div className="space-y-8 pb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground mt-2">
          Conecte suas ferramentas favoritas e automatize seu fluxo de trabalho
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const count =
              cat.id === "all"
                ? INTEGRATIONS.length
                : INTEGRATIONS.filter((i) => i.category === cat.id).length;

            return (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                <Icon className="h-4 w-4" />
                {cat.label}
                <Badge variant="secondary" className="ml-1 text-xs">
                  {count}
                </Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {categories.map((cat) => (
          <TabsContent key={cat.id} value={cat.id} className="mt-6">
            <motion.div
              layout
              className="grid gap-6 md:grid-cols-1 lg:grid-cols-2"
            >
              <AnimatePresence>
                {INTEGRATIONS.filter(
                  (integration) =>
                    cat.id === "all" || integration.category === cat.id,
                ).map((integration) => (
                  <motion.div
                    key={integration.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IntegrationDetailCard integration={integration} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default IntegrationsPage;

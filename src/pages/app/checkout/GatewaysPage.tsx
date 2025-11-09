import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Settings,
  CreditCard,
  Wallet,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  gatewaysApi,
  gatewayConfigApi,
  Gateway,
  GatewayConfig,
} from "@/lib/api/gatewaysApi";
import { useAuthStore } from "@/store/authStore";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { implementedGateways } from "@/lib/gateways/implementedGateways";

const OLD_GATEWAYS_MOCK: any[] = [
  {
    id: "pix",
    name: "Pix",
    status: "ativo",
    colorClass: "bg-blue-500",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2020/02/pix-bc-logo.png",
  },
  {
    id: "picpay",
    name: "PicPay",
    status: "inativo",
    colorClass: "bg-green-500",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2018/05/picpay-logo.png",
  },
  {
    id: "banco-inter",
    name: "Banco Inter",
    colorClass: "bg-orange-500",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2020/04/banco-inter-logo.png",
  },
  {
    id: "boleto",
    name: "Boleto",
    status: "inativo",
    colorClass: "bg-yellow-500",
  },
  {
    id: "cartao-credito",
    name: "Cartão de Crédito",
    colorClass: "bg-blue-600",
  },
  {
    id: "mercado-pago",
    name: "Mercado Pago",
    status: "download",
    colorClass: "bg-blue-400",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2021/06/mercado-pago-logo.png",
  },
  {
    id: "iugu",
    name: "Iugu",
    status: "ativo",
    colorClass: "bg-red-500",
    logoUrl: "https://static.iugu.com/assets/images/iugu-logo-01.png",
  },
  { id: "infinitepay", name: "InfinitePay", colorClass: "bg-gray-800" },
  { id: "vitrine", name: "Vitrine", colorClass: "bg-blue-600" },
  {
    id: "pagarme",
    name: "Pagar.me",
    status: "ativo",
    colorClass: "bg-green-600",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/pagarme.svg",
  },
  {
    id: "stripe",
    name: "Stripe",
    status: "ativo",
    colorClass: "bg-purple-600",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/stripe-4.svg",
  },
  { id: "ticto-card", name: "Ticto Card", colorClass: "bg-green-500" },
  { id: "juno", name: "Juno", colorClass: "bg-gray-700" },
  {
    id: "sicredi",
    name: "Sicredi",
    status: "inativo",
    colorClass: "bg-green-700",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2020/04/sicredi-logo.png",
  },
  { id: "safepay", name: "SafePay", colorClass: "bg-blue-500" },
  { id: "koin", name: "Koin", colorClass: "bg-orange-500" },
  { id: "saque-pague", name: "Saque E Pague", colorClass: "bg-orange-400" },
  { id: "yapay", name: "YAPAY", colorClass: "bg-gray-700" },
  { id: "latpay", name: "Latpay", colorClass: "bg-orange-500" },
  { id: "onnipago", name: "ONNIPAGO", colorClass: "bg-purple-500" },
  { id: "vindi", name: "VINDI", status: "inativo", colorClass: "bg-red-600" },
  { id: "linix", name: "Linix", colorClass: "bg-gray-700" },
  { id: "revo", name: "REVO", colorClass: "bg-purple-600" },
  { id: "utrebank", name: "UtreBank", colorClass: "bg-blue-700" },
  { id: "linxpag", name: "Linxpag", colorClass: "bg-gray-800" },
  { id: "revo-pag", name: "REVO PAG", colorClass: "bg-purple-500" },
  { id: "tnk", name: "TNK", colorClass: "bg-orange-600" },
  { id: "muantel", name: "Muantel Brasil", colorClass: "bg-gray-700" },
  {
    id: "vendas-pay",
    name: "VendasPay",
    status: "download",
    colorClass: "bg-green-600",
  },
  { id: "tiny-pay", name: "Tiny Pay", colorClass: "bg-red-500" },
  {
    id: "melhorenvio",
    name: "Melhorenvio",
    colorClass: "bg-yellow-500",
    logoUrl: "https://static.melhorenvio.com.br/images/logo-melhor-envio.svg",
  },
  { id: "pix-copag", name: "PIX COPAG", colorClass: "bg-green-500" },
  { id: "triip", name: "Triip", colorClass: "bg-purple-500" },
  { id: "monetus", name: "Monetus", colorClass: "bg-gray-700" },
  {
    id: "paghiper",
    name: "PAGHIPER",
    status: "ativo",
    colorClass: "bg-green-600",
  },
  { id: "teupag", name: "Téupag", colorClass: "bg-gray-700" },
  { id: "moneypago", name: "MoneyPago", colorClass: "bg-orange-500" },
  { id: "transferencia", name: "Transferência", colorClass: "bg-gray-600" },
  { id: "nuvei", name: "Nuvei", colorClass: "bg-red-600" },
  {
    id: "payzen",
    name: "PayZen",
    status: "download",
    colorClass: "bg-purple-600",
  },
  { id: "thepos", name: "ThePos", colorClass: "bg-gray-800" },
  { id: "neonpay", name: "NeonPay", colorClass: "bg-blue-500" },
  {
    id: "paypal",
    name: "PayPal",
    status: "ativo",
    colorClass: "bg-blue-600",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/paypal-2.svg",
  },
  { id: "unico", name: "Unico", colorClass: "bg-red-500" },
  { id: "pop", name: "POP", colorClass: "bg-pink-500" },
  { id: "phoebus", name: "Phoebus", colorClass: "bg-purple-600" },
  { id: "tonpay", name: "TONpay", colorClass: "bg-blue-500" },
  { id: "pay-connect", name: "Pay Connect", colorClass: "bg-red-600" },
  { id: "pit-stop", name: "Pit Stop Pagamentos", colorClass: "bg-blue-600" },
  { id: "capfpay", name: "CapfPay", colorClass: "bg-teal-600" },
  { id: "dinahpay", name: "DinahPay", colorClass: "bg-gray-700" },
  { id: "stipix", name: "STipix", colorClass: "bg-green-600" },
  { id: "debit-plus", name: "Debit+", colorClass: "bg-gray-700" },
  { id: "itaubank", name: "Itaubank", colorClass: "bg-blue-700" },
  { id: "sett-pay", name: "Sett Pay", colorClass: "bg-gray-700" },
  { id: "paguvel", name: "Paguvel", colorClass: "bg-pink-500" },
  { id: "supercard", name: "SuperCard", colorClass: "bg-green-500" },
  { id: "mmoney-card", name: "M Money Card", colorClass: "bg-orange-500" },
  { id: "just-pay", name: "Just Pay", colorClass: "bg-teal-500" },
  {
    id: "pagseguro",
    name: "Pagseguro",
    status: "ativo",
    colorClass: "bg-yellow-500",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2018/05/pagseguro-logo.png",
  },
  { id: "n3bank", name: "N3bank", colorClass: "bg-gray-700" },
  { id: "lgpag", name: "LGPag", colorClass: "bg-green-700" },
  { id: "paygolf", name: "PayGolf", colorClass: "bg-blue-500" },
  { id: "omie", name: "Omie", colorClass: "bg-purple-600" },
  { id: "payup", name: "PayUp", colorClass: "bg-gray-600" },
  { id: "place-pay", name: "Place Pay", colorClass: "bg-blue-400" },
  { id: "openpay", name: "Openpay", colorClass: "bg-purple-500" },
  {
    id: "pipefy",
    name: "Pipefy",
    colorClass: "bg-gray-700",
    logoUrl: "https://cdn.worldvectorlogo.com/logos/pipefy.svg",
  },
  { id: "green-pay", name: "Green Pay", colorClass: "bg-green-600" },
  { id: "pay-me", name: "Pay-Me", colorClass: "bg-pink-600" },
  { id: "openpix", name: "OpenPix", colorClass: "bg-gray-800" },
  { id: "cash-pay", name: "Cash Pay", colorClass: "bg-blue-500" },
  { id: "onefy", name: "Onefy", colorClass: "bg-purple-600" },
  { id: "centpay", name: "CentPay", colorClass: "bg-gray-700" },
  { id: "tindin", name: "Tindin", colorClass: "bg-gray-700" },
  {
    id: "vivo",
    name: "Vivo",
    colorClass: "bg-purple-700",
    logoUrl:
      "https://logodownload.org/wp-content/uploads/2014/05/vivo-logo.png",
  },
];

const GatewaysPage = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [configs, setConfigs] = useState<GatewayConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<
    "ALL" | "PAYMENT_PROCESSOR" | "WALLET" | "BANK"
  >("ALL");
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [configForm, setConfigForm] = useState({
    apiKey: "",
    secretKey: "",
    publicKey: "",
    webhookUrl: "",
    pixFee: 0,
    creditCardFee: 0,
    boletoFee: 0,
    isTestMode: true,
    isActive: true,
  });

  useEffect(() => {
    loadGateways();
  }, []);

  const loadGateways = async () => {
    try {
      const data = await gatewaysApi.list();
      setGateways(data);

      if (user?.id) {
        const configsData = await gatewayConfigApi.list();

        setConfigs(configsData);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar gateways",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureGateway = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    const existingConfig = configs.find((c) => c.gatewayId === gateway.id);
    if (existingConfig) {
      setConfigForm({
        apiKey: existingConfig.credentials.apiKey || "",
        secretKey: existingConfig.credentials.secretKey || "",
        publicKey: existingConfig.credentials.publicKey || "",
        webhookUrl: existingConfig.webhookUrl || "",
        pixFee: existingConfig.pixFee || 0,
        creditCardFee: existingConfig.creditCardFee || 0,
        boletoFee: existingConfig.boletoFee || 0,
        isTestMode: existingConfig.isTestMode,
        isActive: existingConfig.isActive,
      });
    } else {
      setConfigForm({
        apiKey: "",
        secretKey: "",
        publicKey: "",
        webhookUrl: "",
        pixFee: 0,
        creditCardFee: 0,
        boletoFee: 0,
        isTestMode: true,
        isActive: true,
      });
    }
    setIsConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    try {
      if (!user?.organizationId || !selectedGateway) return;

      const gwId = selectedGateway.id;
      const existingConfig = configs.find((c) => c.gatewayId === gwId);

      const credentials = {
        apiKey: configForm.apiKey,
        secretKey: configForm.secretKey,
        publicKey: configForm.publicKey,
      };

      if (existingConfig) {
        await gatewayConfigApi.update(existingConfig.id, {
          credentials,
          webhookUrl: configForm.webhookUrl,
          pixFee: configForm.pixFee,
          creditCardFee: configForm.creditCardFee,
          boletoFee: configForm.boletoFee,
          isTestMode: configForm.isTestMode,
          isActive: configForm.isActive,
        });
        toast({ title: "Configuração atualizada!" });
      } else {
        await gatewayConfigApi.create({
          userId: user.id,
          gatewayId: selectedGateway.id,

          credentials,

          webhookUrl: configForm.webhookUrl,

          pixFee: configForm.pixFee,

          creditCardFee: configForm.creditCardFee,

          boletoFee: configForm.boletoFee,

          isTestMode: configForm.isTestMode,

          isActive: configForm.isActive,

          isDefault: false,
        });
        toast({
          title: "Gateway configurado!",
          description: "O gateway está pronto para uso.",
        });
      }

      setIsConfigDialogOpen(false);
      loadGateways();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTestConnection = async () => {
    try {
      if (!selectedGateway) return;

      toast({
        title: "Testando conexão...",
        description: `Testando ${selectedGateway.name}`,
      });

      const { data, error } = await supabase.functions.invoke("test-gateway", {
        body: {
          gatewayId: selectedGateway.id,
          credentials: {
            apiKey: configForm.apiKey,
            secretKey: configForm.secretKey,
            publicKey: configForm.publicKey,
          },
          testMode: configForm.isTestMode,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.success) {
        toast({
          title: "Conexão bem-sucedida!",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Falha na conexão",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isConfigured = (gatewayId: string) => {
    return configs.some((c) => c.gatewayId === gatewayId && c.isActive);
  };

  const isGatewayActive = (gatewayId: string) => {
    return configs.some(
      (c) => c.gatewayId === gatewayId && c.isActive === true,
    );
  };

  const filteredGateways = gateways.filter((gateway) => {
    const matchesSearch = gateway.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType = filterType === "ALL" || gateway.type === filterType;
    return matchesSearch && matchesType;
  });

  const popularGateways = filteredGateways.filter((g) => g.isPopular);
  const otherGateways = filteredGateways.filter((g) => !g.isPopular);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
          Gateways de Pagamento
        </h1>
        <p className="text-gray-600 dark:text-gray-300 font-medium">
          Configure e gerencie seus gateways de pagamento ({gateways.length}{" "}
          disponíveis)
        </p>
      </div>

      <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg">Gateways Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {configs.filter((c) => c.isActive).length}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            de {gateways.length} gateways disponíveis
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar gateway..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 border-gray-200 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm dark:text-white dark:placeholder:text-gray-500"
          />
        </div>
        <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <TabsList>
            <TabsTrigger value="ALL">Todos</TabsTrigger>
            <TabsTrigger value="PAYMENT_PROCESSOR">Processadores</TabsTrigger>
            <TabsTrigger value="WALLET">Wallets</TabsTrigger>
            <TabsTrigger value="BANK">Bancos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <>
          {popularGateways.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Gateways Populares</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularGateways.map((gateway) => (
                  <Card
                    key={gateway.id}
                    className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-12 h-12 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            {gateway.type === "PAYMENT_PROCESSOR" && (
                              <CreditCard className="h-6 w-6 text-white" />
                            )}
                            {gateway.type === "WALLET" && (
                              <Wallet className="h-6 w-6 text-white" />
                            )}
                            {gateway.type === "BANK" && (
                              <Building2 className="h-6 w-6 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">
                                {gateway.name}
                              </h3>
                              {isGatewayActive(gateway.id) && (
                                <div
                                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"
                                  title="Gateway Ativo"
                                />
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {gateway.supportsPix && (
                                <Badge variant="outline" className="text-xs">
                                  PIX
                                </Badge>
                              )}
                              {gateway.supportsCreditCard && (
                                <Badge variant="outline" className="text-xs">
                                  Cartão
                                </Badge>
                              )}
                              {gateway.supportsBoleto && (
                                <Badge variant="outline" className="text-xs">
                                  Boleto
                                </Badge>
                              )}
                            </div>
                            {isConfigured(gateway.id) && (
                              <div className="flex items-center gap-1 mt-2 text-green-600">
                                <CheckCircle2 className="h-3 w-3" />
                                <span className="text-xs font-medium">
                                  Configurado
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConfigureGateway(gateway)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {otherGateways.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Outros Gateways</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {otherGateways.map((gateway) => (
                  <Card
                    key={gateway.id}
                    className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold">
                              {gateway.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium truncate">
                                {gateway.name}
                              </h4>
                              {isGatewayActive(gateway.id) && (
                                <div
                                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0"
                                  title="Gateway Ativo"
                                />
                              )}
                            </div>
                            {isConfigured(gateway.id) && (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleConfigureGateway(gateway)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-md">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              Configurar {selectedGateway?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">API Key *</Label>
                <Input
                  value={configForm.apiKey}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, apiKey: e.target.value })
                  }
                  placeholder="sk_live_xxx"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Secret Key</Label>
                <Input
                  value={configForm.secretKey}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, secretKey: e.target.value })
                  }
                  placeholder="secret_xxx"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Public Key</Label>
                <Input
                  value={configForm.publicKey}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, publicKey: e.target.value })
                  }
                  placeholder="pk_live_xxx"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Webhook URL</Label>
                <Input
                  value={configForm.webhookUrl}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, webhookUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-purple-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Taxa PIX (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={configForm.pixFee}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      pixFee: parseFloat(e.target.value),
                    })
                  }
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-green-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Taxa Cartão (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={configForm.creditCardFee}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      creditCardFee: parseFloat(e.target.value),
                    })
                  }
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">
                  Taxa Boleto (R$)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={configForm.boletoFee}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      boletoFee: parseFloat(e.target.value),
                    })
                  }
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <Switch
                  checked={configForm.isTestMode}
                  onCheckedChange={(v) =>
                    setConfigForm({ ...configForm, isTestMode: v })
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-purple-600"
                />
                <Label className="text-sm font-medium cursor-pointer">
                  Modo de Teste
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={configForm.isActive}
                  onCheckedChange={(v) =>
                    setConfigForm({ ...configForm, isActive: v })
                  }
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600"
                />
                <Label className="text-sm font-medium cursor-pointer">
                  Ativo
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsConfigDialogOpen(false)}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              className="border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
            >
              <Zap className="h-4 w-4 mr-2" />
              Testar Conexão
            </Button>
            <Button
              onClick={handleSaveConfig}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Salvar Configuração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredGateways.length === 0 && !loading && (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum gateway encontrado</p>
        </div>
      )}
    </div>
  );
};

export default GatewaysPage;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  CreditCard,
  Wallet,
  FileText,
  Zap,
  Settings,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import {
  getGatewayBySlug,
  GatewayConfig as GatewayConfigType,
} from "@/lib/gateways/gatewaysList";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import GatewayLogo from "@/components/gateway/GatewayLogo";
import { Skeleton } from "@/components/ui/skeleton";

const GatewayConfigPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  const [gateway, setGateway] = useState<GatewayConfigType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [environment, setEnvironment] = useState<"production" | "sandbox">("production");
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [enableCreditCard, setEnableCreditCard] = useState(false);
  const [enablePix, setEnablePix] = useState(false);
  const [enableBoleto, setEnableBoleto] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadGateway();
    }
  }, [slug]);

  const loadGateway = async () => {
    try {
      setLoading(true);

      const gatewayConfig = getGatewayBySlug(slug!);
      if (!gatewayConfig) {
        toast({
          title: "Gateway não encontrado",
          description: "O gateway solicitado não existe.",
          variant: "destructive",
        });
        navigate("/checkout/gateways");
        return;
      }

      setGateway(gatewayConfig);

      if (user?.id) {
        const { data: dbGateway } = await supabase
          .from("Gateway")
          .select("id")
          .eq("slug", gatewayConfig.slug)
          .single();

        if (dbGateway?.id) {
          const { data, error } = await supabase
            .from("GatewayConfig")
            .select("*")
            .eq("userId", user.id)
            .eq("gatewayId", dbGateway.id)
            .single();

          if (!error && data) {
            setIsActive(data.isActive || false);
            setIsVerified(data.isVerified ?? false);
            setEnvironment(data.environment ?? "production");
            setVerifiedAt(data.verifiedAt ?? null);
            setConfigId(data.id);
            setFormData(data.credentials || {});

            if (data.credentials?.enabledPaymentMethods) {
              const enabled = data.credentials.enabledPaymentMethods;
              setEnableCreditCard(enabled.includes("credit_card"));
              setEnablePix(enabled.includes("pix"));
              setEnableBoleto(enabled.includes("boleto"));
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading gateway:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!gateway || !user?.id) return;

    try {
      let savedConfigId: string | null = null;
      setSaving(true);

      const missingFields = gateway.configFields
        .filter((field) => field.required && !formData[field.name])
        .map((field) => field.label);

      if (missingFields.length > 0) {
        toast({
          title: "Campos obrigatórios",
          description: `Preencha os campos: ${missingFields.join(", ")}`,
          variant: "destructive",
        });
        return;
      }

      const { data: dbGateway, error: gwErr } = await supabase
        .from("Gateway")
        .select("id, slug, name")
        .eq("slug", gateway.slug)
        .single();

      if (gwErr || !dbGateway?.id) {
        throw gwErr || new Error("Gateway não encontrado no banco");
      }

      const { data: existingConfig } = await supabase
        .from("GatewayConfig")
        .select("id")
        .eq("userId", user.id)
        .eq("gatewayId", dbGateway.id)
        .single();

      const enabledPaymentMethods = [];
      if (enableCreditCard) enabledPaymentMethods.push("credit_card");
      if (enablePix) enabledPaymentMethods.push("pix");
      if (enableBoleto) enabledPaymentMethods.push("boleto");

      const updatedCredentials = {
        ...formData,
        enabledPaymentMethods,
      };

      if (existingConfig) {
        const { error } = await supabase
          .from("GatewayConfig")
          .update({
            credentials: updatedCredentials,
            isActive: isActive,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", existingConfig.id);
        if (!error) savedConfigId = existingConfig.id;
      } else {
        const { data: anyConfig } = await supabase
          .from("GatewayConfig")
          .select("id")
          .eq("userId", user.id)
          .limit(1);

        const { data: created, error } = await supabase
          .from("GatewayConfig")
          .insert({
            userId: user.id,
            gatewayId: dbGateway.id,
            credentials: updatedCredentials,
            isActive: isActive,
            isDefault: !anyConfig || anyConfig.length === 0,
          })
          .select("id")
          .single();

        if (error) throw error;
        savedConfigId = created?.id || null;
      }

      toast({
        title: "✅ Configuração salva!",
        description: `Gateway ${gateway.name} foi configurado com sucesso.`,
      });

      try {
        const payload: any = savedConfigId
          ? {
              configId: savedConfigId,
              credentials: formData,
              persistCredentials: false,
            }
          : {
              slug: gateway.slug,
              credentials: formData,
              persistCredentials: false,
            };

        const { data, error } = await supabase.functions.invoke(
          "gateway-config-verify",
          { body: payload }
        );

        if (error) throw error;

        if (data?.success) {
          toast({
            title: "✅ Credenciais verificadas",
            description: data.message || "Gateway verificado com sucesso.",
          });
        }
      } catch (e: any) {
        toast({
          title: "⚠️ Erro ao verificar",
          description: e?.message || "Não foi possível verificar as credenciais.",
          variant: "destructive",
        });
      }

      await loadGateway();
    } catch (error) {
      console.error("Error saving gateway config:", error);
      toast({
        title: "❌ Erro ao salvar",
        description: "Não foi possível salvar a configuração.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    if (!gateway || !user?.id) return;
    try {
      setVerifying(true);
      const payload: any = configId
        ? {
            configId,
            credentials: formData,
            persistCredentials: false,
          }
        : {
            slug: gateway.slug,
            credentials: formData,
            persistCredentials: false,
          };

      const { data, error } = await supabase.functions.invoke(
        "gateway-config-verify",
        { body: payload }
      );

      if (error) throw error;

      if (data?.success) {
        setIsVerified(true);
        setVerifiedAt(data.verifiedAt || new Date().toISOString());
        setEnvironment("production");
        toast({
          title: "✅ Verificação bem-sucedida",
          description: data.message || "Credenciais verificadas com sucesso.",
        });
      } else {
        setIsVerified(false);
        toast({
          title: "❌ Falha na verificação",
          description: data?.message || "Não foi possível verificar as credenciais.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "❌ Erro na verificação",
        description: e?.message || "Erro inesperado ao verificar as credenciais.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const togglePasswordVisibility = (fieldName: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "📋 Copiado!",
      description: "Valor copiado para a área de transferência.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <Skeleton className="h-10 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!gateway) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => navigate("/checkout/gateways")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Voltar para Gateways</span>
        </button>
      </motion.div>

      {/* Header with Gateway Info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex items-start gap-6"
      >
        <GatewayLogo name={gateway.name} logo={gateway.logo} slug={gateway.slug} size="xl" />
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {gateway.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 font-medium mt-2">
                {gateway.description}
              </p>
              <div className="flex gap-2 mt-3">
                {gateway.type === "nacional" || gateway.type === "both" ? (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-0">
                    Nacional
                  </Badge>
                ) : null}
                {gateway.type === "global" || gateway.type === "both" ? (
                  <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-0">
                    Global
                  </Badge>
                ) : null}
              </div>
            </div>
            <a
              href={gateway.apiDocs}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Documentação
            </a>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Form - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Credentials Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 bg-opacity-10">
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">Credenciais de API</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {gateway.configFields.map((field, index) => (
                  <motion.div
                    key={field.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                    className="space-y-2"
                  >
                    <Label htmlFor={field.name} className="text-sm font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {field.type === "text" && (
                      <div className="relative">
                        <Input
                          id={field.name}
                          type="text"
                          placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="pr-10 dark:bg-gray-800 dark:border-gray-700"
                        />
                        {formData[field.name] && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(formData[field.name], field.name)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {copiedField === field.name ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {field.type === "password" && (
                      <div className="relative">
                        <Input
                          id={field.name}
                          type={showPasswords[field.name] ? "text" : "password"}
                          placeholder={field.placeholder}
                          value={formData[field.name] || ""}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="pr-20 dark:bg-gray-800 dark:border-gray-700"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          {formData[field.name] && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(formData[field.name], field.name)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                            >
                              {copiedField === field.name ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(field.name)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          >
                            {showPasswords[field.name] ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {field.type === "select" && field.options && (
                      <Select
                        value={formData[field.name] || ""}
                        onValueChange={(value) => handleFieldChange(field.name, value)}
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectValue placeholder={field.placeholder || "Selecione"} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {field.type === "checkbox" && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <Switch
                          id={field.name}
                          checked={formData[field.name] || false}
                          onCheckedChange={(checked) => handleFieldChange(field.name, checked)}
                        />
                        <Label htmlFor={field.name} className="cursor-pointer">
                          {field.label}
                        </Label>
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Payment Methods Card */}
          {gateway.paymentMethods.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 bg-opacity-10">
                      <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-xl">Métodos de Pagamento</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gateway.paymentMethods.includes("credit_card") && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">Cartão de Crédito</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Aceitar pagamentos com cartão
                          </p>
                        </div>
                      </div>
                      <Switch checked={enableCreditCard} onCheckedChange={setEnableCreditCard} />
                    </motion.div>
                  )}

                  {gateway.paymentMethods.includes("pix") && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">PIX</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Pagamento instantâneo
                          </p>
                        </div>
                      </div>
                      <Switch checked={enablePix} onCheckedChange={setEnablePix} />
                    </motion.div>
                  )}

                  {gateway.paymentMethods.includes("boleto") && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center justify-between p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-500/10">
                          <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="font-medium">Boleto</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Boleto bancário
                          </p>
                        </div>
                      </div>
                      <Switch checked={enableBoleto} onCheckedChange={setEnableBoleto} />
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Sidebar - 1/3 */}
        <div className="space-y-6">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card
              className={cn(
                "border-0 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2",
                isActive
                  ? "bg-green-500/10 border-green-500/50"
                  : "bg-gray-100/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Status do Gateway
                  </Label>
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full animate-pulse",
                      isActive ? "bg-green-500" : "bg-gray-400"
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-900">
                    <span className="text-sm font-medium">Gateway Ativo</span>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs font-medium">Gateway habilitado</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Verification Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold">Verificação</h3>
                  </div>
                  {isVerified ? (
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            Gateway Verificado
                          </p>
                          {verifiedAt && (
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                              {new Date(verifiedAt).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-

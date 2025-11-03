import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ExternalLink, HelpCircle, Loader2 } from "lucide-react";
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
  const [environment, setEnvironment] = useState<"production" | "sandbox">(
    "production",
  );
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (slug) {
      loadGateway();
    }
  }, [slug]);

  const loadGateway = async () => {
    try {
      setLoading(true);

      // Get gateway configuration
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

      // Load saved configuration from database

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

      // Validate required fields
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

      // Map slug -> gatewayId from DB
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

      if (existingConfig) {
        // Update existing config
        const { error } = await supabase
          .from("GatewayConfig")
          .update({
            credentials: formData,
            isActive: isActive,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", existingConfig.id);
        if (!error) savedConfigId = existingConfig.id;
      } else {
        // Create new config

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

            credentials: formData,

            isActive: isActive,

            isDefault: !anyConfig || anyConfig.length === 0,
          })
          .select("id")
          .single();

        if (error) throw error;
        savedConfigId = created?.id || null;
      }

      toast({
        title: "Configuração salva!",
        description: `Gateway ${gateway.name} foi configurado com sucesso.`,
      });

      // Verificar automaticamente as credenciais em produção
      try {
        const payload: any = savedConfigId
          ? { configId: savedConfigId }
          : {
              slug: gateway.slug,
              credentials: formData,
              persistCredentials: false,
            };

        const { data, error } = await supabase.functions.invoke(
          "gateway-config-verify",
          { body: payload },
        );

        if (error) {
          throw error;
        }

        if (data?.success) {
          toast({
            title: "Credenciais verificadas",
            description: data.message || "Gateway verificado com sucesso.",
          });
        } else {
          toast({
            title: "Falha na verificação",
            description:
              data?.message || "Confira suas credenciais e tente novamente.",
            variant: "destructive",
          });
        }
      } catch (e: any) {
        toast({
          title: "Erro ao verificar",
          description:
            e?.message || "Não foi possível verificar as credenciais.",
          variant: "destructive",
        });
      }

      navigate("/checkout/gateways");
    } catch (error) {
      console.error("Error saving gateway config:", error);
      toast({
        title: "Erro ao salvar",
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
      const payload: any = {};
      if (configId) {
        payload.configId = configId;
      } else {
        payload.slug = gateway.slug;
        payload.credentials = formData;
        payload.persistCredentials = false;
      }
      const { data, error } = await supabase.functions.invoke(
        "gateway-config-verify",
        {
          body: payload,
        },
      );
      if (error) throw error;
      if (data?.success) {
        setIsVerified(true);
        setVerifiedAt(data.verifiedAt || new Date().toISOString());
        setEnvironment("production");
        toast({
          title: "Verificação bem-sucedida",
          description: data.message || "Credenciais verificadas com sucesso.",
        });
      } else {
        setIsVerified(false);
        toast({
          title: "Falha na verificação",
          description:
            data?.message || "Não foi possível verificar as credenciais.",
          variant: "destructive",
        });
      }
    } catch (e: any) {
      toast({
        title: "Erro na verificação",
        description:
          e?.message || "Erro inesperado ao verificar as credenciais.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!gateway) {
    return null;
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/checkout/gateways")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="text-sm">ver todos gateways</span>
      </button>

      {/* Header with Logo */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden p-2">
          <img
            src={gateway.logo}
            alt={`${gateway.name} logo`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {gateway.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Integre sua loja ao gateway {gateway.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gateway.configFields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>
                    {field.label}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>

                  {field.type === "text" && (
                    <Input
                      id={field.name}
                      type="text"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      required={field.required}
                    />
                  )}

                  {field.type === "password" && (
                    <Input
                      id={field.name}
                      type="password"
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleFieldChange(field.name, e.target.value)
                      }
                      required={field.required}
                    />
                  )}

                  {field.type === "select" && field.options && (
                    <Select
                      value={formData[field.name] || ""}
                      onValueChange={(value) =>
                        handleFieldChange(field.name, value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={field.placeholder || "Selecione"}
                        />
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
                    <div className="flex items-center gap-2">
                      <Switch
                        id={field.name}
                        checked={formData[field.name] || false}
                        onCheckedChange={(checked) =>
                          handleFieldChange(field.name, checked)
                        }
                      />
                      <Label htmlFor={field.name} className="cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Rules/Additional Settings (Optional) */}
          {gateway.paymentMethods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Regras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {gateway.paymentMethods.includes("credit_card") && (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">Ativar cartão de crédito</span>

                      <Switch
                        defaultChecked={false}
                        disabled={!isVerified || environment !== "production"}
                      />

                      {(!isVerified || environment !== "production") && (
                        <span className="text-xs text-gray-500 ml-2">
                          Disponível após verificação em produção
                        </span>
                      )}
                    </div>
                  )}

                  {gateway.paymentMethods.includes("pix") && (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">Ativar pix</span>

                      <Switch
                        defaultChecked={false}
                        disabled={!isVerified || environment !== "production"}
                      />

                      {(!isVerified || environment !== "production") && (
                        <span className="text-xs text-gray-500 ml-2">
                          Disponível após verificação em produção
                        </span>
                      )}
                    </div>
                  )}

                  {gateway.paymentMethods.includes("boleto") && (
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm">
                        Utilizar taxa de juros customizada
                      </span>

                      <Switch
                        defaultChecked={false}
                        disabled={!isVerified || environment !== "production"}
                      />

                      {(!isVerified || environment !== "production") && (
                        <span className="text-xs text-gray-500 ml-2">
                          Disponível após verificação em produção
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card
            className={cn(
              "border-2",
              isActive
                ? "border-green-200 bg-green-50 dark:bg-green-950/20"
                : "border-red-200 bg-red-50 dark:bg-red-950/20",
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="status" className="text-base font-semibold">
                  Status <span className="text-red-500">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      isActive ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive
                        ? "text-green-700 dark:text-green-300"
                        : "text-red-700 dark:text-red-300",
                    )}
                  >
                    {isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>

              <Select
                value={isActive ? "active" : "inactive"}
                onValueChange={(value) => setIsActive(value === "active")}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>

              {/* Verificação e ajuda */}
              <div className="mt-4 pt-4 border-t space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Verificação</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {isVerified && verifiedAt
                        ? `Verificado em: ${new Date(verifiedAt).toLocaleString()}`
                        : "Não verificado"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Ambiente: {environment}
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      await handleVerify();
                    }}
                    disabled={verifying}
                    className="gap-2"
                  >
                    {verifying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />{" "}
                        Verificando...
                      </>
                    ) : (
                      "Verificar credenciais"
                    )}
                  </Button>
                </div>
                <a
                  href={gateway.apiDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                >
                  <HelpCircle className="h-4 w-4" />

                  <span>Está com dúvidas?</span>

                  <span className="underline">
                    Como integrar o gateway {gateway.name}?
                  </span>

                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Gateway Info */}
          <Card>
            <CardContent className="p-6 space-y-3">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                <div className="flex gap-2 mt-1">
                  {(gateway.type === "nacional" || gateway.type === "both") && (
                    <Badge variant="secondary">Nacional</Badge>
                  )}
                  {(gateway.type === "global" || gateway.type === "both") && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700"
                    >
                      Global
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Métodos de Pagamento
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {gateway.paymentMethods.map((method) => (
                    <Badge key={method} variant="outline" className="text-xs">
                      {method === "credit_card" && "Cartão de Crédito"}
                      {method === "debit_card" && "Cartão de Débito"}
                      {method === "pix" && "Pix"}
                      {method === "boleto" && "Boleto"}
                      {method === "wallet" && "Carteira Digital"}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Features
                </p>
                <ul className="mt-1 space-y-1">
                  {gateway.features.map((feature, index) => (
                    <li
                      key={index}
                      className="text-xs text-gray-700 dark:text-gray-300"
                    >
                      • {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => navigate("/checkout/gateways")}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar"
          )}
        </Button>
      </div>
    </div>
  );
};

export default GatewayConfigPage;

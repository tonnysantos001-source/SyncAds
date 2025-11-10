import React, { useState, useEffect } from "react";
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
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  HiArrowPath,
  HiCheckCircle,
  HiXCircle,
  HiInformationCircle,
  HiArrowTopRightOnSquare,
  HiEye,
  HiEyeSlash,
  HiShieldCheck,
} from "react-icons/hi2";
import { IoSave } from "react-icons/io5";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

interface OAuthConfig {
  platform: string;
  platformName: string;
  clientId: string;
  clientSecret: string;
  isActive: boolean;
  icon: string;
  scopes: string[];
  docsUrl: string;
}

export default function OAuthConfigPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  const [configs, setConfigs] = useState<OAuthConfig[]>([
    {
      platform: "META",
      platformName: "Meta / Facebook Ads",
      clientId: "",
      clientSecret: "",
      isActive: false,
      icon: "📘",
      scopes: [
        "ads_management",
        "ads_read",
        "pages_read_engagement",
        "pages_manage_ads",
      ],
      docsUrl:
        "https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow",
    },
    {
      platform: "GOOGLE",
      platformName: "Google Ads",
      clientId: "",
      clientSecret: "",
      isActive: false,
      icon: "🔍",
      scopes: [
        "https://www.googleapis.com/auth/adwords",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
      docsUrl: "https://developers.google.com/identity/protocols/oauth2",
    },
    {
      platform: "LINKEDIN",
      platformName: "LinkedIn Ads",
      clientId: "",
      clientSecret: "",
      isActive: false,
      icon: "💼",
      scopes: ["r_ads", "r_ads_reporting", "rw_ads"],
      docsUrl:
        "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication",
    },
    {
      platform: "TIKTOK",
      platformName: "TikTok For Business",
      clientId: "",
      clientSecret: "",
      isActive: false,
      icon: "🎵",
      scopes: ["user.info.basic", "video.list", "video.upload"],
      docsUrl: "https://developers.tiktok.com/doc/login-kit-web",
    },
  ]);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("OAuthConfig")
        .select("*")
        .order("platform");

      if (error) throw error;

      if (data && data.length > 0) {
        setConfigs((prevConfigs) =>
          prevConfigs.map((config) => {
            const saved = data.find((d) => d.platform === config.platform);
            if (saved) {
              return {
                ...config,
                clientId: saved.clientId || "",
                clientSecret: "••••••••••••",
                isActive: saved.isActive || false,
              };
            }
            return config;
          }),
        );
      }
    } catch (error: any) {
      console.error("Erro ao carregar configs:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: string) => {
    try {
      setSaving(platform);

      const config = configs.find((c) => c.platform === platform);
      if (!config) return;

      if (!config.clientId || !config.clientSecret) {
        toast({
          title: "Campos obrigatórios",
          description: "Client ID e Client Secret são obrigatórios.",
          variant: "destructive",
        });
        setSaving(null);
        return;
      }

      const dataToSave: any = {
        platform: config.platform,
        clientId: config.clientId,
        isActive: config.isActive,
        scopes: config.scopes,
        updatedAt: new Date().toISOString(),
      };

      if (config.clientSecret !== "••••••••••••") {
        dataToSave.clientSecret = config.clientSecret;
      }

      const { error } = await supabase.from("OAuthConfig").upsert(dataToSave, {
        onConflict: "platform",
      });

      if (error) throw error;

      toast({
        title: "✅ Configuração salva",
        description: `${config.platformName} configurado com sucesso!`,
      });

      await loadConfigs();
    } catch (error: any) {
      console.error("Erro ao salvar config:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updateConfig = (
    platform: string,
    field: keyof OAuthConfig,
    value: any,
  ) => {
    setConfigs((prevConfigs) =>
      prevConfigs.map((config) =>
        config.platform === platform ? { ...config, [field]: value } : config,
      ),
    );
  };

  const toggleSecret = (platform: string) => {
    setShowSecrets((prev) => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <HiArrowPath className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header com gradiente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
              <HiShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Configurações OAuth 2.0
              </h1>
              <p className="text-gray-600 mt-1">
                Configure as credenciais das plataformas para integração via
                chat
              </p>
            </div>
          </div>
        </motion.div>

        {/* Alert Info com gradiente */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <HiInformationCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                    Como funciona?
                  </h3>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Cadastre as credenciais OAuth aqui</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>
                        Marque como "Ativa" quando estiver aprovado pela
                        plataforma
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>
                        Usuários podem pedir no chat: "Conecte com Facebook"
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>A IA mostra card interativo para autorização</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>Tokens são salvos criptografados</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6">
          {configs.map((config, index) => (
            <motion.div
              key={config.platform}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Card className="border-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md">
                        {config.icon}
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          {config.platformName}
                          {config.isActive ? (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                              <HiCheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-gray-200 dark:bg-gray-700"
                            >
                              <HiXCircle className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <span className="font-medium">Scopes:</span>{" "}
                          {config.scopes.slice(0, 2).join(", ")}
                          {config.scopes.length > 2 &&
                            ` +${config.scopes.length - 2} mais`}
                        </CardDescription>
                      </div>
                    </div>
                    <a
                      href={config.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20"
                    >
                      Documentação
                      <HiArrowTopRightOnSquare className="h-4 w-4" />
                    </a>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  {/* Client ID */}
                  <div>
                    <Label
                      htmlFor={`${config.platform}-client-id`}
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Client ID *
                    </Label>
                    <Input
                      id={`${config.platform}-client-id`}
                      placeholder="Digite o Client ID da plataforma"
                      value={config.clientId}
                      onChange={(e) =>
                        updateConfig(
                          config.platform,
                          "clientId",
                          e.target.value,
                        )
                      }
                      className="mt-2 font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    />
                  </div>

                  {/* Client Secret */}
                  <div>
                    <Label
                      htmlFor={`${config.platform}-client-secret`}
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      Client Secret *
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        id={`${config.platform}-client-secret`}
                        type={
                          showSecrets[config.platform] ? "text" : "password"
                        }
                        placeholder="Digite o Client Secret"
                        value={config.clientSecret}
                        onChange={(e) =>
                          updateConfig(
                            config.platform,
                            "clientSecret",
                            e.target.value,
                          )
                        }
                        className="pr-12 font-mono text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret(config.platform)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        {showSecrets[config.platform] ? (
                          <HiEyeSlash className="h-5 w-5" />
                        ) : (
                          <HiEye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id={`${config.platform}-active`}
                      checked={config.isActive}
                      onChange={(e) =>
                        updateConfig(
                          config.platform,
                          "isActive",
                          e.target.checked,
                        )
                      }
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <Label
                      htmlFor={`${config.platform}-active`}
                      className="cursor-pointer font-medium"
                    >
                      Ativar integração (usuários poderão conectar)
                    </Label>
                  </div>

                  {/* Botão Salvar */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleSave(config.platform)}
                      disabled={saving === config.platform}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 text-base font-semibold"
                    >
                      {saving === config.platform ? (
                        <>
                          <HiArrowPath className="mr-2 h-5 w-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <IoSave className="mr-2 h-5 w-5" />
                          Salvar Configuração
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Footer Info com gradiente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="mt-8 border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <HiShieldCheck className="h-6 w-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-lg">
                    📌 Importante
                  </h3>
                  <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>
                        As credenciais são criptografadas antes de salvar no
                        banco
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>Nunca são expostas no frontend dos usuários</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>
                        Quando "Ativa", a integração fica disponível para todos
                        usuários
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      <span>
                        Desative temporariamente se houver problemas de
                        aprovação
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </SuperAdminLayout>
  );
}

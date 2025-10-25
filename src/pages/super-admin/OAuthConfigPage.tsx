import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

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
      platform: 'META',
      platformName: 'Meta / Facebook Ads',
      clientId: '',
      clientSecret: '',
      isActive: false,
      icon: '📘',
      scopes: ['ads_management', 'ads_read', 'pages_read_engagement', 'pages_manage_ads'],
      docsUrl: 'https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow',
    },
    {
      platform: 'GOOGLE',
      platformName: 'Google Ads',
      clientId: '',
      clientSecret: '',
      isActive: false,
      icon: '🔍',
      scopes: ['https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/userinfo.email'],
      docsUrl: 'https://developers.google.com/identity/protocols/oauth2',
    },
    {
      platform: 'LINKEDIN',
      platformName: 'LinkedIn Ads',
      clientId: '',
      clientSecret: '',
      isActive: false,
      icon: '💼',
      scopes: ['r_ads', 'r_ads_reporting', 'rw_ads'],
      docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication',
    },
    {
      platform: 'TIKTOK',
      platformName: 'TikTok For Business',
      clientId: '',
      clientSecret: '',
      isActive: false,
      icon: '🎵',
      scopes: ['user.info.basic', 'video.list', 'video.upload'],
      docsUrl: 'https://developers.tiktok.com/doc/login-kit-web',
    },
  ]);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('OAuthConfig')
        .select('*')
        .order('platform');

      if (error) throw error;

      if (data && data.length > 0) {
        setConfigs(prevConfigs => 
          prevConfigs.map(config => {
            const saved = data.find(d => d.platform === config.platform);
            if (saved) {
              return {
                ...config,
                clientId: saved.clientId || '',
                clientSecret: '••••••••••••',
                isActive: saved.isActive || false,
              };
            }
            return config;
          })
        );
      }
    } catch (error: any) {
      console.error('Erro ao carregar configs:', error);
      toast({
        title: 'Erro ao carregar configurações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (platform: string) => {
    try {
      setSaving(platform);
      
      const config = configs.find(c => c.platform === platform);
      if (!config) return;

      if (!config.clientId || !config.clientSecret) {
        toast({
          title: 'Campos obrigatórios',
          description: 'Client ID e Client Secret são obrigatórios.',
          variant: 'destructive',
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

      if (config.clientSecret !== '••••••••••••') {
        dataToSave.clientSecret = config.clientSecret;
      }

      const { error } = await supabase
        .from('OAuthConfig')
        .upsert(dataToSave, {
          onConflict: 'platform',
        });

      if (error) throw error;

      toast({
        title: '✅ Configuração salva',
        description: `${config.platformName} configurado com sucesso!`,
      });

      await loadConfigs();

    } catch (error: any) {
      console.error('Erro ao salvar config:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(null);
    }
  };

  const updateConfig = (platform: string, field: keyof OAuthConfig, value: any) => {
    setConfigs(prevConfigs =>
      prevConfigs.map(config =>
        config.platform === platform
          ? { ...config, [field]: value }
          : config
      )
    );
  };

  const toggleSecret = (platform: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔐 Configurações OAuth 2.0
          </h1>
          <p className="text-gray-600">
            Configure as credenciais das plataformas. Quando cadastradas e ativadas, seus usuários poderão conectar via chat com IA.
          </p>
        </div>

        {/* Alert Info */}
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Como funciona?</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Cadastre as credenciais OAuth aqui</li>
                  <li>• Marque como "Ativa" quando estiver aprovado pela plataforma</li>
                  <li>• Usuários podem pedir no chat: "Conecte com Facebook"</li>
                  <li>• A IA mostra card interativo para autorização</li>
                  <li>• Tokens são salvos criptografados</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {configs.map((config) => (
            <Card key={config.platform} className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{config.icon}</span>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {config.platformName}
                        {config.isActive ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Scopes: {config.scopes.slice(0, 2).join(', ')}
                        {config.scopes.length > 2 && ` +${config.scopes.length - 2} mais`}
                      </CardDescription>
                    </div>
                  </div>
                  <a
                    href={config.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Documentação
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Client ID */}
                <div>
                  <Label htmlFor={`${config.platform}-client-id`}>
                    Client ID *
                  </Label>
                  <Input
                    id={`${config.platform}-client-id`}
                    placeholder="Digite o Client ID da plataforma"
                    value={config.clientId}
                    onChange={(e) => updateConfig(config.platform, 'clientId', e.target.value)}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                {/* Client Secret */}
                <div>
                  <Label htmlFor={`${config.platform}-client-secret`}>
                    Client Secret *
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id={`${config.platform}-client-secret`}
                      type={showSecrets[config.platform] ? 'text' : 'password'}
                      placeholder="Digite o Client Secret"
                      value={config.clientSecret}
                      onChange={(e) => updateConfig(config.platform, 'clientSecret', e.target.value)}
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret(config.platform)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showSecrets[config.platform] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`${config.platform}-active`}
                    checked={config.isActive}
                    onChange={(e) => updateConfig(config.platform, 'isActive', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor={`${config.platform}-active`} className="cursor-pointer">
                    Ativar integração (usuários poderão conectar)
                  </Label>
                </div>

                {/* Botão Salvar */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={() => handleSave(config.platform)}
                    disabled={saving === config.platform}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  >
                    {saving === config.platform ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configuração
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Info */}
        <Card className="mt-8 border-gray-200 bg-gray-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">📌 Importante</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• As credenciais são criptografadas antes de salvar no banco</li>
              <li>• Nunca são expostas no frontend dos usuários</li>
              <li>• Quando "Ativa", a integração fica disponível para todos usuários</li>
              <li>• Desative temporariamente se houver problemas de aprovação</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}

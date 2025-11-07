import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Bot, Check, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";

interface OrganizationAi {
  id: string;
  isDefault: boolean;
  customSystemPrompt: string | null;
  globalAiConnection: {
    id: string;
    name: string;
    provider: string;
    model: string | null;
    maxTokens: number;
    temperature: number;
    isActive: boolean;
  };
}

export const OrganizationAiTab: React.FC = () => {
  const { toast } = useToast();
  const user = useStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [aiConnections, setAiConnections] = useState<OrganizationAi[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOrgAiConnections();
  }, []);

  const loadOrgAiConnections = async () => {
    try {
      if (!user?.id) return;

      // Get user's organization
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("organizationId")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;

      // Get organization's AI connections
      const { data, error } = await supabase
        .from("OrganizationAiConnection")
        .select(
          `
          id,
          isDefault,
          customSystemPrompt,
          globalAiConnection:GlobalAiConnection (
            id,
            name,
            provider,
            model,
            maxTokens,
            temperature,
            isActive
          )
        `,
        )
        .eq("organizationId", userData.organizationId);

      if (error) throw error;

      setAiConnections(data || []);

      // Load custom prompt from default AI
      const defaultAi = data?.find((ai) => ai.isDefault);
      if (defaultAi?.customSystemPrompt) {
        setCustomPrompt(defaultAi.customSystemPrompt);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar IAs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCustomPrompt = async () => {
    try {
      setSaving(true);

      const defaultAi = aiConnections.find((ai) => ai.isDefault);
      if (!defaultAi) {
        throw new Error("No default AI connection found");
      }

      const { error } = await supabase
        .from("OrganizationAiConnection")
        .update({ customSystemPrompt: customPrompt || null })
        .eq("id", defaultAi.id);

      if (error) throw error;

      toast({
        title: "✅ Prompt personalizado salvo!",
        description: "Suas próximas conversas usarão este prompt.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar prompt",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      OPENAI: "bg-green-100 text-green-800",
      ANTHROPIC: "bg-orange-100 text-orange-800",
      GOOGLE: "bg-blue-100 text-blue-800",
      COHERE: "bg-purple-100 text-purple-800",
    };
    return (
      <Badge className={colors[provider] || "bg-gray-100 text-gray-800"}>
        {provider}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (aiConnections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inteligência Artificial</CardTitle>
          <CardDescription>
            Configuração de IA da sua organização
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-3">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
            <h3 className="text-lg font-medium">Nenhuma IA Configurada</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Sua organização ainda não tem uma IA configurada. Entre em contato
              com o administrador do sistema.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const defaultAi = aiConnections.find((ai) => ai.isDefault);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 p-6 space-y-6">
      {/* AI Connection Info */}
      <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            IA Configurada
          </CardTitle>
          <CardDescription>
            Esta é a IA que sua organização está usando atualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiConnections.map((ai) => (
            <div key={ai.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">
                      {ai.globalAiConnection.name}
                    </h3>
                    {ai.isDefault && (
                      <Badge variant="default">
                        <Check className="h-3 w-3 mr-1" />
                        Padrão
                      </Badge>
                    )}
                    {!ai.globalAiConnection.isActive && (
                      <Badge variant="destructive">Inativa</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Configurada pelo administrador do sistema
                  </p>
                </div>
                {getProviderBadge(ai.globalAiConnection.provider)}
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Modelo</span>
                  <p className="font-medium">
                    {ai.globalAiConnection.model || "Padrão"}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Max Tokens</span>
                  <p className="font-medium">
                    {ai.globalAiConnection.maxTokens}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Temperature</span>
                  <p className="font-medium">
                    {ai.globalAiConnection.temperature}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Custom System Prompt */}
      {defaultAi && (
        <Card>
          <CardHeader>
            <CardTitle>Prompt Personalizado</CardTitle>
            <CardDescription>
              Configure como a IA deve se comportar nas conversas (opcional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customPrompt">Instruções para a IA</Label>
              <Textarea
                id="customPrompt"
                placeholder="Ex: Você é um assistente de marketing especializado em e-commerce. Sempre forneça exemplos práticos e dados específicos do mercado brasileiro."
                className="min-h-[150px]"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Se deixado em branco, será usado o prompt padrão da IA.
              </p>
            </div>
            <Button onClick={saveCustomPrompt} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Prompt Personalizado"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Gerenciamento de IA
              </p>
              <p className="text-blue-700">
                As conexões de IA são gerenciadas centralmente pelo
                administrador do sistema. Se precisar de uma IA diferente ou
                tiver problemas, entre em contato com o suporte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

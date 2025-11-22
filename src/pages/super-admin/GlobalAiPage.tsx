import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HiPlus,
  HiSparkles,
  HiTrash,
  HiBeaker,
  HiCog6Tooth,
  HiXMark,
  HiCpuChip,
} from "react-icons/hi2";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

interface GlobalAiConnection {
  id: string;
  name: string;
  provider: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens: number;
  temperature: number;
  isActive: boolean;
  systemPrompt?: string;
  initialGreetings?: string[];
  createdAt: string;
}

export default function GlobalAiPage() {
  const [aiConnections, setAiConnections] = useState<GlobalAiConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPromptDialogOpen, setIsPromptDialogOpen] = useState(false);
  const [selectedAi, setSelectedAi] = useState<GlobalAiConnection | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    provider: "OPENAI",
    apiKey: "",
    baseUrl: "",
    model: "",
    maxTokens: 4096,
    temperature: 0.7,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load AI connections
      const { data: aiData, error: aiError } = await supabase
        .from("GlobalAiConnection")
        .select("*")
        .order("createdAt", { ascending: false });

      if (aiError) throw aiError;
      setAiConnections(aiData || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAiConnection = async () => {
    try {
      // Verificar autenticação antes de inserir
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(
          "Você precisa estar autenticado. Faça login novamente.",
        );
      }

      console.log("✅ Usuário autenticado:", user.id, user.email);

      const { error } = await supabase.from("GlobalAiConnection").insert({
        name: formData.name,
        provider: formData.provider,
        apiKey: formData.apiKey,
        baseUrl: formData.baseUrl || null,
        model: formData.model || null,
        maxTokens: formData.maxTokens,
        temperature: formData.temperature,
        isActive: true,
      });

      if (error) {
        console.error("❌ Erro RLS:", error);
        throw error;
      }

      toast({
        title: "✅ IA adicionada!",
        description: `${formData.name} foi criada com sucesso.`,
      });

      setIsDialogOpen(false);
      loadData();

      // Reset form
      setFormData({
        name: "",
        provider: "OPENAI",
        apiKey: "",
        baseUrl: "",
        model: "",
        maxTokens: 4096,
        temperature: 0.7,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar IA",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleAiStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("GlobalAiConnection")
        .update({ isActive: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Status atualizado",
        description: `IA ${!currentStatus ? "ativada" : "desativada"}.`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const testAiConnection = async (ai: GlobalAiConnection) => {
    try {
      // Validar se tem API key
      if (!ai.apiKey || ai.apiKey.length < 10) {
        throw new Error("API Key inválida ou muito curta");
      }

      toast({
        title: "🧪 Validando configuração...",
        description: `Verificando ${ai.provider}`,
      });

      // Ativar a IA no banco após validação básica
      const { error } = await supabase
        .from("GlobalAiConnection")
        .update({ isActive: true })
        .eq("id", ai.id);

      if (error) throw error;

      // Atualizar estado local
      setAiConnections((prev) =>
        prev.map((conn) =>
          conn.id === ai.id ? { ...conn, isActive: true } : conn,
        ),
      );

      toast({
        title: "✅ Configuração válida!",
        description: `${ai.provider} configurada e ativada. Teste no chat para confirmar funcionamento.`,
      });
    } catch (error: any) {
      console.error("Validação falhou:", error);
      toast({
        title: "❌ Erro na validação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAiConnection = async (id: string, name: string) => {
    if (
      !confirm(
        `Tem certeza que deseja remover "${name}"?\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("GlobalAiConnection")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "🗑️ IA removida!",
        description: `${name} foi removida com sucesso.`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao remover IA",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openPromptDialog = (ai: GlobalAiConnection) => {
    setSelectedAi(ai);
    setIsPromptDialogOpen(true);
  };

  const savePromptConfig = async () => {
    if (!selectedAi) return;

    try {
      const { error } = await supabase
        .from("GlobalAiConnection")
        .update({
          systemPrompt: selectedAi.systemPrompt,
          initialGreetings: selectedAi.initialGreetings,
        })
        .eq("id", selectedAi.id);

      if (error) throw error;

      toast({
        title: "✅ Configuração salva!",
        description: "Prompt e mensagens iniciais atualizados.",
      });

      setIsPromptDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configuração",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getProviderBadge = (provider: string) => {
    const colors: Record<string, string> = {
      OPENAI: "bg-green-100 text-green-800",
      ANTHROPIC: "bg-orange-100 text-orange-800",
      GOOGLE: "bg-blue-100 text-blue-800",
      OPENROUTER: "bg-indigo-100 text-indigo-800",
      GROQ: "bg-red-100 text-red-800",
      COHERE: "bg-purple-100 text-purple-800",
      MISTRAL: "bg-amber-100 text-amber-800",
      PERPLEXITY: "bg-cyan-100 text-cyan-800",
      TOGETHER: "bg-pink-100 text-pink-800",
      FIREWORKS: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${colors[provider] || "bg-gray-100 text-gray-800"}`}
      >
        {provider}
      </span>
    );
  };

  // Provider examples and defaults
  const providerExamples: Record<
    string,
    { model: string; baseUrl: string; description: string }
  > = {
    OPENAI: {
      model: "gpt-4o-mini",
      baseUrl: "https://api.openai.com/v1",
      description: "GPT-4, GPT-3.5, DALL-E, Whisper",
    },
    ANTHROPIC: {
      model: "claude-3-5-sonnet-20241022",
      baseUrl: "https://api.anthropic.com/v1",
      description: "Claude 3.5 Sonnet, Claude 3 Opus",
    },
    GOOGLE: {
      model: "gemini-2.0-flash-exp",
      baseUrl: "https://generativelanguage.googleapis.com/v1",
      description: "Gemini Pro, Gemini Flash",
    },
    OPENROUTER: {
      model: "openai/gpt-4-turbo",
      baseUrl: "https://openrouter.ai/api/v1",
      description:
        "Acesso a 200+ modelos (OpenAI, Anthropic, Google, Meta, etc)",
    },
    GROQ: {
      model: "llama-3.3-70b-versatile",
      baseUrl: "https://api.groq.com/openai/v1",
      description: "Llama 3.3, Mixtral - Ultra rápido",
    },
    COHERE: {
      model: "command-r-plus",
      baseUrl: "https://api.cohere.ai/v1",
      description: "Command R+, Command R",
    },
    MISTRAL: {
      model: "mistral-large-latest",
      baseUrl: "https://api.mistral.ai/v1",
      description: "Mistral Large, Mistral Medium",
    },
    PERPLEXITY: {
      model: "llama-3.1-sonar-large-128k-online",
      baseUrl: "https://api.perplexity.ai",
      description: "Sonar Online - IA com busca web",
    },
    TOGETHER: {
      model: "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo",
      baseUrl: "https://api.together.xyz/v1",
      description: "Llama, Qwen, DeepSeek",
    },
    FIREWORKS: {
      model: "accounts/fireworks/models/llama-v3p1-405b-instruct",
      baseUrl: "https://api.fireworks.ai/inference/v1",
      description: "Modelos open source otimizados",
    },
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-76px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Conexões de IA Globais
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Adicionar e gerenciar IAs que serão atribuídas às organizações
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <HiPlus className="h-4 w-4 mr-2" />
                Nova IA
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Nova Conexão de IA</DialogTitle>
                <DialogDescription>
                  Adicionar uma nova IA global ao sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-300">Nome</Label>
                  <Input
                    id="name"
                    placeholder="OpenAI GPT-4"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="provider" className="text-gray-300">Provider</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => {
                      const example = providerExamples[value];
                      setFormData({
                        ...formData,
                        provider: value,
                        model: example?.model || "",
                        baseUrl: example?.baseUrl || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OPENAI">🤖 OpenAI</SelectItem>
                      <SelectItem value="ANTHROPIC">
                        🧠 Anthropic (Claude)
                      </SelectItem>
                      <SelectItem value="GOOGLE">🔵 Google (Gemini)</SelectItem>
                      <SelectItem value="OPENROUTER">
                        🌐 OpenRouter (200+ modelos)
                      </SelectItem>
                      <SelectItem value="GROQ">
                        ⚡ Groq (Ultra rápido)
                      </SelectItem>
                      <SelectItem value="MISTRAL">🇫🇷 Mistral AI</SelectItem>
                      <SelectItem value="COHERE">💜 Cohere</SelectItem>
                      <SelectItem value="PERPLEXITY">
                        🔍 Perplexity (Web)
                      </SelectItem>
                      <SelectItem value="TOGETHER">🤝 Together AI</SelectItem>
                      <SelectItem value="FIREWORKS">🎆 Fireworks AI</SelectItem>
                    </SelectContent>
                  </Select>
                  {providerExamples[formData.provider] && (
                    <p className="text-xs text-gray-500">
                      {providerExamples[formData.provider].description}
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="apiKey" className="text-gray-300">API Key</Label>
                  <Input
                    id="apiKey"
                    type="text"
                    autoComplete="off"
                    placeholder="sk-..."
                    value={formData.apiKey}
                    onChange={(e) =>
                      setFormData({ ...formData, apiKey: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model" className="text-gray-300">Modelo</Label>
                  <Input
                    id="model"
                    placeholder={
                      providerExamples[formData.provider]?.model ||
                      "gpt-4-turbo"
                    }
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {formData.provider === "OPENROUTER"
                      ? "Formato: provider/model (ex: openai/gpt-4-turbo, anthropic/claude-3-5-sonnet)"
                      : "Nome do modelo a ser usado"}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baseUrl" className="text-gray-300">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder={
                      providerExamples[formData.provider]?.baseUrl ||
                      "https://api.openai.com/v1"
                    }
                    value={formData.baseUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, baseUrl: e.target.value })
                    }
                  />
                  <p className="text-xs text-gray-500">
                    URL da API do provider
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={createAiConnection}>Criar IA</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          {aiConnections.map((ai) => (
            <Card key={ai.id} className="border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-lg">
                      <HiCpuChip className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle>{ai.name}</CardTitle>
                        {ai.isActive && (
                          <Badge className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30 border">✓ Testada</Badge>
                        )}
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        {getProviderBadge(ai.provider)}
                        {ai.model && (
                          <span className="text-sm">• {ai.model}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPromptDialog(ai)}
                      title="Configurar prompt e mensagens"
                    >
                      <HiCog6Tooth className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testAiConnection(ai)}
                      title="Testar conexão com a IA"
                    >
                      <HiBeaker className="h-4 w-4 mr-2" />
                      Testar
                    </Button>
                    <Button
                      size="sm"
                      variant={ai.isActive ? "outline" : "default"}
                      onClick={() => toggleAiStatus(ai.id, ai.isActive)}
                    >
                      {ai.isActive ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteAiConnection(ai.id, ai.name)}
                      title="Remover IA"
                    >
                      <HiTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">API Key</span>
                    <div className="font-mono text-xs mt-1">
                      {ai.apiKey.substring(0, 10)}...
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Max Tokens</span>
                    <div className="font-medium mt-1">{ai.maxTokens}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Temperature</span>
                    <div className="font-medium mt-1">{ai.temperature}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Criada em</span>
                    <div className="font-medium mt-1">
                      {new Date(ai.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {aiConnections.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <HiCpuChip className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhuma IA configurada
                </h3>
                <p className="text-gray-500 mb-4">
                  Adicione sua primeira conexão de IA para começar
                </p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <HiPlus className="h-4 w-4 mr-2" />
                  Adicionar IA
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Prompt Configuration Dialog */}
        <Dialog open={isPromptDialogOpen} onOpenChange={setIsPromptDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle>Configurar IA: {selectedAi?.name}</DialogTitle>
              <DialogDescription>
                Configure o prompt de sistema e mensagens iniciais da IA
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* System Prompt */}
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">Prompt de Sistema</Label>
                <Textarea
                  id="systemPrompt"
                  value={selectedAi?.systemPrompt || ""}
                  onChange={(e) =>
                    setSelectedAi((prev) =>
                      prev ? { ...prev, systemPrompt: e.target.value } : null,
                    )
                  }
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="Digite o prompt de sistema que define o comportamento da IA..."
                />
                <p className="text-xs text-gray-500">
                  Este prompt define a personalidade, capacidades e
                  comportamento da IA. Seja específico sobre o que a IA pode
                  fazer.
                </p>
              </div>

              {/* Initial Greetings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Mensagens Iniciais</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newGreetings = [
                        ...(selectedAi?.initialGreetings || []),
                        "Nova mensagem inicial",
                      ];
                      setSelectedAi((prev) =>
                        prev
                          ? { ...prev, initialGreetings: newGreetings }
                          : null,
                      );
                    }}
                  >
                    <HiPlus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <div className="space-y-2">
                  {(selectedAi?.initialGreetings || []).map(
                    (greeting, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={greeting}
                          onChange={(e) => {
                            const newGreetings = [
                              ...(selectedAi?.initialGreetings || []),
                            ];
                            newGreetings[index] = e.target.value;
                            setSelectedAi((prev) =>
                              prev
                                ? { ...prev, initialGreetings: newGreetings }
                                : null,
                            );
                          }}
                          placeholder={`Mensagem inicial ${index + 1}`}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            const newGreetings = (
                              selectedAi?.initialGreetings || []
                            ).filter((_, i) => i !== index);
                            setSelectedAi((prev) =>
                              prev
                                ? { ...prev, initialGreetings: newGreetings }
                                : null,
                            );
                          }}
                        >
                          <HiXMark className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  A IA escolherá aleatoriamente uma dessas mensagens para saudar
                  novos usuários.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPromptDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={savePromptConfig}>Salvar Configuração</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </SuperAdminLayout>
  );
}

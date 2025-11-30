import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { IconSend, IconPlus, IconMenu2, IconX } from "@tabler/icons-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useRealtimeCommands } from "@/hooks/useRealtimeCommands";

// ============================================
// TYPES
// ============================================
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

interface ExtensionStatus {
  connected: boolean;
  deviceId: string | null;
  lastCheck: number;
}

interface PendingCommand {
  id: string;
  command: string;
  messageId: string;
  timestamp: number;
}

// ============================================
// CHAT PAGE - VERSÃO SIMPLES E FUNCIONAL
// ============================================
export default function ChatPageNovo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Estados básicos
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [aiStatus, setAiStatus] = useState<
    "thinking" | "searching" | "navigating" | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    connected: false,
    deviceId: null,
    lastCheck: 0,
  });
  const [pendingCommands, setPendingCommands] = useState<PendingCommand[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ============================================
  // REALTIME - Substituir polling por event-driven
  // ============================================
  const { isConnected: realtimeConnected } = useRealtimeCommands({
    userId: user?.id,
    enabled: !!user?.id,
    onCommandCompleted: async (command) => {
      console.log("✅ Realtime - Comando completado:", command);

      // Encontrar comando pendente
      const pending = pendingCommands.find((p) => p.id === command.id);
      if (!pending) return;

      // Processar resultado com IA
      await processCommandResult(command, pending.messageId);

      // Remover da lista de pendentes
      setPendingCommands((prev) => prev.filter((p) => p.id !== command.id));
    },
    onCommandFailed: async (command) => {
      console.error("❌ Realtime - Comando falhou:", command);

      // Remover da lista de pendentes
      setPendingCommands((prev) => prev.filter((p) => p.id !== command.id));

      toast({
        title: "Comando falhou",
        description: command.error || "Erro ao executar comando na extensão",
        variant: "destructive",
      });
    },
  });

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login-v2", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ============================================
  // CARREGAR CONVERSAS
  // ============================================
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      setIsLoading(true);
      try {
        // Buscar conversas
        const { data: convs, error: convsError } = await supabase
          .from("ChatConversation")
          .select("id, title, createdAt")
          .eq("userId", user.id)
          .order("createdAt", { ascending: false });

        if (convsError) throw convsError;

        if (!convs || convs.length === 0) {
          // Criar primeira conversa automaticamente
          const firstConv = {
            id: crypto.randomUUID(),
            userId: user.id,
            title: `Conversa ${new Date().toLocaleDateString()}`,
            createdAt: new Date().toISOString(),
          };

          const { error: insertError } = await supabase
            .from("ChatConversation")
            .insert(firstConv);

          if (!insertError) {
            setConversations([
              {
                id: firstConv.id,
                title: firstConv.title,
                messages: [],
              },
            ]);
            setActiveConversationId(firstConv.id);
          }
          return;
        }

        // Buscar mensagens para cada conversa
        const conversationsWithMessages = await Promise.all(
          convs.map(async (conv) => {
            const { data: msgs } = await supabase
              .from("ChatMessage")
              .select("id, role, content, createdAt")
              .eq("conversationId", conv.id)
              .order("createdAt", { ascending: true });

            return {
              id: conv.id,
              title: conv.title,
              messages: (msgs || []).map((m) => ({
                id: m.id,
                role: m.role.toLowerCase() as "user" | "assistant",
                content: m.content,
                createdAt: m.createdAt,
              })),
            };
          }),
        );

        setConversations(conversationsWithMessages);
        if (!activeConversationId && conversationsWithMessages.length > 0) {
          setActiveConversationId(conversationsWithMessages[0].id);
        }
      } catch (error: any) {
        console.error("Erro ao carregar conversas:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as conversas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  // ============================================
  // VERIFICAR EXTENSÃO - SISTEMA ROBUSTO
  // ============================================
  useEffect(() => {
    if (!user) return;

    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    const checkExtension = async () => {
      try {
        const { data, error } = await supabase
          .from("extension_devices")
          .select("id, device_id, status, last_seen")
          .eq("user_id", user.id)
          .eq("status", "online")
          .order("last_seen", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("❌ Erro ao verificar extensão:", error);
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_FAILURES) {
            console.warn(
              `⚠️ ${MAX_FAILURES} falhas consecutivas, marcando como offline`,
            );
            setExtensionStatus({
              connected: false,
              deviceId: null,
              lastCheck: Date.now(),
            });
          }
          return;
        }

        const now = Date.now();
        const lastSeen = data ? new Date(data.last_seen).getTime() : 0;
        const timeDiff = now - lastSeen;
        const isConnected = !!data && timeDiff < 30000; // 30s timeout (2x heartbeat de 15s)

        console.log(`🔍 Extensão check:`, {
          hasData: !!data,
          timeDiff: `${Math.round(timeDiff / 1000)}s`,
          isConnected,
          deviceId: data?.device_id?.substring(0, 8) + "...",
        });

        setExtensionStatus({
          connected: isConnected,
          deviceId: data?.device_id || null,
          lastCheck: now,
        });

        // Reset contador se sucesso
        if (!error) consecutiveFailures = 0;
      } catch (error) {
        console.error("❌ Exception ao verificar extensão:", error);
        consecutiveFailures++;
      }
    };

    // Verificar imediatamente
    checkExtension();

    // Verificar a cada 5 segundos (polling agressivo para responsividade)
    const interval = setInterval(checkExtension, 5000);

    return () => clearInterval(interval);
  }, [user]);

  // ============================================
  // SCROLL TO BOTTOM
  // ============================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeConversationId]);

  // ============================================
  // CRIAR NOVA CONVERSA
  // ============================================
  const createNewConversation = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    try {
      const now = new Date().toISOString();
      const newConv = {
        id: crypto.randomUUID(),
        userId: user.id,
        title: `Conversa ${new Date().toLocaleDateString()}`,
        createdAt: now,
      };

      console.log("🆕 Criando nova conversa:", newConv);

      const { data, error } = await supabase
        .from("ChatConversation")
        .insert(newConv)
        .select()
        .single();

      if (error) {
        console.error("❌ Erro Supabase:", error);
        throw error;
      }

      console.log("✅ Conversa criada:", data);

      const newConversation: Conversation = {
        id: newConv.id,
        title: newConv.title,
        messages: [],
      };

      setConversations([newConversation, ...conversations]);
      setActiveConversationId(newConv.id);

      // IMPORTANTE: Limpar mensagens do estado atual
      setMessages([]);
      setIsLoadingMessages(false);

      // Scroll para o topo
      setTimeout(() => {
        const chatContainer = document.querySelector(".overflow-y-auto");
        if (chatContainer) {
          chatContainer.scrollTop = 0;
        }
      }, 100);

      toast({
        title: "Nova conversa criada!",
      });
    } catch (error: any) {
      console.error("❌ Erro ao criar conversa:", error);
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar nova conversa",
        variant: "destructive",
      });
    }
  };

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================
  // ============================================
  // ENVIAR COMANDO PARA EXTENSÃO
  // ============================================
  const sendBrowserCommand = async (
    commandType: string,
    params: any,
    messageId: string,
  ) => {
    if (!extensionStatus.connected || !extensionStatus.deviceId) {
      console.warn("⚠️ Extensão não conectada, comando não enviado");
      return null;
    }

    try {
      const commandId = crypto.randomUUID();

      console.log("📤 Enviando comando para extensão:", {
        id: commandId,
        command: commandType,
        params,
        deviceId: extensionStatus.deviceId,
      });

      const { error } = await supabase.from("ExtensionCommand").insert({
        id: commandId,
        deviceId: extensionStatus.deviceId,
        userId: user?.id,
        command: commandType,
        params: params,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Erro ao inserir comando:", error);
        return null;
      }

      console.log("✅ Comando inserido com sucesso:", commandId);

      // Adicionar comando à lista de pendentes
      setPendingCommands((prev) => [
        ...prev,
        {
          id: commandId,
          command: commandType,
          messageId: messageId,
          timestamp: Date.now(),
        },
      ]);

      return commandId;
    } catch (error) {
      console.error("❌ Erro ao enviar comando:", error);
      return null;
    }
  };

  // ============================================
  // PROCESSAR RESULTADO COM IA
  // ============================================
  const processCommandResult = async (command: any, messageId: string) => {
    if (!user || !activeConversationId) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      // Criar prompt para IA processar resultado
      let resultPrompt = "";

      if (command.status === "COMPLETED" && command.result) {
        const result = command.result.result || command.result;

        switch (command.command) {
          case "LIST_TABS":
            const tabs = result.tabs || [];
            resultPrompt = `RESULTADO: Encontrei ${tabs.length} abas abertas:\n\n${tabs.map((t: any, i: number) => `${i + 1}. ${t.title}\n   URL: ${t.url}`).join("\n\n")}\n\nPor favor, apresente esta lista de forma organizada e amigável para o usuário.`;
            break;

          case "GET_PAGE_INFO":
            resultPrompt = `RESULTADO: Informações da página:\n- Título: ${result.title}\n- URL: ${result.url}\n- Domínio: ${result.domain}\n\nResumo do conteúdo:\n${result.bodyText?.substring(0, 500) || "Sem conteúdo"}\n\nPor favor, apresente essas informações de forma clara para o usuário.`;
            break;

          case "NAVIGATE":
            resultPrompt = `RESULTADO: Nova aba aberta com sucesso em: ${result.navigated}\n\nConfirme ao usuário que a ação foi concluída.`;
            break;

          case "CLICK_ELEMENT":
            resultPrompt = `RESULTADO: Clique executado com sucesso no elemento: ${result.clicked}\n\nConfirme ao usuário que a ação foi concluída.`;
            break;

          case "TYPE_TEXT":
            resultPrompt = `RESULTADO: Texto digitado com sucesso: "${result.value}"\n\nConfirme ao usuário que a ação foi concluída.`;
            break;

          case "READ_TEXT":
            resultPrompt = `RESULTADO: Texto lido do elemento:\n\n${result.text}\n\nPor favor, apresente este conteúdo de forma clara para o usuário.`;
            break;

          default:
            resultPrompt = `RESULTADO da ação ${command.command}:\n\n${JSON.stringify(result, null, 2)}\n\nPor favor, apresente este resultado de forma clara para o usuário.`;
        }
      } else if (command.status === "FAILED") {
        resultPrompt = `ERRO: A ação ${command.command} falhou com o seguinte erro: ${command.error}\n\nPor favor, explique o problema ao usuário de forma amigável e sugira uma solução.`;
      }

      // Enviar para IA processar
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-enhanced`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: resultPrompt,
            conversationId: activeConversationId,
            extensionConnected: extensionStatus.connected,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const aiResponse = await response.json();

      // Adicionar resposta da IA no chat
      const newMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content: aiResponse.response,
        createdAt: new Date().toISOString(),
      };

      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
              ...conv,
              messages: [...conv.messages, newMessage],
            }
            : conv,
        ),
      );

      console.log("✅ Resultado processado pela IA e adicionado ao chat");
    } catch (error) {
      console.error("❌ Erro ao processar resultado:", error);
    }
  };

  // ============================================
  // ENVIAR MENSAGEM
  // ============================================
  const sendMessage = async () => {
    if (!input.trim() || !activeConversationId || !user || isSending) return;

    const userMessage = input.trim();
    const tempUserMsgId = `temp-user-${Date.now()}`;
    const tempAiMsgId = `temp-ai-${Date.now()}`;

    setInput("");
    setIsSending(true);

    // Determinar status da IA baseado na mensagem
    const msgLower = userMessage.toLowerCase();
    if (
      msgLower.includes("pesquis") ||
      msgLower.includes("busca") ||
      msgLower.includes("procur")
    ) {
      setAiStatus("searching");
    } else if (
      msgLower.includes("abr") ||
      msgLower.includes("naveg") ||
      msgLower.includes("acess")
    ) {
      setAiStatus("navigating");
    } else {
      setAiStatus("thinking");
    }

    try {
      // 1. Adicionar mensagem do usuário na UI imediatamente (otimistic update)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
              ...conv,
              messages: [
                ...conv.messages,
                {
                  id: tempUserMsgId,
                  role: "user",
                  content: userMessage,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
            : conv,
        ),
      );

      // 2. Chamar Edge Function (ela vai salvar AMBAS mensagens)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error("Sem sessão");

      // LOG DE DEBUG
      console.log("🚀 Enviando mensagem para IA:", {
        message: userMessage,
        extensionConnected: extensionStatus.connected,
        deviceId: extensionStatus.deviceId,
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-enhanced`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: userMessage,
            conversationId: activeConversationId,
            extensionConnected: extensionStatus.connected,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // ✅ Limpar qualquer JSON residual da resposta antes de exibir
      let cleanResponse = data.response || "";

      // Remover blocos JSON completos (```json ... ```)
      cleanResponse = cleanResponse.replace(/```json\s*[\s\S]*?\s*```/g, "");

      // Remover JSON soltos que possam ter sobrado
      cleanResponse = cleanResponse.replace(/\{[\s\S]*?"type"[\s\S]*?\}/g, "");

      // Remover múltiplos espaços/quebras de linha
      cleanResponse = cleanResponse.replace(/\n{3,}/g, "\n\n").trim();

      // Se a resposta ficou vazia após limpeza, usar mensagem padrão
      if (!cleanResponse) {
        cleanResponse = "Executando ação...";
      }

      // 3. Atualizar UI com IDs reais do banco (substituir temporários)
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
              ...conv,
              messages: [
                // Remover temporários e adicionar as mensagens reais do banco
                ...conv.messages.filter((m) => !m.id.startsWith("temp-")),
                {
                  id: data.userMessageId || tempUserMsgId,
                  role: "user",
                  content: userMessage,
                  createdAt: new Date().toISOString(),
                },
                {
                  id: data.aiMessageId || tempAiMsgId,
                  role: "assistant",
                  content: cleanResponse,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
            : conv,
        ),
      );
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);

      // Remover mensagem temporária em caso de erro
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
              ...conv,
              messages: conv.messages.filter(
                (m) => !m.id.startsWith("temp-"),
              ),
            }
            : conv,
        ),
      );

      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      setAiStatus(null);
    }
  };

  // ============================================
  // DELETAR CONVERSA
  // ============================================
  const deleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from("ChatConversation")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(conversations[0]?.id || null);
      }

      toast({
        title: "Conversa deletada",
      });
    } catch (error: any) {
      console.error("Erro ao deletar:", error);
      toast({
        title: "Erro ao deletar",
        variant: "destructive",
      });
    }
  };

  // ============================================
  // CONVERSA ATIVA
  // ============================================
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  // ============================================
  // RENDER
  // ============================================
  return (
    // Card responsivo com altura ajustada para o viewport menos header e padding
    <div className="flex w-full h-[calc(100vh-10rem)] bg-gray-950 text-white rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`${sidebarOpen ? "translate-x-0 w-72" : "-translate-x-full w-0 md:translate-x-0 md:w-0"
          } absolute md:relative z-30 h-full transition-all duration-300 border-r border-gray-800 flex flex-col bg-gray-900 flex-shrink-0`}
      >
        {sidebarOpen && (
          <>
            {/* Header Sidebar */}
            <div className="p-4 border-b border-gray-800">
              <button
                onClick={createNewConversation}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                <IconPlus className="w-5 h-5" />
                Nova Conversa
              </button>
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto p-2">
              {isLoading ? (
                <div className="text-center text-gray-500 py-4">
                  Carregando...
                </div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${activeConversationId === conv.id
                      ? "bg-gray-800 border border-blue-600"
                      : "bg-gray-900 hover:bg-gray-800"
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm truncate">{conv.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <IconX className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {conv.messages.length} mensagens
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* MAIN CHAT */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-4 justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-800 rounded-lg"
          >
            <IconMenu2 className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">
            {activeConversation?.title || "Chat"}
          </h1>

          {/* Status da Extensão */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${extensionStatus.connected
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : "bg-gray-800 text-gray-400 border border-gray-700"
                }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${extensionStatus.connected ? "bg-green-400" : "bg-gray-500"
                  }`}
              />
              <span>
                {extensionStatus.connected
                  ? "Extensão Ativa"
                  : "Extensão Offline"}
              </span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConversation ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-xl mb-2">Nenhuma conversa selecionada</p>
                <p className="text-sm">Crie uma nova conversa para começar</p>

                {/* Aviso sobre extensão */}
                {!extensionStatus.connected && (
                  <div className="mt-8 p-4 bg-yellow-600/10 border border-yellow-600/30 rounded-lg max-w-md mx-auto">
                    <p className="text-yellow-400 text-sm mb-2 font-medium">
                      ⚠️ Extensão do navegador offline
                    </p>
                    <p className="text-gray-400 text-xs">
                      Para usar automação de navegador, instale e ative a
                      extensão SyncAds AI
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : activeConversation.messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-xl mb-2">Nova conversa</p>
                <p className="text-sm">Envie uma mensagem para começar</p>

                {/* Dica sobre extensão */}
                {extensionStatus.connected && (
                  <div className="mt-8 p-4 bg-green-600/10 border border-green-600/30 rounded-lg max-w-md mx-auto">
                    <p className="text-green-400 text-sm mb-2 font-medium">
                      ✨ Extensão conectada!
                    </p>
                    <p className="text-gray-400 text-xs">
                      Agora posso controlar seu navegador. Experimente: "Abra o
                      Facebook Ads"
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {activeConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${message.role === "user" ? "bg-blue-600" : "bg-gray-800"
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {/* Typing indicator quando IA está processando */}
              {aiStatus && <TypingIndicator status={aiStatus} />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              onPaste={(e) => {
                // FORÇA paste a funcionar
                e.stopPropagation();
                const pastedText = e.clipboardData.getData("text");
                if (pastedText) {
                  setInput(input + pastedText);
                }
              }}
              placeholder="Digite sua mensagem..."
              disabled={isSending || !activeConversationId}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 focus:outline-none focus:border-blue-600 disabled:opacity-50"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isSending || !activeConversationId}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
            >
              {isSending ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <IconSend className="w-5 h-5" />
                  Enviar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

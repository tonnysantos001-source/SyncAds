import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconSend,
  IconPlus,
  IconMenu2,
  IconX,
  IconBrandOpenai,
  IconUserCircle,
  IconTrash,
  IconSparkles,
  IconCircleCheck,
  IconAlertCircle,
} from "@tabler/icons-react";
import Textarea from "react-textarea-autosize";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import chatService from "@/lib/api/chatService";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

const MAX_CHARS = 2000;

const USER_SYSTEM_PROMPT = `Você é um assistente de IA especializado em marketing digital para a plataforma SyncAds.

Você pode ajudar com:
- Estratégias de marketing digital
- Criação de campanhas
- Análise de público-alvo
- Otimização de conversões
- Dicas de anúncios
- Análise de métricas

Quando o usuário mencionar navegação web ou automação, informe que a extensão do navegador está disponível.

Responda sempre em português do Brasil de forma clara, objetiva e prática.`;

interface ExtensionStatus {
  connected: boolean;
  deviceId: string | null;
  lastCheck: number;
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [extensionStatus, setExtensionStatus] = useState<ExtensionStatus>({
    connected: false,
    deviceId: null,
    lastCheck: 0,
  });

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigate = useNavigate();

  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  const setActiveConversationId = useChatStore(
    (state) => state.setActiveConversationId,
  );
  const isAssistantTyping = useChatStore((state) => state.isAssistantTyping);
  const setAssistantTyping = useChatStore((state) => state.setAssistantTyping);
  const addMessage = useChatStore((state) => state.addMessage);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  // Auth check
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login-v2", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [activeConversation?.messages, isAssistantTyping]);

  // Check extension status
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
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_FAILURES) {
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
        const isConnected = !!data && timeDiff < 30000;

        setExtensionStatus({
          connected: isConnected,
          deviceId: data?.device_id || null,
          lastCheck: now,
        });

        if (!error) consecutiveFailures = 0;
      } catch (error) {
        consecutiveFailures++;
      }
    };

    checkExtension();
    const interval = setInterval(checkExtension, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Initialize chat
  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      try {
        setIsLoadingConversations(true);
        await useChatStore.getState().loadConversations(user.id);

        const { data: existingConversations, error: queryError } =
          await supabase
            .from("ChatConversation")
            .select("id")
            .eq("userId", user.id)
            .limit(1);

        if (queryError) throw queryError;

        if (!existingConversations || existingConversations.length === 0) {
          await useChatStore
            .getState()
            .createNewConversation(
              user.id,
              `Conversa ${new Date().toLocaleDateString()}`,
            );
        }
      } catch (error) {
        console.error("Erro ao inicializar chat:", error);
        toast({
          title: "Erro ao carregar chat",
          description: "Tente recarregar a página.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };

    initChat();
  }, [user, toast]);

  // Send message
  const handleSend = useCallback(async () => {
    if (
      input.trim() === "" ||
      !activeConversationId ||
      input.length > MAX_CHARS
    ) {
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setAssistantTyping(true);

    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      role: "user" as const,
      content: userMessage,
      timestamp: new Date().toISOString(),
    };

    addMessage(activeConversationId, tempUserMessage);

    try {
      const response = await chatService.sendMessage(
        activeConversationId,
        userMessage,
      );

      if (response.reply) {
        const aiMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant" as const,
          content: response.reply,
          timestamp: new Date().toISOString(),
        };
        addMessage(activeConversationId, aiMessage);
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setAssistantTyping(false);
    }
  }, [input, activeConversationId, addMessage, setAssistantTyping, toast]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // New conversation
  const handleNewConversation = useCallback(async () => {
    if (!user) return;

    try {
      await useChatStore
        .getState()
        .createNewConversation(
          user.id,
          `Conversa ${new Date().toLocaleDateString()}`,
        );
      toast({
        title: "✨ Nova conversa criada",
      });
    } catch (error) {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro ao criar conversa",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  // Delete conversation
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      if (!confirm("Tem certeza que deseja deletar esta conversa?")) return;

      try {
        const { error } = await supabase
          .from("ChatConversation")
          .delete()
          .eq("id", id);

        if (error) throw error;

        await useChatStore.getState().loadConversations(user!.id);

        toast({
          title: "🗑️ Conversa deletada",
        });
      } catch (error) {
        console.error("Erro ao deletar:", error);
        toast({
          title: "Erro ao deletar",
          variant: "destructive",
        });
      }
    },
    [user, toast],
  );

  return (
    <div className="flex h-full w-full max-h-full overflow-hidden bg-gradient-to-br from-gray-900 via-gray-850 to-gray-900">
      {/* SIDEBAR */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-80 bg-gradient-to-b from-[#12121A] to-[#1A1A2E] border-r border-gray-700/50 flex flex-col shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <IconSparkles className="w-5 h-5 text-blue-400" />
                  Conversas
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-all"
                >
                  <IconX className="w-5 h-5" />
                </motion.button>
              </div>
              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 0 25px rgba(59, 130, 246, 0.5)",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleNewConversation}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2 font-medium transition-all shadow-lg shadow-blue-500/30"
              >
                <IconPlus className="w-5 h-5" />
                Nova Conversa
              </motion.button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {conversations.map((conv) => (
                <motion.div
                  key={conv.id}
                  whileHover={{ scale: 1.02, x: 4 }}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all group relative",
                    activeConversationId === conv.id
                      ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 shadow-lg shadow-blue-500/20"
                      : "bg-gray-800/30 hover:bg-gray-800/50 border border-transparent",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {conv.messages && conv.messages.length > 0
                          ? conv.messages[
                              conv.messages.length - 1
                            ].content.substring(0, 35) + "..."
                          : "Nova conversa"}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                    >
                      <IconTrash className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#12121A] to-[#1A1A2E] border-b border-gray-700/50 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-all"
              >
                <IconMenu2 className="w-6 h-6" />
              </motion.button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <IconSparkles className="w-6 h-6 text-blue-400" />
                Chat IA - Marketing
              </h1>
              <p className="text-sm text-gray-400">
                Assistente especializado em marketing digital
              </p>
            </div>
          </div>

          {/* Extension Status */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all",
              extensionStatus.connected
                ? "bg-green-600/20 text-green-400 border border-green-600/30"
                : "bg-gray-800/50 text-gray-400 border border-gray-700/30",
            )}
          >
            {extensionStatus.connected ? (
              <IconCircleCheck className="w-4 h-4" />
            ) : (
              <IconAlertCircle className="w-4 h-4" />
            )}
            <span>
              {extensionStatus.connected
                ? "Extensão Ativa"
                : "Extensão Offline"}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4 bg-[#0A0A0F]">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full mx-auto mb-4"
                />
                <p className="text-gray-400 text-lg font-medium">
                  Carregando conversas...
                </p>
              </div>
            </div>
          ) : activeConversation && activeConversation.messages ? (
            <>
              {activeConversation.messages.map((message: any) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl p-4 backdrop-blur-sm",
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/30"
                        : "bg-gray-800/50 text-gray-200 border border-gray-700/30",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {message.role === "assistant" && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          whileHover={{ rotate: 10, scale: 1.1 }}
                          className="flex-shrink-0"
                        >
                          <IconBrandOpenai className="w-6 h-6 text-blue-400" />
                        </motion.div>
                      )}
                      {message.role === "user" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.1 }}
                          className="flex-shrink-0"
                        >
                          <IconUserCircle className="w-6 h-6 text-white" />
                        </motion.div>
                      )}
                      <div className="flex-1 whitespace-pre-wrap break-words">
                        {message.content}
                      </div>
                    </div>
                    <div
                      className={cn(
                        "text-xs mt-2 ml-9",
                        message.role === "user"
                          ? "text-white/60"
                          : "text-gray-500",
                      )}
                    >
                      {message.timestamp
                        ? new Date(message.timestamp).toLocaleTimeString(
                            "pt-BR",
                          )
                        : ""}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isAssistantTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[80%] bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
                    <div className="flex items-center gap-3">
                      <IconBrandOpenai className="w-6 h-6 text-blue-400 animate-pulse" />
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0,
                          }}
                          className="w-2 h-2 bg-blue-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.2,
                          }}
                          className="w-2 h-2 bg-blue-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: 0.4,
                          }}
                          className="w-2 h-2 bg-blue-400 rounded-full"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <IconSparkles className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <p className="text-gray-400 text-xl mb-2">
                  Olá! 👋 Como posso ajudar?
                </p>
                <p className="text-gray-600 text-sm">
                  Estou aqui para ajudar com marketing digital e estratégias
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-700/50 p-4 bg-gradient-to-r from-[#12121A] to-[#1A1A2E] flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                maxLength={MAX_CHARS}
                disabled={isAssistantTyping}
                className="w-full bg-gray-800/50 border border-gray-700/50 rounded-2xl px-6 py-4 pr-24 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                minRows={1}
                maxRows={6}
              />
              <div className="absolute right-2 bottom-2 flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs font-medium px-2 py-1 rounded",
                    input.length > MAX_CHARS * 0.9
                      ? "text-red-400 bg-red-500/20"
                      : "text-gray-500 bg-gray-800/50",
                  )}
                >
                  {input.length}/{MAX_CHARS}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={
                    input.trim() === "" ||
                    input.length > MAX_CHARS ||
                    isAssistantTyping
                  }
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl p-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
                >
                  <IconSend className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {!extensionStatus.connected && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-xs text-yellow-400/80 flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded-lg border border-yellow-500/20"
              >
                <IconAlertCircle className="w-4 h-4" />
                <span>
                  Extensão offline - Recursos de automação indisponíveis
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

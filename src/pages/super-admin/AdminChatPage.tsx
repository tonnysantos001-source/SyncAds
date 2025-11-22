import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import {
  IconSend,
  IconPlus,
  IconMenu2,
  IconX,
  IconMessages,
  IconBrandOpenai,
  IconUserCircle,
  IconTrash,
  IconShieldCheck,
} from "@tabler/icons-react";
import Textarea from "react-textarea-autosize";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import chatService from "@/lib/api/chatService";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import SuperAdminLayout from "@/components/layout/SuperAdminLayout";

const MAX_CHARS = 2000; // Admin tem limite maior

const ADMIN_SYSTEM_PROMPT = `Você é um assistente de IA especializado para administradores do sistema SyncAds.

Você tem acesso a informações privilegiadas e pode ajudar com:
- Análise de métricas do sistema
- Gerenciamento de usuários
- Configurações avançadas
- Troubleshooting de problemas
- Análise de logs e performance
- Estatísticas gerais da plataforma

Responda de forma clara, técnica e objetiva. Use dados e estatísticas quando relevante.`;

export default function AdminChatPage() {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

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

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login-v2", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [activeConversation?.messages, isAssistantTyping]);

  useEffect(() => {
    const initChat = async () => {
      if (!user) {
        console.log("⏳ [AdminChat] Aguardando usuário...");
        return;
      }

      try {
        console.log("🚀 [AdminChat] Iniciando chat para admin:", user.id);
        setIsLoadingConversations(true);

        console.log("📥 [AdminChat] Carregando conversações...");
        await useChatStore.getState().loadConversations(user.id);

        const { data: existingConversations, error: queryError } =
          await supabase
            .from("ChatConversation")
            .select("id")
            .eq("userId", user.id)
            .limit(1);

        if (queryError) {
          console.error(
            "❌ [AdminChat] Erro ao buscar conversações:",
            queryError,
          );
          throw queryError;
        }

        console.log(
          "✅ [AdminChat] Conversações encontradas:",
          existingConversations?.length || 0,
        );

        // Se não houver conversas, criar uma
        if (!existingConversations || existingConversations.length === 0) {
          console.log("➕ [AdminChat] Criando primeira conversação admin...");
          await useChatStore
            .getState()
            .createNewConversation(user.id, "Chat Admin");
          console.log("✅ [AdminChat] Primeira conversação criada");
        }

        console.log("✅ [AdminChat] Chat inicializado com sucesso");
      } catch (error) {
        console.error("❌ [AdminChat] Erro ao inicializar chat:", error);
        toast({
          title: "Erro ao carregar chat",
          description:
            "Não foi possível carregar as conversas. Tente recarregar a página.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingConversations(false);
      }
    };

    initChat();
  }, [user, toast]);

  const handleSend = useCallback(async () => {
    if (
      input.trim() === "" ||
      !activeConversationId ||
      input.length > MAX_CHARS
    ) {
      console.log("⚠️ [AdminChat] Validação falhou:", {
        inputEmpty: input.trim() === "",
        noConversation: !activeConversationId,
        tooLong: input.length > MAX_CHARS,
      });
      return;
    }

    console.log("📤 [AdminChat] Enviando mensagem:", {
      conversationId: activeConversationId,
      length: input.length,
    });

    const userMessage = input;

    if (user) {
      addMessage(user.id, activeConversationId, {
        id: `msg-${Date.now()}`,
        role: "user",
        content: userMessage,
      });
    }

    setInput("");
    setAssistantTyping(true);

    try {
      let fullResponse = "";

      const response = await chatService.sendMessage(
        userMessage,
        activeConversationId,
      );
      fullResponse = response;

      // Stream response
      if (user) {
        const messageId = `msg-${Date.now() + 1}`;

        // Adicionar mensagem inicial vazia
        addMessage(user.id, activeConversationId, {
          id: messageId,
          role: "assistant",
          content: "",
        });

        // Simular streaming
        const words = fullResponse.split(" ");
        let displayedContent = "";

        for (let i = 0; i < words.length; i += 2) {
          const chunk = words.slice(i, i + 2).join(" ");
          displayedContent += (i > 0 ? " " : "") + chunk;

          addMessage(user.id, activeConversationId, {
            id: messageId,
            role: "assistant",
            content: displayedContent,
          });

          await new Promise((resolve) => setTimeout(resolve, 20));
        }

        // Mensagem final completa
        addMessage(user.id, activeConversationId, {
          id: messageId,
          role: "assistant",
          content: fullResponse,
        });
      }
    } catch (error: any) {
      console.error("❌ [AdminChat] Erro ao enviar:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setAssistantTyping(false);
    }
  }, [
    activeConversationId,
    input,
    user,
    activeConversation?.messages,
    toast,
    addMessage,
    setAssistantTyping,
  ]);

  const handleNewConversation = async () => {
    try {
      if (!user) return;

      await useChatStore
        .getState()
        .createNewConversation(user.id, "Nova Conversa Admin");
      await useChatStore.getState().loadConversations(user.id);

      toast({
        title: "Nova conversa criada",
        description: "Uma nova conversa foi iniciada.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar nova conversa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await useChatStore.getState().deleteConversation(id);

      if (activeConversationId === id && user) {
        await useChatStore.getState().loadConversations(user.id);
      }

      toast({
        title: "Conversa deletada",
        description: "A conversa foi removida com sucesso.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro ao deletar conversa:", error);
    }
  };

  return (
    <SuperAdminLayout>
      <div className="h-[calc(100vh-4rem)] flex bg-[#0A0A0F] overflow-hidden">
        {/* SIDEBAR */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed md:relative w-80 h-full bg-[#12121A]/95 backdrop-blur-xl border-r border-gray-700/50 flex flex-col z-50 shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-700/50 bg-gradient-to-b from-gray-800/50 to-transparent">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <IconShieldCheck className="w-6 h-6 text-blue-400" />
                    Admin Chat
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
              <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
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
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#12121A] to-[#1A1A2E] border-b border-gray-700/50 px-6 py-4 flex items-center justify-between">
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
                  <IconShieldCheck className="w-6 h-6 text-blue-400" />
                  Admin AI Assistant
                </h1>
                <p className="text-sm text-gray-400">
                  Sistema especializado para administradores
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-[#0A0A0F] custom-scrollbar">
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
                  <p className="text-gray-600 text-sm mt-2">
                    Aguarde enquanto configuramos seu chat
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
                  <IconMessages className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhuma conversa selecionada</p>
                  <p className="text-gray-600 text-sm mt-2">
                    Crie uma nova conversa para começar
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-700/50 bg-[#12121A]/50 backdrop-blur-xl p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  onPaste={(e) => {
                    // FORÇA paste a funcionar
                    e.stopPropagation();
                    const pastedText = e.clipboardData.getData('text');
                    if (pastedText) {
                      setInput(input + pastedText);
                    }
                  }}
                  placeholder="Digite sua mensagem admin..."
                  maxRows={6}
                  className="w-full bg-gray-800/50 border-2 border-gray-700/50 focus:border-blue-500/50 rounded-2xl px-6 py-4 pr-14 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleSend}
                  disabled={
                    input.trim() === "" ||
                    isAssistantTyping ||
                    input.length > MAX_CHARS
                  }
                  className="absolute right-3 bottom-3 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/30"
                >
                  <IconSend className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="flex items-center justify-between mt-2 px-2">
                <p className="text-xs text-gray-500">
                  {input.length}/{MAX_CHARS} caracteres
                </p>
                <p className="text-xs text-gray-500">
                  Shift + Enter para nova linha
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import {
  IconSend,
  IconPaperclip,
  IconMicrophone,
  IconTrash,
  IconPlus,
  IconSparkles,
  IconMenu2,
  IconX,
  IconMessage2,
  IconMessages,
  IconBrandOpenai,
  IconUserCircle,
  IconCircleDotFilled,
} from "@tabler/icons-react";
import Textarea from "react-textarea-autosize";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useCampaignsStore } from "@/store/campaignsStore";
import { useSettingsStore } from "@/store/settingsStore";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { sendSecureMessage } from "@/lib/api/chat";
import { supabase } from "@/lib/supabase";
import {
  detectCampaignIntent,
  cleanCampaignBlockFromResponse,
  campaignSystemPrompt,
} from "@/lib/ai/campaignParser";
import {
  sarcasticSystemPrompt,
  getRandomGreeting,
} from "@/lib/ai/sarcasticPersonality";
import { IntegrationConnectionCard } from "@/components/chat/IntegrationConnectionCard";
import AiThinkingIndicator from "@/components/ai/AiThinkingIndicator";
import {
  adminSystemPrompt,
  cleanAdminBlocksFromResponse,
} from "@/lib/ai/adminTools";
import { integrationSystemPrompt } from "@/lib/integrations/integrationParsers";
import {
  integrationControlPrompt,
  cleanIntegrationBlocksFromResponse,
} from "@/lib/ai/integrationTools";
import { motion, AnimatePresence } from "framer-motion";
import {
  canSendAiMessage,
  incrementAiMessageUsage,
} from "@/lib/plans/planLimits";
import { AIUsageBadge } from "@/components/chat/AIUsageBadge";

const quickSuggestions = [
  "Criar campanha de Facebook Ads",
  "Analisar performance da última semana",
  "Sugerir otimizações",
];

const MAX_CHARS = 500;

const ChatPage: React.FC = () => {
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalAiConfig, setGlobalAiConfig] = useState<{
    systemPrompt: string;
    initialGreetings: string[];
  } | null>(null);

  const [currentTool, setCurrentTool] = useState<
    "web_search" | "web_scraping" | "python_exec" | null
  >(null);
  const [aiReasoning, setAiReasoning] = useState<string>("");
  const [aiSources, setAiSources] = useState<string[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  const addCampaign = useCampaignsStore((state) => state.addCampaign);

  const aiSystemPrompt = useSettingsStore((state) => state.aiSystemPrompt);
  const aiInitialGreetings = useSettingsStore(
    (state) => state.aiInitialGreetings,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId,
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [activeConversation?.messages, isAssistantTyping]);

  useEffect(() => {
    const loadGlobalAiConfig = async () => {
      if (!user) return;

      try {
        const { data: globalAi } = await supabase
          .from("GlobalAiConnection")
          .select("id, systemPrompt, initialGreetings")
          .eq("isActive", true)
          .limit(1)
          .single();

        if (globalAi) {
          setGlobalAiConfig({
            systemPrompt: globalAi.systemPrompt || aiSystemPrompt,
            initialGreetings: globalAi.initialGreetings || aiInitialGreetings,
          });
        }
      } catch (error) {
        console.error("Erro ao carregar IA Global:", error);
      }
    };

    loadGlobalAiConfig();
  }, [user?.id]);

  useEffect(() => {
    if (activeConversation && activeConversation.messages.length === 0) {
      const greeting = getRandomGreeting();
      setTimeout(() => {
        if (user) {
          addMessage(user.id, activeConversationId!, {
            id: `greeting-${Date.now()}`,
            role: "assistant",
            content: greeting,
          });
        }
      }, 500);
    }
  }, [activeConversationId, activeConversation?.messages.length]);

  const streamAssistantResponse = async (
    userId: string,
    conversationId: string,
    fullContent: string,
  ) => {
    const messageId = `msg-${Date.now() + 1}`;
    let displayedContent = "";

    addMessage(userId, conversationId, {
      id: messageId,
      role: "assistant",
      content: "",
    });

    const words = fullContent.split(" ");
    const chunkSize = 2;

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunk = words.slice(i, i + chunkSize).join(" ");
      displayedContent += (i > 0 ? " " : "") + chunk;

      addMessage(userId, conversationId, {
        id: messageId,
        role: "assistant",
        content: displayedContent,
      });

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    addMessage(userId, conversationId, {
      id: messageId,
      role: "assistant",
      content: fullContent,
    });
  };

  const handleSend = async () => {
    if (
      input.trim() === "" ||
      !activeConversationId ||
      input.length > MAX_CHARS
    )
      return;

    // Verificar limite de mensagens IA
    if (user) {
      const limitCheck = await canSendAiMessage(user.id);
      if (!limitCheck.allowed) {
        toast({
          title: "Limite de mensagens atingido",
          description:
            limitCheck.message + ". Faça upgrade do seu plano para continuar.",
          variant: "destructive",
        });
        return;
      }
    }

    const userMessage = input;

    const lowerMessage = userMessage.toLowerCase();
    if (
      lowerMessage.includes("pesquis") ||
      lowerMessage.includes("busca") ||
      lowerMessage.includes("google")
    ) {
      setCurrentTool("web_search");
      setAiReasoning(`Pesquisando: "${userMessage}"`);
      setAiSources(["Google Search", "Exa AI"]);
    } else {
      setCurrentTool(null);
      setAiReasoning("Processando...");
      setAiSources([]);
    }

    if (user) {
      addMessage(user.id, activeConversationId, {
        id: `msg-${Date.now()}`,
        role: "user",
        content: userMessage,
      });
    }
    setInput("");
    setSidebarOpen(false);
    setAssistantTyping(true);

    try {
      const conversation = conversations.find(
        (c: any) => c.id === activeConversationId,
      );

      const customPrompt =
        globalAiConfig?.systemPrompt || sarcasticSystemPrompt;
      const systemMessage =
        adminSystemPrompt +
        "\n\n" +
        campaignSystemPrompt +
        "\n\n" +
        integrationSystemPrompt +
        "\n\n" +
        integrationControlPrompt +
        "\n\n" +
        customPrompt;

      const conversationHistory = (conversation?.messages || [])
        .slice(-20)
        .map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        }));

      const result = await sendSecureMessage(
        userMessage,
        activeConversationId,
        conversationHistory,
        systemMessage,
      );
      const response = result.response;

      const campaignIntent = detectCampaignIntent(response);

      if (campaignIntent && user) {
        try {
          await addCampaign(user.id, {
            name: campaignIntent.data.name,
            platform: campaignIntent.data.platform,
            status: "Pausada",
            budgetTotal: campaignIntent.data.budgetTotal,
            budgetSpent: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            startDate: campaignIntent.data.startDate,
            endDate: campaignIntent.data.endDate || "",
            ctr: 0,
            cpc: 0,
          });

          toast({
            title: "Campanha Criada!",
            description: `"${campaignIntent.data.name}" criada com sucesso.`,
            variant: "success",
          });
        } catch (error) {
          console.error("Erro ao criar campanha:", error);
        }
      }

      let cleanedResponse = cleanCampaignBlockFromResponse(response);
      cleanedResponse = cleanAdminBlocksFromResponse(cleanedResponse);
      cleanedResponse = cleanIntegrationBlocksFromResponse(cleanedResponse);

      if (user) {
        await streamAssistantResponse(
          user.id,
          activeConversationId,
          cleanedResponse,
        );

        // Incrementar contador de mensagens IA após resposta bem-sucedida
        await incrementAiMessageUsage(user.id);
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    } finally {
      setAssistantTyping(false);
      setCurrentTool(null);
      setAiReasoning("");
      setAiSources([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-attachments")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("chat-attachments").getPublicUrl(filePath);

      const fileInfo = file.type.startsWith("image/")
        ? `![${file.name}](${publicUrl})`
        : `[${file.name}](${publicUrl})`;

      setInput((prev) => (prev ? `${prev}\n\n${fileInfo}` : fileInfo));

      toast({
        title: "Arquivo enviado!",
        description: `${file.name} foi anexado com sucesso.`,
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const loadConversationMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from("ChatMessage")
        .select("id, role, content, createdAt")
        .eq("conversationId", convId)
        .order("createdAt", { ascending: true });

      if (error) throw error;

      const loadedMessages = (data || []).map((msg: any) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: new Date(msg.createdAt),
      }));

      useChatStore.getState().setConversationMessages(convId, loadedMessages);
      setActiveConversationId(convId);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      if (!user) return;

      await useChatStore.getState().loadConversations(user.id);

      const { data: existingConversations } = await supabase
        .from("ChatConversation")
        .select("id")
        .eq("userId", user.id)
        .limit(1);

      if (!existingConversations || existingConversations.length === 0) {
        await handleNewConversation();
      }
    };

    initChat();
  }, [user]);

  const handleNewConversation = async () => {
    try {
      if (!user) return;

      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const { error } = await supabase.from("ChatConversation").insert({
        id: newId,
        userId: user.id,
        title: "Nova Conversa",
        createdAt: now,
        updatedAt: now,
      });

      if (error) throw error;

      setActiveConversationId(newId);
      await useChatStore.getState().loadConversations(user.id);

      toast({
        title: "Nova conversa criada!",
        description: "Comece a conversar com a IA.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Erro ao criar conversa:", error);
      toast({
        title: "Erro ao criar conversa",
        description: "Não foi possível criar nova conversa.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await supabase
        .from("ChatMessage")
        .delete()
        .eq("conversationId", conversationId);

      const { error } = await supabase
        .from("ChatConversation")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }

      await useChatStore.getState().loadConversations(user!.id);

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
    <div className="h-[calc(100vh-80px)] flex bg-[#0A0A0F]">
      {/* SIDEBAR - Dark Theme */}
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
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  >
                    <IconMessages className="w-6 h-6 text-blue-400" />
                  </motion.div>
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
                <motion.div
                  animate={{ rotate: [0, 90, 90, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                >
                  <IconPlus className="w-5 h-5" />
                </motion.div>
                Nova Conversa
              </motion.button>
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {conversations.map((conv: any, index: number) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (activeConversationId !== conv.id) {
                      loadConversationMessages(conv.id);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all backdrop-blur-sm",
                    activeConversationId === conv.id
                      ? "bg-gradient-to-r from-blue-600/25 to-purple-600/25 border border-blue-500/50 shadow-lg shadow-blue-500/20"
                      : "bg-gray-800/30 hover:bg-gray-800/50 border border-gray-700/30",
                  )}
                >
                  <motion.div
                    whileHover={{ rotate: 10 }}
                    className={cn(
                      "flex-shrink-0",
                      activeConversationId === conv.id
                        ? "text-blue-400"
                        : "text-gray-500",
                    )}
                  >
                    <IconMessage2 className="w-5 h-5" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.messages && conv.messages.length > 0
                        ? conv.messages[
                            conv.messages.length - 1
                          ].content.substring(0, 35) + "..."
                        : "Sem mensagens"}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      handleDeleteConversation(conv.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-all"
                  >
                    <IconTrash className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-[#12121A]/95 backdrop-blur-xl border-b border-gray-700/50 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-800/50 text-gray-400 hover:text-white transition-all"
              >
                {sidebarOpen ? (
                  <IconX className="w-6 h-6" />
                ) : (
                  <IconMenu2 className="w-6 h-6" />
                )}
              </motion.button>
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.3)",
                    "0 0 30px rgba(168, 85, 247, 0.3)",
                    "0 0 20px rgba(59, 130, 246, 0.3)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <IconBrandOpenai className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white">Chat com IA</h1>
                <p className="text-sm text-gray-400">Assistente inteligente</p>
              </div>
            </div>
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 0 10px rgba(34, 197, 94, 0.3)",
                  "0 0 20px rgba(34, 197, 94, 0.5)",
                  "0 0 10px rgba(34, 197, 94, 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <IconCircleDotFilled className="w-3 h-3 text-green-400" />
              </motion.div>
              <span className="text-sm font-medium text-green-400">Online</span>
            </motion.div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0A0A0F] custom-scrollbar">
          {activeConversation ? (
            <>
              {activeConversation.messages.map((message: any) => {
                const integrationMatch = message.content?.match(
                  /INTEGRATION_CONNECT:(\w+):([^🔗]+)/,
                );

                if (integrationMatch && message.role === "assistant") {
                  const [, platform, platformName] = integrationMatch;
                  const cleanContent = message.content.replace(
                    /🔗 \*\*INTEGRATION_CONNECT:[^🔗]+🔗\*\* 🔗\n\n/,
                    "",
                  );

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[80%]">
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-4 mb-2 border border-gray-700/30">
                          <div className="flex items-start gap-3">
                            <motion.div
                              whileHover={{ rotate: 10, scale: 1.1 }}
                              className="flex-shrink-0"
                            >
                              <IconBrandOpenai className="w-6 h-6 text-blue-400" />
                            </motion.div>
                            <div className="flex-1 text-gray-200">
                              {cleanContent}
                            </div>
                          </div>
                        </div>
                        <IntegrationConnectionCard
                          platform={platform}
                          platformName={platformName.trim()}
                          onSkip={() => console.log("Pulado:", platform)}
                          onSuccess={() => console.log("Conectado:", platform)}
                        />
                      </div>
                    </motion.div>
                  );
                }

                return (
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
                );
              })}

              {isAssistantTyping && (
                <AiThinkingIndicator
                  isThinking={isAssistantTyping}
                  currentTool={currentTool}
                  reasoning={aiReasoning}
                  sources={aiSources}
                  status="thinking"
                />
              )}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Selecione ou crie uma conversa para começar.</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-[#12121A]/95 backdrop-blur-xl border-t border-gray-700/50 p-4 shadow-2xl">
          <div className="hidden sm:flex gap-2 mb-3">
            {quickSuggestions.map((s) => (
              <motion.button
                key={s}
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 0 15px rgba(59, 130, 246, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setInput(s)}
                className="px-3 py-1.5 rounded-lg bg-gray-800/50 hover:bg-gray-700/50 text-gray-300 text-sm transition-all border border-gray-700/30 backdrop-blur-sm"
              >
                {s}
              </motion.button>
            ))}
          </div>
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
              placeholder="Digite sua mensagem..."
              className="w-full resize-none rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 text-white placeholder-gray-500 p-4 pr-32 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:bg-gray-800/70 transition-all shadow-inner"
              minRows={1}
              maxRows={5}
              maxLength={MAX_CHARS}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: -10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleAttachClick}
                      className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-blue-400 transition-all"
                    >
                      <IconPaperclip className="w-5 h-5" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>Anexar arquivo</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      animate={isRecording ? { scale: [1, 1.2, 1] } : {}}
                      transition={{
                        duration: 0.5,
                        repeat: isRecording ? Infinity : 0,
                      }}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={!activeConversationId}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        isRecording
                          ? "bg-red-500/30 text-red-400 shadow-lg shadow-red-500/50"
                          : "hover:bg-gray-700/50 text-gray-400 hover:text-red-400",
                      )}
                    >
                      <IconMicrophone className="w-5 h-5" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRecording ? "Parar gravação" : "Gravar áudio"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <motion.button
                whileHover={{ scale: 1.05, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                animate={
                  input.trim() !== "" && activeConversationId
                    ? {
                        boxShadow: [
                          "0 0 10px rgba(59, 130, 246, 0.3)",
                          "0 0 20px rgba(168, 85, 247, 0.4)",
                          "0 0 10px rgba(59, 130, 246, 0.3)",
                        ],
                      }
                    : {}
                }
                transition={{ duration: 1.5, repeat: Infinity }}
                onClick={handleSend}
                disabled={input.trim() === "" || !activeConversationId}
                className={cn(
                  "p-2.5 rounded-lg transition-all",
                  input.trim() === "" || !activeConversationId
                    ? "bg-gray-700/50 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl",
                )}
              >
                <IconSend className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <AIUsageBadge />
            <p
              className={cn(
                "text-xs",
                input.length > MAX_CHARS ? "text-red-400" : "text-gray-500",
              )}
            >
              {input.length} / {MAX_CHARS}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;

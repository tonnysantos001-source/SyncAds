import { create } from "zustand";
import { conversationsApi, chatApi } from "@/lib/api";
import { ChatConversation, ChatMessage } from "@/data/mocks";

interface ChatState {
  // Estado
  conversations: ChatConversation[];
  activeConversationId: string | null;
  isAssistantTyping: boolean;

  // Actions
  loadConversations: (userId: string) => Promise<void>;
  createNewConversation: (userId: string, title?: string) => Promise<void>;
  addMessage: (
    userId: string,
    conversationId: string,
    message: ChatMessage,
  ) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversationId: (id: string | null) => void;
  setAssistantTyping: (isTyping: boolean) => void;
  setConversationMessages: (
    conversationId: string,
    messages: ChatMessage[],
  ) => void;
  addConversation: (conversation: ChatConversation) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // Estado inicial
  conversations: [],
  activeConversationId: null,
  isAssistantTyping: false,

  // Load Conversations
  loadConversations: async (userId: string) => {
    try {
      // Carregar conversas
      const dbConversations = await conversationsApi.getConversations(userId);

      // Load messages for each conversation
      const conversationsWithMessages = await Promise.all(
        dbConversations.map(async (conv) => {
          // Carregar mensagens
          const messages = await chatApi.getConversationMessages(conv.id);
          return {
            id: conv.id,
            title: conv.title,
            createdAt: conv.createdAt,
            messages:
              messages?.map((msg) => ({
                id: msg.id,
                role: msg.role.toLowerCase() as "user" | "assistant",
                content: msg.content,
                timestamp: new Date(msg.createdAt),
              })) || [],
          };
        }),
      );

      set({
        conversations: conversationsWithMessages,
        activeConversationId:
          conversationsWithMessages.length > 0
            ? conversationsWithMessages[0].id
            : null,
      });
    } catch (error) {
      console.error("Load conversations error:", error);
    }
  },

  // Create New Conversation
  createNewConversation: async (userId: string, title?: string) => {
    try {
      const conversationTitle =
        title || `Nova Conversa ${new Date().toLocaleDateString()}`;
      const newConversation = await conversationsApi.createConversation(
        userId,
        conversationTitle,
      );

      set((state) => ({
        conversations: [
          {
            id: newConversation.id,
            title: newConversation.title,
            createdAt: newConversation.createdAt,
            messages: [],
          },
          ...state.conversations,
        ],
        activeConversationId: newConversation.id,
      }));
    } catch (error) {
      console.error("Create conversation error:", error);
      throw error;
    }
  },

  // Add Message
  addMessage: async (
    userId: string,
    conversationId: string,
    message: ChatMessage,
  ) => {
    try {
      console.log("📝 [ChatStore] Adicionando mensagem:", {
        id: message.id,
        role: message.role,
        contentPreview: message.content.substring(0, 50),
        conversationId,
      });

      // Add to local state first for immediate feedback
      set((state) => {
        const newConversations = state.conversations.map((conv) => {
          if (conv.id === conversationId) {
            // Garantir que messages existe
            const messages = conv.messages || [];

            // Verificar se a mensagem já existe
            const existingMessageIndex = messages.findIndex(
              (msg) => msg.id === message.id,
            );

            if (existingMessageIndex >= 0) {
              // Atualizar mensagem existente (para streaming)
              console.log(
                "🔄 [ChatStore] Atualizando mensagem existente:",
                message.id,
              );
              const updatedMessages = [...messages];
              updatedMessages[existingMessageIndex] = message;
              return { ...conv, messages: updatedMessages };
            } else {
              // Adicionar nova mensagem
              console.log(
                "➕ [ChatStore] Adicionando nova mensagem:",
                message.id,
              );
              return { ...conv, messages: [...messages, message] };
            }
          }
          return conv;
        });
        return { conversations: newConversations };
      });

      // ✅ NÃO salvar no banco durante streaming
      // A Edge Function (chat-enhanced) já salva as mensagens no banco
      // O frontend apenas atualiza o estado local para UX imediata
      console.log(
        "💾 [ChatStore] Mensagem adicionada ao estado local (Edge Function salvará no banco)",
      );
    } catch (error) {
      console.error("❌ [ChatStore] Erro ao adicionar mensagem:", error);
      // Rollback the local change on error
      set((state) => {
        const newConversations = state.conversations.map((conv) => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              messages: (conv.messages || []).filter(
                (msg) => msg.id !== message.id,
              ),
            };
          }
          return conv;
        });
        return { conversations: newConversations };
      });
    }
  },

  // Delete Conversation
  deleteConversation: async (id: string) => {
    try {
      await conversationsApi.deleteConversation(id);

      set((state) => {
        const remainingConversations = state.conversations.filter(
          (conv) => conv.id !== id,
        );
        let newActiveId = state.activeConversationId;

        if (state.activeConversationId === id) {
          newActiveId =
            remainingConversations.length > 0
              ? remainingConversations[0].id
              : null;
        }

        return {
          conversations: remainingConversations,
          activeConversationId: newActiveId,
        };
      });
    } catch (error) {
      console.error("Delete conversation error:", error);
      throw error;
    }
  },

  // Set Conversation Messages
  setConversationMessages: (conversationId: string, messages: ChatMessage[]) =>
    set((state) => {
      const newConversations = state.conversations.map((conv) => {
        if (conv.id === conversationId) {
          return { ...conv, messages: messages || [] };
        }
        return conv;
      });
      return { conversations: newConversations };
    }),

  // Add Conversation
  addConversation: (conversation: ChatConversation) =>
    set((state) => ({
      conversations: [
        ...state.conversations,
        { ...conversation, messages: conversation.messages || [] },
      ],
    })),

  // Set Active Conversation
  setActiveConversationId: (id: string | null) =>
    set({ activeConversationId: id }),

  // Set Assistant Typing
  setAssistantTyping: (isTyping: boolean) =>
    set({ isAssistantTyping: isTyping }),
}));

/**
 * ============================================
 * SYNCADS CHAT SERVICE - SIMPLIFIED
 * ============================================
 * Serviço de comunicação com Supabase Edge Function
 * Usa APENAS chat-enhanced (sem Railway)
 *
 * Autor: SyncAds Team
 * Data: 2025-01-17
 * ============================================
 */

import { supabase } from "../supabase";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  userId?: string;
}

export interface ChatServiceOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export interface SendMessageResponse {
  response: string;
  error?: string;
  conversationId?: string;
}

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const CHAT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/chat-stream`;

// ============================================
// MAIN SERVICE CLASS
// ============================================

class ChatService {
  private abortController: AbortController | null = null;

  /**
   * Envia mensagem para a Edge Function chat-enhanced
   */
  async sendMessage(
    message: string,
    conversationId: string,
    options: ChatServiceOptions = {},
  ): Promise<string> {
    try {
      console.log("📤 [ChatService] Enviando mensagem:", {
        conversationId,
        messageLength: message.length,
      });

      // Cancelar request anterior se existir
      if (this.abortController) {
        console.log("🛑 [ChatService] Cancelando request anterior");
        this.abortController.abort();
      }

      this.abortController = new AbortController();
      const signal = options.signal || this.abortController.signal;

      // Pegar sessão do Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error("❌ [ChatService] Erro de autenticação:", sessionError);
        throw new Error("Usuário não autenticado");
      }

      // Pegar informações do usuário
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("❌ [ChatService] Erro ao buscar usuário:", userError);
        throw new Error("Usuário não encontrado");
      }

      console.log("👤 [ChatService] Usuário autenticado:", user.id);

      // Buscar histórico da conversa (últimas 20 mensagens)
      const { data: conversationMessages, error: messagesError } =
        await supabase
          .from("ChatMessage")
          .select("role, content")
          .eq("conversationId", conversationId)
          .order("createdAt", { ascending: true })
          .limit(20);

      if (messagesError) {
        console.warn(
          "⚠️ [ChatService] Erro ao buscar histórico:",
          messagesError,
        );
      }

      const conversationHistory =
        conversationMessages?.map((msg) => ({
          role: msg.role.toLowerCase(),
          content: msg.content,
        })) || [];

      console.log(
        "📜 [ChatService] Histórico carregado:",
        conversationHistory.length,
        "mensagens",
      );

      // Preparar payload para Edge Function
      const payload = {
        message,
        conversationId,
        conversationHistory,
        systemPrompt: undefined, // Usa o padrão da função
      };

      console.log(
        "🚀 [ChatService] Chamando Edge Function:",
        CHAT_FUNCTION_URL,
      );

      // Fazer request para Edge Function
      const response = await fetch(CHAT_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify(payload),
        signal,
      });

      console.log("📥 [ChatService] Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ [ChatService] Erro HTTP:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (e) {
          // Não é JSON, usar errorText
          if (errorText) {
            errorMessage = errorText;
          }
        }

        throw new Error(errorMessage);
      }

      // Processar resposta
      const data: SendMessageResponse = await response.json();

      console.log("✅ [ChatService] Resposta recebida:", {
        hasResponse: !!data.response,
        hasError: !!data.error,
        responseLength: data.response?.length || 0,
      });

      if (data.error) {
        console.error("❌ [ChatService] Erro da IA:", data.error);
        throw new Error(data.error);
      }

      if (!data.response || data.response === "Sem resposta da IA") {
        console.error("❌ [ChatService] IA não retornou resposta válida");
        throw new Error(
          "IA não configurada ou sem resposta. Configure uma IA em Configurações > IA Global.",
        );
      }

      const fullResponse = data.response;

      // Callback de chunk (simulado para compatibilidade)
      if (options.onChunk) {
        const words = fullResponse.split(" ");
        for (let i = 0; i < words.length; i += 2) {
          const chunk = words.slice(i, i + 2).join(" ");
          options.onChunk(chunk + " ");
          // Pequeno delay para simular streaming
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Callback de complete
      if (options.onComplete) {
        options.onComplete(fullResponse);
      }

      console.log("✅ [ChatService] Mensagem enviada com sucesso");
      return fullResponse;
    } catch (error: any) {
      console.error("❌ [ChatService] Erro ao enviar mensagem:", error);

      // Callback de erro
      if (options.onError) {
        options.onError(error);
      }

      // Se foi cancelado, não lançar erro
      if (error.name === "AbortError") {
        console.log("🛑 [ChatService] Request cancelado pelo usuário");
        throw new Error("Request cancelado");
      }

      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancela o request atual
   */
  abort(): void {
    if (this.abortController) {
      console.log("🛑 [ChatService] Abortando request...");
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Salva mensagem no banco (caso precise salvar manualmente)
   */
  async saveMessage(
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
  ): Promise<ChatMessage | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const messageData = {
        id: crypto.randomUUID(),
        conversationId,
        role: role.toUpperCase(),
        content,
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("ChatMessage")
        .insert(messageData)
        .select()
        .single();

      if (error) {
        console.error("❌ [ChatService] Erro ao salvar mensagem:", error);
        return null;
      }

      console.log("✅ [ChatService] Mensagem salva:", data.id);
      return data as ChatMessage;
    } catch (error) {
      console.error("❌ [ChatService] Erro ao salvar mensagem:", error);
      return null;
    }
  }

  /**
   * Busca mensagens de uma conversa
   */
  async getConversationMessages(
    conversationId: string,
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from("ChatMessage")
        .select("*")
        .eq("conversationId", conversationId)
        .order("createdAt", { ascending: true });

      if (error) {
        console.error("❌ [ChatService] Erro ao buscar mensagens:", error);
        return [];
      }

      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error("❌ [ChatService] Erro ao buscar mensagens:", error);
      return [];
    }
  }

  /**
   * Verifica se a IA está configurada
   */
  async isAIConfigured(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from("GlobalAiConnection")
        .select("id, isActive")
        .eq("isActive", true)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("❌ [ChatService] Erro ao verificar IA:", error);
        return false;
      }

      const isConfigured = !!data;
      console.log("🤖 [ChatService] IA configurada:", isConfigured);
      return isConfigured;
    } catch (error) {
      console.error("❌ [ChatService] Erro ao verificar IA:", error);
      return false;
    }
  }
}

// ============================================
// EXPORT SINGLETON
// ============================================

const chatService = new ChatService();

export default chatService;

// Export da classe para instâncias customizadas
export { ChatService };

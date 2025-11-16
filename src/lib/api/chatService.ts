/**
 * ============================================
 * SYNCADS CHAT SERVICE
 * ============================================
 * Serviço de comunicação com Railway Python Service
 * Suporta streaming SSE, múltiplos providers de IA,
 * e integração completa com Supabase
 *
 * Autor: SyncAds AI Team
 * Data: 16/01/2025
 * ============================================
 */

import { supabase } from "./supabase";

// ============================================
// TYPES & INTERFACES
// ============================================

export interface ChatMessage {
  id?: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: string;
  userId?: string;
}

export interface ChatStreamChunk {
  text?: string;
  done?: boolean;
  error?: string;
}

export interface GlobalAiConnection {
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

export interface ChatServiceOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

// ============================================
// CONFIGURATION
// ============================================

const RAILWAY_URL =
  import.meta.env.VITE_PYTHON_SERVICE_URL ||
  (import.meta.env.PROD
    ? "https://syncads-python-microservice-production.up.railway.app"
    : "http://localhost:8000");

const CHAT_ENDPOINT = `${RAILWAY_URL}/api/chat`;

// ============================================
// MAIN SERVICE CLASS
// ============================================

class ChatService {
  private abortController: AbortController | null = null;

  /**
   * Envia mensagem e recebe resposta com streaming
   */
  async sendMessage(
    message: string,
    conversationId: string,
    options: ChatServiceOptions = {},
  ): Promise<string> {
    try {
      // Cancelar request anterior se existir
      if (this.abortController) {
        this.abortController.abort();
      }

      this.abortController = new AbortController();
      const signal = options.signal || this.abortController.signal;

      // Pegar sessão do Supabase
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      // Pegar informações do usuário
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Usuário não encontrado");
      }

      // Buscar organização do usuário
      const { data: userData } = await supabase
        .from("User")
        .select("organizationId")
        .eq("id", user.id)
        .single();

      const organizationId = userData?.organizationId;

      // Preparar payload
      const payload = {
        message,
        conversationId,
        userId: user.id,
        organizationId,
      };

      console.log("📤 Sending to Railway:", CHAT_ENDPOINT, payload);

      // Fazer request
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          error.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      // Processar streaming
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Stream not available");
      }

      const decoder = new TextDecoder();
      let fullResponse = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decodificar chunk
        const chunk = decoder.decode(value, { stream: true });

        // Processar linhas SSE
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data: ChatStreamChunk = JSON.parse(line.substring(6));

              if (data.text) {
                fullResponse += data.text;
                options.onChunk?.(data.text);
              }

              if (data.done) {
                console.log("✅ Stream completed");
                options.onComplete?.(fullResponse);
                return fullResponse;
              }

              if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn("Failed to parse SSE data:", line, e);
            }
          }
        }
      }

      return fullResponse;
    } catch (error: any) {
      console.error("❌ Chat error:", error);
      options.onError?.(error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancela request em andamento
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Busca IA ativa da organização
   */
  async getActiveAI(organizationId: string): Promise<GlobalAiConnection | null> {
    try {
      // Buscar IA configurada para a organização
      const { data: orgAi } = await supabase
        .from("OrganizationAiConnection")
        .select("*, GlobalAiConnection(*)")
        .eq("organizationId", organizationId)
        .eq("isDefault", true)
        .single();

      if (orgAi?.GlobalAiConnection?.isActive) {
        return orgAi.GlobalAiConnection as GlobalAiConnection;
      }

      // Fallback: buscar primeira IA global ativa
      const { data: globalAi } = await supabase
        .from("GlobalAiConnection")
        .select("*")
        .eq("isActive", true)
        .order("createdAt", { ascending: true })
        .limit(1)
        .single();

      return globalAi || null;
    } catch (error) {
      console.error("Error fetching active AI:", error);
      return null;
    }
  }

  /**
   * Salva mensagem no Supabase
   */
  async saveMessage(
    conversationId: string,
    role: "user" | "assistant",
    content: string,
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase.from("ChatMessage").insert({
        conversationId,
        role,
        content,
        userId: user?.id,
        createdAt: new Date().toISOString(),
      });

      if (error) {
        console.error("Error saving message:", error);
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  }

  /**
   * Busca histórico da conversa
   */
  async getConversationHistory(
    conversationId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from("ChatMessage")
        .select("*")
        .eq("conversationId", conversationId)
        .order("createdAt", { ascending: true })
        .limit(limit);

      if (error) throw error;

      return (data || []) as ChatMessage[];
    } catch (error) {
      console.error("Error fetching history:", error);
      return [];
    }
  }

  /**
   * Cria nova conversa
   */
  async createConversation(title?: string): Promise<string> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      // Buscar organização do usuário
      const { data: userData } = await supabase
        .from("User")
        .select("organizationId")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("ChatConversation")
        .insert({
          userId: user.id,
          organizationId: userData?.organizationId,
          title: title || "Nova conversa",
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  /**
   * Lista conversas do usuário
   */
  async listConversations(limit: number = 20): Promise<any[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("ChatConversation")
        .select("*")
        .eq("userId", user.id)
        .order("updatedAt", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error listing conversations:", error);
      return [];
    }
  }

  /**
   * Deleta conversa
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Deletar mensagens primeiro
      await supabase
        .from("ChatMessage")
        .delete()
        .eq("conversationId", conversationId);

      // Deletar conversa
      const { error } = await supabase
        .from("ChatConversation")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      throw error;
    }
  }

  /**
   * Verifica se Railway está online
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${RAILWAY_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.status === "healthy";
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Pega informações do Railway
   */
  async getServiceInfo(): Promise<any> {
    try {
      const response = await fetch(`${RAILWAY_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error("Failed to get service info:", error);
      return null;
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const chatService = new ChatService();

export default chatService;

// Export da classe para instâncias customizadas
export { ChatService };

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Envia mensagem rápida (atalho)
 */
export async function sendChatMessage(
  message: string,
  conversationId: string,
  onChunk?: (chunk: string) => void,
): Promise<string> {
  return chatService.sendMessage(message, conversationId, { onChunk });
}

/**
 * Verifica se Railway está disponível
 */
export async function isRailwayAvailable(): Promise<boolean> {
  return chatService.checkHealth();
}

/**
 * Formata mensagem para exibição
 */
export function formatChatMessage(message: ChatMessage): string {
  const time = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const prefix = message.role === "user" ? "Você" : "IA";

  return `[${time}] ${prefix}: ${message.content}`;
}

/**
 * Detecta provider da IA
 */
export function getProviderIcon(provider: string): string {
  const icons: Record<string, string> = {
    OPENAI: "🤖",
    ANTHROPIC: "🧠",
    GOOGLE: "🔍",
    GROQ: "⚡",
    COHERE: "🎯",
    MISTRAL: "🌪️",
    OPENROUTER: "🔀",
    PERPLEXITY: "🔮",
    TOGETHER: "🤝",
    FIREWORKS: "🎆",
  };

  return icons[provider.toUpperCase()] || "💬";
}

/**
 * Calcula tokens aproximados (estimativa)
 */
export function estimateTokens(text: string): number {
  // Estimativa simples: ~4 caracteres por token
  return Math.ceil(text.length / 4);
}

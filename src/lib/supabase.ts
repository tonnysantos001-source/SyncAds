import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { SUPABASE_CONFIG } from "./config";

// =====================================================
// STORAGE ADAPTER UNIVERSAL (Desktop + Mobile)
// =====================================================

/**
 * Storage adapter que funciona em todos os dispositivos
 * Fallback: localStorage -> sessionStorage -> memoryStorage
 */
class UniversalStorage {
  private memoryStorage: Map<string, string> = new Map();
  private storageType: "localStorage" | "sessionStorage" | "memory" = "memory";

  constructor() {
    // Detectar qual storage está disponível
    if (this.isStorageAvailable("localStorage")) {
      this.storageType = "localStorage";
      console.log("✅ Usando localStorage");
    } else if (this.isStorageAvailable("sessionStorage")) {
      this.storageType = "sessionStorage";
      console.warn("⚠️ localStorage indisponível, usando sessionStorage");
    } else {
      this.storageType = "memory";
      console.warn(
        "⚠️ Storage persistente indisponível, usando memória (sessão será perdida ao recarregar)",
      );
    }
  }

  private isStorageAvailable(type: "localStorage" | "sessionStorage"): boolean {
    try {
      const storage = window[type];
      const testKey = "__storage_test__";
      storage.setItem(testKey, "test");
      storage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private getStorage(): Storage | null {
    if (this.storageType === "localStorage") {
      return window.localStorage;
    } else if (this.storageType === "sessionStorage") {
      return window.sessionStorage;
    }
    return null;
  }

  getItem(key: string): string | null {
    try {
      const storage = this.getStorage();
      if (storage) {
        return storage.getItem(key);
      }
      return this.memoryStorage.get(key) || null;
    } catch (error) {
      console.error("Erro ao ler storage:", error);
      return this.memoryStorage.get(key) || null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.setItem(key, value);
      }
      // Sempre manter em memória como backup
      this.memoryStorage.set(key, value);
    } catch (error) {
      console.error("Erro ao salvar no storage:", error);
      // Fallback para memória
      this.memoryStorage.set(key, value);
    }
  }

  removeItem(key: string): void {
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(key);
      }
      this.memoryStorage.delete(key);
    } catch (error) {
      console.error("Erro ao remover do storage:", error);
      this.memoryStorage.delete(key);
    }
  }
}

const universalStorage = new UniversalStorage();

// Configuração básica do Supabase com persistência de sessão
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: universalStorage as any,
      storageKey: "supabase.auth.token",
    },
    db: {
      schema: "public",
    },
  },
);

/**
 * Verifica se a sessão atual é válida
 * @returns true se a sessão está válida, false caso contrário
 */
export const ensureValidSession = async (): Promise<boolean> => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Erro ao verificar sessão:", error);
      return false;
    }

    if (!session) {
      console.warn("⚠️ Nenhuma sessão ativa encontrada");
      return false;
    }

    // Verificar se o token está próximo de expirar (menos de 5 minutos)
    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    // Só renovar se realmente estiver perto de expirar
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
      console.log("🔄 Token próximo de expirar, renovando...");
      const { data: refreshData, error: refreshError } =
        await supabase.auth.refreshSession();

      if (refreshError) {
        console.error("❌ Erro ao renovar sessão:", refreshError);
        return false;
      }

      if (!refreshData.session) {
        console.error("❌ Falha ao renovar sessão");
        return false;
      }

      console.log("✅ Sessão renovada com sucesso");
    }

    return true;
  } catch (error) {
    console.error("❌ Erro crítico ao validar sessão:", error);
    return false;
  }
};

/**
 * Wrapper para operações do Supabase que garante sessão válida
 * @param operation - Função a ser executada
 * @param retries - Número máximo de tentativas (padrão: 2)
 */
export const withValidSession = async <T>(
  operation: () => Promise<T>,
  retries = 2,
): Promise<T> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Garantir sessão válida antes da operação
      const isValid = await ensureValidSession();

      if (!isValid) {
        throw new Error("Sessão inválida ou expirada");
      }

      // Executar operação
      const result = await operation();
      return result;
    } catch (error: any) {
      console.error(`❌ Tentativa ${attempt}/${retries} falhou:`, error);

      // Se é erro de autenticação e ainda tem tentativas, renovar e tentar novamente
      if (
        attempt < retries &&
        (error.message?.includes("JWT") ||
          error.message?.includes("session") ||
          error.message?.includes("auth") ||
          error.code === "PGRST301")
      ) {
        console.log("🔄 Tentando renovar sessão e repetir operação...");
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      throw error;
    }
  }

  throw new Error("Falha após todas as tentativas");
};

/**
 * Listener para mudanças de autenticação
 */
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    console.log("👋 Usuário deslogado");
  } else if (event === "SIGNED_IN") {
    console.log("👤 Usuário logado");
  } else if (event === "TOKEN_REFRESHED") {
    console.log("🔄 Token renovado automaticamente");
  }
});

/**
 * Inicializa e restaura a sessão ao carregar a página
 */
const initializeSession = async () => {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("❌ Erro ao carregar sessão:", error);
      return;
    }

    if (session) {
      console.log("✅ Sessão restaurada com sucesso");
    } else {
      console.log("ℹ️ Nenhuma sessão ativa");
    }
  } catch (error) {
    console.error("❌ Erro ao inicializar sessão:", error);
  }
};

// Inicializar sessão automaticamente ao carregar o módulo
initializeSession();

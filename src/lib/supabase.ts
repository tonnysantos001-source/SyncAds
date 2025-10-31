import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { SUPABASE_CONFIG } from "./config";

// Configuração básica do Supabase com persistência de sessão
export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: localStorage,
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

import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";
import { SUPABASE_CONFIG } from "./config";

// Detectar se é dispositivo móvel
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

// Configuração otimizada para mobile
const getSupabaseConfig = () => {
  const isMobile = isMobileDevice();

  return {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Para mobile, ser mais agressivo com refresh
      ...(isMobile && {
        storage: localStorage,
        storageKey: "syncads-auth-token",
        flowType: "pkce" as const,
      }),
    },
    global: {
      headers: {
        "x-client-info": isMobile ? "syncads-mobile" : "syncads-web",
      },
    },
    db: {
      schema: "public",
    },
    // Para mobile, tentar reconectar automaticamente
    ...(isMobile && {
      realtime: {
        params: {
          eventsPerSecond: 2,
        },
      },
    }),
  };
};

export const supabase = createClient<Database>(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  getSupabaseConfig(),
);

// Função para garantir que a sessão está válida antes de qualquer operação
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

    if (timeUntilExpiry < 300) {
      // Menos de 5 minutos
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

// Wrapper para operações do Supabase que garante sessão válida
export const withValidSession = async <T>(
  operation: () => Promise<T>,
  retries = 3,
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
          error.message?.includes("auth"))
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

// Listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
  console.log("🔐 Auth state changed:", event);

  if (event === "SIGNED_OUT") {
    console.log("👋 Usuário deslogado");
    localStorage.removeItem("syncads-auth-token");
  } else if (event === "SIGNED_IN") {
    console.log("👋 Usuário logado");
  } else if (event === "TOKEN_REFRESHED") {
    console.log("🔄 Token renovado automaticamente");
  } else if (event === "USER_UPDATED") {
    console.log("👤 Usuário atualizado");
  }
});

// Inicialização: verificar e restaurar sessão no mobile
if (isMobileDevice()) {
  console.log("📱 Dispositivo móvel detectado, inicializando sessão...");

  // Verificar sessão imediatamente
  ensureValidSession().then((isValid) => {
    if (isValid) {
      console.log("✅ Sessão válida restaurada");
    } else {
      console.warn("⚠️ Sessão inválida ou expirada");
    }
  });

  // Configurar verificação periódica da sessão (a cada 3 minutos)
  setInterval(
    () => {
      ensureValidSession().catch((error) => {
        console.error("❌ Erro na verificação periódica:", error);
      });
    },
    3 * 60 * 1000,
  );

  // Verificar sessão quando o app volta ao foco
  window.addEventListener("focus", () => {
    console.log("👀 App voltou ao foco, verificando sessão...");
    ensureValidSession();
  });

  // Verificar sessão quando volta online
  window.addEventListener("online", () => {
    console.log("🌐 Voltou online, verificando sessão...");
    ensureValidSession();
  });
}

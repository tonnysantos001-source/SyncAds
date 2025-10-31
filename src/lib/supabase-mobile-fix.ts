import { supabase } from "./supabase";

/**
 * Função para verificar se o dispositivo é mobile REAL
 * Não considera DevTools em modo responsivo como mobile
 */
export function isMobileDevice(): boolean {
  // Verifica se tem touch screen E user agent mobile E tela pequena
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isMobileUA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );
  const isSmallScreen = window.innerWidth <= 768;

  // Não é mobile se não tem touch (DevTools não tem touch real)
  return hasTouch && isMobileUA && isSmallScreen;
}

/**
 * Função para garantir que a sessão do Supabase esteja válida
 * NÃO redireciona automaticamente - apenas retorna o status
 */
export async function garantirSessaoValida(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      console.warn("⚠️ Nenhuma sessão ativa encontrada");
      return false;
    }

    // Verificar se o token está próximo de expirar
    const expiresAt = session.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt - now;

    // Só renovar se estiver perto de expirar (menos de 5 minutos)
    if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
      console.log("🔄 Token próximo de expirar, renovando...");
      const { error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("❌ Erro ao atualizar sessão:", error);
        return false;
      }

      console.log("✅ Sessão renovada com sucesso");
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar sessão:", error);
    return false;
  }
}

/**
 * Inicializa verificações periódicas de sessão (APENAS PARA MOBILE REAL)
 * Não faz verificações agressivas
 */
export async function inicializarCorrecaoChatMobile(): Promise<void> {
  // Só ativar para dispositivos móveis REAIS
  if (!isMobileDevice()) {
    console.log("💻 Desktop detectado - sem verificações extras");
    return;
  }

  console.log("📱 Dispositivo móvel detectado");

  // Verificação inicial (não bloqueia)
  garantirSessaoValida().catch((err) => {
    console.warn("⚠️ Erro na verificação inicial de sessão:", err);
  });

  // Verificação periódica SUAVE (a cada 10 minutos - não agressivo)
  setInterval(
    () => {
      garantirSessaoValida().catch((err) => {
        console.warn("⚠️ Erro na verificação periódica:", err);
      });
    },
    10 * 60 * 1000,
  );

  // Verificar quando volta online (importante)
  window.addEventListener("online", () => {
    console.log("🌐 Voltou online, verificando sessão...");
    garantirSessaoValida().catch((err) => {
      console.warn("⚠️ Erro ao verificar sessão:", err);
    });
  });
}

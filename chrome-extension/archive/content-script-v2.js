// ============================================
// VERSÃO MELHORADA DO checkAuthState
// Copiar e colar no content-script.js
// Substituir a função existente (linha 588-630)
// ============================================

let lastAuthState = null;

function checkAuthState() {
  try {
    const keys = Object.keys(localStorage);

    // Padrões de chaves Supabase conhecidos
    const patterns = [
      "sb-", // Padrão novo Supabase
      "supabase.auth.token", // Padrão legacy
      "supabase-auth-token", // Alternativo
      "__supabase", // Prefixo alternativo
    ];

    console.log(`🔍 Verificando ${keys.length} chaves no localStorage...`);

    for (const key of keys) {
      // Verificar se a chave corresponde a algum padrão
      const matchesPattern = patterns.some((pattern) => key.includes(pattern));

      if (!matchesPattern) continue;

      console.log(`   🔑 Analisando chave: ${key}`);

      try {
        const value = localStorage.getItem(key);
        if (!value) {
          console.log(`      ⚠️ Valor vazio`);
          continue;
        }

        // Tentar parsear como JSON
        const parsed = JSON.parse(value);
        console.log(`      ✓ JSON válido`);

        // Buscar user em diferentes estruturas possíveis
        const user =
          parsed?.user ||
          parsed?.currentUser ||
          parsed?.data?.user ||
          parsed?.session?.user ||
          parsed?.currentSession?.user;

        // Buscar access_token em diferentes estruturas
        const accessToken =
          parsed?.access_token ||
          parsed?.data?.session?.access_token ||
          parsed?.session?.access_token ||
          parsed?.currentSession?.access_token;

        if (user && user.id && accessToken) {
          const currentState = JSON.stringify({
            id: user.id,
            email: user.email,
          });

          // Apenas notificar se mudou
          if (currentState !== lastAuthState) {
            console.log("🔐 ✅ LOGIN DETECTADO!");
            console.log("   👤 User ID:", user.id);
            console.log("   📧 Email:", user.email || "N/A");
            console.log("   🔑 Fonte:", key);

            // Enviar mensagem ao background
            chrome.runtime
              .sendMessage({
                type: "AUTO_LOGIN_DETECTED",
                userId: user.id,
                email: user.email || "",
                accessToken: accessToken,
                source: `localStorage-${key}`,
              })
              .then((response) => {
                console.log("   ✅ Mensagem enviada ao background:", response);
              })
              .catch((error) => {
                console.error("   ❌ Erro ao enviar mensagem:", error);
              });

            lastAuthState = currentState;

            // Mostrar indicador visual
            showIndicator("Conectando...", "info");

            return true;
          } else {
            console.log(
              "   ℹ️ Usuário já conhecido, não notificando novamente",
            );
          }
        } else {
          if (!user?.id) {
            console.log(`      ⚠️ Estrutura não contém user.id`);
          } else if (!accessToken) {
            console.log(`      ⚠️ Estrutura não contém access_token`);
          }
        }
      } catch (e) {
        console.log(`      ❌ Erro ao parsear (não é JSON): ${e.message}`);
        continue;
      }
    }

    return false;
  } catch (error) {
    console.error("❌ Erro geral ao verificar auth:", error);
    return false;
  }
}

// Verificar a cada 2 segundos
console.log("⏱️ Iniciando monitoramento de auth (intervalo: 2s)");
console.log("📦 localStorage disponível?", typeof localStorage !== "undefined");
console.log(
  "🔢 Total de chaves no localStorage:",
  Object.keys(localStorage).length,
);

// Mostrar todas as chaves IMEDIATAMENTE para debug
try {
  const allKeys = Object.keys(localStorage);
  console.log("🗝️ TODAS AS CHAVES DO LOCALSTORAGE:");

  // Agrupar por prefixo
  const grouped = {};
  allKeys.forEach((key) => {
    const prefix = key.split("-")[0] || key.split(".")[0] || "outros";
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(key);
  });

  Object.keys(grouped).forEach((prefix) => {
    console.log(`   📁 ${prefix}:`, grouped[prefix].length, "chaves");
    grouped[prefix].forEach((key) => {
      const val = localStorage.getItem(key);
      if (val && val.length < 100) {
        console.log(`      - ${key}: ${val}`);
      } else if (val) {
        console.log(`      - ${key}: [${val.length} chars]`);
      }
    });
  });
} catch (e) {
  console.error("❌ Erro ao ler localStorage:", e);
}

// Executar verificação imediatamente
console.log("🚀 Verificação inicial de auth...");
const foundAuth = checkAuthState();
if (foundAuth) {
  console.log("✅ Auth encontrado na verificação inicial!");
} else {
  console.log("⏳ Auth não encontrado, continuará monitorando...");
}

// Continuar monitorando
setInterval(checkAuthState, 2000);

// ============================================
// LISTENER ADICIONAL: Detectar mudanças no localStorage
// ============================================
window.addEventListener("storage", (e) => {
  console.log("📢 Storage event:", {
    key: e.key,
    oldValue: e.oldValue ? `[${e.oldValue.length} chars]` : null,
    newValue: e.newValue ? `[${e.newValue.length} chars]` : null,
  });

  // Se a chave é relacionada ao Supabase, verificar imediatamente
  if (e.key && (e.key.includes("sb-") || e.key.includes("supabase"))) {
    console.log("   🔄 Mudança em chave Supabase detectada, verificando...");
    setTimeout(checkAuthState, 100);
  }
});

// ============================================
// NOTIFICAR BACKGROUND QUE CONTENT SCRIPT ESTÁ PRONTO
// ============================================
setTimeout(() => {
  chrome.runtime
    .sendMessage({
      type: "CONTENT_SCRIPT_READY",
      url: window.location.href,
    })
    .then(() => {
      console.log("✅ Background notificado que content script está pronto");
    })
    .catch((error) => {
      console.error("❌ Erro ao notificar background:", error);
    });
}, 100);

// ============================================
// LOG DE INICIALIZAÇÃO
// ============================================
console.log("✅ SyncAds Content Script Ready v2.0");
console.log("   🌐 URL:", window.location.href);
console.log("   🔧 Features: Auto-login detection, Storage monitoring");

sendLog(
  "CONTENT_SCRIPT_LOADED",
  `Content script v2 loaded on ${window.location.hostname}`,
);

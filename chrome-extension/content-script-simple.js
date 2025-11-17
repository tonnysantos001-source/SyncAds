// ============================================
// SYNCADS EXTENSION - CONTENT SCRIPT SIMPLIFICADO v2.0
// Detecta token e envia para background
// ============================================

console.log("🚀 SyncAds Content Script v2.0 Started");

// ============================================
// AVISO VISUAL
// ============================================
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "error" ? "#ef4444" : "#10b981"};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 350px;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `
    <strong>🔌 SyncAds Extension</strong><br>
    ${message}
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ============================================
// FUNÇÃO PRINCIPAL - DETECTAR E ENVIAR TOKEN
// ============================================
function detectAndSendToken() {
  try {
    console.log("🔍 Buscando token do Supabase...");

    const keys = Object.keys(localStorage);
    console.log(`   📦 ${keys.length} chaves no localStorage`);

    // 1. Buscar chave moderna do Supabase: sb-*-auth-token
    const supabaseKey = keys.find(
      (key) => key.startsWith("sb-") && key.includes("-auth-token"),
    );

    if (supabaseKey) {
      const authData = localStorage.getItem(supabaseKey);
      if (authData) {
        try {
          const parsed = JSON.parse(authData);
          const user = parsed?.user;
          const accessToken = parsed?.access_token;

          if (user?.id && accessToken) {
            console.log("✅ Token encontrado!");
            console.log("   👤 User ID:", user.id);
            console.log("   📧 Email:", user.email);
            console.log("   🔑 Token:", accessToken.substring(0, 30) + "...");

            // Enviar para background
            chrome.runtime
              .sendMessage({
                type: "AUTH_TOKEN_DETECTED",
                data: {
                  userId: user.id,
                  email: user.email || "",
                  accessToken: accessToken,
                },
              })
              .then((response) => {
                console.log("✅ Resposta do background:", response);
                if (response?.success) {
                  console.log("🎉 Extensão conectada com sucesso!");
                  showNotification("Conectado com sucesso! ✓", "success");
                } else {
                  console.error("❌ Erro:", response?.error);
                  if (
                    response?.error?.includes("Token") ||
                    response?.error?.includes("expirado")
                  ) {
                    showNotification(
                      "Token expirado! Por favor, faça logout e login novamente.",
                      "error",
                    );
                  } else {
                    showNotification(
                      "Erro ao conectar: " + response?.error,
                      "error",
                    );
                  }
                }
              })
              .catch((error) => {
                console.error("❌ Erro ao enviar mensagem:", error);
              });

            return true;
          }
        } catch (e) {
          console.error("❌ Erro ao parsear token:", e);
        }
      }
    }

    // 2. Fallback: buscar formato legado
    const legacyAuth = localStorage.getItem("supabase.auth.token");
    if (legacyAuth) {
      try {
        const parsed = JSON.parse(legacyAuth);
        const user = parsed?.currentSession?.user || parsed?.user;
        const accessToken =
          parsed?.currentSession?.access_token || parsed?.access_token;

        if (user?.id && accessToken) {
          console.log("✅ Token encontrado (legacy)!");

          chrome.runtime
            .sendMessage({
              type: "AUTH_TOKEN_DETECTED",
              data: {
                userId: user.id,
                email: user.email || "",
                accessToken: accessToken,
              },
            })
            .then((response) => {
              console.log("✅ Token enviado (legacy):", response);
              if (response?.success) {
                showNotification("Conectado com sucesso! ✓", "success");
              } else if (response?.error) {
                showNotification(
                  "Erro ao conectar. Tente fazer login novamente.",
                  "error",
                );
              }
            })
            .catch((error) => {
              console.error("❌ Erro:", error);
            });

          return true;
        }
      } catch (e) {
        console.error("❌ Erro ao parsear legacy:", e);
      }
    }

    console.log("⚠️ Token não encontrado");
    return false;
  } catch (error) {
    console.error("❌ Erro geral:", error);
    return false;
  }
}

// ============================================
// EXECUTAR DETECÇÃO
// ============================================

// 1. Executar imediatamente
console.log("🚀 Primeira verificação...");
setTimeout(() => {
  detectAndSendToken();
}, 1000);

// 2. Monitorar mudanças no localStorage
window.addEventListener("storage", (e) => {
  if (e.key && (e.key.includes("sb-") || e.key.includes("supabase"))) {
    console.log("🔄 Mudança detectada no localStorage");
    setTimeout(detectAndSendToken, 500);
  }
});

// 3. Verificar periodicamente (a cada 5 segundos)
setInterval(() => {
  detectAndSendToken();
}, 5000);

console.log("✅ Content script ready - Monitorando auth...");

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
// BOTÃO FLUTUANTE PARA RECONEXÃO MANUAL
// ============================================
function createReconnectButton() {
  // Verificar se já existe
  if (document.getElementById("syncads-reconnect-btn")) {
    return;
  }

  const button = document.createElement("div");
  button.id = "syncads-reconnect-btn";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 999998;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
  `;
  button.innerHTML = `🔌 Conectar SyncAds`;

  // Hover effect
  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.05)";
    button.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
    button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
  });

  // Click handler
  button.addEventListener("click", () => {
    button.innerHTML = `⏳ Conectando...`;
    button.style.opacity = "0.7";
    tokenSent = false; // Reset flag

    setTimeout(() => {
      detectAndSendToken();
      button.style.opacity = "1";
      button.innerHTML = `🔌 Conectar SyncAds`;
    }, 500);
  });

  document.body.appendChild(button);
  console.log("✅ Botão de reconexão criado");

  // Auto-remover após 30 segundos
  setTimeout(() => {
    if (button.parentElement) {
      button.style.animation = "slideOut 0.3s ease";
      setTimeout(() => button.remove(), 300);
    }
  }, 30000);
}

// ============================================
// FUNÇÃO PRINCIPAL - DETECTAR E ENVIAR TOKEN
// ============================================
function detectAndSendToken() {
  // Evitar enviar token múltiplas vezes
  if (tokenSent) {
    console.log("⚠️ Token já foi enviado, ignorando...");
    return false;
  }

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

            tokenSent = true; // Marcar como enviado
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

          tokenSent = true; // Marcar como enviado
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
// DETECTAR MUDANÇAS DE URL (LOGIN/NAVEGAÇÃO)
// ============================================
let lastUrl = location.href;
let tokenSent = false;

function checkUrlChange() {
  const currentUrl = location.href;
  if (currentUrl !== lastUrl) {
    console.log("🔄 URL mudou:", currentUrl);
    lastUrl = currentUrl;
    tokenSent = false; // Reset flag quando URL muda

    // Aguardar mais tempo para dar tempo do Supabase criar token novo
    setTimeout(() => {
      console.log("🔍 Verificando token após mudança de URL...");
      detectAndSendToken();
    }, 3000);
  }
}

// Monitorar mudanças de URL
setInterval(checkUrlChange, 500);

// ============================================
// EXECUTAR DETECÇÃO
// ============================================

// 1. Criar botão de reconexão
setTimeout(() => {
  createReconnectButton();
}, 2000);

// 2. Executar primeira verificação
console.log("🚀 Primeira verificação...");
setTimeout(() => {
  detectAndSendToken();
}, 3000);

// 3. Monitorar mudanças no localStorage
window.addEventListener("storage", (e) => {
  if (e.key && (e.key.includes("sb-") || e.key.includes("supabase"))) {
    console.log("🔄 Mudança detectada no localStorage");
    tokenSent = false; // Reset flag
    setTimeout(detectAndSendToken, 1000);
  }
});

// 4. Verificar periodicamente (a cada 10 segundos) - apenas se ainda não enviou
setInterval(() => {
  if (!tokenSent) {
    detectAndSendToken();
  }
}, 10000);

console.log("✅ Content script ready - Monitorando auth...");

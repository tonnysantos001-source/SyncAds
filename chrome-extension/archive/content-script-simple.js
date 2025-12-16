// ============================================
// SYNCADS EXTENSION - TOKEN DETECTOR v3.0
// Detecta CRIAÇÃO de token novo (não token antigo)
// ============================================

console.log("🚀 SyncAds Token Detector v3.0 - Monitoring token creation");

// ============================================
// ESTADO
// ============================================
let lastTokenSent = null;
let knownKeys = new Set();
let checkCount = 0;

// ============================================
// NOTIFICAÇÃO VISUAL
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
  notification.innerHTML = `<strong>🔌 SyncAds</strong><br>${message}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = "opacity 0.3s";
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

// ============================================
// BOTÃO DE CONEXÃO MANUAL
// ============================================
function createConnectButton() {
  if (document.getElementById("syncads-connect-btn")) return;

  const button = document.createElement("div");
  button.id = "syncads-connect-btn";
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

  button.onmouseenter = () => {
    button.style.transform = "scale(1.05)";
  };

  button.onmouseleave = () => {
    button.style.transform = "scale(1)";
  };

  button.onclick = () => {
    button.innerHTML = `⏳ Buscando token...`;
    lastTokenSent = null;
    detectAndSendToken();
    setTimeout(() => {
      button.innerHTML = `🔌 Conectar SyncAds`;
    }, 2000);
  };

  document.body.appendChild(button);
}

// ============================================
// DETECTAR TOKEN NOVO
// ============================================
function detectAndSendToken() {
  try {
    checkCount++;
    const keys = Object.keys(localStorage);

    // Procurar chave do Supabase (formato novo ou legado)
    let supabaseKey = keys.find(
      (k) => k.startsWith("sb-") && k.includes("-auth-token"),
    );

    // Se não encontrou formato novo, tentar legado
    if (!supabaseKey) {
      supabaseKey = keys.find((k) => k === "supabase.auth.token");
    }

    if (!supabaseKey) {
      if (checkCount % 50 === 0) {
        console.log("⏳ Aguardando token do Supabase...", {
          totalKeys: keys.length,
          checks: checkCount,
          keysFound: keys,
        });
      }
      return;
    }

    // Ler dados
    const authDataRaw = localStorage.getItem(supabaseKey);
    if (!authDataRaw) return;

    const authData = JSON.parse(authDataRaw);
    console.log("🔑 Chave detectada:", supabaseKey);
    const user = authData?.user;
    const accessToken = authData?.access_token;
    const expiresAt = authData?.expires_at;

    if (!user?.id || !accessToken) {
      console.log("⚠️ Dados incompletos no token");
      return;
    }

    // Verificar se é token NOVO (expira no futuro)
    if (expiresAt) {
      const expiresDate = new Date(expiresAt * 1000);
      const now = new Date();

      if (expiresDate <= now) {
        console.log("❌ Token EXPIRADO detectado:", {
          expiresAt: expiresDate.toLocaleString(),
          now: now.toLocaleString(),
          expired: true,
        });
        showNotification(
          "Token expirado! Faça LOGOUT e LOGIN novamente.",
          "error",
        );
        return;
      }

      console.log("✅ Token VÁLIDO encontrado:", {
        userId: user.id,
        email: user.email,
        expiresAt: expiresDate.toLocaleString(),
        validFor: Math.floor((expiresDate - now) / 1000 / 60) + " minutos",
      });
    }

    // Evitar enviar mesmo token múltiplas vezes
    const tokenHash = accessToken.substring(0, 50);
    if (tokenHash === lastTokenSent) {
      if (checkCount % 50 === 0) {
        console.log("ℹ️ Token já enviado, aguardando novo...");
      }
      return;
    }

    // ENVIAR TOKEN PARA BACKGROUND
    console.log("📤 Enviando token para background...");
    console.log("   User ID:", user.id);
    console.log("   Email:", user.email);
    console.log("   Token:", accessToken.substring(0, 30) + "...");

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
          lastTokenSent = tokenHash;
          showNotification("Conectado com sucesso! ✓", "success");
          console.log("🎉 EXTENSÃO CONECTADA!");

          // Esconder botão
          const btn = document.getElementById("syncads-connect-btn");
          if (btn) {
            btn.style.opacity = "0";
            setTimeout(() => btn.remove(), 500);
          }
        } else {
          console.error("❌ Erro:", response?.error);
          showNotification(
            "Erro: " + (response?.error || "Desconhecido"),
            "error",
          );
        }
      })
      .catch((error) => {
        console.error("❌ Erro ao enviar token:", error);
        showNotification("Erro ao conectar. Tente novamente.", "error");
      });
  } catch (error) {
    console.error("❌ Erro ao detectar token:", error);
  }
}

// ============================================
// MONITORAR MUDANÇAS NO LOCALSTORAGE
// ============================================
function monitorLocalStorage() {
  const currentKeys = Object.keys(localStorage);
  const currentKeysSet = new Set(currentKeys);

  // Detectar novas chaves
  const newKeys = [...currentKeysSet].filter((k) => !knownKeys.has(k));

  if (newKeys.length > 0) {
    console.log("🆕 Novas chaves detectadas:", newKeys);
    knownKeys = currentKeysSet;

    // Se for chave do Supabase, verificar imediatamente
    const hasSupabaseKey = newKeys.some(
      (k) => k.startsWith("sb-") || k.includes("supabase"),
    );
    if (hasSupabaseKey) {
      console.log("🔑 Nova chave Supabase! Verificando token...");
      setTimeout(detectAndSendToken, 500);
    }
  } else {
    knownKeys = currentKeysSet;
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
console.log("⚙️ Inicializando detector...");

// Salvar chaves iniciais
knownKeys = new Set(Object.keys(localStorage));
console.log("📦 Chaves iniciais:", knownKeys.size);

// Criar botão
setTimeout(() => {
  if (document.body) {
    createConnectButton();
  }
}, 2000);

// Primeira verificação (após 2s)
setTimeout(() => {
  console.log("🔍 Primeira verificação de token...");
  detectAndSendToken();
}, 2000);

// Monitorar localStorage a cada 200ms
setInterval(monitorLocalStorage, 200);

// Verificar token a cada 1 segundo
setInterval(detectAndSendToken, 1000);

// Listener de storage event (adicional)
window.addEventListener("storage", (e) => {
  if (e.key && (e.key.includes("sb-") || e.key.includes("supabase"))) {
    console.log("📢 Storage event:", e.key);
    setTimeout(detectAndSendToken, 100);
  }
});

console.log("✅ Detector ativo - Aguardando token válido...");

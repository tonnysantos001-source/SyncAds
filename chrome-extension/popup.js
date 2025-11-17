// ============================================
// SYNCADS EXTENSION - POPUP (MINIMALISTA)
// ============================================

const CONFIG = {
  PANEL_URL: "https://syncads.com.br/login-v2",
};

// Elementos do DOM
const statusIndicator = document.getElementById("statusIndicator");
const statusTitle = document.getElementById("statusTitle");
const statusSubtitle = document.getElementById("statusSubtitle");
const openPanelBtn = document.getElementById("openPanelBtn");
const mainContent = document.getElementById("mainContent");
const loadingContent = document.getElementById("loadingContent");

// ============================================
// FUNÇÕES DE UI
// ============================================
function showLoading() {
  mainContent.style.display = "none";
  loadingContent.classList.add("active");
}

function hideLoading() {
  loadingContent.classList.remove("active");
  mainContent.style.display = "flex";
}

function setButtonState(state) {
  const btnIcon = document.getElementById("btnIcon");
  const btnText = document.getElementById("btnText");

  if (state === "connecting") {
    openPanelBtn.classList.add("connecting");
    openPanelBtn.setAttribute("disabled", "true");
    btnIcon.textContent = "⏳";
    btnText.textContent = "Verificando...";
  } else if (state === "connected") {
    openPanelBtn.classList.remove("connecting");
    openPanelBtn.removeAttribute("disabled");
    btnIcon.textContent = "✅";
    btnText.textContent = "Conectado";
  } else {
    openPanelBtn.classList.remove("connecting");
    openPanelBtn.removeAttribute("disabled");
    btnIcon.textContent = "🔗";
    btnText.textContent = "Conectar";
  }
}

function updateStatus(isConnected) {
  console.log("🎨 Updating UI status:", isConnected);

  if (isConnected) {
    statusIndicator.classList.add("connected");
    statusTitle.textContent = "✅ Conectado";
    statusSubtitle.textContent = "Extensão ativa • Automação habilitada";
    openPanelBtn.style.display = "none";
  } else {
    statusIndicator.classList.remove("connected");
    statusTitle.textContent = "⚠️ Desconectado";
    statusSubtitle.textContent = "Clique em Conectar para ativar";
    openPanelBtn.style.display = "inline-flex";
  }
}</text>


// ============================================
// VERIFICAR STATUS
// ============================================
async function checkConnectionStatus() {
  try {
    const result = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "isConnected",
      "accessToken",
      "lastActivity",
    ]);

    // Verificar se tem dados básicos
    const hasBasicData = result.deviceId && result.userId && result.accessToken;

    // Verificar se a última atividade foi recente (últimos 2 minutos)
    const lastActivity = result.lastActivity || 0;
    const isRecent = (Date.now() - lastActivity) < 120000; // 2 minutos

    // Considerar conectado se tem dados e atividade recente
    const isConnected = hasBasicData && (result.isConnected || isRecent);

    console.log("📊 Status Check:", {
      hasBasicData,
      isRecent,
      isConnected,
      lastActivity: new Date(lastActivity).toISOString()
    });

    updateStatus(isConnected);

    return isConnected;
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    updateStatus(false);
    return false;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
openPanelBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  setButtonState("connecting");

  try {
    // Verificar aba atual
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    console.log("📍 Aba atual:", currentTab.url);

    // Verificar se já está no painel
    const isOnPanel =
      currentTab.url &&
      (currentTab.url.includes("syncads.com.br") ||
        currentTab.url.includes("localhost"));

    if (!isOnPanel) {
      console.log("🔄 Redirecionando para painel SyncAds...");

      // Se não está no painel, redirecionar
      await chrome.tabs.update(currentTab.id, {
        url: CONFIG.PANEL_URL,
      });

      // Aguardar carregamento e verificar status múltiplas vezes
      console.log("⏳ Aguardando login...");

      setTimeout(() => checkConnectionStatus(), 2000);
      setTimeout(() => checkConnectionStatus(), 4000);
      setTimeout(() => checkConnectionStatus(), 6000);

      setTimeout(async () => {
        const connected = await checkConnectionStatus();
        setButtonState(connected ? "connected" : "default");
      }, 7000);
    } else {
      console.log("✅ Já está no painel! Verificando conexão...");

      // Já está no painel, forçar detecção
      try {
        await chrome.tabs.sendMessage(currentTab.id, {
          type: "CHECK_AUTH",
        });
        console.log("📤 Mensagem enviada para content-script");
      } catch (err) {
        console.log("⚠️ Content script ainda não carregado, recarregando...");
        await chrome.tabs.reload(currentTab.id);
      }

      // Verificar status múltiplas vezes
      setTimeout(() => checkConnectionStatus(), 500);
      setTimeout(() => checkConnectionStatus(), 1500);
      setTimeout(() => checkConnectionStatus(), 3000);

      setTimeout(async () => {
        const connected = await checkConnectionStatus();
        setButtonState(connected ? "connected" : "default");

        if (!connected) {
          console.log("🔴 Ainda não conectado. Por favor, faça login no painel.");
        }
      }, 4000);
    }
  } catch (error) {
    console.error("❌ Erro ao conectar:", error);
    setButtonState("default");
  }
});

// Listener para mudanças no storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.isConnected || changes.deviceId || changes.userId || changes.lastActivity) {
      console.log("🔄 Storage changed, rechecking status...");
      checkConnectionStatus();
    }
  }
});

// Listener para mensagens do background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "STATUS_UPDATE") {
    updateStatus(message.connected);
    setButtonState(message.connected ? "connected" : "default");
  } else if (message.action === "LOGIN_SUCCESS") {
    updateStatus(true);
    setButtonState("connected");
  } else if (message.action === "LOGOUT") {
    updateStatus(false);
    setButtonState("default");
  }

  sendResponse({ received: true });
  return true;
});

// ============================================
// INICIALIZAÇÃO
// ============================================
async function initialize() {
  showLoading();

  await checkConnectionStatus();

  setTimeout(hideLoading, 300);
}

// Iniciar e verificar periodicamente
initialize();

// Verificar status a cada 10 segundos
setInterval(() => {
  checkConnectionStatus();
}, 10000);

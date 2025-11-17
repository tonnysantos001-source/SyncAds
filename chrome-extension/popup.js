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
  if (isConnected) {
    statusIndicator.classList.add("connected");
    statusTitle.textContent = "Conectado";
    statusSubtitle.textContent = "Extensão ativa • Automação habilitada";
    openPanelBtn.style.display = "none";
  } else {
    statusIndicator.classList.remove("connected");
    statusTitle.textContent = "Desconectado";
    statusSubtitle.textContent = "Clique em Conectar";
    openPanelBtn.style.display = "inline-flex";
  }
}

// ============================================
// VERIFICAR STATUS
// ============================================
async function checkConnectionStatus() {
  try {
    const result = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "isConnected",
    ]);

    const isConnected = result.deviceId && result.userId && result.isConnected;

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

    // Verificar se já está no painel
    const isOnPanel =
      currentTab.url &&
      (currentTab.url.includes("syncads.com.br") ||
        currentTab.url.includes("localhost"));

    if (!isOnPanel) {
      // Se não está no painel, redirecionar na mesma aba
      await chrome.tabs.update(currentTab.id, {
        url: CONFIG.PANEL_URL,
      });

      // Aguardar carregamento
      setTimeout(async () => {
        const connected = await checkConnectionStatus();
        setButtonState(connected ? "connected" : "default");
      }, 3000);
    } else {
      // Já está no painel, apenas verificar conexão
      const connected = await checkConnectionStatus();

      // Enviar mensagem para detectar login
      chrome.tabs
        .sendMessage(currentTab.id, {
          type: "CHECK_AUTH",
        })
        .catch(() => {
          // Content script pode não estar carregado ainda
        });

      setTimeout(() => {
        setButtonState(connected ? "connected" : "default");
      }, 1500);
    }
  } catch (error) {
    console.error("❌ Erro ao conectar:", error);
    setButtonState("default");
  }
});

// Listener para mudanças no storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (changes.isConnected || changes.deviceId || changes.userId) {
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

// Iniciar
initialize();

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
  console.log("🎨 [POPUP] Updating UI status:", isConnected);

  if (isConnected) {
    statusIndicator.classList.add("connected");
    statusTitle.textContent = "✅ Conectado";
    statusSubtitle.textContent = "Extensão ativa • Automação habilitada";
    openPanelBtn.style.display = "none";
  } else {
    statusIndicator.classList.remove("connected");
    statusTitle.textContent = "⚠️ Desconectado";
    statusSubtitle.textContent = "Entre no painel para conectar";
    openPanelBtn.style.display = "inline-flex";

    // Atualizar texto do botão
    const btnText = document.getElementById("btnText");
    if (btnText) {
      btnText.textContent = "Verificar";
    }
  }
}

// ============================================
// VERIFICAR STATUS REAL (HEARTBEAT NO BANCO)
// ============================================
async function checkConnectionStatus() {
  try {
    const result = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "accessToken",
    ]);

    console.log("📊 [POPUP] Storage data:", {
      hasDeviceId: !!result.deviceId,
      hasUserId: !!result.userId,
      hasToken: !!result.accessToken,
    });

    // Se não tem dados básicos, está offline
    if (!result.deviceId || !result.userId || !result.accessToken) {
      console.log("❌ [POPUP] Sem dados básicos - OFFLINE");
      updateStatus(false);
      return false;
    }

    // VERIFICAR HEARTBEAT REAL NO BANCO
    console.log("🔍 [POPUP] Verificando heartbeat no banco...");

    const response = await fetch(
      `https://ovskepqggmxlfckxqgbr.supabase.co/rest/v1/extension_devices?device_id=eq.${result.deviceId}&select=last_seen,status`,
      {
        headers: {
          apikey:
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
          Authorization: `Bearer ${result.accessToken}`,
        },
      },
    );

    const data = await response.json();

    if (!data || data.length === 0) {
      console.log("❌ [POPUP] Device não encontrado no banco");
      updateStatus(false);
      return false;
    }

    const device = data[0];
    const lastSeen = new Date(device.last_seen).getTime();
    const now = Date.now();
    const diff = Math.round((now - lastSeen) / 1000);
    const isConnected = diff < 30; // 30s timeout

    console.log("✅ [POPUP] Heartbeat check:", {
      lastSeen: device.last_seen,
      diffSeconds: diff,
      isConnected,
      status: device.status,
    });

    updateStatus(isConnected);
    return isConnected;
  } catch (error) {
    console.error("❌ [POPUP] Erro ao verificar status:", error);
    updateStatus(false);
    return false;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
openPanelBtn.addEventListener("click", async (e) => {
  e.preventDefault();

  console.log("🔘 [POPUP] Connect button clicked!");

  setButtonState("connecting");

  try {
    // Verificar aba atual
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    console.log("📍 [POPUP] Current tab:", currentTab.url);

    // Verificar se já está no painel
    const isOnPanel =
      currentTab.url &&
      (currentTab.url.includes("syncads.com.br") ||
        currentTab.url.includes("localhost") ||
        currentTab.url.includes("vercel.app"));

    if (!isOnPanel) {
      console.log("⚠️ [POPUP] Not on SyncAds panel");

      // Mostrar mensagem para ir ao painel (sem redirecionar)
      setButtonState("default");

      // Atualizar UI para mostrar instrução
      statusTitle.textContent = "⚠️ Abra o Painel";
      statusSubtitle.textContent = "Entre no painel SyncAds para conectar";

      console.log("💡 [POPUP] User needs to open SyncAds panel manually");

      return;
    }

    console.log("✅ [POPUP] Already on SyncAds panel! Checking connection...");

    // Já está no painel, forçar detecção
    try {
      console.log("📤 [POPUP] Sending CHECK_AUTH to content-script...");
      const response = await chrome.tabs.sendMessage(currentTab.id, {
        type: "CHECK_AUTH",
      });
      console.log("✅ [POPUP] Content-script response:", response);
    } catch (err) {
      console.log("⚠️ [POPUP] Content script not responding", err.message);
    }

    // Verificar status múltiplas vezes
    setTimeout(() => checkConnectionStatus(), 500);
    setTimeout(() => checkConnectionStatus(), 1500);
    setTimeout(() => checkConnectionStatus(), 3000);

    setTimeout(async () => {
      const connected = await checkConnectionStatus();
      setButtonState(connected ? "connected" : "default");

      if (!connected) {
        console.log(
          "🔴 [POPUP] Still not connected. Please login on the panel.",
        );
        statusTitle.textContent = "⚠️ Faça Login";
        statusSubtitle.textContent = "Entre no painel para conectar";
      } else {
        console.log("🎉 [POPUP] Connection successful!");
      }
    }, 4000);
  } catch (error) {
    console.error("❌ [POPUP] Error connecting:", error);
    setButtonState("default");
  }
});

// Listener para mudanças no storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    console.log("💾 [POPUP] Storage changed:", Object.keys(changes));

    if (
      changes.isConnected ||
      changes.deviceId ||
      changes.userId ||
      changes.lastActivity
    ) {
      console.log(
        "🔄 [POPUP] Important storage change detected, rechecking status...",
      );

      if (changes.isConnected) {
        console.log(
          "  isConnected:",
          changes.isConnected.oldValue,
          "→",
          changes.isConnected.newValue,
        );
      }
      if (changes.userId) {
        console.log(
          "  userId:",
          !!changes.userId.oldValue,
          "→",
          !!changes.userId.newValue,
        );
      }

      checkConnectionStatus();
    }
  }
});

// Listener para mensagens do background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 [POPUP] Message received from background:", message);

  if (message.action === "STATUS_UPDATE") {
    console.log("🔄 [POPUP] Status update received:", message.connected);
    updateStatus(message.connected);
    setButtonState(message.connected ? "connected" : "default");
  } else if (message.action === "LOGIN_SUCCESS") {
    console.log("🎉 [POPUP] Login success received!", message);
    updateStatus(true);
    setButtonState("connected");
  } else if (message.action === "LOGOUT") {
    console.log("👋 [POPUP] Logout received");
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
  console.log("🚀 [POPUP] Initializing popup...");
  showLoading();

  await checkConnectionStatus();

  setTimeout(hideLoading, 300);

  console.log("✅ [POPUP] Popup initialized");
}

// Iniciar e verificar periodicamente
initialize();

// Verificar status a cada 10 segundos
setInterval(() => {
  console.log("⏰ [POPUP] Periodic status check...");
  checkConnectionStatus();
}, 10000);

console.log("🎯 [POPUP] Popup script loaded and ready");

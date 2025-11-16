// ============================================
// SYNCADS EXTENSION - POPUP SCRIPT
// Interface simplificada do usuário
// ============================================

console.log("🎨 SyncAds Popup Loaded");

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  API_URL: "https://syncads-python-microservice-production.up.railway.app",
  FRONTEND_URL: "https://syncads-njplhgitt-fatima-drivias-projects.vercel.app",
  EXTENSION_SETUP_URL:
    "https://syncads-njplhgitt-fatima-drivias-projects.vercel.app/extension-setup",
};

// ============================================
// ELEMENTOS DO DOM
// ============================================
const elements = {
  mainContent: document.getElementById("mainContent"),
  loadingContent: document.getElementById("loadingContent"),
  statusDot: document.getElementById("statusDot"),
  statusTitle: document.getElementById("statusTitle"),
  statusSubtitle: document.getElementById("statusSubtitle"),
  loginBtn: document.getElementById("loginBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
};

// ============================================
// ESTADO GLOBAL
// ============================================
let state = {
  deviceId: null,
  userId: null,
  isConnected: false,
  isLoggedIn: false,
};

// ============================================
// FUNÇÕES DE UI
// ============================================
function showLoading() {
  elements.mainContent.style.display = "none";
  elements.loadingContent.style.display = "block";
}

function hideLoading() {
  elements.mainContent.style.display = "block";
  elements.loadingContent.style.display = "none";
}

function updateStatus(connected, title, subtitle) {
  if (connected) {
    elements.statusDot.classList.add("connected");
    elements.statusTitle.textContent = title || "Conectado";
    elements.statusSubtitle.textContent =
      subtitle || "Extensão ativa e funcionando";
  } else {
    elements.statusDot.classList.remove("connected");
    elements.statusTitle.textContent = title || "Desconectado";
    elements.statusSubtitle.textContent = subtitle || "Faça login para ativar";
  }
}

function showLoggedInState() {
  elements.loginBtn.style.display = "none";
  elements.refreshBtn.style.display = "flex";
  updateStatus(true, "Conectado", "Pronto para automatizar");
  state.isLoggedIn = true;
}

function showLoggedOutState() {
  elements.loginBtn.style.display = "flex";
  elements.refreshBtn.style.display = "none";
  updateStatus(false, "Desconectado", "Faça login para ativar");
  state.isLoggedIn = false;
}

// ============================================
// FUNÇÕES DE COMUNICAÇÃO
// ============================================
function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

async function checkLoginStatus() {
  try {
    // Verificar se tem deviceId e userId salvos
    const result = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "isConnected",
    ]);

    if (result.deviceId && result.userId) {
      state.deviceId = result.deviceId;
      state.userId = result.userId;
      state.isConnected = result.isConnected || false;

      showLoggedInState();
      return true;
    }

    showLoggedOutState();
    return false;
  } catch (error) {
    console.error("❌ Erro ao verificar login:", error);
    showLoggedOutState();
    return false;
  }
}

async function registerDevice() {
  try {
    const response = await sendMessageToBackground({
      action: "REGISTER_DEVICE",
    });

    if (response && response.success) {
      console.log("✅ Dispositivo registrado:", response.deviceId);
      state.deviceId = response.deviceId;
      state.isConnected = true;

      // Salvar no storage
      await chrome.storage.local.set({
        deviceId: response.deviceId,
        isConnected: true,
      });

      showLoggedInState();
      return true;
    }

    return false;
  } catch (error) {
    console.error("❌ Erro ao registrar dispositivo:", error);
    return false;
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
elements.loginBtn.addEventListener("click", () => {
  console.log("🔐 Abrindo página de login...");

  // Abrir página de setup/login
  chrome.tabs.create({
    url: CONFIG.EXTENSION_SETUP_URL,
  });

  // Fechar popup
  window.close();
});

elements.refreshBtn.addEventListener("click", async () => {
  console.log("🔄 Verificando conexão...");

  showLoading();

  try {
    await checkLoginStatus();

    if (state.isLoggedIn) {
      // Tentar registrar dispositivo novamente
      await registerDevice();
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar:", error);
  } finally {
    setTimeout(hideLoading, 500);
  }
});

// ============================================
// LISTENERS DE MENSAGENS
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Mensagem recebida no popup:", message);

  switch (message.action) {
    case "STATUS_UPDATE":
      updateStatus(message.connected, message.title, message.subtitle);
      break;

    case "LOGIN_SUCCESS":
      state.userId = message.userId;
      showLoggedInState();
      registerDevice();
      break;

    case "LOGOUT":
      state.userId = null;
      state.deviceId = null;
      state.isConnected = false;
      showLoggedOutState();
      break;

    default:
      console.log("⚠️ Ação desconhecida:", message.action);
  }

  sendResponse({ received: true });
  return true;
});

// ============================================
// INICIALIZAÇÃO
// ============================================
async function initialize() {
  console.log("🚀 Inicializando popup...");

  showLoading();

  try {
    // Verificar status de login
    const isLoggedIn = await checkLoginStatus();

    if (isLoggedIn) {
      console.log("✅ Usuário logado");

      // Tentar registrar dispositivo se não estiver conectado
      if (!state.isConnected) {
        await registerDevice();
      }
    } else {
      console.log("ℹ️ Usuário não logado");
    }
  } catch (error) {
    console.error("❌ Erro na inicialização:", error);
    showLoggedOutState();
  } finally {
    setTimeout(hideLoading, 300);
  }
}

// Iniciar quando o DOM estiver pronto
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

console.log("✅ Popup script carregado");

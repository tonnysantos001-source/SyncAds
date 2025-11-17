// ============================================
// SYNCADS EXTENSION - BACKGROUND SCRIPT SIMPLIFICADO v2.0
// Versão robusta e minimalista
// ============================================

console.log("🚀 SyncAds Extension v2.0 - Background Started");

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  supabaseUrl: "https://ovskepqggmxlfckxqgbr.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.YMx-wL6hUtVPtGmN_5MKHIvfzqSmz5Jx6y0P3XJiWm4",
  functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
  version: "2.0.0",
};

// ============================================
// ESTADO
// ============================================
let state = {
  deviceId: null,
  userId: null,
  accessToken: null,
  isConnected: false,
};

// ============================================
// INICIALIZAÇÃO
// ============================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Installed:", details.reason);
  await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("🔄 Startup");
  await initialize();
});

async function initialize() {
  const stored = await chrome.storage.local.get(["deviceId"]);

  if (!stored.deviceId) {
    state.deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await chrome.storage.local.set({ deviceId: state.deviceId });
    console.log("🆔 Device ID criado:", state.deviceId);
  } else {
    state.deviceId = stored.deviceId;
    console.log("🆔 Device ID carregado:", state.deviceId);
  }

  updateBadge();
}

// ============================================
// LISTENER - MENSAGENS DO CONTENT-SCRIPT
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Mensagem recebida:", request.type);

  if (request.type === "AUTH_TOKEN_DETECTED") {
    handleAuthToken(request.data)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Async response
  }

  if (request.type === "GET_STATUS") {
    sendResponse({
      isConnected: state.isConnected,
      userId: state.userId,
      deviceId: state.deviceId,
    });
    return true;
  }
});

// ============================================
// PROCESSAR TOKEN DO CONTENT-SCRIPT
// ============================================
async function handleAuthToken(data) {
  const { userId, email, accessToken } = data;

  console.log("🔐 Processando auth token...");
  console.log("   User ID:", userId);
  console.log("   Email:", email);
  console.log("   Token preview:", accessToken?.substring(0, 30) + "...");

  // Validar dados
  if (!userId || !accessToken) {
    throw new Error("userId ou accessToken faltando");
  }

  // Salvar temporariamente
  state.userId = userId;
  state.accessToken = accessToken;

  // PASSO 1: Registrar dispositivo (deixar Edge Function validar token)
  console.log("📝 Registrando dispositivo...");
  const registered = await registerDevice();

  if (!registered) {
    console.error("❌ Falha ao registrar - Token pode estar expirado");
    state.accessToken = null;
    state.userId = null;
    updateBadge();
    throw new Error("Falha ao registrar dispositivo - Faça login novamente");
  }

  console.log("✅ Dispositivo registrado com sucesso!");

  // PASSO 2: Salvar no storage
  await chrome.storage.local.set({
    userId,
    accessToken,
    lastConnected: Date.now(),
  });

  state.isConnected = true;
  updateBadge();

  console.log("🎉 Extensão conectada com sucesso!");

  return { success: true, message: "Conectado!" };
}

// ============================================
// REGISTRAR DISPOSITIVO NO SUPABASE
// ============================================
async function registerDevice() {
  try {
    const response = await fetch(`${CONFIG.functionsUrl}/extension-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({
        device_id: state.deviceId,
        browser_info: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
        },
        version: CONFIG.version,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Erro ao registrar:", error);
      return false;
    }

    const data = await response.json();
    console.log("✅ Dispositivo registrado:", data);
    return true;
  } catch (error) {
    console.error("❌ Erro ao registrar dispositivo:", error);
    return false;
  }
}

// ============================================
// ATUALIZAR BADGE
// ============================================
function updateBadge() {
  if (state.isConnected) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    chrome.action.setTitle({ title: "SyncAds - Conectado ✓" });
  } else if (state.userId) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    chrome.action.setTitle({ title: "SyncAds - Aguardando..." });
  } else {
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setTitle({ title: "SyncAds - Aguardando login" });
  }
}

// Inicializar
initialize();

console.log("✅ Background script ready");

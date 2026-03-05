// ============================================
// SYNCADS EXTENSION - BACKGROUND SCRIPT v2.0
// Service Worker com Supabase Edge Functions
// ============================================

console.log("🚀 SyncAds Extension - Background Script v2.0 (Supabase)");

// ============================================
// CONFIGURAÇÃO
// ============================================
const CONFIG = {
  supabaseUrl: "https://ovskepqggmxlfckxqgbr.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.YMx-wL6hUtVPtGmN_5MKHIvfzqSmz5Jx6y0P3XJiWm4",
  functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
  pollInterval: 3000,
  reconnectDelay: 5000,
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
  isPolling: false,
  pollIntervalId: null,
  stats: {
    commandsExecuted: 0,
    commandsSuccess: 0,
    commandsFailed: 0,
  },
};

// ============================================
// INICIALIZAÇÃO
// ============================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason);

  if (details.reason === "install") {
    await initialize();
    chrome.tabs.create({ url: "https://syncads.com.br/app" });
  } else if (details.reason === "update") {
    await initialize();
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log("🔄 Extension startup");
  await initialize();
});

async function initialize() {
  console.log("⚙️ Initializing extension...");

  // Gerar ou recuperar deviceId
  const stored = await chrome.storage.local.get(["deviceId"]);

  if (stored.deviceId) {
    state.deviceId = stored.deviceId;
    console.log("✅ Device ID recuperado:", state.deviceId);
  } else {
    state.deviceId = generateDeviceId();
    await chrome.storage.local.set({ deviceId: state.deviceId });
    console.log("✅ Device ID gerado:", state.deviceId);
  }

  updateBadge();
}

function generateDeviceId() {
  return `ext_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    vendor: navigator.vendor,
  };
}

// ============================================
// AUTENTICAÇÃO
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Message received:", message.type);

  if (message.type === "AUTH_DETECTED") {
    handleAuthDetected(message.data).then(sendResponse);
    return true;
  }

  if (message.type === "GET_STATUS") {
    sendResponse({
      connected: state.isConnected,
      deviceId: state.deviceId,
      userId: state.userId,
      stats: state.stats,
    });
    return true;
  }

  if (message.type === "DISCONNECT") {
    disconnect().then(sendResponse);
    return true;
  }
});

async function handleAuthDetected(authData) {
  console.log("🔐 Auth detected:", authData);

  try {
    state.userId = authData.user?.id || null;
    state.accessToken = authData.access_token || null;

    if (!state.userId || !state.accessToken) {
      throw new Error("Invalid auth data");
    }

    await chrome.storage.local.set({
      userId: state.userId,
      accessToken: state.accessToken,
      lastAuth: Date.now(),
    });

    console.log("✅ Auth saved, connecting to server...");
    await connectToServer();

    return { success: true };
  } catch (error) {
    console.error("❌ Auth handling error:", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// CONEXÃO COM SERVIDOR
// ============================================
async function connectToServer() {
  if (state.isConnected) {
    console.log("ℹ️ Already connected");
    return { success: true };
  }

  console.log("🔌 Connecting to server...");
  console.log("   Device ID:", state.deviceId);
  console.log("   User ID:", state.userId);

  try {
    if (!state.accessToken) {
      // Tentar recuperar do storage
      const stored = await chrome.storage.local.get(["accessToken", "userId"]);
      if (stored.accessToken && stored.userId) {
        state.accessToken = stored.accessToken;
        state.userId = stored.userId;
      } else {
        throw new Error("No access token available");
      }
    }

    // Registrar dispositivo via Edge Function
    const response = await fetch(`${CONFIG.functionsUrl}/extension-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.accessToken}`,
        "apikey": CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({
        device_id: state.deviceId,
        browser_info: getBrowserInfo(),
        version: CONFIG.version,
      }),
    });

    console.log("   Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("   Error response:", errorText);
      throw new Error(`Registration failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Connected:", data);

    state.isConnected = true;

    await chrome.storage.local.set({
      isConnected: true,
      lastConnected: Date.now(),
    });

    updateBadge("success");
    startCommandPolling();

    // Log success
    await sendLog("info", "Extension connected successfully");

    return { success: true, data };
  } catch (error) {
    console.error("❌ Connection error:", error);

    state.isConnected = false;
    await chrome.storage.local.set({ isConnected: false });
    updateBadge("error");

    // Tentar reconectar
    setTimeout(connectToServer, CONFIG.reconnectDelay);

    return { success: false, error: error.message };
  }
}

async function disconnect() {
  console.log("🔌 Disconnecting...");

  state.isConnected = false;
  state.isPolling = false;

  if (state.pollIntervalId) {
    clearInterval(state.pollIntervalId);
    state.pollIntervalId = null;
  }

  updateBadge("offline");

  return { success: true };
}

// ============================================
// POLLING DE COMANDOS
// ============================================
function startCommandPolling() {
  if (state.isPolling) {
    console.log("ℹ️ Already polling");
    return;
  }

  console.log("📡 Starting command polling");
  state.isPolling = true;

  // Poll imediatamente
  pollCommands();

  // Poll a cada intervalo
  state.pollIntervalId = setInterval(pollCommands, CONFIG.pollInterval);
}

async function pollCommands() {
  if (!state.isConnected || !state.accessToken) {
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.functionsUrl}/extension-commands/${state.deviceId}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${state.accessToken}`,
          "apikey": CONFIG.supabaseAnonKey,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.error("🔐 Token expired, disconnecting...");
        await disconnect();
        return;
      }
      throw new Error(`Poll failed: ${response.status}`);
    }

    const result = await response.json();

    if (result.commands && result.commands.length > 0) {
      console.log(`📥 Received ${result.commands.length} command(s)`);

      for (const command of result.commands) {
        await executeCommand(command);
      }
    }
  } catch (error) {
    console.error("❌ Poll error:", error);
    await sendLog("error", `Poll error: ${error.message}`);
  }
}

// ============================================
// EXECUÇÃO DE COMANDOS
// ============================================
async function executeCommand(command) {
  console.log("⚡ Executing command:", command.type, command.id);

  try {
    let result;

    switch (command.type) {
      case "NAVIGATE":
        result = await executeNavigate(command.data);
        break;

      case "DOM_CLICK":
        result = await executeDomClick(command.data);
        break;

      case "DOM_FILL":
        result = await executeDomFill(command.data);
        break;

      case "DOM_READ":
        result = await executeDomRead(command.data);
        break;

      case "SCREENSHOT":
        result = await executeScreenshot(command.data);
        break;

      default:
        throw new Error(`Unknown command type: ${command.type}`);
    }

    // Atualizar status do comando
    await updateCommandStatus(command.id, "completed", result);

    state.stats.commandsExecuted++;
    state.stats.commandsSuccess++;

    console.log("✅ Command completed:", command.id);
    await sendLog("info", `Command ${command.type} completed`, { commandId: command.id });

  } catch (error) {
    console.error("❌ Command execution error:", error);

    await updateCommandStatus(command.id, "failed", { error: error.message });

    state.stats.commandsExecuted++;
    state.stats.commandsFailed++;

    await sendLog("error", `Command ${command.type} failed: ${error.message}`, {
      commandId: command.id,
      error: error.stack,
    });
  }
}

async function updateCommandStatus(commandId, status, result) {
  try {
    const response = await fetch(
      `${CONFIG.functionsUrl}/extension-commands/${state.deviceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${state.accessToken}`,
          "apikey": CONFIG.supabaseAnonKey,
        },
        body: JSON.stringify({
          command_id: commandId,
          status,
          result,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update command: ${response.status}`);
    }

    console.log("✅ Command status updated:", commandId, status);
  } catch (error) {
    console.error("❌ Failed to update command status:", error);
  }
}

// ============================================
// IMPLEMENTAÇÃO DOS COMANDOS
// ============================================
async function executeNavigate(data) {
  const { url } = data;

  const tab = await chrome.tabs.create({ url, active: true });

  return {
    success: true,
    tabId: tab.id,
    url: tab.url,
  };
}

async function executeDomClick(data) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs.length === 0) {
    throw new Error("No active tab");
  }

  const result = await chrome.tabs.sendMessage(tabs[0].id, {
    type: "DOM_CLICK",
    data,
  });

  return result;
}

async function executeDomFill(data) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs.length === 0) {
    throw new Error("No active tab");
  }

  const result = await chrome.tabs.sendMessage(tabs[0].id, {
    type: "DOM_FILL",
    data,
  });

  return result;
}

async function executeDomRead(data) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs.length === 0) {
    throw new Error("No active tab");
  }

  const result = await chrome.tabs.sendMessage(tabs[0].id, {
    type: "DOM_READ",
    data,
  });

  return result;
}

async function executeScreenshot(data) {
  const screenshot = await chrome.tabs.captureVisibleTab(null, {
    format: "png",
  });

  return {
    success: true,
    screenshot,
    timestamp: Date.now(),
  };
}

// ============================================
// LOGS
// ============================================
async function sendLog(level, message, data = null) {
  try {
    if (!state.accessToken) {
      return;
    }

    await fetch(`${CONFIG.functionsUrl}/extension-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.accessToken}`,
        "apikey": CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({
        device_id: state.deviceId,
        level,
        message,
        data,
      }),
    });
  } catch (error) {
    console.error("❌ Failed to send log:", error);
  }
}

// ============================================
// BADGE
// ============================================
function updateBadge(status = null) {
  if (!status) {
    status = state.isConnected ? "success" : "offline";
  }

  const colors = {
    success: "#10b981",
    error: "#ef4444",
    offline: "#6b7280",
  };

  const texts = {
    success: "ON",
    error: "ERR",
    offline: "OFF",
  };

  chrome.action.setBadgeBackgroundColor({ color: colors[status] });
  chrome.action.setBadgeText({ text: texts[status] });
}

// ============================================
// VERIFICAR AUTH NO STARTUP
// ============================================
(async () => {
  const stored = await chrome.storage.local.get([
    "deviceId",
    "userId",
    "accessToken",
    "isConnected",
  ]);

  if (stored.deviceId) {
    state.deviceId = stored.deviceId;
  }

  if (stored.userId && stored.accessToken) {
    state.userId = stored.userId;
    state.accessToken = stored.accessToken;

    // Tentar conectar
    await connectToServer();
  } else {
    console.log("ℹ️ No saved auth, waiting for login...");
    updateBadge("offline");
  }
})();

console.log("✅ Background script initialized");

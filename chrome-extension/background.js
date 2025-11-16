// ============================================
// SYNCADS EXTENSION - BACKGROUND SCRIPT
// Service Worker para comunicação com servidor
// ============================================

console.log("🚀 SyncAds Extension - Background Script Loaded v1.0.0");

// ============================================
// CONFIGURAÇÃO GLOBAL
// ============================================
const CONFIG = {
  serverUrl: "https://syncads.com.br",
  apiUrl: "https://syncads-python-microservice-production.up.railway.app",
  pollInterval: 3000, // 3 segundos
  reconnectDelay: 5000, // 5 segundos
  version: "1.0.0",
  allowedDomains: ["syncads.com.br", "localhost"],
};

// ============================================
// ESTADO GLOBAL
// ============================================
let state = {
  deviceId: null,
  userId: null,
  isConnected: false,
  isPolling: false,
  lastPollTime: null,
  commandQueue: [],
  activeCommands: new Map(),
  stats: {
    commandsExecuted: 0,
    commandsSuccess: 0,
    commandsFailed: 0,
    lastActivity: null,
  },
};

// ============================================
// INICIALIZAÇÃO
// ============================================
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason);

  if (details.reason === "install") {
    console.log("🎉 First time installation");
    await initialize();

    // Abrir página de boas-vindas
    chrome.tabs.create({
      url: `${CONFIG.serverUrl}/extension-setup`,
    });
  } else if (details.reason === "update") {
    console.log("🔄 Extension updated");
    await initialize();
  }
});

// Inicializar ao startar
chrome.runtime.onStartup.addListener(async () => {
  console.log("🔌 Extension startup");
  await initialize();
});

// ============================================
// FUNÇÃO DE INICIALIZAÇÃO
// ============================================
async function initialize() {
  try {
    // Carregar configuração do storage
    const stored = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "config",
    ]);

    // Gerar ou recuperar deviceId
    if (!stored.deviceId) {
      state.deviceId = generateDeviceId();
      await chrome.storage.local.set({ deviceId: state.deviceId });
      console.log("🆔 Generated new deviceId:", state.deviceId);
    } else {
      state.deviceId = stored.deviceId;
      console.log("🆔 Loaded deviceId:", state.deviceId);
    }

    // Recuperar userId se existir
    if (stored.userId) {
      state.userId = stored.userId;
      console.log("👤 User logged in:", state.userId);

      // Conectar automaticamente se usuário logado
      await connectToServer();
    } else {
      console.log("⚠️ User not logged in");
    }

    // Atualizar badge
    updateBadge();
  } catch (error) {
    console.error("❌ Initialization error:", error);
  }
}

// ============================================
// GERAÇÃO DE DEVICE ID
// ============================================
function generateDeviceId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `device_${timestamp}_${random}`;
}

// ============================================
// CONEXÃO COM SERVIDOR
// ============================================
async function connectToServer() {
  if (state.isConnected) {
    console.log("ℹ️ Already connected");
    return;
  }

  if (!state.userId) {
    console.log("⚠️ Cannot connect: No userId");
    return;
  }

  try {
    console.log("🔌 Connecting to server...");

    // Registrar dispositivo
    const response = await fetch(`${CONFIG.apiUrl}/api/extension/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: state.deviceId,
        userId: state.userId,
        browser: getBrowserInfo(),
        version: CONFIG.version,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
    }

    const data = await response.json();
    console.log("✅ Connected to server:", data);

    state.isConnected = true;
    state.stats.lastActivity = Date.now();

    // Atualizar badge
    updateBadge();

    // Iniciar polling de comandos
    startCommandPolling();

    // Notificar popup
    chrome.runtime
      .sendMessage({
        type: "CONNECTION_STATUS",
        connected: true,
      })
      .catch(() => {});
  } catch (error) {
    console.error("❌ Connection error:", error);
    state.isConnected = false;
    updateBadge();

    // Tentar reconectar
    console.log(`🔄 Reconnecting in ${CONFIG.reconnectDelay / 1000}s...`);
    setTimeout(connectToServer, CONFIG.reconnectDelay);
  }
}

// ============================================
// DISCONNECT
// ============================================
async function disconnect() {
  console.log("🔌 Disconnecting...");

  state.isConnected = false;
  state.isPolling = false;

  updateBadge();

  // Notificar popup
  chrome.runtime
    .sendMessage({
      type: "CONNECTION_STATUS",
      connected: false,
    })
    .catch(() => {});
}

// ============================================
// POLLING DE COMANDOS
// ============================================
async function startCommandPolling() {
  if (state.isPolling) {
    console.log("ℹ️ Already polling");
    return;
  }

  state.isPolling = true;
  console.log("📡 Started command polling");

  pollCommands();
}

async function pollCommands() {
  if (!state.isConnected || !state.isPolling) {
    return;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `${CONFIG.apiUrl}/api/extension/commands?deviceId=${state.deviceId}`,
      { signal: controller.signal },
    );

    clearTimeout(timeoutId);

    if (response.ok) {
      const result = await response.json();

      if (result.commands && result.commands.length > 0) {
        console.log(`📨 Received ${result.commands.length} command(s)`);

        for (const command of result.commands) {
          await executeCommand(command);
        }
      }

      state.lastPollTime = Date.now();
    }
  } catch (error) {
    if (error.name === "AbortError") {
      // Timeout normal, continuar
    } else {
      console.error("❌ Polling error:", error);
    }
  }

  // Próximo poll
  if (state.isPolling) {
    setTimeout(pollCommands, CONFIG.pollInterval);
  }
}

// ============================================
// EXECUÇÃO DE COMANDOS
// ============================================
async function executeCommand(command) {
  console.log("⚡ Executing command:", command.type, command.id);

  state.activeCommands.set(command.id, command);
  state.stats.commandsExecuted++;

  let result;

  try {
    switch (command.type) {
      case "DOM_READ":
      case "DOM_CLICK":
      case "DOM_FILL":
      case "DOM_WAIT":
        result = await executeDOMCommand(command);
        break;

      case "NAVIGATE":
        result = await executeNavigate(command);
        break;

      case "SCREENSHOT":
        result = await executeScreenshot(command);
        break;

      case "SCRIPT":
        result = await executeScript(command);
        break;

      case "EXTRACT_DATA":
        result = await extractData(command);
        break;

      default:
        result = {
          success: false,
          error: `Unknown command type: ${command.type}`,
        };
    }

    if (result.success) {
      state.stats.commandsSuccess++;
      console.log("✅ Command executed successfully:", command.id);
    } else {
      state.stats.commandsFailed++;
      console.log("❌ Command failed:", command.id, result.error);
    }
  } catch (error) {
    console.error("❌ Command execution error:", error);
    result = {
      success: false,
      error: error.message,
    };
    state.stats.commandsFailed++;
  }

  // Enviar resultado
  await sendResult(command.id, result);

  state.activeCommands.delete(command.id);
  state.stats.lastActivity = Date.now();
  updateBadge();
}

// ============================================
// EXECUTAR COMANDO DOM
// ============================================
async function executeDOMCommand(command) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tabs || tabs.length === 0) {
    return { success: false, error: "No active tab" };
  }

  const tab = tabs[0];

  // Injetar content script se necessário
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content-script.js"],
    });
  } catch (error) {
    // Content script já pode estar injetado
  }

  // Enviar comando para content script
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, command, (response) => {
      if (chrome.runtime.lastError) {
        resolve({
          success: false,
          error: chrome.runtime.lastError.message,
        });
      } else {
        resolve(response || { success: false, error: "No response" });
      }
    });
  });
}

// ============================================
// NAVEGAR
// ============================================
async function executeNavigate(command) {
  try {
    const { url, newTab = false } = command;

    if (newTab) {
      await chrome.tabs.create({ url });
    } else {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { url });
      } else {
        await chrome.tabs.create({ url });
      }
    }

    return {
      success: true,
      message: `Navigated to ${url}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// SCREENSHOT
// ============================================
async function executeScreenshot(command) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs || tabs.length === 0) {
      return { success: false, error: "No active tab" };
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: "png",
      quality: 90,
    });

    return {
      success: true,
      screenshot: dataUrl,
      timestamp: Date.now(),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// EXECUTAR SCRIPT
// ============================================
async function executeScript(command) {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tabs || tabs.length === 0) {
      return { success: false, error: "No active tab" };
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: new Function(command.code),
    });

    return {
      success: true,
      result: results[0]?.result,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// ============================================
// EXTRAIR DADOS
// ============================================
async function extractData(command) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tabs || tabs.length === 0) {
    return { success: false, error: "No active tab" };
  }

  return executeDOMCommand({
    type: "DOM_READ",
    selector: command.selector,
    id: command.id,
  });
}

// ============================================
// ENVIAR RESULTADO
// ============================================
async function sendResult(commandId, result) {
  try {
    await fetch(`${CONFIG.apiUrl}/api/extension/result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: state.deviceId,
        commandId,
        result,
        timestamp: Date.now(),
      }),
    });

    console.log("📤 Result sent for command:", commandId);
  } catch (error) {
    console.error("❌ Failed to send result:", error);
  }
}

// ============================================
// ENVIAR LOG
// ============================================
async function sendLog(log) {
  try {
    await fetch(`${CONFIG.apiUrl}/api/extension/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: state.deviceId,
        userId: state.userId,
        ...log,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    console.error("❌ Failed to send log:", error);
  }
}

// ============================================
// BROWSER INFO
// ============================================
function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    vendor: navigator.vendor,
    version: CONFIG.version,
  };
}

// ============================================
// ATUALIZAR BADGE
// ============================================
function updateBadge() {
  if (state.isConnected) {
    chrome.action.setBadgeText({ text: "✓" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    chrome.action.setTitle({ title: "SyncAds - Conectado" });
  } else if (state.userId) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    chrome.action.setTitle({ title: "SyncAds - Desconectado" });
  } else {
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setTitle({ title: "SyncAds - Login necessário" });
  }
}

// ============================================
// LISTENERS DE MENSAGENS
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Message received:", request.type);

  if (request.type === "GET_STATE") {
    sendResponse({
      ...state,
      config: CONFIG,
    });
    return true;
  }

  if (request.type === "LOGIN") {
    state.userId = request.userId;
    chrome.storage.local.set({ userId: request.userId });
    connectToServer();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "LOGOUT") {
    state.userId = null;
    chrome.storage.local.remove("userId");
    disconnect();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "RECONNECT") {
    connectToServer();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "SEND_LOG") {
    sendLog(request.log);
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "GET_STATS") {
    sendResponse(state.stats);
    return true;
  }

  return true;
});

// ============================================
// LISTENER DE TABS
// ============================================
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && state.isConnected) {
    sendLog({
      action: "TAB_UPDATED",
      message: `Tab loaded: ${tab.url}`,
      data: {
        tabId,
        url: tab.url,
        title: tab.title,
      },
    });
  }

  // Detectar login automático quando o painel é carregado
  if (changeInfo.status === "complete" && tab.url) {
    const url = new URL(tab.url);
    const isDomain = CONFIG.allowedDomains.some((domain) =>
      url.hostname.includes(domain),
    );

    if (isDomain && !state.userId) {
      // Tentar detectar login automaticamente
      setTimeout(() => {
        detectAutoLogin(tabId);
      }, 1000);
    }
  }
});

// ============================================
// DETECÇÃO AUTOMÁTICA DE LOGIN
// ============================================
async function detectAutoLogin(tabId) {
  try {
    console.log("🔍 Tentando detectar login automático...");

    // Executar script para verificar se há userId no localStorage
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          // Tentar pegar do localStorage
          const authData = localStorage.getItem("supabase.auth.token");
          if (authData) {
            const parsed = JSON.parse(authData);
            return {
              userId: parsed?.currentSession?.user?.id,
              email: parsed?.currentSession?.user?.email,
              found: true,
            };
          }

          // Tentar alternativas
          const userId = localStorage.getItem("userId");
          if (userId) {
            return { userId, found: true };
          }

          return { found: false };
        } catch (e) {
          return { found: false, error: e.message };
        }
      },
    });

    const result = results[0]?.result;

    if (result?.found && result?.userId) {
      console.log("✅ Login detectado automaticamente:", result.userId);

      // Salvar userId
      state.userId = result.userId;
      await chrome.storage.local.set({ userId: result.userId });

      // Conectar ao servidor
      await connectToServer();

      // Notificar popup
      chrome.runtime
        .sendMessage({
          type: "LOGIN_SUCCESS",
          userId: result.userId,
          email: result.email,
        })
        .catch(() => {});

      console.log("🎉 Extensão conectada automaticamente!");
    } else {
      console.log("ℹ️ Usuário não está logado no painel");
    }
  } catch (error) {
    console.error("❌ Erro ao detectar login:", error);
  }
}

// ============================================
// INICIALIZAR AUTOMATICAMENTE
// ============================================
initialize();

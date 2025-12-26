// ============================================
// SYNCADS EXTENSION - BACKGROUND SCRIPT v5.0
// Side Panel Architecture + Token Management
// ============================================

try {
  importScripts('supabase.js', 'realtime-client.js');
  console.log("✅ [IMPORTS] Supabase & Realtime scripts imported");
} catch (e) {
  console.error("❌ [IMPORTS] Failed to import scripts:", e);
}


console.log(
  "🚀 SyncAds Extension v5.0 - Background Service Worker Initializing...",
);

// ============================================
// SIDE PANEL HANDLER
// ============================================

// Abrir side panel ao clicar no ícone da extensão
chrome.action.onClicked.addListener((tab) => {
  console.log("🎯 [SIDE PANEL] Extension icon clicked, opening side panel...");

  chrome.sidePanel
    .open({ windowId: tab.windowId })
    .then(() => {
      console.log("✅ [SIDE PANEL] Side panel opened successfully");
    })
    .catch((error) => {
      console.error("❌ [SIDE PANEL] Error opening side panel:", error);
    });
});

// Garantir que o side panel esteja disponível
chrome.runtime.onInstalled.addListener(() => {
  console.log("📦 [SIDE PANEL] Extension installed/updated");

  chrome.sidePanel
    .setPanelBehavior({ openPanelOnActionClick: true })
    .then(() => {
      console.log("✅ [SIDE PANEL] Panel behavior set");
    })
    .catch((error) => {
      console.warn("⚠️ [SIDE PANEL] Could not set panel behavior:", error);
    });
});

console.log("✅ [SIDE PANEL] Handlers registered");

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  supabaseUrl: "https://ovskepqggmxlfckxqgbr.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
  functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
  restUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/rest/v1",
  version: "4.0.0",

  // Retry & Timeout Configuration
  retry: {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
  },

  token: {
    refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes before expiry
    checkInterval: 60 * 1000, // Check every minute
  },

  keepAlive: {
    interval: 25 * 1000, // Keep SW alive every 25 seconds
  },
};

const COMMAND_TIMEOUT = 30000;

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
  deviceId: null,
  userId: null,
  userEmail: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiresAt: null,
  isConnected: false,
  isInitialized: false,
  lastActivity: null,

  // Runtime state
  pendingMessages: [],
  isProcessingToken: false,
  refreshTimer: null,
  keepAliveTimer: null,

  // Reconnection state
  reconnectionAttempts: 0,
  maxReconnectAttempts: 3,
};

// ============================================
// LOGGING UTILITIES
// ============================================
const Logger = {
  info: (message, data = {}) => {
    console.log(`ℹ️ [INFO] ${message}`, data);
    sendLogToSupabase("info", message, data).catch(() => { });
  },

  success: (message, data = {}) => {
    console.log(`✅ [SUCCESS] ${message}`, data);
    sendLogToSupabase("success", message, data).catch(() => { });
  },

  warn: (message, data = {}) => {
    console.warn(`⚠️ [WARN] ${message}`, data);
    sendLogToSupabase("warning", message, data).catch(() => { });
  },

  error: (message, error = null, data = {}) => {
    console.error(`❌ [ERROR] ${message}`, error, data);
    sendLogToSupabase("error", message, {
      ...data,
      error: error?.message,
    }).catch(() => { });
  },

  debug: (message, data = {}) => {
    console.log(`🔍 [DEBUG] ${message}`, data);
  },
};

// ============================================
// CONTEXT RECONNECTION HANDLER
// ============================================
async function handleContextInvalidation() {
  if (state.reconnectionAttempts >= state.maxReconnectAttempts) {
    Logger.error("Max reconnection attempts reached");
    return false;
  }

  state.reconnectionAttempts++;
  Logger.info(
    `Attempting context reconnection (${state.reconnectionAttempts}/${state.maxReconnectAttempts})`,
  );

  try {
    // Recarregar estado do storage
    const stored = await chrome.storage.local.get([
      "userId",
      "accessToken",
      "deviceId",
      "refreshToken",
      "tokenExpiresAt",
    ]);

    if (stored.userId && stored.accessToken) {
      state.userId = stored.userId;
      state.accessToken = stored.accessToken;
      state.deviceId = stored.deviceId;
      state.refreshToken = stored.refreshToken;
      state.tokenExpiresAt = stored.tokenExpiresAt;
      state.isConnected = true;

      // Reiniciar heartbeat e polling
      startHeartbeat();
      // Reiniciar heartbeat e polling
      startHeartbeat();
      startKeepAlive();

      // REALTIME INIT
      setTimeout(() => initRealtimeConnection(), 1000); // Delay safe


      // REALTIME RECONNECT
      setTimeout(() => initRealtimeConnection(), 1000);

      Logger.success("Context reconnected successfully");
      state.reconnectionAttempts = 0;
      return true;
    } else {
      Logger.warn("Cannot reconnect: missing credentials in storage");
      return false;
    }
  } catch (error) {
    Logger.error("Context reconnection failed", error);
    return false;
  }
}

// ============================================
// COMMAND POLLING (NEW)
// ============================================
async function checkPendingCommands() {
  if (!state.accessToken || !state.deviceId) {
    Logger.debug("Skipping command check: not authenticated");
    return;
  }

  try {
    // Buscar comandos PENDING para este dispositivo
    const response = await fetch(
      `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=eq.pending&order=created_at.asc&limit=10`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      Logger.warn("Failed to fetch commands", { status: response.status });
      return;
    }

    const commands = await response.json();

    if (commands.length === 0) {
      Logger.debug("No pending commands");
      return;
    }

    Logger.info(`📦 Found ${commands.length} pending commands`);

    // Processar cada comando
    for (const cmd of commands) {
      await processCommand(cmd);
    }
  } catch (error) {
    Logger.error("Error checking commands", error);
  }
}

async function processCommand(cmd) {
  Logger.info("Processing command", {
    id: cmd.id,
    type: cmd.type,
    value: cmd.value,
    options: cmd.options,
    selector: cmd.selector,
  });

  try {
    // Marcar como PROCESSING
    await updateCommandStatus(cmd.id, "processing", {
      started_at: new Date().toISOString(),
    });

    // Obter tab ativa (tenta encontrar uma)
    let [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Se não achou tab ativa, e comando é NAVIGATE, vamos criar uma nova.
    // Para outros comandos, precisamos de uma tab ativa.
    if (!activeTab && cmd.type !== "NAVIGATE") {
      throw new Error("No active tab found");
    }

    if (activeTab) {
      Logger.info("Active tab found", {
        tabId: activeTab.id,
        url: activeTab.url,
        title: activeTab.title,
      });

      // Verificar se a tab está pronta
      if (!activeTab.id || activeTab.discarded) {
        // Se comando for NAVIGATE, não tem problema, vamos criar/atualizar
        if (cmd.type !== "NAVIGATE") {
          throw new Error("Tab is not ready");
        }
      }
    } else {
      Logger.warn("No active tab found, but proceeding for NAVIGATE command");
    }

    // Montar parâmetros baseado no tipo
    let params = {};
    let action = cmd.type;

    if (cmd.type === "NAVIGATE") {
      params = { url: cmd.options?.url || cmd.value };
      action = "NAVIGATE";
      Logger.info("NAVIGATE command detected", { url: params.url });
    } else if (cmd.type === "DOM_CLICK") {
      params = { selector: cmd.selector };
      action = "CLICK";
    } else if (cmd.type === "DOM_FILL") {
      params = { selector: cmd.selector, value: cmd.value };
      action = "FILL";
    } else if (cmd.type === "DOM_SCROLL") {
      params = { y: cmd.value || 500 };
      action = "SCROLL";
    } else if (cmd.type === "SCAN_PAGE") {
      action = "SCAN_PAGE"; // Special handler
    } else if (cmd.type === "SCREENSHOT") {
      // 3C. Implementação Nativa de Screenshot
      Logger.info("📸 Executing SCREENSHOT natively in background...");
      try {
        const screenshotBase64 = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "png", quality: 80 });
        response = { success: true, base64: screenshotBase64 };
        // Evitar envio ao content script
        action = "SCREENSHOT_NATIVE";
      } catch (err) {
        Logger.error("Native screenshot failed", err);
        throw new Error("Screenshot capture failed: " + err.message);
      }
    } else {
      params = cmd.options || {};
      action = cmd.type.replace("DOM_", "");
    }


    // 3A. Se for NAVIGATE, executar NATIVAMENTE no background (evita erro de conexão)
    if (cmd.type === "NAVIGATE") {
      Logger.info("🌐 Executing NAVIGATE natively in background...", { url: params.url });

      let targetTabId;

      if (activeTab?.id) {
        // Atualizar tab existente
        await chrome.tabs.update(activeTab.id, { url: params.url });
        targetTabId = activeTab.id;
      } else {
        // Criar nova tab se não existir
        const newTab = await chrome.tabs.create({ url: params.url, active: true });
        targetTabId = newTab.id;
      }

      Logger.info("⏳ Waiting for navigation to complete...", { targetTabId });
      await waitForNavigation(targetTabId, 30000); // 30s timeout

      // Pular o envio de mensagem para content script pois já navegamos
      Logger.success("✅ Navigation completed natively");

      // Mock response para o restante do fluxo
      response = { success: true, native: true };
    }
    else {
      // Pular se for ação nativa já resolvida (NAVIGATE ou SCREENSHOT_NATIVE)
      if (action === "SCREENSHOT_NATIVE") {
        Logger.success("✅ Screenshot captured natively, skipping content script");
      }
      else {
        if (!activeTab) throw new Error("Need active tab for this command");

        // 3B. Outros comandos (CLICK, FILL, SCAN) vão para o content script

        Logger.info("Sending message to content script", {
          action,
          params,
          tabId: activeTab.id,
        });

        // Enviar comando para content-script com timeout
        response = await Promise.race([
          new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(
              activeTab.id,
              {
                type: "EXECUTE_DOM_ACTION",
                action: action,
                params: params,
              },
              async (response) => {
                if (chrome.runtime.lastError) {
                  const error = chrome.runtime.lastError.message;
                  Logger.error("SendMessage error", null, { error });

                  // NOVO: detectar context invalidated
                  if (error.includes("Extension context invalidated")) {
                    Logger.warn(
                      "Context invalidated detected, attempting reconnection...",
                    );
                    const reconnected = await handleContextInvalidation();

                    if (reconnected) {
                      // Retry comando após reconexão
                      return reject(new Error("RETRY_AFTER_RECONNECT"));
                    }
                  }

                  reject(new Error(error));
                } else {
                  Logger.success("Response received from content script", {
                    response,
                  });
                  resolve(response);
                }
              },
            );
          }),
          new Promise((_, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(`Command timeout after ${COMMAND_TIMEOUT / 1000}s`),
                ),
              COMMAND_TIMEOUT,
            ),
          ),
        ]);
      }
    }

    // HANDLER ESPECÍFICO PARA SCAN_PAGE (Backend Side processing)
    if (cmd.type === "SCAN_PAGE") {
      Logger.info("📸 Capturing screenshot for SCAN_PAGE...");
      try {
        const screenshotBase64 = await chrome.tabs.captureVisibleTab(activeTab.windowId, { format: "png", quality: 80 });
        const fileName = `${state.userId}/${Date.now()}_scan.png`;

        // Upload to Supabase Storage
        // Usar fetch direto para evitar problemas com lib
        const blob = await (await fetch(screenshotBase64)).blob();

        const uploadRes = await fetch(`${CONFIG.supabaseUrl}/storage/v1/object/screenshots/${fileName}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${state.accessToken}`,
            "apikey": CONFIG.supabaseAnonKey,
            "Content-Type": "image/png"
          },
          body: blob
        });

        if (!uploadRes.ok) throw new Error("Upload failed: " + await uploadRes.text());

        const screenshotUrl = `${CONFIG.supabaseUrl}/storage/v1/object/public/screenshots/${fileName}`;
        Logger.success("📸 Screenshot uploaded: " + screenshotUrl);

        // Anexar ao response
        response.screenshotUrl = screenshotUrl;

      } catch (screenError) {
        Logger.error("Screenshot capture failed", screenError);
        response.screenshotError = screenError.message;
      }
    }

    Logger.success("Command executed successfully", { response });

    // Aguardar navegação completar (mais tempo para NAVIGATE)
    if (cmd.type === "NAVIGATE") {
      Logger.info("Waiting for navigation to complete...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Pegar informações ATUAIS da tab para confirmar execução
    const [updatedTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const confirmationData = {
      executed: true,
      commandType: cmd.type,
      currentUrl: updatedTab?.url || activeTab?.url || "unknown",
      currentTitle: updatedTab?.title || activeTab?.title || "unknown",
      originalResponse: response,
      timestamp: new Date().toISOString(),
    };

    // Marcar como COMPLETED
    await updateCommandStatus(cmd.id, "completed", {
      result: confirmationData,
      completed_at: new Date().toISOString(),
    });

    Logger.success("✅ Command executed and confirmed", {
      id: cmd.id,
      type: cmd.type,
      url: confirmationData.currentUrl,
    });
  } catch (error) {
    // NOVO: retry logic para RETRY_AFTER_RECONNECT
    if (error.message === "RETRY_AFTER_RECONNECT") {
      Logger.info("Retrying command after reconnection...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return processCommand(cmd); // Recursivo - tentar novamente
    }

    Logger.error("❌ Command execution failed", error, {
      id: cmd.id,
      type: cmd.type,
      errorMessage: error.message,
    });

    // Marcar como falha
    await updateCommandStatus(cmd.id, "failed", null, error.message);
  }
}

// Helper: Wait for tab to complete loading
// Helper: Wait for tab to complete loading
function waitForNavigation(tabId, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    // 1. Check if already complete
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        return reject(new Error(chrome.runtime.lastError.message));
      }
      if (tab && tab.status === 'complete') {
        return resolve(tab);
      }
    });

    // 2. Setup listener for future updates
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timeout waiting for tab ${tabId} to load`));
    }, timeoutMs);

    function onUpdated(tid, changeInfo, tab) {
      if (tid === tabId && changeInfo.status === 'complete') {
        cleanup();
        resolve(tab);
      }
    }

    function onRemoved(tid) {
      if (tid === tabId) {
        cleanup();
        reject(new Error(`Tab ${tabId} was closed during loading`));
      }
    }

    function cleanup() {
      clearTimeout(timer);
      try {
        chrome.tabs.onUpdated.removeListener(onUpdated);
        chrome.tabs.onRemoved.removeListener(onRemoved);
      } catch (e) { /* ignore */ }
    }

    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.tabs.onRemoved.addListener(onRemoved);
  });
}

async function updateCommandStatus(commandId, status, extraData = {}) {
  try {
    const response = await fetch(
      `${CONFIG.restUrl}/extension_commands?id=eq.${commandId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          status,
          ...extraData,
        }),
      },
    );

    if (response.ok) {
      Logger.debug("Command status updated", { commandId, status });
    } else {
      Logger.warn("Failed to update command status", {
        commandId,
        status: response.status,
      });
    }
  } catch (error) {
    Logger.error("Failed to update command status", error);
  }
}

// ============================================
// SCREENSHOT HANDLER
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CAPTURE_SCREENSHOT") {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
          format: "png",
          quality: 90,
        });

        sendResponse({ success: true, screenshot: dataUrl });
      } catch (error) {
        Logger.error("Screenshot capture failed", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep channel open for async response
  }

  if (message.type === "LIST_TABS") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});
        const tabsList = tabs.map((tab) => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          active: tab.active,
          windowId: tab.windowId,
        }));

        sendResponse({ success: true, tabs: tabsList, count: tabsList.length });
      } catch (error) {
        Logger.error("List tabs failed", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep channel open for async response
  }

  if (message.type === "OPEN_NEW_TAB") {
    (async () => {
      try {
        const newTab = await chrome.tabs.create({
          url: message.url,
          active: true,
        });

        sendResponse({ success: true, tabId: newTab.id, url: message.url });
      } catch (error) {
        Logger.error("Open new tab failed", error);
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // Keep channel open for async response
  }
});

// ============================================
// SERVICE WORKER KEEP-ALIVE
// ============================================
function startKeepAlive() {
  Logger.debug("Starting keep-alive, polling, and REALTIME...");

  // REALTIME START
  initRealtimeConnection();


  // Main keep-alive interval (ping to stay awake)
  state.keepAliveTimer = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => { });
  }, CONFIG.keepAlive.interval);

  // Command polling interval (check for new commands)
  if (state.commandTimer) clearInterval(state.commandTimer);
  state.commandTimer = setInterval(checkPendingCommands, 5000); // 5 segundos (menos agressivo)

  Logger.debug("Keep-alive started", {
    interval: CONFIG.keepAlive.interval,
    polling: 5000,
  });
}

// ============================================
// HEARTBEAT PARA MANTER STATUS ONLINE
// ============================================
async function sendHeartbeat() {
  if (!state.userId || !state.deviceId || !state.accessToken) {
    Logger.debug("Skipping heartbeat: not authenticated");
    return;
  }

  try {
    // Tentar atualizar heartbeat (PATCH)
    // Se dispositivo não existir, isso vai falhar (404/PGRST116 ou '[]' dependendo do retorno)
    const response = await fetch(
      `${CONFIG.restUrl}/extension_devices?device_id=eq.${state.deviceId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
          Prefer: "return=representation", // Para saber se atualizou algo
        },
        body: JSON.stringify({
          status: "online",
          last_seen: new Date().toISOString(),
        }),
      },
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        Logger.debug("💓 Heartbeat OK");
        state.lastActivity = Date.now();
        await chrome.storage.local.set({
          lastActivity: state.lastActivity,
          isConnected: true,
        });
        return; // Sucesso
      } else {
        Logger.warn("Heartbeat updated 0 rows (device not found?)");
      }
    } else {
      Logger.warn("Heartbeat PATCH failed", { status: response.status });
    }

    // Se chegou aqui, falhou a atualização. Tentar registrar novamente.
    Logger.info("Heartbeat failed or device missing. Attempting re-registration...");
    await registerDevice();

  } catch (error) {
    Logger.error("Heartbeat error", error);
  }
}

// Iniciar heartbeat
let heartbeatInterval = null;

function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  sendHeartbeat(); // Executar imediatamente
  heartbeatInterval = setInterval(sendHeartbeat, 30000);
  Logger.info("Heartbeat started (30s interval)");
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    Logger.info("Heartbeat stopped");
  }
}

// Inicializar se já estiver rodando
if (heartbeatInterval) clearInterval(heartbeatInterval);
heartbeatInterval = setInterval(sendHeartbeat, 30000);
// sendHeartbeat(); // Removido chamada imediata global para evitar race condition na inicialização


// ============================================
// WAIT FOR SERVICE WORKER
// ============================================
async function waitForServiceWorker(maxAttempts = 5, delayMs = 200) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const info = await chrome.runtime.getPlatformInfo();
      if (info) {
        Logger.debug(`Service Worker ready (attempt ${i + 1})`);
        return true;
      }
    } catch (error) {
      Logger.debug(`Waiting for SW... (attempt ${i + 1}/${maxAttempts})`);
      await sleep(delayMs);
    }
  }

  Logger.warn("Service Worker not ready after max attempts");
  return false;
}

// ============================================
// SAFE MESSAGE SENDER WITH RETRY LOGIC
// ============================================
async function sendMessageSafe(tabId, message, options = {}) {
  const {
    maxRetries = CONFIG.retry.maxAttempts,
    initialDelay = CONFIG.retry.initialDelay,
    timeout = 10000,
  } = options;

  let lastError = null;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Wait for SW if this is first attempt
      if (attempt === 1) {
        await waitForServiceWorker();
      }

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Message timeout")), timeout);
      });

      // Send message with timeout
      const responsePromise = chrome.tabs.sendMessage(tabId, message);
      const response = await Promise.race([responsePromise, timeoutPromise]);

      Logger.debug(`Message sent successfully to tab ${tabId}`, {
        message,
        attempt,
      });
      return { success: true, data: response };
    } catch (error) {
      lastError = error;
      const errorMsg = error?.message || "Unknown error";

      Logger.debug(
        `Send message attempt ${attempt}/${maxRetries} failed: ${errorMsg}`,
      );

      // Don't retry on certain errors
      if (
        errorMsg.includes("Tab not found") ||
        errorMsg.includes("No tab with id") ||
        errorMsg.includes("Receiving end does not exist")
      ) {
        Logger.warn("Tab or receiver not available, stopping retries");
        break;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        await sleep(delay);
        delay = Math.min(
          delay * CONFIG.retry.backoffMultiplier,
          CONFIG.retry.maxDelay,
        );
      }
    }
  }

  Logger.error("Failed to send message after all retries", lastError, {
    tabId,
    message,
  });
  return { success: false, error: lastError?.message || "Message send failed" };
}

// ============================================
// TOKEN VALIDATION
// ============================================
function isTokenValid(token, expiresAt) {
  if (!token) return false;

  // Check if token is JWT format
  const parts = token.split(".");
  if (parts.length !== 3) {
    Logger.warn("Invalid JWT format");
    return false;
  }

  // Check expiration
  if (expiresAt) {
    const expiryDate = new Date(expiresAt * 1000);
    const now = new Date();
    const timeUntilExpiry = expiryDate - now;

    if (timeUntilExpiry <= 0) {
      Logger.warn("Token expired", {
        expiresAt: expiryDate.toISOString(),
        now: now.toISOString(),
      });
      return false;
    }

    // Check if needs refresh soon
    if (timeUntilExpiry < CONFIG.token.refreshBeforeExpiry) {
      Logger.info("Token expiring soon, should refresh", {
        timeUntilExpiry: Math.floor(timeUntilExpiry / 1000 / 60) + " minutes",
      });
    }
  }

  return true;
}

function shouldRefreshToken() {
  if (!state.tokenExpiresAt || !state.accessToken) return false;

  const expiryDate = new Date(state.tokenExpiresAt * 1000);
  const now = new Date();
  const timeUntilExpiry = expiryDate - now;

  return (
    timeUntilExpiry > 0 && timeUntilExpiry < CONFIG.token.refreshBeforeExpiry
  );
}

// ============================================
// TOKEN REFRESH
// ============================================
async function refreshAccessToken() {
  if (!state.refreshToken) {
    Logger.warn("No refresh token available");
    return false;
  }

  try {
    Logger.info("Refreshing access token...");

    const response = await fetch(
      `${CONFIG.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.supabaseAnonKey,
        },
        body: JSON.stringify({
          refresh_token: state.refreshToken,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      Logger.error("Token refresh failed", null, {
        status: response.status,
        error,
      });
      return false;
    }

    const data = await response.json();

    if (data.access_token) {
      state.accessToken = data.access_token;
      state.tokenExpiresAt = data.expires_at;

      if (data.refresh_token) {
        state.refreshToken = data.refresh_token;
      }

      // Save to storage
      await chrome.storage.local.set({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiresAt: state.tokenExpiresAt,
      });

      Logger.success("Token refreshed successfully", {
        expiresIn:
          Math.floor(
            (new Date(data.expires_at * 1000) - new Date()) / 1000 / 60,
          ) + " minutes",
      });

      return true;
    }

    // Restart Realtime with new token
    restartRealtime().catch(e => console.error("Realtime restart failed", e));

    return false;
  } catch (error) {
    Logger.error("Token refresh exception", error);
    return false;
  }
}

// ============================================
// AUTO TOKEN REFRESH SCHEDULER
// ============================================
function startTokenRefreshScheduler() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
  }

  state.refreshTimer = setInterval(async () => {
    if (shouldRefreshToken()) {
      Logger.info("Auto-refreshing token...");
      await refreshAccessToken();
    }
  }, CONFIG.token.checkInterval);

  Logger.info("Token refresh scheduler started");
}

function stopTokenRefreshScheduler() {
  if (state.refreshTimer) {
    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
    Logger.info("Token refresh scheduler stopped");
  }
}

// ============================================
// DEVICE REGISTRATION
// ============================================
async function registerDevice() {
  if (!state.accessToken || !state.userId) {
    Logger.error("Cannot register device: missing token or userId");
    return false;
  }

  // Validate token before registration
  if (!isTokenValid(state.accessToken, state.tokenExpiresAt)) {
    Logger.warn("Token invalid, attempting refresh...");
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      Logger.error("Cannot register device: token invalid and refresh failed");
      return false;
    }
  }

  const deviceData = {
    device_id: state.deviceId,
    browser_info: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      vendor: navigator.vendor || "unknown",
    },
    version: CONFIG.version,
  };

  try {
    Logger.info("Registering device via Edge Function...", {
      deviceId: state.deviceId,
    });

    const response = await fetch(`${CONFIG.functionsUrl}/extension-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify(deviceData),
    });

    if (response.ok) {
      const data = await response.json();
      Logger.success("Device registered via Edge Function", data);
      return true;
    }

    const errorText = await response.text();
    Logger.warn("Edge Function registration failed, trying direct API...", {
      status: response.status,
      error: errorText,
    });

    // Fallback to direct API
    return await registerDeviceDirectly();
  } catch (error) {
    Logger.error("Edge Function registration exception", error);
    return await registerDeviceDirectly();
  }
}

async function registerDeviceDirectly() {
  try {
    Logger.info("Registering device via REST API...");

    // Check if device exists
    const checkResponse = await fetch(
      `${CONFIG.restUrl}/extension_devices?device_id=eq.${state.deviceId}&user_id=eq.${state.userId}&select=*`,
      {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
          "Content-Type": "application/json",
        },
      },
    );

    const existing = await checkResponse.json();

    const devicePayload = {
      isOnline: true,
      lastSeen: new Date().toISOString(),
      version: CONFIG.version,
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
      },
    };

    if (existing && existing.length > 0) {
      // Update existing
      Logger.info("Updating existing device...");

      const updateResponse = await fetch(
        `${CONFIG.restUrl}/extension_devices?device_id=eq.${state.deviceId}&user_id=eq.${state.userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            apikey: CONFIG.supabaseAnonKey,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify(devicePayload),
        },
      );

      if (updateResponse.ok) {
        Logger.success("Device updated via REST API");
        return true;
      }

      const error = await updateResponse.text();
      Logger.error("Device update failed", null, { error });
      return false;
    } else {
      // Insert new
      Logger.info("Creating new device...");

      const createResponse = await fetch(
        `${CONFIG.restUrl}/extension_devices`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${state.accessToken}`,
            apikey: CONFIG.supabaseAnonKey,
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            deviceId: state.deviceId,
            userId: state.userId,
            ...devicePayload,
          }),
        },
      );

      if (createResponse.ok) {
        Logger.success("Device created via REST API");
        return true;
      }

      const error = await createResponse.text();
      Logger.error("Device creation failed", null, { error });
      return false;
    }
  } catch (error) {
    Logger.error("Direct registration exception", error);
    return false;
  }
}

// ============================================
// SEND LOG TO SUPABASE
// ============================================
async function sendLogToSupabase(level, message, data = {}) {
  if (!state.deviceId || !state.accessToken) return;

  try {
    await fetch(`${CONFIG.restUrl}/extension_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({
        device_id: state.deviceId,
        user_id: state.userId,
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (error) {
    // Silent fail - don't spam console
  }
}

// ============================================
// HANDLE AUTH TOKEN FROM CONTENT SCRIPT
// ============================================
async function handleAuthToken(data) {
  // Prevent concurrent token processing
  if (state.isProcessingToken) {
    Logger.warn("Already processing token, skipping...");
    return { success: false, error: "Already processing token" };
  }

  state.isProcessingToken = true;

  try {
    const { userId, email, accessToken, refreshToken, expiresAt } = data;

    Logger.info("Processing auth token...", {
      userId,
      email,
      hasRefreshToken: !!refreshToken,
      expiresAt: expiresAt
        ? new Date(expiresAt * 1000).toISOString()
        : "unknown",
    });

    // Validate required fields
    if (!userId || !accessToken) {
      throw new Error("Missing userId or accessToken");
    }

    // Validate token format and expiration
    if (!isTokenValid(accessToken, expiresAt)) {
      throw new Error("Invalid or expired token");
    }

    // Update state
    state.userId = userId;
    state.userEmail = email;
    state.accessToken = accessToken;
    state.refreshToken = refreshToken || null;
    state.tokenExpiresAt = expiresAt || null;
    state.lastActivity = Date.now();

    // Register device
    Logger.info("Registering device...");
    const registered = await registerDevice();

    if (!registered) {
      throw new Error("Device registration failed");
    }

    // Save to storage
    await chrome.storage.local.set({
      userId,
      userEmail: email,
      accessToken,
      refreshToken: state.refreshToken,
      tokenExpiresAt: expiresAt,
      isConnected: true,
      lastConnected: Date.now(),
      lastActivity: state.lastActivity,
      deviceId: state.deviceId,
    });

    Logger.info("Storage updated with connection data", {
      userId,
      deviceId: state.deviceId,
      isConnected: true,
      lastActivity: state.lastActivity,
    });

    state.isConnected = true;

    // Start heartbeat
    startHeartbeat();

    // Start token refresh scheduler
    if (state.refreshToken) {
      startTokenRefreshScheduler();
    }

    // Update UI
    updateBadge();
    notifyPopup({ action: "LOGIN_SUCCESS", userId, email });

    Logger.success("Extension connected successfully!", {
      userId,
      email,
      deviceId: state.deviceId,
    });

    return {
      success: true,
      message: "Connected successfully!",
      deviceId: state.deviceId,
    };
  } catch (error) {
    Logger.error("Auth token processing failed", error);

    // Reset state on error
    state.userId = null;
    state.accessToken = null;
    state.isConnected = false;
    updateBadge();

    return {
      success: false,
      error: error.message || "Authentication failed",
    };
  } finally {
    state.isProcessingToken = false;
  }
}

// ============================================
// DISCONNECT
// ============================================
async function disconnect() {
  Logger.info("Disconnecting extension...");

  // Stop schedulers
  stopTokenRefreshScheduler();
  stopHeartbeat();

  // Clear state
  state.userId = null;
  state.userEmail = null;
  state.accessToken = null;
  state.refreshToken = null;
  state.tokenExpiresAt = null;
  state.isConnected = false;

  // Clear storage (keep deviceId)
  await chrome.storage.local.remove([
    "userId",
    "userEmail",
    "accessToken",
    "refreshToken",
    "tokenExpiresAt",
    "isConnected",
    "lastConnected",
  ]);

  updateBadge();
  notifyPopup({ action: "LOGOUT" });

  Logger.info("Disconnected");
}

// ============================================
// UPDATE BADGE
// ============================================
function updateBadge() {
  if (state.isConnected) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#10b981" });
    chrome.action.setTitle({ title: "SyncAds - Connected ✓" });
  } else if (state.userId) {
    chrome.action.setBadgeText({ text: "!" });
    chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    chrome.action.setTitle({ title: "SyncAds - Connecting..." });
  } else {
    chrome.action.setBadgeText({ text: "" });
    chrome.action.setTitle({ title: "SyncAds - Not Connected" });
  }
}

// ============================================
// NOTIFY POPUP
// ============================================
function notifyPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Popup might not be open
  });
}

// ============================================
// MESSAGE LISTENER
// ============================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  Logger.debug("Message received", {
    type: request.type,
    sender: sender.tab?.id,
  });

  handleAsyncInternal(request)
    .then(sendResponse)
    .catch((error) => {
      Logger.error("Async handler error", error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});

// ============================================
// ASYNC HANDLER (GLOBAL SCOPE)
// ============================================
async function handleAsyncInternal(request) {
  try {
    switch (request.type) {
      case "AUTH_TOKEN_DETECTED":
        // Content script detectou token de autenticação
        Logger.info("Auth token detected from content script", {
          userId: request.data?.userId,
          email: request.data?.email,
        });

        try {
          // Salvar no state
          state.userId = request.data.userId;
          state.userEmail = request.data.email;
          state.accessToken = request.data.accessToken;
          state.refreshToken = request.data.refreshToken;
          state.tokenExpiresAt = request.data.expiresAt;
          state.isConnected = true;

          // Salvar no storage
          await chrome.storage.local.set({
            userId: state.userId,
            userEmail: state.userEmail,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            tokenExpiresAt: state.tokenExpiresAt,
            isConnected: true,
            lastActivity: Date.now(),
          });

          // Registrar device no Supabase
          const deviceData = {
            device_id: state.deviceId,
            user_id: state.userId,
            status: "online",
            last_seen: new Date().toISOString(),
            // browser: navigator.userAgent, // Coluna não existe no banco
            version: CONFIG.version,
          };

          Logger.info("Registering device in Supabase...", {
            deviceId: state.deviceId.substring(0, 12) + "...",
            userId: state.userId,
          });

          // Usar fetch direto com timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

          try {
            const registerResponse = await fetch(
              `${CONFIG.restUrl}/extension_devices?on_conflict=device_id`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${state.accessToken}`,
                  apikey: CONFIG.supabaseAnonKey,
                  Prefer: "resolution=merge-duplicates,return=minimal",
                },
                body: JSON.stringify(deviceData),
                signal: controller.signal,
              },
            );
            clearTimeout(timeoutId);

            if (!registerResponse.ok) {
              const errorText = await registerResponse.text();
              Logger.error("Device registration failed", {
                status: registerResponse.status,
                error: errorText,
              });
              return {
                success: false,
                error: `Registration failed: ${errorText}`,
              };
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            throw fetchError;
          }

          Logger.success("Device registered successfully!");

          // Iniciar heartbeat
          startHeartbeat();

          return {
            success: true,
            message: "Authentication successful",
            userId: state.userId,
            deviceId: state.deviceId,
          };
        } catch (error) {
          Logger.error("Auth token processing error", error);
          return { success: false, error: error.message };
        }

      case "GET_STATUS":
        return {
          success: true,
          data: {
            isConnected: state.isConnected,
            userId: state.userId,
            userEmail: state.userEmail,
            deviceId: state.deviceId,
            version: CONFIG.version,
          },
        };

      case "LIST_TABS":
        // Listar todas as abas abertas no navegador
        const tabs = await chrome.tabs.query({});
        const tabsList = tabs.map((tab) => ({
          id: tab.id,
          title: tab.title,
          url: tab.url,
          active: tab.active,
          windowId: tab.windowId,
          favIconUrl: tab.favIconUrl,
        }));

        Logger.info("Listing open tabs", { count: tabsList.length });

        return {
          success: true,
          data: {
            tabs: tabsList,
            count: tabsList.length,
            timestamp: Date.now(),
          },
        };

      // ============================================
      // COMANDOS DOM GERAIS - AUTOMAÇÃO WEB
      // ============================================

      case "CLICK_ELEMENT":
        // Clicar em elemento usando seletor CSS
        const clickTab = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!clickTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        await chrome.scripting.executeScript({
          target: { tabId: clickTab[0].id },
          func: (selector) => {
            const element = document.querySelector(selector);
            if (!element)
              return {
                success: false,
                error: `Elemento não encontrado: ${selector}`,
              };
            element.click();
            return { success: true, clicked: selector };
          },
          args: [request.data.selector],
        });

        return {
          success: true,
          action: "clicked",
          selector: request.data.selector,
        };

      case "TYPE_TEXT":
        // Digitar texto em campo usando seletor CSS
        const typeTab = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!typeTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        await chrome.scripting.executeScript({
          target: { tabId: typeTab[0].id },
          func: (selector, text) => {
            const element = document.querySelector(selector);
            if (!element)
              return {
                success: false,
                error: `Elemento não encontrado: ${selector}`,
              };

            if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
              element.value = text;
              element.dispatchEvent(new Event("input", { bubbles: true }));
              element.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
              element.textContent = text;
            }

            return { success: true, typed: text };
          },
          args: [request.data.selector, request.data.text],
        });

        return {
          success: true,
          action: "typed",
          selector: request.data.selector,
        };

      case "READ_TEXT":
        // Ler texto de elemento ou página inteira
        const readTab = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!readTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        const [readResult] = await chrome.scripting.executeScript({
          target: { tabId: readTab[0].id },
          func: (selector) => {
            if (selector) {
              const element = document.querySelector(selector);
              if (!element)
                return {
                  success: false,
                  error: `Elemento não encontrado: ${selector}`,
                };
              return {
                success: true,
                text: element.innerText || element.textContent,
              };
            } else {
              // Ler página inteira
              return { success: true, text: document.body.innerText };
            }
          },
          args: [request.data.selector],
        });

        return readResult.result;

      case "EXECUTE_JS":
        // Executar JavaScript personalizado na página
        const execTab = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!execTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        const [execResult] = await chrome.scripting.executeScript({
          target: { tabId: execTab[0].id },
          func: (code) => {
            try {
              const result = eval(code);
              return { success: true, result };
            } catch (error) {
              return { success: false, error: error.message };
            }
          },
          args: [request.data.code],
        });

        return execResult.result;

      case "SCROLL_TO":
        // Scroll para elemento ou posição
        const scrollTab = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!scrollTab[0])
          return { success: false, error: "Nenhuma aba ativa" };

        await chrome.scripting.executeScript({
          target: { tabId: scrollTab[0].id },
          func: (selector, position) => {
            if (selector) {
              const element = document.querySelector(selector);
              if (element) element.scrollIntoView({ behavior: "smooth" });
            } else if (position) {
              window.scrollTo({ top: position, behavior: "smooth" });
            }
          },
          args: [request.data.selector, request.data.position],
        });

        return { success: true, action: "scrolled" };

      case "WAIT":
        // Aguardar tempo em ms
        await new Promise((resolve) =>
          setTimeout(resolve, request.data.ms || 1000),
        );
        return { success: true, waited: request.data.ms };

      case "GET_PAGE_INFO":
        // Obter informações completas da página
        const infoTab = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!infoTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        const [infoResult] = await chrome.scripting.executeScript({
          target: { tabId: infoTab[0].id },
          func: () => {
            return {
              title: document.title,
              url: window.location.href,
              html: document.documentElement.outerHTML.substring(0, 5000), // Primeiros 5000 chars
              forms: Array.from(document.forms).map((f) => ({
                action: f.action,
                method: f.method,
                fields: Array.from(f.elements).map((e) => ({
                  name: e.name,
                  type: e.type,
                  value: e.value,
                })),
              })),
              links: Array.from(document.links)
                .slice(0, 50)
                .map((l) => ({
                  text: l.textContent,
                  href: l.href,
                })),
            };
          },
        });

        return { success: true, data: infoResult.result };

      case "DISCONNECT":
        await disconnect();
        return { success: true, message: "Disconnected" };

      case "REFRESH_TOKEN":
        const tokenRefreshed = await refreshAccessToken();
        return {
          success: tokenRefreshed,
          message: tokenRefreshed ? "Token refreshed" : "Refresh failed",
        };

      case "CAPTURE_SCREENSHOT":
        captureScreenshot(message.data).then(sendResponse);
        return true;

      case "VOICE_INPUT":
        handleVoiceInput(message.text);
        sendResponse({ success: true });
        return true;

      case "PING":
        return { success: true, message: "pong", timestamp: Date.now() };

      default:
        return { success: false, error: "Unknown message type" };
    }
  } catch (error) {
    Logger.error("Async operation error", error);
    return { success: false, error: error.message };
  }
}

// ============================================
// INITIALIZATION
// ============================================
async function initialize() {
  Logger.info("Initializing background service worker...");

  try {
    // Start keep-alive
    startKeepAlive();

    // Load stored data
    const stored = await chrome.storage.local.get([
      "deviceId",
      "userId",
      "userEmail",
      "accessToken",
      "refreshToken",
      "tokenExpiresAt",
      "isConnected",
    ]);

    // Generate or load device ID
    if (!stored.deviceId) {
      state.deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await chrome.storage.local.set({ deviceId: state.deviceId });
      Logger.info("Device ID generated", { deviceId: state.deviceId });
    } else {
      state.deviceId = stored.deviceId;
      Logger.info("Device ID loaded", { deviceId: state.deviceId });
    }

    Logger.info("Stored data loaded", {
      hasDeviceId: !!stored.deviceId,
      hasUserId: !!stored.userId,
      hasToken: !!stored.accessToken,
      isConnected: stored.isConnected,
      lastActivity: stored.lastActivity,
    });

    // Restore session if exists
    if (stored.userId && stored.accessToken) {
      state.userId = stored.userId;
      state.userEmail = stored.userEmail;
      state.accessToken = stored.accessToken;
      state.refreshToken = stored.refreshToken;
      state.tokenExpiresAt = stored.tokenExpiresAt;

      // Validate token
      if (isTokenValid(state.accessToken, state.tokenExpiresAt)) {
        state.isConnected = true;
        state.lastActivity = Date.now();

        // Update storage with current activity
        await chrome.storage.local.set({
          isConnected: true,
          lastActivity: state.lastActivity,
        });

        // Start heartbeat
        startHeartbeat();

        // Start token refresh scheduler
        if (state.refreshToken) {
          startTokenRefreshScheduler();
        }

        Logger.success("Session restored", {
          userId: state.userId,
          email: state.userEmail,
          deviceId: state.deviceId,
        });
      } else {
        Logger.warn("Stored token invalid, attempting refresh...");

        if (state.refreshToken) {
          const refreshed = await refreshAccessToken();
          if (refreshed) {
            state.isConnected = true;
            startTokenRefreshScheduler();
            Logger.success("Session restored via token refresh");
          } else {
            Logger.warn("Token refresh failed, session lost");
            await disconnect();
          }
        } else {
          Logger.warn("No refresh token, session lost");
          await disconnect();
        }
      }
    }

    updateBadge();
    state.isInitialized = true;

    Logger.success("Background service worker initialized", {
      deviceId: state.deviceId,
      isConnected: state.isConnected,
      version: CONFIG.version,
    });
  } catch (error) {
    Logger.error("Initialization failed", error);
  }
}

// ============================================
// LIFECYCLE LISTENERS
// ============================================
chrome.runtime.onInstalled.addListener(async (details) => {
  Logger.info("Extension installed", { reason: details.reason });
  await initialize();
});

chrome.runtime.onStartup.addListener(async () => {
  Logger.info("Browser started");
  await initialize();
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// START
// ============================================
initialize();

Logger.info("✅ Background script loaded and ready");

// ============================================
// COMMAND POLLING SYSTEM
// Poll for pending commands and execute them
// ============================================

let commandPollingInterval = null;
const COMMAND_POLL_INTERVAL = 2000; // 2 segundos (reduzido de 5s)

async function pollAndExecuteCommands() {
  // Só executar se tiver token válido
  if (!state.accessToken || !state.deviceId) {
    return;
  }

  try {
    // Buscar comandos pendentes para este dispositivo
    const response = await fetch(
      `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=eq.pending&order=created_at.asc&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'apikey': CONFIG.supabaseAnonKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) return;

    const commands = await response.json();
    if (!commands || commands.length === 0) return;

    Logger.info(`📥 Found ${commands.length} pending command(s)`);

    for (const command of commands) {
      await executeCommand(command);
    }

  } catch (error) {
    Logger.error('Error polling commands', error);
  }
}

// End of Background Script


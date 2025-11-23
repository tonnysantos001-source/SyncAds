// ============================================
// SYNCADS EXTENSION - BACKGROUND SCRIPT v4.0
// Arquitetura Robusta com Retry Logic e Token Management
// ============================================

console.log(
  "🚀 SyncAds Extension v4.0 - Background Service Worker Initializing...",
);

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
// COMMAND POLLING (NEW)
// ============================================
async function checkPendingCommands() {
  if (!state.accessToken) {
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.restUrl}/ExtensionCommand?deviceId=eq.${state.deviceId}&status=eq.PENDING&order=createdAt.asc&limit=5`,
      {
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
        },
      }
    );

    const commands = await response.json();

    if (commands && commands.length > 0) {
      Logger.info("📦 Comandos pendentes encontrados", {
        count: commands.length,
        commands: commands.map(c => ({ id: c.id, command: c.command }))
      });

      for (const cmd of commands) {
        try {
          Logger.info("🚀 Executando comando", {
            id: cmd.id,
            command: cmd.command,
            params: cmd.params
          });

          await updateCommandStatus(cmd.id, "processing");

          const result = await executeCommand(cmd);

          Logger.success("✅ Comando completado", { id: cmd.id, result });
          await updateCommandStatus(cmd.id, "completed", result);
        } catch (error) {
          Logger.error("❌ Erro ao executar comando", { id: cmd.id, error });
          await updateCommandStatus(cmd.id, "failed", null, error.message);
        }
      }
    }
  } catch (error) {
    Logger.error("Erro ao verificar comandos pendentes", error);
  }
}

async function updateCommandStatus(commandId, status, result = null, error = null) {
  if (!state.accessToken) return;

  try {
    const payload = {
      status: status.toUpperCase(),
    };

    if (status === "completed" && result) {
      payload.result = result;
      payload.completedAt = new Date().toISOString();
    }

    if (status === "failed" && error) {
      payload.error = error;
    }

    await fetch(
      `${CONFIG.restUrl}/ExtensionCommand?id=eq.${commandId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(payload),
      }
    );
  } catch (e) {
    console.error("Error updating command status", e);
  }
}

async function executeCommand(cmd) {
  const request = {
    type: cmd.command,      // ← Agora lê 'command' do banco
    data: cmd.params || {}  // ← Agora lê 'params' do banco
  };

  // Reutilizar lógica do handleAsyncInternal
  return await handleAsyncInternal(request);
}

// ============================================
// SERVICE WORKER KEEP-ALIVE
// ============================================
function startKeepAlive() {
  if (state.keepAliveTimer) {
    clearInterval(state.keepAliveTimer);
  }

  // Main keep-alive interval (ping to stay awake)
  state.keepAliveTimer = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => { });
  }, CONFIG.keepAlive.interval);

  // Command polling interval (check for new commands)
  if (state.commandTimer) clearInterval(state.commandTimer);
  state.commandTimer = setInterval(checkPendingCommands, 3000);

  Logger.debug("Keep-alive started", {
    interval: CONFIG.keepAlive.interval,
    polling: 3000
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
    // Atualizar lastSeen e isOnline no banco
    const response = await fetch(
      `${CONFIG.restUrl}/extension_devices?device_id=eq.${state.deviceId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          isOnline: true,
          lastSeen: new Date().toISOString(),
        }),
      },
    );

    if (response.ok) {
      Logger.debug("Heartbeat sent successfully");
      state.lastActivity = Date.now();

      // Atualizar storage para sincronizar com popup
      await chrome.storage.local.set({
        lastActivity: state.lastActivity,
        isConnected: true,
      });

      // Notificar popup sobre status
      notifyPopup({
        action: "STATUS_UPDATE",
        connected: true,
        lastActivity: state.lastActivity,
      });
    } else {
      Logger.warn("Heartbeat failed", { status: response.status });
    }
  } catch (error) {
    Logger.error("Heartbeat error", error);
  }
}

// Iniciar heartbeat a cada 15 segundos (reduzido para melhor detecção)
let heartbeatInterval = null;

function startHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Enviar imediatamente
  sendHeartbeat();

  // Depois a cada 15 segundos
  heartbeatInterval = setInterval(() => {
    sendHeartbeat();
  }, 15000); // 15 segundos - mais responsivo

  Logger.info("Heartbeat started (15s interval)");
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    Logger.info("Heartbeat stopped");
  }
}

// Heartbeat a cada 15 segundos (2x mais rápido que timeout de 30s no frontend)
if (heartbeatInterval) clearInterval(heartbeatInterval);
heartbeatInterval = setInterval(sendHeartbeat, 15000);
sendHeartbeat(); // Enviar imediatamente ao iniciar

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
              }
            );
            clearTimeout(timeoutId);

            if (!registerResponse.ok) {
              const errorText = await registerResponse.text();
              Logger.error("Device registration failed", {
                status: registerResponse.status,
                error: errorText
              });
              return { success: false, error: `Registration failed: ${errorText}` };
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
        const tabsList = tabs.map(tab => ({
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
        const clickTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!clickTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        await chrome.scripting.executeScript({
          target: { tabId: clickTab[0].id },
          func: (selector) => {
            const element = document.querySelector(selector);
            if (!element) return { success: false, error: `Elemento não encontrado: ${selector}` };
            element.click();
            return { success: true, clicked: selector };
          },
          args: [request.data.selector],
        });

        return { success: true, action: "clicked", selector: request.data.selector };

      case "TYPE_TEXT":
        // Digitar texto em campo usando seletor CSS
        const typeTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!typeTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        await chrome.scripting.executeScript({
          target: { tabId: typeTab[0].id },
          func: (selector, text) => {
            const element = document.querySelector(selector);
            if (!element) return { success: false, error: `Elemento não encontrado: ${selector}` };

            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
              element.value = text;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
              element.textContent = text;
            }

            return { success: true, typed: text };
          },
          args: [request.data.selector, request.data.text],
        });

        return { success: true, action: "typed", selector: request.data.selector };

      case "READ_TEXT":
        // Ler texto de elemento ou página inteira
        const readTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!readTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        const [readResult] = await chrome.scripting.executeScript({
          target: { tabId: readTab[0].id },
          func: (selector) => {
            if (selector) {
              const element = document.querySelector(selector);
              if (!element) return { success: false, error: `Elemento não encontrado: ${selector}` };
              return { success: true, text: element.innerText || element.textContent };
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
        const execTab = await chrome.tabs.query({ active: true, currentWindow: true });
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
        const scrollTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!scrollTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        await chrome.scripting.executeScript({
          target: { tabId: scrollTab[0].id },
          func: (selector, position) => {
            if (selector) {
              const element = document.querySelector(selector);
              if (element) element.scrollIntoView({ behavior: 'smooth' });
            } else if (position) {
              window.scrollTo({ top: position, behavior: 'smooth' });
            }
          },
          args: [request.data.selector, request.data.position],
        });

        return { success: true, action: "scrolled" };

      case "WAIT":
        // Aguardar tempo em ms
        await new Promise(resolve => setTimeout(resolve, request.data.ms || 1000));
        return { success: true, waited: request.data.ms };

      case "GET_PAGE_INFO":
        // Obter informações completas da página
        const infoTab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!infoTab[0]) return { success: false, error: "Nenhuma aba ativa" };

        const [infoResult] = await chrome.scripting.executeScript({
          target: { tabId: infoTab[0].id },
          func: () => {
            return {
              title: document.title,
              url: window.location.href,
              html: document.documentElement.outerHTML.substring(0, 5000), // Primeiros 5000 chars
              forms: Array.from(document.forms).map(f => ({
                action: f.action,
                method: f.method,
                fields: Array.from(f.elements).map(e => ({
                  name: e.name,
                  type: e.type,
                  value: e.value,
                })),
              })),
              links: Array.from(document.links).slice(0, 50).map(l => ({
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
        const refreshed = await refreshAccessToken();
        return {
          success: refreshed,
          message: refreshed ? "Token refreshed" : "Refresh failed",
        };

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

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
  supabaseUrl: "https://ovskepqggmxlfckxqgbr.supabase.co",
  supabaseAnonKey:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.YMx-wL6hUtVPtGmN_5MKHIvfzqSmz5Jx6y0P3XJiWm4",
  functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
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
  accessToken: null,
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
      "accessToken",
      "config",
      "isConnected",
      "lastConnected",
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

    // Recuperar userId e accessToken se existir
    if (stored.userId) {
      state.userId = stored.userId;
      state.accessToken = stored.accessToken;
      console.log("👤 User logged in:", state.userId);

      // Verificar se estava conectado recentemente (últimas 24h)
      const wasConnected = stored.isConnected;
      const lastConnected = stored.lastConnected || 0;
      const hoursSinceLastConnection =
        (Date.now() - lastConnected) / (1000 * 60 * 60);

      if (wasConnected && hoursSinceLastConnection < 24) {
        console.log("🔄 Restaurando conexão anterior...");
        await connectToServer();
      } else if (wasConnected) {
        console.log("⏰ Conexão expirada (>24h), requerendo nova conexão");
        await chrome.storage.local.set({ isConnected: false });
      } else {
        console.log("ℹ️ Extensão não estava conectada anteriormente");
      }
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
    return { success: true, alreadyConnected: true };
  }

  if (!state.userId) {
    console.log("⚠️ Cannot connect: No userId");
    return { success: false, error: "No userId" };
  }

  try {
    console.log("🔌 Connecting to server...");
    console.log("   📍 Functions URL:", CONFIG.functionsUrl);
    console.log("   🆔 Device ID:", state.deviceId);
    console.log("   👤 User ID:", state.userId);

    // Verificar se tem accessToken
    if (!state.accessToken) {
      throw new Error("No access token available");
    }

    // Registrar dispositivo
    const requestBody = {
      device_id: state.deviceId,
      browser_info: getBrowserInfo(),
      version: CONFIG.version,
    };

    console.log("   📤 Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${CONFIG.functionsUrl}/extension-register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("   📥 Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("   ❌ Error response:", errorText);
      throw new Error(`Registration failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Connected to server:", data);

    state.isConnected = true;
    state.stats.lastActivity = Date.now();

    // Salvar estado persistente
    await chrome.storage.local.set({
      isConnected: true,
      lastConnected: Date.now(),
    });
    console.log("💾 Estado salvo: isConnected = true");

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

    return { success: true, data };
  } catch (error) {
    console.error("❌ Connection error:", error);
    console.error("   📝 Message:", error.message);
    console.error("   📚 Stack:", error.stack);

    state.isConnected = false;
    await chrome.storage.local.set({ isConnected: false });
    updateBadge();

    // Tentar reconectar apenas se não for erro 500
    if (!error.message.includes("500")) {
      console.log(`🔄 Reconnecting in ${CONFIG.reconnectDelay / 1000}s...`);
      setTimeout(connectToServer, CONFIG.reconnectDelay);
    } else {
      console.error(
        "🚫 Erro 500 detectado - verifique configuração do Supabase no Railway",
      );
    }

    return { success: false, error: error.message };
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
      `${CONFIG.functionsUrl}/extension-commands/${state.deviceId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          apikey: CONFIG.supabaseAnonKey,
        },
        signal: controller.signal,
      },
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
    if (!state.accessToken) {
      console.warn("⚠️ No access token, skipping result");
      return;
    }

    await fetch(`${CONFIG.functionsUrl}/extension-commands/${state.deviceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({
        command_id: commandId,
        status: result.success ? "completed" : "failed",
        result,
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
    if (!state.accessToken) {
      // Sem token, não enviar log
      return;
    }

    await fetch(`${CONFIG.functionsUrl}/extension-log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
      },
      body: JSON.stringify({
        device_id: state.deviceId,
        level: log.level || "info",
        message: log.message || log.action,
        data: log.data || log,
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

  if (request.type === "AUTO_LOGIN_DETECTED") {
    console.log(
      "🔐 Login detectado automaticamente pelo content script:",
      request.userId,
    );

    // Verificar se já está conectado para este usuário
    if (state.userId === request.userId && state.isConnected) {
      console.log("ℹ️ Já conectado para este usuário, ignorando");
      sendResponse({ success: true, alreadyConnected: true });
      return true;
    }

    state.userId = request.userId;
    state.accessToken = request.accessToken;
    chrome.storage.local.set({
      userId: request.userId,
      userEmail: request.email,
      accessToken: request.accessToken,
    });
    connectToServer().then(() => {
      console.log("✅ Extensão conectada após detecção de login");
      // Notificar popup
      chrome.runtime
        .sendMessage({
          action: "LOGIN_SUCCESS",
          userId: request.userId,
          email: request.email,
        })
        .catch(() => {});
    });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === "AUTO_LOGOUT_DETECTED") {
    console.log("🚪 Logout detectado pelo content script");
    state.userId = null;
    state.deviceId = null;
    state.isConnected = false;
    chrome.storage.local.remove(["userId", "userEmail"]);
    disconnect();
    // Notificar popup
    chrome.runtime
      .sendMessage({
        action: "LOGOUT",
      })
      .catch(() => {});
    sendResponse({ success: true });
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
    try {
      const url = new URL(tab.url);
      const isDomain = CONFIG.allowedDomains.some((domain) =>
        url.hostname.includes(domain),
      );

      // Auto-detectar login quando visitar o painel
      if (isDomain && !state.userId) {
        setTimeout(() => {
          detectAutoLogin(tabId).catch((error) => {
            console.log("⚠️ Erro na detecção automática:", error.message);
          });
        }, 2000); // Aguardar 2s para o localStorage ser populado
      }
    } catch (error) {
      console.log("⚠️ Erro ao processar URL:", error.message);
    }
  }
});

// ============================================
// DETECÇÃO AUTOMÁTICA DE LOGIN
// ============================================
async function detectAutoLogin(tabId) {
  try {
    console.log("🔍 Tentando detectar login automático no tab:", tabId);

    // Verificar se a tab ainda existe
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab) {
        console.log("⚠️ Tab não existe mais, abortando detecção");
        return false;
      }
    } catch (error) {
      console.log("⚠️ Tab não existe mais:", error.message);
      return false;
    }

    // Executar script para verificar se há userId no localStorage
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        try {
          console.log("📦 Verificando localStorage...");
          // Verificar todas as chaves do localStorage
          const keys = Object.keys(localStorage);
          console.log("🔑 Chaves encontradas:", keys.length);

          // 1. Buscar chave do Supabase auth (formato moderno: sb-*-auth-token)
          const supabaseAuthKey = keys.find(
            (key) => key.startsWith("sb-") && key.includes("-auth-token"),
          );

          if (supabaseAuthKey) {
            const authData = localStorage.getItem(supabaseAuthKey);
            if (authData) {
              try {
                const parsed = JSON.parse(authData);
                console.log("🔍 Parsed auth data:", {
                  hasUser: !!parsed?.user,
                  hasToken: !!parsed?.access_token,
                });

                const user = parsed?.user;
                const accessToken = parsed?.access_token;

                if (user?.id && accessToken) {
                  console.log("✅ Token encontrado via supabase-modern");
                  return {
                    userId: user.id,
                    email: user.email,
                    accessToken: accessToken,
                    found: true,
                    source: "supabase-modern",
                  };
                }
              } catch (e) {
                console.error("❌ Erro ao parsear auth data:", e);
              }
            }
          }

          // 2. Buscar formato legado: supabase.auth.token
          const legacyAuth = localStorage.getItem("supabase.auth.token");
          if (legacyAuth) {
            try {
              const parsed = JSON.parse(legacyAuth);
              const user = parsed?.currentSession?.user || parsed?.user;
              const accessToken =
                parsed?.currentSession?.access_token || parsed?.access_token;
              if (user?.id && accessToken) {
                console.log("✅ Token encontrado via supabase-legacy");
                return {
                  userId: user.id,
                  email: user.email,
                  accessToken: accessToken,
                  found: true,
                  source: "supabase-legacy",
                };
              }
            } catch (e) {
              console.error("❌ Erro ao parsear legacyAuth:", e);
            }
          }

          // 3. Buscar em sessionStorage também
          const sessionKeys = Object.keys(sessionStorage);
          const sessionAuthKey = sessionKeys.find(
            (key) => key.startsWith("sb-") && key.includes("-auth-token"),
          );

          if (sessionAuthKey) {
            const authData = sessionStorage.getItem(sessionAuthKey);
            if (authData) {
              try {
                const parsed = JSON.parse(authData);
                const user = parsed?.user;
                const accessToken = parsed?.access_token;
                if (user?.id && accessToken) {
                  console.log("✅ Token encontrado via supabase-session");
                  return {
                    userId: user.id,
                    email: user.email,
                    accessToken: accessToken,
                    found: true,
                    source: "supabase-session",
                  };
                }
              } catch (e) {
                console.error("❌ Erro ao parsear sessionStorage:", e);
              }
            }
          }

          // 4. Debug: mostrar todas as chaves que começam com 'sb-'
          const supabaseKeys = keys.filter((k) => k.startsWith("sb-"));
          console.log("🔑 Chaves Supabase encontradas:", supabaseKeys);

          // Tentar ler todas as chaves supabase para debug
          if (supabaseKeys.length > 0) {
            for (const key of supabaseKeys) {
              try {
                const data = localStorage.getItem(key);
                if (data) {
                  const parsed = JSON.parse(data);
                  console.log(`📦 Conteúdo de ${key}:`, {
                    hasUser: !!parsed?.user,
                    hasAccessToken: !!parsed?.access_token,
                    userId: parsed?.user?.id?.substring(0, 8) + "...",
                    tokenPreview:
                      parsed?.access_token?.substring(0, 20) + "...",
                  });
                }
              } catch (e) {
                console.log(`⚠️ Erro ao ler ${key}:`, e.message);
              }
            }
          }

          return {
            found: false,
            debugInfo: {
              totalKeys: keys.length,
              supabaseKeys: supabaseKeys.length,
            },
          };
        } catch (e) {
          return { found: false, error: e.message };
        }
      },
    });

    const result = results[0]?.result;
    console.log("📊 Resultado da detecção:", result);

    if (result?.found && result?.userId) {
      console.log("✅ Login detectado automaticamente:", {
        userId: result.userId,
        email: result.email,
        source: result.source,
      });

      // Salvar userId e accessToken
      state.userId = result.userId;
      state.accessToken = result.accessToken;
      await chrome.storage.local.set({
        userId: result.userId,
        userEmail: result.email,
        accessToken: result.accessToken,
      });

      // Conectar ao servidor
      await connectToServer();

      // Notificar popup
      chrome.runtime
        .sendMessage({
          action: "LOGIN_SUCCESS",
          userId: result.userId,
          email: result.email,
        })
        .catch(() => {});

      console.log("🎉 Extensão conectada automaticamente!");
      return true;
    } else {
      console.log("ℹ️ Usuário não está logado no painel. Resultado:", result);
      return false;
    }
  } catch (error) {
    console.error("❌ Erro ao detectar login:", error.message);
    console.error("Stack:", error.stack);
    return false;
  }
}

// ============================================
// INICIALIZAR AUTOMATICAMENTE
// ============================================
initialize();

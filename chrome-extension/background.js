// ============================================
// SYNCADS EXTENSION - BACKGROUND SCRIPT v5.0
// Side Panel Architecture + Token Management
// ============================================

import { createClient } from './supabase.js';
import { initRealtimeConnection } from './realtime-client.js';
import { callActionRouter, buildActionPayload } from './action-router-client.js';

// Sistema de Auto-Heal
let attemptAutoHeal, withAutoHeal;
try {
  const autoHealModule = await import('./auto-heal.js');
  attemptAutoHeal = autoHealModule.attemptAutoHeal;
  withAutoHeal = autoHealModule.withAutoHeal;
  console.log("✅ [AUTO-HEAL] Sistema de auto-correção carregado");
} catch (e) {
  console.warn("⚠️ [AUTO-HEAL] Não foi possível carregar auto-heal.js:", e.message);
  // Fallback: funções vazias
  attemptAutoHeal = async () => false;
  withAutoHeal = async (fn) => await fn();
}

console.log("✅ [IMPORTS] Supabase, Realtime & Action Router Client imported");
// Legacy try/catch block removed as static imports will throw syntax errors if they fail



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
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
  functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
  restUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/rest/v1",
  version: "5.0.0",

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

// GLOBAL DOM SIGNALS REGISTRY (Strict Source of Truth)
if (!globalThis.domSignals) {
  globalThis.domSignals = {
    navigationComplete: false,
    editorReady: false,
    contentInserted: false,
    lastMutation: null,
    documentUrl: null
  };
}

function getDomSignals() {
  if (!globalThis.domSignals) {
    globalThis.domSignals = {
      navigationComplete: false,
      editorReady: false,
      contentInserted: false,
      lastMutation: null,
      documentUrl: null
    };
  }
  return globalThis.domSignals;
}

// Orphaned Config Block Deleted

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

// HELPER: Recover User Info from Token if missing
async function ensureUserInfo() {
  if (state.userId || !state.accessToken) return;
  try {
    const res = await fetch(`${CONFIG.supabaseUrl}/auth/v1/user`, {
      headers: { "Authorization": `Bearer ${state.accessToken}`, "apikey": CONFIG.supabaseAnonKey }
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.id) {
        state.userId = data.id;
        state.userEmail = data.email;
        state.user = data; // Backward compat
        Logger.success("👤 User info recovered:", { id: state.userId });
      }
    }
  } catch (e) { console.warn("Failed to ensure user info", e); }
}

// HELPER: Generate Session ID for actions
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}


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
      startKeepAlive();

      // REALTIME INIT
      setTimeout(() => initRealtimeConnection(state, processCommand), 1000); // Delay safe

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
// DOCUMENT SIGNAL LISTENER
// ============================================
/**
 * Listens for DOCUMENT_CREATED_CONFIRMED signal from content script
 * 
 * This is the CANONICAL way to know when a Google Docs document
 * is fully created and stable.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "DOCUMENT_SIGNAL") {
    // Handle async processing
    (async () => {
      const signal = message.signal;

      Logger.success("📨 [DOCUMENT_SIGNAL] Received canonical signal:", {
        type: signal.type,
        url: signal.payload?.url,
        docId: signal.payload?.docId,
      });

      // Update global DOM signals state
      if (globalThis.domSignals) {
        if (signal.type === "DOCUMENT_CREATED_CONFIRMED") {
          globalThis.domSignals.editorReady = true;
          globalThis.domSignals.documentUrl = signal.payload.url;
          globalThis.domSignals.navigationComplete = true;
          globalThis.domSignals.lastSignal = signal;
        }
      }

      // ============================================
      // PERSIST TO SUPABASE
      // ============================================
      if (signal.type === "DOCUMENT_CREATED_CONFIRMED") {
        Logger.info("💾 [DOCUMENT_SIGNAL] Persisting to Supabase...");

        try {
          // Find the most recent command that's pending or processing
          // This signal likely corresponds to a NAVIGATE command
          const commandsResponse = await fetch(
            `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=in.(pending,processing)&order=created_at.desc&limit=1`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${state.accessToken}`,
                apikey: CONFIG.supabaseAnonKey,
                "Content-Type": "application/json",
              },
            }
          );

          if (commandsResponse.ok) {
            const commands = await commandsResponse.json();

            if (commands.length > 0) {
              const command = commands[0];

              Logger.info(`💾 [DOCUMENT_SIGNAL] Updating command ${command.id}...`);

              // Update command metadata with signal
              const updateResponse = await fetch(
                `${CONFIG.restUrl}/extension_commands?id=eq.${command.id}`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${state.accessToken}`,
                    apikey: CONFIG.supabaseAnonKey,
                    "Content-Type": "application/json",
                    "Prefer": "return=representation",
                  },
                  body: JSON.stringify({
                    metadata: {
                      ...(command.metadata || {}),
                      document_signal: signal,
                      document_confirmed_at: new Date().toISOString(),
                    },
                    updated_at: new Date().toISOString(),
                  }),
                }
              );

              if (updateResponse.ok) {
                Logger.success(`✅ [DOCUMENT_SIGNAL] Signal persisted to command ${command.id}`);
              } else {
                const errorText = await updateResponse.text();
                Logger.error(`❌ [DOCUMENT_SIGNAL] Failed to persist signal:`, null, {
                  status: updateResponse.status,
                  error: errorText,
                });
              }
            } else {
              Logger.warn("⚠️ [DOCUMENT_SIGNAL] No recent command found to attach signal");
            }
          }
        } catch (persistError) {
          Logger.error("❌ [DOCUMENT_SIGNAL] Error persisting signal:", persistError);
        }
      }

      sendResponse({ received: true, timestamp: Date.now() });
    })();

    return true; // Keep channel open for async response
  }

  // ============================================
  // DOCUMENT URL CAPTURED HANDLER
  // ============================================
  if (message.type === "DOCUMENT_URL_CAPTURED") {
    (async () => {
      const { url, docId } = message.payload;

      Logger.success("📄 [DOCUMENT_URL] Document URL captured:", { url, docId });

      // Send to sidepanel
      try {
        await chrome.runtime.sendMessage({
          type: "DISPLAY_DOCUMENT_LINK",
          payload: {
            url: url,
            docId: docId,
            message: `✅ Documento criado com sucesso!`
          }
        });
        Logger.success("📤 [DOCUMENT_URL] Sent to sidepanel");
      } catch (e) {
        Logger.warn("⚠️ [DOCUMENT_URL] Could not send to sidepanel (may be closed):", e.message);
      }

      // Update command metadata with URL
      try {
        const commandsResponse = await fetch(
          `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=in.(processing,completed)&order=created_at.desc&limit=1`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${state.accessToken}`,
              apikey: CONFIG.supabaseAnonKey,
              "Content-Type": "application/json",
            },
          }
        );

        if (commandsResponse.ok) {
          const commands = await commandsResponse.json();
          if (commands.length > 0) {
            const command = commands[0];

            await fetch(
              `${CONFIG.restUrl}/extension_commands?id=eq.${command.id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: `Bearer ${state.accessToken}`,
                  apikey: CONFIG.supabaseAnonKey,
                  "Content-Type": "application/json",
                  "Prefer": "return=representation",
                },
                body: JSON.stringify({
                  metadata: {
                    ...(command.metadata || {}),
                    document_url: url,
                    document_id: docId,
                    url_captured_at: new Date().toISOString(),
                  },
                  updated_at: new Date().toISOString(),
                }),
              }
            );

            Logger.success(`✅ [DOCUMENT_URL] URL persisted to command ${command.id}`);
          }
        }
      } catch (persistError) {
        Logger.error("❌ [DOCUMENT_URL] Error persisting URL:", persistError);
      }

      sendResponse({ received: true, timestamp: Date.now() });
    })();

    return true; // Keep channel open for async response
  }
});

Logger.info("✅ [DOCUMENT_SIGNAL] Listener registered");


// ============================================
// COMMAND POLLING (NEW)
// ============================================
async function checkPendingCommands() {
  if (!state.accessToken || !state.deviceId) {
    Logger.debug("Skipping command check: not authenticated");
    return;
  }

  try {
    // ============================================
    // 1. TOKEN VALIDATION & REFRESH
    // ============================================

    // Check if token is expired or about to expire
    if (state.tokenExpiresAt) {
      let expiresAt;

      // Convert to timestamp if string
      if (typeof state.tokenExpiresAt === 'string') {
        expiresAt = new Date(state.tokenExpiresAt).getTime();
      } else if (typeof state.tokenExpiresAt === 'number') {
        // If it's a number, check if it's in seconds (Unix timestamp)
        // or milliseconds (JS timestamp)
        if (state.tokenExpiresAt < 10000000000) {
          // Likely seconds, convert to milliseconds
          expiresAt = state.tokenExpiresAt * 1000;
        } else {
          expiresAt = state.tokenExpiresAt;
        }
      } else {
        Logger.error("Invalid tokenExpiresAt format:", state.tokenExpiresAt);
        expiresAt = 0;
      }

      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      // If expired or expiring in less than 5 minutes
      if (timeUntilExpiry < 5 * 60 * 1000) {
        Logger.warn("⏰ Token expired or expiring soon, refreshing...", {
          expiresAt: new Date(expiresAt).toISOString(),
          now: new Date(now).toISOString(),
          timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000)}s`,
          isExpired: timeUntilExpiry < 0
        });

        try {
          await refreshAccessToken();
          Logger.success("✅ Token refreshed successfully");
        } catch (refreshError) {
          Logger.error("❌ Token refresh failed", refreshError);
          // Continue anyway - might still work
        }
      }
    }

    // ============================================
    // 2. ENSURE USER INFO
    // ============================================
    await ensureUserInfo();

    // ============================================
    // 3. AUDIT LOGGING
    // ============================================
    const userId = state.user?.id || state.userId || "N/A";
    const hasToken = !!state.accessToken;

    console.log(`🔍 [AUDIT] Auth State:`, {
      hasToken,
      userId,
      deviceId: state.deviceId,
      tokenExpiry: state.tokenExpiresAt,
    });

    const url = `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=eq.pending&order=created_at.asc&limit=10`;

    console.log(`🔍 [AUDIT] Query URL: ${url}`);

    // ============================================
    // 4. FETCH PENDING COMMANDS
    // ============================================
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
        apikey: CONFIG.supabaseAnonKey,
        "Content-Type": "application/json",
        "Prefer": "return=representation", // Force full response
      },
    });

    console.log(`🔍 [AUDIT] Response:`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    // ============================================
    // 5. RLS & AUTH ERROR DETECTION
    // ============================================
    if (!response.ok) {
      const errorText = await response.text();

      // Check for RLS or Auth issues
      if (response.status === 401 || response.status === 403) {
        Logger.error("🚨 RLS or Auth issue detected!", {
          status: response.status,
          error: errorText,
        });

        // Try to refresh token and retry
        Logger.info("🔄 Attempting token refresh...");
        try {
          await refreshAccessToken();
          Logger.success("✅ Token refreshed, will retry next poll");
        } catch (e) {
          Logger.error("❌ Token refresh failed", e);
        }
        return;
      }

      // Other errors
      Logger.error(`Failed to fetch commands: ${response.status}`, null, {
        errorText,
      });
      return;
    }

    // ============================================
    // 6. PARSE & PROCESS COMMANDS
    // ============================================
    const commands = await response.json();

    console.log(`🔍 [AUDIT] Commands found: ${commands.length}`);

    if (commands.length > 0) {
      console.log(`🔍 [AUDIT] Command details:`, commands.map(c => ({
        id: c.id,
        type: c.type,
        status: c.status,
        created_at: c.created_at,
      })));
    }

    if (commands.length === 0) {
      // This is OK - just no commands to process
      // Don't log as warning to avoid noise
      return;
    }

    Logger.info(`📦 Found ${commands.length} pending commands`);

    // Process each command
    for (const cmd of commands) {
      await processCommand(cmd);
    }
  } catch (error) {
    Logger.error("Error checking commands", error);

    // If network error, log details
    if (error.message?.includes("fetch")) {
      Logger.error("Network error during command polling", error, {
        accessToken: state.accessToken ? "present" : "missing",
        deviceId: state.deviceId,
      });
    }
  }
}


async function processCommand(cmd) {
  Logger.info("Processing command", {
    id: cmd.id,
    type: cmd.type,
    // data: cmd.data
  });

  // Fallback for data source
  const cmdData = cmd.data || cmd.options || {};
  const cmdValue = cmd.value || cmdData.value;
  const cmdSelector = cmd.selector || cmdData.selector;

  // Patch cmd object so downstream logic works with 'cmd.value', 'cmd.options' expectations
  cmd.options = cmdData;
  cmd.value = cmdValue;
  cmd.selector = cmdSelector;

  try {
    // Marcar como PROCESSING
    await updateCommandStatus(cmd.id, "processing", {
      started_at: new Date().toISOString(),
    });

    // 2. Get Active Tab (NUCLEAR STRATEGY + TARGET URL FALLBACK)
    let activeTab = null;
    const maxRetries = 10; // 5 seconds total

    for (let i = 0; i < maxRetries; i++) {
      // Strategy A: Current Window
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Strategy B: Last Focused Window
      if (!tab) {
        [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      }

      // Strategy C: Scan ALL "normal" windows
      if (!tab) {
        const windows = await chrome.windows.getAll({ populate: true, windowTypes: ['normal'] });
        for (const win of windows) {
          const active = win.tabs.find(t => t.active);
          if (active) {
            tab = active;
            Logger.info("⚠️ Found active tab in background window (Strategy C)", { tabId: tab.id });
            break;
          }
        }
      }

      // Strategy D: Target URL Heuristic (The "Plan B" for Google Docs)
      // If we still have no tab, search for the tab we likely just opened (Google Docs)
      if (!tab) {
        const [docTab] = await chrome.tabs.query({ url: "*://docs.google.com/*" });
        if (docTab) {
          tab = docTab;
          Logger.info("🎯 Found Google Docs tab via URL match (Strategy D)", { tabId: tab.id });
        }
      }

      if (tab && (tab.url?.startsWith("chrome://") || tab.url?.startsWith("chrome-extension://") || tab.url?.startsWith("edge://"))) {
        // System page detected - Ignore and try next strategy
        // Exception: If we are specifically testing an extension page (unlikely for user)
        // But for automation, we want Web Content.
        // If query command is 'navigate', we might accept it? No, debugger fails on system pages anyway.
        Logger.warn("⚠️ Ignoring System/Extension Tab (Debugger Protected)", { url: tab.url });
        tab = null;
      }

      if (tab && tab.id && tab.status !== 'unloaded') {
        activeTab = tab;
        break;
      }

      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    // Se não achou tab ativa, e comando é NAVIGATE, vamos criar uma nova.
    // Para outros comandos, precisamos de uma tab ativa.
    const isNavigate = (cmd.type || "").toLowerCase() === "navigate";

    if (!activeTab && !isNavigate) {
      throw new Error("No active tab found (Open a page first)");
    }

    if (activeTab) {
      Logger.info("Active tab found", {
        tabId: activeTab.id,
        url: activeTab.url,
        title: activeTab.title,
      });

      // Verificar se a tab está pronta
      if (!activeTab.id || (activeTab.discarded && !isNavigate)) {
        throw new Error("Tab is discarded or not ready");
      }
    } else {
      Logger.warn("No active tab found, but proceeding for NAVIGATE command");
    }

    // MAPPING CANONICAL COMMANDS -> EXECUTOR ACTIONS
    let params = {};
    let action = cmd.type;

    // 1. NAVIGATE
    if (cmd.type === "navigate") {
      params = { url: cmd.payload?.url || cmd.options?.url };
      action = "NAVIGATE";
      Logger.info("COORD: Mapping 'navigate' -> NAVIGATE", params);

      // 2. WAIT (New Robust Wait)
    } else if (cmd.type === "wait") {
      params = {
        selector: cmd.payload?.selector || cmd.selector,
        timeout: cmd.payload?.timeout || 10000
      };
      action = "DOM_WAIT";
      Logger.info("COORD: Mapping 'wait' -> DOM_WAIT", params);

      // 3. CLICK
    } else if (cmd.type === "click") {
      params = { selector: cmd.payload?.selector || cmd.selector };
      action = "DOM_CLICK"; // Maps to clickElement
      Logger.info("COORD: Mapping 'click' -> DOM_CLICK", params);

    } else if (cmd.type === "type" || cmd.type === "fill_input") {
      // 4. TYPE / FILL INPUT
      params = {
        selector: cmd.payload?.selector || cmd.selector,
        value: cmd.payload?.text || cmd.payload?.value || cmd.value
      };

      // STRICT TYPING ROUTER (Magic Text vs Super Paste)
      const textVal = params.value || "";
      const isDocs = activeTab?.url?.includes("docs.google.com");

      if (isDocs) {
        action = "DOM_INSERT"; // Force Super Paste for all Docs inputs (Robustness)
        Logger.info(`COORD: Routing '${cmd.type}' -> DOM_INSERT (Docs Detected: Enforcing Super Paste)`);
      } else {
        action = "DOM_TYPE"; // Magic Text / Native Debugger
        Logger.info(`COORD: Routing '${cmd.type}' -> DOM_TYPE`, params);
      }

      // 5. SCROLL
    } else if (cmd.type === "scroll") {
      params = {
        y: cmd.payload?.amount || 500,
        x: 0
      };
      action = "DOM_SCROLL";
      Logger.info("COORD: Mapping 'scroll' -> DOM_SCROLL", params);

      // 6. INSERT CONTENT (Super Paste)
    } else if (cmd.type === "insert_content") {
      params = {
        value: cmd.payload?.value || cmd.value,
        format: cmd.payload?.format || 'html',
        selector: cmd.payload?.selector || cmd.selector
      };
      action = "DOM_INSERT";
      Logger.info("COORD: Mapping 'insert_content' -> DOM_INSERT", params);

      // LEGACY FALLBACK (Should rarely be used if Planner is strict)
    } else if (cmd.type === "NAVIGATE") {
      params = { url: cmd.options?.url || cmd.value };
      action = "NAVIGATE";
    } else {
      // REJECT UNKNOWN TYPES
      throw new Error(`CRITICAL: Executor received unknown command type: ${cmd.type}`);
    }



    // ============================================
    // 3. EXECUTE ACTION LOCALLY (EXTENSION IS EXECUTOR)
    // ============================================

    Logger.info(`🎯 [EXECUTE] Executing LOCALLY: ${action}`, params);

    let domReport = { success: false, logs: [] };

    // Helper: Ensure content script is injected
    async function ensureContentScriptInjected(tabId) {
      try {
        // Try to ping the content script
        await chrome.tabs.sendMessage(tabId, { type: "DOM_STATUS" });
        return true; // Already injected
      } catch (e) {
        // Not injected or not responding, inject now
        Logger.warn(`📌 Content script not responding in tab ${tabId}, injecting...`);

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content-script.js']
          });

          // Wait for injection to complete
          await new Promise(r => setTimeout(r, 1000));
          Logger.success(`✅ Content script injected in tab ${tabId}`);
          return true;
        } catch (injectError) {
          Logger.error(`❌ Failed to inject content script:`, injectError);
          return false;
        }
      }
    }

    try {
      if (action === "NAVIGATE") {
        const urlIndex = params.url.indexOf("://");
        const targetUrl = urlIndex === -1 ? "https://" + params.url : params.url;

        // Create tab if none exists
        if (!activeTab || !activeTab.id) {
          Logger.info("Creating NEW tab for navigation");
          activeTab = await chrome.tabs.create({ url: targetUrl });
        } else {
          Logger.info("Updating EXISTING tab for navigation", { tabId: activeTab.id });
          activeTab = await chrome.tabs.update(activeTab.id, { url: targetUrl });
        }

        // Wait for connection/load (basic delay for stability)
        await new Promise(r => setTimeout(r, 2000));
        domReport = { success: true, final_url: targetUrl, logs: ["Navigated to " + targetUrl] };

      } else {
        // CONTENT SCRIPT ACTIONS
        if (!activeTab || !activeTab.id) {
          throw new Error(`No active tab for DOM action: ${action}`);
        }

        // ENSURE CONTENT SCRIPT IS INJECTED (com auto-heal integrado)
        if (!(await ensureContentScriptInjected(activeTab.id))) {
          const error = new Error("Failed to inject content script - tab may be protected");

          // Tentar auto-heal
          const healed = await attemptAutoHeal(error, {
            commandId: cmd.id,
            deviceId: state.deviceId,
            action: action,
            tabId: activeTab.id
          });

          if (!healed) {
            throw error;
          }

          // Retry após heal
          Logger.info("🩹 [AUTO-HEAL] Retrying after content script injection...");
          if (!(await ensureContentScriptInjected(activeTab.id))) {
            throw new Error("Content script injection failed even after auto-heal");
          }
        }

        Logger.info(`Sending message to tab ${activeTab.id}...`);

        // Send message to content script com tratamento de erro e auto-heal
        let response;
        try {
          response = await chrome.tabs.sendMessage(activeTab.id, {
            type: "EXECUTE_ACTION",
            action: action,
            params: params
          });
        } catch (err) {
          const error = new Error(`Communication failed (Refresh page?): ${err.message}`);

          // Tentar auto-heal
          Logger.warn("⚠️ [AUTO-HEAL] Communication failed, attempting auto-heal...");
          const healed = await attemptAutoHeal(error, {
            commandId: cmd.id,
            deviceId: state.deviceId,
            action: action,
            tabId: activeTab.id,
            originalError: err.message
          });

          if (healed) {
            Logger.success("🩹 [AUTO-HEAL] Healed! Retrying communication...");

            // Retry após heal
            await ensureContentScriptInjected(activeTab.id);
            response = await chrome.tabs.sendMessage(activeTab.id, {
              type: "EXECUTE_ACTION",
              action: action,
              params: params
            });
          } else {
            throw error;
          }
        }

        domReport = response || { success: false, error: "No response from content script" };

        if (!domReport.success) {
          throw new Error(domReport.error || "Unknown content script error");
        }
      }

      Logger.success(`✅ [EXECUTE] Local execution success`, domReport);

    } catch (error) {
      Logger.error(`❌ [EXECUTE] Local execution failed:`, error);
      domReport = {
        success: false,
        error: error.message,
        logs: [`Execution error: ${error.message}`]
      };
    }

    // Prepare response for logging/signals logic downstream
    // (We reuse 'domReport' which aligns with the variable name expected in line 741)
    let response = {
      success: domReport.success,
      action: action,
      error: domReport.error,
      executedAt: new Date().toISOString(),
      executionTime: 0,
      logs: domReport.logs || []
    };

    // Ensure 'domReport' has final_url for the check below
    domReport.final_url = activeTab ? activeTab.url : "";

    let status = "success";
    let retryable = false;
    let failureReason = null;

    // 1. URL CHECK
    const finalUrl = (domReport.final_url || activeTab?.url || "").replace(/\/$/, "");
    if (finalUrl.endsWith("/u/0")) {
      status = "failed";
      failureReason = "Redirected to Google Docs home (/u/0)";
      signals.push({ type: "UNEXPECTED_NAVIGATION", timestamp: Date.now(), payload: { url: "/u/0" } });
    }

    // 2. SIGNAL CHECK
    // Ensure signals array exists
    const safeSignals = (typeof signals !== 'undefined' ? signals : []);

    if (safeSignals.some(s => s.type === "UNEXPECTED_NAVIGATION")) {
      status = "failed";
      failureReason = "Executor abortado: navegação inesperada detectada";
    } else if (cmd.type === "insert_content" && !safeSignals.some(s => s.type === "EDITOR_READY")) {
      status = "failed";
      retryable = true;
      failureReason = "Editor não pronto";
    }

    const confirmationData = {
      success: status === "success",
      status: status === "success" ? "SUCCESS" : status === "failed" ? "FAILED" : "BLOCKED",
      verified: false, // Will be set by ReasonerVerifier
      command_id: cmd.id,
      command_type: cmd.type,
      url_before: activeTab?.url || "unknown",
      url_after: activeTab?.url || "unknown",
      title_after: activeTab?.title || "unknown",
      dom_signals: domReport,
      reason: failureReason,
      originalResponse: response,
      retryable: retryable,
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

async function updateCommandStatus(commandId, status, extraData = {}, commandType = null) {
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

    // BROADCAST TO SIDEPANEL
    try {
      chrome.runtime.sendMessage({
        type: 'COMMAND_STATUS',
        commandId,
        status,
        commandType,
        error: extraData.error
      });
    } catch (e) { /* Ignore */ }

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
  initRealtimeConnection(state, processCommand);


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
            deviceId: (state.deviceId || "unknown").substring(0, 12) + "...",
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

// End of Background Script// End of Background Script

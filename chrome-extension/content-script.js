// ============================================
// SYNCADS EXTENSION - CONTENT SCRIPT v4.0
// Robust Token Detection & Background Communication
// ============================================

// ============================================
// 🛡️ PROTEÇÃO: NÃO EXECUTAR NO PRÓPRIO SYNCADS
// ============================================
const SYNCADS_DOMAINS = [
  "syncads.com.br",
  "www.syncads.com.br",
  "vercel.app",
  "localhost",
  "127.0.0.1",
];

const currentDomain = window.location.hostname;
const isSyncAdsSite = SYNCADS_DOMAINS.some(
  (domain) =>
    currentDomain.includes(domain) ||
    currentDomain.includes("syncads") ||
    window.location.href.includes("syncads"),
);

if (isSyncAdsSite) {
  console.log("🛡️ SyncAds Extension: Skipping own domain -", currentDomain);
  // NÃO EXECUTA NADA - sai do script
  throw new Error("SyncAds domain detected - extension disabled on own site");
}

console.log("🚀 SyncAds Content Script v4.0 - Initializing on:", currentDomain);

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  version: "4.0.0",

  detection: {
    initialDelay: 2000, // Wait 2s before first check
    checkInterval: 1000, // Check every 1s
    storageMonitorInterval: 200, // Monitor storage changes every 200ms
    maxSendAttempts: 3, // Max attempts to send token to background
    retryDelay: 1000, // Delay between send retries
  },

  notification: {
    duration: 5000,
    position: { top: "20px", right: "20px" },
  },

  button: {
    position: { bottom: "20px", right: "20px" },
  },
};

// ============================================
// STATE MANAGEMENT
// ============================================
let state = {
  isInitialized: false,
  lastTokenSent: null,
  knownStorageKeys: new Set(),
  checkCount: 0,
  isProcessingToken: false,
  hasShownButton: false,

  // Track what we've already processed
  processedTokens: new Set(),
  lastDetectionTime: null,
};

// ============================================
// LOGGING
// ============================================
const Logger = {
  info: (message, data = {}) => {
    console.log(`ℹ️ [ContentScript] ${message}`, data);
  },

  success: (message, data = {}) => {
    console.log(`✅ [ContentScript] ${message}`, data);
  },

  warn: (message, data = {}) => {
    console.warn(`⚠️ [ContentScript] ${message}`, data);
  },

  error: (message, error = null, data = {}) => {
    console.error(`❌ [ContentScript] ${message}`, error, data);
  },

  debug: (message, data = {}) => {
    console.log(`🔍 [ContentScript] ${message}`, data);
  },
};

// ============================================
// UI COMPONENTS
// ============================================
function showNotification(message, type = "info") {
  const existing = document.getElementById("syncads-notification");
  if (existing) existing.remove();

  const notification = document.createElement("div");
  notification.id = "syncads-notification";
  notification.style.cssText = `
    position: fixed;
    top: ${CONFIG.notification.position.top};
    right: ${CONFIG.notification.position.right};
    background: ${type === "error" ? "#ef4444" : type === "success" ? "#10b981" : "#3b82f6"};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    max-width: 350px;
    animation: slideIn 0.3s ease;
  `;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  notification.innerHTML = `<strong>🔌 SyncAds</strong><br>${message}`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.transition = "opacity 0.3s, transform 0.3s";
    notification.style.opacity = "0";
    notification.style.transform = "translateX(400px)";
    setTimeout(() => notification.remove(), 300);
  }, CONFIG.notification.duration);
}

function createConnectButton() {
  if (state.hasShownButton || document.getElementById("syncads-connect-btn")) {
    return;
  }

  const button = document.createElement("div");
  button.id = "syncads-connect-btn";
  button.style.cssText = `
    position: fixed;
    bottom: ${CONFIG.button.position.bottom};
    right: ${CONFIG.button.position.right};
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 12px 20px;
    border-radius: 25px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 999998;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;
    transition: all 0.3s ease;
  `;
  button.innerHTML = `🔌 Conectar SyncAds`;

  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.05)";
    button.style.boxShadow = "0 6px 20px rgba(0,0,0,0.4)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
    button.style.boxShadow = "0 4px 15px rgba(0,0,0,0.3)";
  });

  button.addEventListener("click", async () => {
    button.innerHTML = `⏳ Buscando token...`;
    state.lastTokenSent = null;
    state.processedTokens.clear();

    const result = await detectAndSendToken();

    if (!result) {
      button.innerHTML = `🔌 Conectar SyncAds`;
      setTimeout(() => {
        button.innerHTML = `🔌 Tentar novamente`;
      }, 2000);
    }
  });

  document.body.appendChild(button);
  state.hasShownButton = true;

  Logger.debug("Connect button created");
}

function removeConnectButton() {
  const button = document.getElementById("syncads-connect-btn");
  if (button) {
    button.style.transition = "opacity 0.5s, transform 0.5s";
    button.style.opacity = "0";
    button.style.transform = "scale(0.8)";
    setTimeout(() => button.remove(), 500);
    Logger.debug("Connect button removed");
  }
}

// ============================================
// SAFE MESSAGE SENDER
// ============================================
async function sendMessageToBackground(
  message,
  maxAttempts = CONFIG.detection.maxSendAttempts,
) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      Logger.debug(
        `Sending message to background (attempt ${attempt}/${maxAttempts})`,
        { type: message.type },
      );

      const response = await chrome.runtime.sendMessage(message);

      Logger.success("Message sent successfully", { response });
      return { success: true, data: response };
    } catch (error) {
      const errorMsg = error?.message || "Unknown error";

      Logger.warn(`Send attempt ${attempt}/${maxAttempts} failed: ${errorMsg}`);

      // Check if it's a fatal error (no retry needed)
      if (
        errorMsg.includes("Extension context invalidated") ||
        errorMsg.includes("message port closed")
      ) {
        Logger.error("Fatal error - extension context lost", error);
        return { success: false, error: errorMsg, fatal: true };
      }

      // Retry with delay
      if (attempt < maxAttempts) {
        await sleep(CONFIG.detection.retryDelay);
      }
    }
  }

  Logger.error("Failed to send message after all attempts");
  return { success: false, error: "Max retry attempts exceeded" };
}

// ============================================
// TOKEN VALIDATION
// ============================================
function validateToken(authData) {
  if (!authData) {
    Logger.debug("No auth data");
    return null;
  }

  const user = authData.user;
  const accessToken = authData.access_token;
  const refreshToken = authData.refresh_token;
  const expiresAt = authData.expires_at;

  if (!user?.id || !accessToken) {
    Logger.debug("Incomplete auth data", {
      hasUser: !!user?.id,
      hasToken: !!accessToken,
    });
    return null;
  }

  // Check token expiration
  if (expiresAt) {
    const expiryDate = new Date(expiresAt * 1000);
    const now = new Date();

    if (expiryDate <= now) {
      Logger.warn("Token is EXPIRED", {
        expiresAt: expiryDate.toLocaleString(),
        now: now.toLocaleString(),
      });
      return null;
    }

    const minutesUntilExpiry = Math.floor((expiryDate - now) / 1000 / 60);
    Logger.debug("Token is valid", {
      expiresAt: expiryDate.toLocaleString(),
      validFor: minutesUntilExpiry + " minutes",
    });
  }

  return {
    userId: user.id,
    email: user.email || "",
    accessToken,
    refreshToken: refreshToken || null,
    expiresAt: expiresAt || null,
  };
}

// ============================================
// TOKEN DETECTION
// ============================================
function findSupabaseAuthKey() {
  const localKeys = Object.keys(localStorage);
  const sessionKeys = Object.keys(sessionStorage);
  const allKeys = [...localKeys, ...sessionKeys];

  // Priority 1: Modern format (sb-*-auth-token)
  let authKey = allKeys.find(
    (k) => k.startsWith("sb-") && k.includes("-auth-token"),
  );
  if (authKey) {
    const storage = localKeys.includes(authKey) ? localStorage : sessionStorage;
    return { key: authKey, storage, format: "modern" };
  }

  // Priority 2: Legacy format
  authKey = allKeys.find((k) => k === "supabase.auth.token");
  if (authKey) {
    const storage = localKeys.includes(authKey) ? localStorage : sessionStorage;
    return { key: authKey, storage, format: "legacy" };
  }

  return null;
}

async function detectAndSendToken() {
  // Prevent concurrent processing
  if (state.isProcessingToken) {
    Logger.debug("Already processing token, skipping...");
    return false;
  }

  state.isProcessingToken = true;

  try {
    state.checkCount++;

    // Find auth key
    const authInfo = findSupabaseAuthKey();

    if (!authInfo) {
      if (state.checkCount % 50 === 0) {
        Logger.debug("No Supabase auth key found", {
          checks: state.checkCount,
          localKeys: Object.keys(localStorage).length,
          sessionKeys: Object.keys(sessionStorage).length,
        });
      }
      return false;
    }

    // Read auth data
    const authDataRaw = authInfo.storage.getItem(authInfo.key);
    if (!authDataRaw) {
      Logger.debug("Auth key found but no data");
      return false;
    }

    let authData;
    try {
      authData = JSON.parse(authDataRaw);
    } catch (error) {
      Logger.error("Failed to parse auth data", error);
      return false;
    }

    // Validate token
    const validatedToken = validateToken(authData);
    if (!validatedToken) {
      if (state.checkCount % 50 === 0) {
        Logger.debug("Token found but invalid or expired");
      }
      return false;
    }

    // Create token fingerprint
    const tokenFingerprint = `${validatedToken.userId}_${validatedToken.accessToken.substring(0, 50)}`;

    // Check if already sent
    if (state.processedTokens.has(tokenFingerprint)) {
      if (state.checkCount % 100 === 0) {
        Logger.debug("Token already processed, waiting for new token...");
      }
      return false;
    }

    // Send to background
    Logger.info("Valid token detected! Sending to background...", {
      userId: validatedToken.userId,
      email: validatedToken.email,
      format: authInfo.format,
      hasRefreshToken: !!validatedToken.refreshToken,
    });

    const result = await sendMessageToBackground({
      type: "AUTH_TOKEN_DETECTED",
      data: validatedToken,
    });

    if (result.success && result.data?.success) {
      // Mark as processed
      state.processedTokens.add(tokenFingerprint);
      state.lastTokenSent = tokenFingerprint;
      state.lastDetectionTime = Date.now();

      // Show success notification
      showNotification("✅ Conectado com sucesso!", "success");

      // Remove connect button
      removeConnectButton();

      Logger.success("Extension connected successfully!", {
        userId: validatedToken.userId,
        email: validatedToken.email,
      });

      return true;
    } else {
      const errorMsg = result.data?.error || result.error || "Unknown error";
      Logger.error("Background rejected token", null, { error: errorMsg });

      showNotification("❌ Erro ao conectar: " + errorMsg, "error");

      return false;
    }
  } catch (error) {
    Logger.error("Token detection exception", error);
    return false;
  } finally {
    state.isProcessingToken = false;
  }
}

// ============================================
// STORAGE MONITORING
// ============================================
function monitorStorageChanges() {
  const currentLocalKeys = new Set(Object.keys(localStorage));
  const currentSessionKeys = new Set(Object.keys(sessionStorage));
  const currentKeys = new Set([...currentLocalKeys, ...currentSessionKeys]);

  // Detect new keys
  const newKeys = [...currentKeys].filter(
    (k) => !state.knownStorageKeys.has(k),
  );

  if (newKeys.length > 0) {
    Logger.debug("New storage keys detected", { newKeys });

    // Check if any new key is a Supabase auth key
    const hasSupabaseKey = newKeys.some(
      (k) => k.startsWith("sb-") || k.includes("supabase"),
    );

    if (hasSupabaseKey) {
      Logger.info("New Supabase auth key detected, checking token...");
      setTimeout(() => detectAndSendToken(), 500);
    }
  }

  // Update known keys
  state.knownStorageKeys = currentKeys;
}

// ============================================
// MESSAGE LISTENER
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.debug("Message received from background", { type: message.type });

  switch (message.type) {
    case "CHECK_AUTH":
      detectAndSendToken()
        .then((result) => sendResponse({ success: result }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true; // Async response

    case "PING":
      sendResponse({ success: true, message: "pong", timestamp: Date.now() });
      return true;

    case "GET_TOKEN":
      const authInfo = findSupabaseAuthKey();
      if (authInfo) {
        const authDataRaw = authInfo.storage.getItem(authInfo.key);
        if (authDataRaw) {
          try {
            const authData = JSON.parse(authDataRaw);
            const validated = validateToken(authData);
            sendResponse({ success: true, data: validated });
          } catch (error) {
            sendResponse({ success: false, error: "Failed to parse token" });
          }
        } else {
          sendResponse({ success: false, error: "No auth data" });
        }
      } else {
        sendResponse({ success: false, error: "No auth key found" });
      }
      return true;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
      return true;
  }
});

// ============================================
// STORAGE EVENT LISTENER
// ============================================
window.addEventListener("storage", (event) => {
  if (
    event.key &&
    (event.key.startsWith("sb-") || event.key.includes("supabase"))
  ) {
    Logger.debug("Storage event detected", { key: event.key });
    setTimeout(() => detectAndSendToken(), 100);
  }
});

// ============================================
// INITIALIZATION
// ============================================
async function initialize() {
  if (state.isInitialized) {
    Logger.warn("Already initialized, skipping...");
    return;
  }

  Logger.info("Initializing content script...", {
    url: window.location.href,
    version: CONFIG.version,
  });

  // Save initial storage keys
  state.knownStorageKeys = new Set([
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage),
  ]);

  Logger.debug("Initial storage state", {
    localKeys: Object.keys(localStorage).length,
    sessionKeys: Object.keys(sessionStorage).length,
  });

  // Check if background is ready
  try {
    const response = await sendMessageToBackground({ type: "PING" });
    if (response.success) {
      Logger.success("Background service worker is ready");
    }
  } catch (error) {
    Logger.warn("Background not ready yet", error);
  }

  // Initial token check (after delay)
  setTimeout(() => {
    Logger.info("Running initial token check...");
    detectAndSendToken();
  }, CONFIG.detection.initialDelay);

  // Create connect button (after delay)
  setTimeout(() => {
    if (document.body) {
      createConnectButton();
    }
  }, CONFIG.detection.initialDelay + 500);

  // Start periodic checks
  setInterval(() => {
    detectAndSendToken();
  }, CONFIG.detection.checkInterval);

  // Start storage monitoring
  setInterval(() => {
    monitorStorageChanges();
  }, CONFIG.detection.storageMonitorInterval);

  state.isInitialized = true;

  Logger.success("Content script initialized and monitoring", {
    checkInterval: CONFIG.detection.checkInterval + "ms",
    storageMonitorInterval: CONFIG.detection.storageMonitorInterval + "ms",
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// START
// ============================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

Logger.info("✅ Content script loaded");

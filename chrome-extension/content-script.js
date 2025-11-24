// ============================================
// SYNCADS EXTENSION - CONTENT SCRIPT v4.0
// Robust Token Detection & Background Communication
// ============================================

// ============================================
// ✅ EXECUTAR APENAS NO SYNCADS PARA DETECTAR LOGIN
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

// Content script deve executar no SyncAds para capturar token após login
console.log("🚀 SyncAds Extension v4.0 - Content Script Active", {
  domain: currentDomain,
  isSyncAdsSite: isSyncAdsSite,
  url: window.location.href,
});

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

      const response = await Promise.race([
        chrome.runtime.sendMessage(message),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Timeout waiting for background response")),
            15000,
          ),
        ),
      ]);

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
  Logger.debug("🔍 Detectando token...", {
    url: window.location.href,
    isSyncAds: isSyncAdsSite,
  });

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
    isSyncAdsSite: isSyncAdsSite,
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

  // CRITICAL: Se estamos no SyncAds, detectar token IMEDIATAMENTE
  if (isSyncAdsSite) {
    Logger.info("🎯 No SyncAds! Iniciando detecção agressiva de token...");

    // Verificar imediatamente (sem delay)
    detectAndSendToken();

    // Verificar novamente após 500ms
    setTimeout(() => detectAndSendToken(), 500);

    // E mais uma vez após 2 segundos
    setTimeout(() => detectAndSendToken(), 2000);

    // Adicionar listener para mudanças no localStorage/sessionStorage
    window.addEventListener("storage", (e) => {
      Logger.debug("Storage changed", { key: e.key, newValue: !!e.newValue });
      if (e.key && (e.key.includes("auth") || e.key.includes("supabase"))) {
        Logger.info("Auth storage changed! Detectando token...");
        setTimeout(() => detectAndSendToken(), 100);
      }
    });

    // Observar mudanças diretas no localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key.includes("auth") || key.includes("supabase")) {
        Logger.info("LocalStorage auth modified!", { key });
        setTimeout(() => detectAndSendToken(), 100);
      }
    };
  } else {
    // Para outros sites, delay normal
    setTimeout(() => {
      Logger.info("Running initial token check...");
      detectAndSendToken();
    }, CONFIG.detection.initialDelay);
  }

  // Create connect button (after delay)
  setTimeout(() => {
    if (document.body && !isSyncAdsSite) {
      createConnectButton();
    }
  }, CONFIG.detection.initialDelay + 500);

  // Start periodic checks (APENAS SE NÃO TEMOS TOKEN AINDA)
  setInterval(() => {
    // Só verificar se ainda não processamos nenhum token
    if (state.processedTokens.size === 0) {
      detectAndSendToken();
    }
  }, 30000); // A cada 30s, não 5s

  // Start storage monitoring
  setInterval(() => {
    monitorStorageChanges();
  }, CONFIG.detection.storageMonitorInterval);

  state.isInitialized = true;

  Logger.success("Content script initialized and monitoring", {
    storageMonitorInterval: CONFIG.detection.storageMonitorInterval + "ms",
    isSyncAdsSite: isSyncAdsSite,
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// DOM COMMAND EXECUTOR
// ============================================
async function executeDomCommand(command) {
  const { type, data } = command;

  Logger.info("🎯 Executing DOM command", { type, data });

  try {
    let result = null;

    switch (type) {
      case "DOM_CLICK":
        result = await executeClick(data.selector);
        break;

      case "DOM_FILL":
        result = await executeFill(data.selector, data.value);
        break;

      case "DOM_READ":
        result = await executeRead(data.selector);
        break;

      case "SCREENSHOT":
        result = await executeScreenshot();
        break;

      case "NAVIGATE":
        result = await executeNavigation(data.url);
        break;

      case "SCROLL":
        result = await executeScroll(data);
        break;

      case "WAIT":
        result = await executeWait(data.ms || 1000);
        break;

      case "DOM_HOVER":
        result = await executeHover(data.selector);
        break;

      case "DOM_SELECT":
        result = await executeSelect(data.selector, data.value);
        break;

      case "FORM_SUBMIT":
        result = await executeFormSubmit(data.selector);
        break;

      default:
        throw new Error(`Unknown command type: ${type}`);
    }

    Logger.success("✅ Command executed successfully", { type, result });
    return { success: true, result };
  } catch (error) {
    Logger.error("❌ Command execution failed", error, { type, data });
    return { success: false, error: error.message };
  }
}

// ============================================
// COMMAND IMPLEMENTATIONS
// ============================================

async function executeClick(selector) {
  Logger.debug("Executing CLICK", { selector });

  // Tentar encontrar elemento com retry
  let element = null;
  for (let i = 0; i < 3; i++) {
    element = document.querySelector(selector);
    if (element) break;
    await sleep(500);
  }

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Scroll para elemento estar visível
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(300);

  // Destacar elemento temporariamente
  const originalOutline = element.style.outline;
  element.style.outline = "3px solid #10b981";

  // Clicar
  element.click();

  // Remover destaque
  setTimeout(() => {
    element.style.outline = originalOutline;
  }, 500);

  return {
    clicked: selector,
    text: element.textContent?.trim().substring(0, 50) || "",
    tagName: element.tagName.toLowerCase(),
  };
}

async function executeFill(selector, value) {
  Logger.debug("Executing FILL", { selector, value });

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Scroll para elemento estar visível
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(300);

  // Focar no elemento
  element.focus();

  // Limpar valor anterior
  element.value = "";

  // Destacar elemento
  const originalOutline = element.style.outline;
  element.style.outline = "3px solid #3b82f6";

  // Preencher com delay (simular digitação)
  for (let i = 0; i < value.length; i++) {
    element.value += value[i];
    element.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep(50);
  }

  // Disparar eventos
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("blur", { bubbles: true }));

  // Remover destaque
  setTimeout(() => {
    element.style.outline = originalOutline;
  }, 500);

  return {
    filled: selector,
    value: value,
    tagName: element.tagName.toLowerCase(),
  };
}

async function executeRead(selector) {
  Logger.debug("Executing READ", { selector });

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Scroll para elemento estar visível
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(300);

  // Destacar elemento
  const originalOutline = element.style.outline;
  element.style.outline = "3px solid #f59e0b";
  setTimeout(() => {
    element.style.outline = originalOutline;
  }, 500);

  return {
    text: element.textContent?.trim() || "",
    html: element.innerHTML,
    value: element.value || null,
    tagName: element.tagName.toLowerCase(),
    attributes: Array.from(element.attributes).reduce((acc, attr) => {
      acc[attr.name] = attr.value;
      return acc;
    }, {}),
    classList: Array.from(element.classList),
    href: element.href || null,
    src: element.src || null,
  };
}

async function executeScreenshot() {
  Logger.debug("Executing SCREENSHOT");

  // Enviar mensagem para background para capturar screenshot
  const response = await chrome.runtime.sendMessage({
    type: "CAPTURE_SCREENSHOT",
  });

  return response;
}

async function executeNavigation(url) {
  Logger.debug("Executing NAVIGATE", { url });

  // Validar URL
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  window.location.href = url;

  return { navigated: url };
}

async function executeScroll(data) {
  Logger.debug("Executing SCROLL", { data });

  const { x = 0, y = 0, behavior = "smooth", selector = null } = data;

  if (selector) {
    // Scroll para elemento específico
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }
    element.scrollIntoView({ behavior, block: "center" });
  } else {
    // Scroll da página
    window.scrollTo({ top: y, left: x, behavior });
  }

  await sleep(500);

  return {
    scrolled: { x, y },
    currentScroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
  };
}

async function executeWait(ms) {
  Logger.debug("Executing WAIT", { ms });

  await sleep(ms);

  return { waited: ms };
}

async function executeHover(selector) {
  Logger.debug("Executing HOVER", { selector });

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  // Scroll para elemento estar visível
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(300);

  // Criar e disparar evento de hover
  const mouseOverEvent = new MouseEvent("mouseover", {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  const mouseEnterEvent = new MouseEvent("mouseenter", {
    view: window,
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(mouseOverEvent);
  element.dispatchEvent(mouseEnterEvent);

  return {
    hovered: selector,
    tagName: element.tagName.toLowerCase(),
  };
}

async function executeSelect(selector, value) {
  Logger.debug("Executing SELECT", { selector, value });

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  if (element.tagName.toLowerCase() !== "select") {
    throw new Error("Element is not a SELECT element");
  }

  // Scroll para elemento estar visível
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await sleep(300);

  // Selecionar opção
  element.value = value;

  // Disparar eventos
  element.dispatchEvent(new Event("change", { bubbles: true }));
  element.dispatchEvent(new Event("input", { bubbles: true }));

  return {
    selected: selector,
    value: value,
    selectedText: element.options[element.selectedIndex]?.text || "",
  };
}

async function executeFormSubmit(selector) {
  Logger.debug("Executing FORM_SUBMIT", { selector });

  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  let form = element;
  if (element.tagName.toLowerCase() !== "form") {
    // Buscar form pai
    form = element.closest("form");
    if (!form) {
      throw new Error("No form found");
    }
  }

  // Submit
  form.submit();

  return {
    submitted: selector,
    action: form.action || "",
    method: form.method || "GET",
  };
}

// ============================================
// MESSAGE LISTENER - RECEBER COMANDOS
// ============================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Logger.debug("📩 Message received in content-script", { type: message.type });

  if (message.type === "EXECUTE_COMMAND") {
    // Executar comando de forma assíncrona
    (async () => {
      try {
        const result = await executeDomCommand({
          type: message.command,
          data: message.params,
        });

        sendResponse({ success: true, result });

        // Mostrar feedback visual
        if (result.success) {
          showCommandFeedback(message.command, result.result);
        }
      } catch (error) {
        Logger.error("Command execution error", error);
        sendResponse({ success: false, error: error.message });
        showCommandError(message.command, error.message);
      }
    })();

    return true; // Keep channel open for async response
  }

  if (message.type === "PING") {
    sendResponse({ pong: true, timestamp: Date.now() });
    return true;
  }

  if (message.type === "GET_PAGE_INFO") {
    sendResponse({
      url: window.location.href,
      title: document.title,
      domain: window.location.hostname,
    });
    return true;
  }
});

// ============================================
// FEEDBACK VISUAL
// ============================================
function showCommandFeedback(command, result) {
  const toast = document.createElement("div");
  toast.id = "syncads-command-toast";
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 40px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0,0,0,0.1);
    z-index: 2147483647;
    animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
  `;

  const icon = document.createElement("span");
  icon.style.cssText = `
    font-size: 20px;
    display: flex;
    align-items: center;
  `;
  icon.textContent = "✓";

  const text = document.createElement("span");
  text.textContent = `${formatCommandName(command)} executado com sucesso`;

  toast.appendChild(icon);
  toast.appendChild(text);

  // Remover toast anterior se existir
  const existingToast = document.getElementById("syncads-command-toast");
  if (existingToast) {
    existingToast.remove();
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation =
      "slideOut 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

function showCommandError(command, errorMsg) {
  const toast = document.createElement("div");
  toast.id = "syncads-command-toast";
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 10px 40px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.1);
    z-index: 2147483647;
    animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 400px;
  `;

  const icon = document.createElement("span");
  icon.style.cssText = `
    font-size: 20px;
    display: flex;
    align-items: center;
  `;
  icon.textContent = "✕";

  const text = document.createElement("div");
  text.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 4px;">${formatCommandName(command)} falhou</div>
    <div style="font-size: 12px; opacity: 0.9;">${errorMsg}</div>
  `;

  toast.appendChild(icon);
  toast.appendChild(text);

  // Remover toast anterior se existir
  const existingToast = document.getElementById("syncads-command-toast");
  if (existingToast) {
    existingToast.remove();
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation =
      "slideOut 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

function formatCommandName(command) {
  const names = {
    DOM_CLICK: "Clique",
    DOM_FILL: "Preenchimento",
    DOM_READ: "Leitura",
    SCREENSHOT: "Captura de tela",
    NAVIGATE: "Navegação",
    SCROLL: "Rolagem",
    WAIT: "Espera",
    DOM_HOVER: "Hover",
    DOM_SELECT: "Seleção",
    FORM_SUBMIT: "Envio de formulário",
  };

  return names[command] || command;
}

// Adicionar animações CSS
if (!document.getElementById("syncads-animations")) {
  const style = document.createElement("style");
  style.id = "syncads-animations";
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0) scale(1);
        opacity: 1;
      }
      to {
        transform: translateX(400px) scale(0.9);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// ============================================
// START
// ============================================
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

Logger.info("✅ Content script loaded with DOM executor");

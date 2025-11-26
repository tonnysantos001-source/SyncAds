// ============================================
// SYNCADS AI SIDE PANEL - MODERN VERSION
// ============================================
// Complete implementation with Supabase integration,
// chat functionality, command execution, and realtime updates
// ============================================

console.log("🚀 [SIDE PANEL MODERN] Initializing...");

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  SUPABASE_URL: "https://ovskepqggmxlfckxqgbr.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
  CHAT_API_URL:
    "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced",
  MAX_MESSAGE_LENGTH: 4000,
  STORAGE_KEYS: {
    USER_ID: "syncads_user_id",
    ACCESS_TOKEN: "syncads_access_token",
    DEVICE_ID: "syncads_device_id",
    CURRENT_CONVERSATION: "syncads_current_conversation",
  },
  REALTIME_CHANNEL: "extension_commands",
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  // Auth
  userId: null,
  accessToken: null,
  deviceId: null,
  isAuthenticated: false,

  // Conversation
  conversationId: null,
  conversations: [],
  messages: [],

  // UI State
  isTyping: false,
  isSending: false,
  showEmptyState: true,
  sidebarOpen: false,

  // Realtime
  realtimeChannel: null,
  commandsSubscription: null,

  // Commands
  pendingCommands: new Map(),
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  // Containers
  messagesContainer: document.getElementById("messagesContainer"),
  emptyState: document.getElementById("emptyState"),

  // Input
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  sendIcon: document.getElementById("sendIcon"),
  sendLoader: document.getElementById("sendLoader"),
  attachBtn: document.getElementById("attachBtn"),

  // Sidebar
  sidebar: document.getElementById("sidebar"),
  historyBtn: document.getElementById("historyBtn"),
  closeSidebar: document.getElementById("closeSidebar"),
  newChatBtn: document.getElementById("newChatBtn"),
  conversationsList: document.getElementById("conversationsList"),

  // Overlay
  overlay: document.getElementById("overlay"),

  // Suggestions
  suggestions: document.getElementById("suggestions"),
};

// ============================================
// SUPABASE CLIENT INITIALIZATION
// ============================================
let supabase = null;

function initSupabase() {
  try {
    if (typeof supabase === "undefined" || !window.supabase) {
      console.error("❌ Supabase library not loaded");
      return false;
    }

    supabase = window.supabase.createClient(
      CONFIG.SUPABASE_URL,
      CONFIG.SUPABASE_ANON_KEY,
    );

    console.log("✅ Supabase client initialized");
    return true;
  } catch (error) {
    console.error("❌ Failed to initialize Supabase:", error);
    return false;
  }
}

// ============================================
// STORAGE UTILITIES
// ============================================
const Storage = {
  async get(key) {
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } catch (error) {
      console.error(`❌ Storage.get error for ${key}:`, error);
      return null;
    }
  },

  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      console.log(`✅ Storage.set: ${key}`);
    } catch (error) {
      console.error(`❌ Storage.set error for ${key}:`, error);
    }
  },

  async remove(key) {
    try {
      await chrome.storage.local.remove(key);
      console.log(`✅ Storage.remove: ${key}`);
    } catch (error) {
      console.error(`❌ Storage.remove error for ${key}:`, error);
    }
  },

  async clear() {
    try {
      await chrome.storage.local.clear();
      console.log("✅ Storage cleared");
    } catch (error) {
      console.error("❌ Storage.clear error:", error);
    }
  },
};

// ============================================
// AUTHENTICATION
// ============================================
const Auth = {
  async loadSession() {
    try {
      console.log("🔐 Loading session...");

      // Load from storage
      const userId = await Storage.get(CONFIG.STORAGE_KEYS.USER_ID);
      const accessToken = await Storage.get(CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      const deviceId = await Storage.get(CONFIG.STORAGE_KEYS.DEVICE_ID);

      if (!userId || !accessToken) {
        console.log("⚠️ No stored session found");
        return false;
      }

      // Update state
      state.userId = userId;
      state.accessToken = accessToken;
      state.deviceId = deviceId || (await this.generateDeviceId());
      state.isAuthenticated = true;

      // Verify session with Supabase
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error || !session) {
        console.log("⚠️ Session invalid, trying to restore...");

        // Try to set session
        const { error: setError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: accessToken, // May need proper refresh token
        });

        if (setError) {
          console.error("❌ Failed to restore session:", setError);
          await this.logout();
          return false;
        }
      }

      console.log("✅ Session loaded successfully");
      console.log("👤 User ID:", userId);
      console.log("📱 Device ID:", state.deviceId);

      // Register device
      await this.registerDevice();

      return true;
    } catch (error) {
      console.error("❌ Load session error:", error);
      return false;
    }
  },

  async generateDeviceId() {
    const deviceId = `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await Storage.set(CONFIG.STORAGE_KEYS.DEVICE_ID, deviceId);
    return deviceId;
  },

  async registerDevice() {
    try {
      if (!state.deviceId || !state.userId) {
        console.warn("⚠️ Cannot register device: missing deviceId or userId");
        return;
      }

      const { error } = await supabase.from("extension_devices").upsert(
        {
          device_id: state.deviceId,
          user_id: state.userId,
          status: "online",
          last_seen: new Date().toISOString(),
          browser: "Chrome",
          os: navigator.platform,
        },
        {
          onConflict: "device_id",
        },
      );

      if (error) {
        console.error("❌ Device registration error:", error);
      } else {
        console.log("✅ Device registered:", state.deviceId);
      }
    } catch (error) {
      console.error("❌ Register device error:", error);
    }
  },

  async logout() {
    try {
      console.log("👋 Logging out...");

      // Clear state
      state.userId = null;
      state.accessToken = null;
      state.deviceId = null;
      state.isAuthenticated = false;
      state.conversationId = null;
      state.conversations = [];
      state.messages = [];

      // Clear storage
      await Storage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Reset UI
      UI.showEmptyState();
      UI.clearMessages();

      console.log("✅ Logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  },

  // Listen for auth changes from background script
  onAuthChange(callback) {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes[CONFIG.STORAGE_KEYS.ACCESS_TOKEN]) {
        callback();
      }
    });
  },
};

// ============================================
// CONVERSATION MANAGEMENT
// ============================================
const Conversation = {
  async loadConversations() {
    try {
      if (!state.userId) {
        console.warn("⚠️ Cannot load conversations: not authenticated");
        return [];
      }

      console.log("📂 Loading conversations...");

      const { data, error } = await supabase
        .from("ChatConversation")
        .select("id, title, createdAt, updatedAt")
        .eq("userId", state.userId)
        .order("updatedAt", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ Load conversations error:", error);
        return [];
      }

      state.conversations = data || [];
      console.log(`✅ Loaded ${state.conversations.length} conversations`);

      // Update UI
      UI.renderConversations();

      return state.conversations;
    } catch (error) {
      console.error("❌ Load conversations error:", error);
      return [];
    }
  },

  async createConversation() {
    try {
      if (!state.userId) {
        console.error("❌ Cannot create conversation: not authenticated");
        UI.showNotification("❌ Você precisa estar logado", "error");
        return null;
      }

      console.log("➕ Creating new conversation...");

      const now = new Date().toISOString();
      const conversationId = crypto.randomUUID();

      const { data, error } = await supabase
        .from("ChatConversation")
        .insert({
          id: conversationId,
          userId: state.userId,
          title: `Chat ${new Date().toLocaleDateString("pt-BR")}`,
          createdAt: now,
        })
        .select()
        .single();

      if (error) {
        console.error("❌ Create conversation error:", error);
        UI.showNotification("❌ Erro ao criar conversa", "error");
        return null;
      }

      console.log("✅ Conversation created:", data.id);

      // Update state
      state.conversationId = data.id;
      state.conversations.unshift(data);
      state.messages = [];

      // Save to storage
      await Storage.set(CONFIG.STORAGE_KEYS.CURRENT_CONVERSATION, data.id);

      // Update UI
      UI.clearMessages();
      UI.hideEmptyState();
      UI.renderConversations();
      UI.showNotification("✨ Nova conversa criada!", "success");

      // Focus input
      elements.messageInput.focus();

      return data;
    } catch (error) {
      console.error("❌ Create conversation error:", error);
      UI.showNotification("❌ Erro ao criar conversa", "error");
      return null;
    }
  },

  async switchConversation(conversationId) {
    try {
      console.log("🔄 Switching to conversation:", conversationId);

      state.conversationId = conversationId;
      await Storage.set(
        CONFIG.STORAGE_KEYS.CURRENT_CONVERSATION,
        conversationId,
      );

      // Load messages
      await this.loadMessages(conversationId);

      // Update UI
      UI.renderConversations();
      UI.hideEmptyState();

      console.log("✅ Switched to conversation:", conversationId);
    } catch (error) {
      console.error("❌ Switch conversation error:", error);
    }
  },

  async loadMessages(conversationId) {
    try {
      console.log("💬 Loading messages for conversation:", conversationId);

      const { data, error } = await supabase
        .from("ChatMessage")
        .select("id, role, content, createdAt")
        .eq("conversationId", conversationId)
        .order("createdAt", { ascending: true });

      if (error) {
        console.error("❌ Load messages error:", error);
        return [];
      }

      state.messages = data || [];
      console.log(`✅ Loaded ${state.messages.length} messages`);

      // Render messages
      UI.renderMessages();

      return state.messages;
    } catch (error) {
      console.error("❌ Load messages error:", error);
      return [];
    }
  },

  async deleteConversation(conversationId) {
    try {
      console.log("🗑️ Deleting conversation:", conversationId);

      const { error } = await supabase
        .from("ChatConversation")
        .delete()
        .eq("id", conversationId);

      if (error) {
        console.error("❌ Delete conversation error:", error);
        return false;
      }

      // Update state
      state.conversations = state.conversations.filter(
        (c) => c.id !== conversationId,
      );

      if (state.conversationId === conversationId) {
        state.conversationId = null;
        state.messages = [];
        UI.showEmptyState();
      }

      // Update UI
      UI.renderConversations();

      console.log("✅ Conversation deleted");
      return true;
    } catch (error) {
      console.error("❌ Delete conversation error:", error);
      return false;
    }
  },
};

// ============================================
// INITIALIZATION
// ============================================
async function init() {
  try {
    console.log("🎬 Initializing Side Panel...");

    // Initialize Supabase
    if (!initSupabase()) {
      console.error("❌ Failed to initialize Supabase");
      UI.showNotification("❌ Erro ao conectar com o servidor", "error");
      return;
    }

    // Setup event listeners
    setupEventListeners();

    // Load session
    const authenticated = await Auth.loadSession();

    if (authenticated) {
      // Load conversations
      await Conversation.loadConversations();

      // Load last conversation
      const lastConversationId = await Storage.get(
        CONFIG.STORAGE_KEYS.CURRENT_CONVERSATION,
      );

      if (lastConversationId) {
        await Conversation.switchConversation(lastConversationId);
      } else if (state.conversations.length > 0) {
        await Conversation.switchConversation(state.conversations[0].id);
      } else {
        // Create first conversation
        await Conversation.createConversation();
      }

      // Setup realtime
      setupRealtime();
    } else {
      console.log("⚠️ Not authenticated");
      UI.showEmptyState();
      UI.showNotification(
        "⚠️ Faça login na extensão para continuar",
        "warning",
      );
    }

    console.log("✅ Side Panel initialized");
  } catch (error) {
    console.error("❌ Initialization error:", error);
    UI.showNotification("❌ Erro ao inicializar", "error");
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
  // Send message
  elements.sendBtn?.addEventListener("click", handleSendMessage);

  // Input events
  elements.messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  });

  elements.messageInput?.addEventListener("input", handleInputChange);

  // Sidebar
  elements.historyBtn?.addEventListener("click", () => UI.toggleSidebar());
  elements.closeSidebar?.addEventListener("click", () => UI.toggleSidebar());
  elements.overlay?.addEventListener("click", () => UI.toggleSidebar());

  // New chat
  elements.newChatBtn?.addEventListener("click", async () => {
    await Conversation.createConversation();
    UI.toggleSidebar();
  });

  // Quick actions
  document.querySelectorAll(".quick-action").forEach((action) => {
    action.addEventListener("click", handleQuickAction);
  });

  // Auth change listener
  Auth.onAuthChange(async () => {
    console.log("🔄 Auth changed, reloading...");
    await init();
  });

  console.log("✅ Event listeners setup complete");
}

// ============================================
// START APPLICATION
// ============================================
document.addEventListener("DOMContentLoaded", init);

console.log("✅ [SIDE PANEL MODERN] Script loaded");

// ============================================
// UI UTILITIES
// ============================================
const UI = {
  showEmptyState() {
    state.showEmptyState = true;
    elements.emptyState?.classList.remove("hidden");

    // Clear all message elements except empty state
    const messageElements = elements.messagesContainer?.querySelectorAll(
      ".message, .typing-indicator",
    );
    messageElements?.forEach((el) => el.remove());
  },

  hideEmptyState() {
    state.showEmptyState = false;
    elements.emptyState?.classList.add("hidden");
  },

  clearMessages() {
    state.messages = [];
    const messageElements = elements.messagesContainer?.querySelectorAll(
      ".message, .typing-indicator",
    );
    messageElements?.forEach((el) => el.remove());
    this.showEmptyState();
  },

  renderMessages() {
    if (!elements.messagesContainer) return;

    // Clear existing messages
    const messageElements = elements.messagesContainer.querySelectorAll(
      ".message, .typing-indicator",
    );
    messageElements.forEach((el) => el.remove());

    if (state.messages.length === 0) {
      this.showEmptyState();
      return;
    }

    this.hideEmptyState();

    // Render each message
    state.messages.forEach((message) => {
      this.appendMessage(message, false);
    });

    // Scroll to bottom
    this.scrollToBottom();
  },

  appendMessage(message, animate = true) {
    if (!elements.messagesContainer) return;

    this.hideEmptyState();

    const messageEl = document.createElement("div");
    messageEl.className = `message ${message.role}`;
    if (!animate) messageEl.style.animation = "none";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = message.role === "user" ? "👤" : "🤖";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = message.content;

    const time = document.createElement("div");
    time.className = "message-time";
    time.textContent = this.formatTime(message.createdAt);

    contentDiv.appendChild(bubble);
    contentDiv.appendChild(time);

    messageEl.appendChild(avatar);
    messageEl.appendChild(contentDiv);

    elements.messagesContainer.appendChild(messageEl);

    if (animate) {
      this.scrollToBottom();
    }
  },

  showTypingIndicator() {
    if (!elements.messagesContainer) return;

    const typingEl = document.createElement("div");
    typingEl.className = "message assistant";
    typingEl.id = "typingIndicator";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";

    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.innerHTML =
      '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    typingEl.appendChild(avatar);
    typingEl.appendChild(indicator);

    elements.messagesContainer.appendChild(typingEl);
    this.scrollToBottom();
  },

  hideTypingIndicator() {
    const typingEl = document.getElementById("typingIndicator");
    typingEl?.remove();
  },

  scrollToBottom() {
    if (elements.messagesContainer) {
      elements.messagesContainer.scrollTop =
        elements.messagesContainer.scrollHeight;
    }
  },

  formatTime(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  toggleSidebar() {
    state.sidebarOpen = !state.sidebarOpen;
    elements.sidebar?.classList.toggle("open");
    elements.overlay?.classList.toggle("active");
  },

  renderConversations() {
    if (!elements.conversationsList) return;

    elements.conversationsList.innerHTML = "";

    if (state.conversations.length === 0) {
      elements.conversationsList.innerHTML =
        '<div style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhuma conversa ainda</div>';
      return;
    }

    state.conversations.forEach((conv) => {
      const item = document.createElement("div");
      item.className = "conversation-item";
      if (conv.id === state.conversationId) {
        item.classList.add("active");
      }

      const title = document.createElement("div");
      title.className = "conversation-title";
      title.textContent = conv.title || "Sem título";

      const date = document.createElement("div");
      date.className = "conversation-date";
      date.textContent = this.formatDate(conv.createdAt);

      item.appendChild(title);
      item.appendChild(date);

      item.addEventListener("click", async () => {
        await Conversation.switchConversation(conv.id);
        this.toggleSidebar();
      });

      elements.conversationsList.appendChild(item);
    });
  },

  formatDate(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 86400000) {
      // Less than 1 day
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    }
  },

  showNotification(message, type = "info") {
    console.log(`🔔 [${type.toUpperCase()}] ${message}`);

    // Create notification element
    const notification = document.createElement("div");
    notification.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === "error" ? "var(--error)" : type === "success" ? "var(--success)" : "var(--accent-blue)"};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            max-width: 300px;
            text-align: center;
            font-size: 14px;
        `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transform = "translateX(-50%) translateY(-10px)";
      notification.style.transition = "all 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  setInputLoading(loading) {
    state.isSending = loading;

    if (loading) {
      elements.sendBtn?.setAttribute("disabled", "true");
      elements.sendIcon?.classList.add("hidden");
      elements.sendLoader?.classList.remove("hidden");
      elements.messageInput?.setAttribute("disabled", "true");
    } else {
      elements.sendBtn?.removeAttribute("disabled");
      elements.sendIcon?.classList.remove("hidden");
      elements.sendLoader?.classList.add("hidden");
      elements.messageInput?.removeAttribute("disabled");
    }
  },
};

// ============================================
// MESSAGE HANDLING
// ============================================
async function handleSendMessage() {
  try {
    const message = elements.messageInput?.value?.trim();

    if (!message) {
      return;
    }

    if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
      UI.showNotification(
        `❌ Mensagem muito longa (máx: ${CONFIG.MAX_MESSAGE_LENGTH})`,
        "error",
      );
      return;
    }

    if (!state.userId || !state.isAuthenticated) {
      UI.showNotification("❌ Você precisa estar logado", "error");
      return;
    }

    // Create conversation if needed
    if (!state.conversationId) {
      const conv = await Conversation.createConversation();
      if (!conv) {
        UI.showNotification("❌ Erro ao criar conversa", "error");
        return;
      }
    }

    console.log("📤 Sending message:", message);

    // Clear input
    elements.messageInput.value = "";
    UI.setInputLoading(true);

    // Add user message to UI
    const userMessage = {
      id: `temp_user_${Date.now()}`,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };

    state.messages.push(userMessage);
    UI.appendMessage(userMessage);

    // Show typing indicator
    UI.showTypingIndicator();

    // Send to API
    const response = await sendMessageToAPI(message);

    // Hide typing indicator
    UI.hideTypingIndicator();

    if (response && response.response) {
      // Add assistant message to UI
      const assistantMessage = {
        id: `temp_ai_${Date.now()}`,
        role: "assistant",
        content: response.response,
        createdAt: new Date().toISOString(),
      };

      state.messages.push(assistantMessage);
      UI.appendMessage(assistantMessage);

      console.log("✅ Message sent successfully");
    } else {
      UI.showNotification("❌ Erro ao enviar mensagem", "error");
      // Remove user message on error
      state.messages.pop();
      UI.renderMessages();
    }
  } catch (error) {
    console.error("❌ Send message error:", error);
    UI.showNotification("❌ Erro ao enviar mensagem", "error");
    UI.hideTypingIndicator();
  } finally {
    UI.setInputLoading(false);
  }
}

async function sendMessageToAPI(message) {
  try {
    const response = await fetch(CONFIG.CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
      },
      body: JSON.stringify({
        message: message,
        conversationId: state.conversationId,
        extensionConnected: true,
      }),
    });

    if (!response.ok) {
      console.error("❌ API error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ API request error:", error);
    return null;
  }
}

function handleInputChange() {
  // Auto-resize textarea
  if (elements.messageInput) {
    elements.messageInput.style.height = "auto";
    elements.messageInput.style.height =
      elements.messageInput.scrollHeight + "px";
  }
}

// ============================================
// QUICK ACTIONS
// ============================================
async function handleQuickAction(event) {
  const action = event.currentTarget.dataset.action;

  console.log("🎯 Quick action:", action);

  const actions = {
    "list-tabs": "Liste todas as minhas abas abertas",
    "page-info": "Me dê informações sobre a página atual",
    screenshot: "Tire uma screenshot da página atual",
    extract: "Extraia todos os dados desta página",
  };

  const message = actions[action];

  if (message && elements.messageInput) {
    elements.messageInput.value = message;
    elements.messageInput.focus();
    await handleSendMessage();
  }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================
function setupRealtime() {
  try {
    if (!state.deviceId) {
      console.warn("⚠️ Cannot setup realtime: no device ID");
      return;
    }

    console.log("🔴 Setting up realtime subscriptions...");

    // Subscribe to command updates
    const channel = supabase
      .channel("extension_commands")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "extension_commands",
          filter: `device_id=eq.${state.deviceId}`,
        },
        handleCommandUpdate,
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("✅ Realtime subscribed");
        } else {
          console.log("⚠️ Realtime status:", status);
        }
      });

    state.realtimeChannel = channel;
  } catch (error) {
    console.error("❌ Realtime setup error:", error);
  }
}

function handleCommandUpdate(payload) {
  try {
    console.log("🔄 Command update:", payload);

    const command = payload.new;

    if (command.status === "completed") {
      console.log("✅ Command completed:", command.id);
      // Handle completed command if needed
    } else if (command.status === "failed") {
      console.error("❌ Command failed:", command.id, command.error);
      UI.showNotification("❌ Comando falhou", "error");
    }
  } catch (error) {
    console.error("❌ Command update handler error:", error);
  }
}

// ============================================
// CLEANUP
// ============================================
window.addEventListener("beforeunload", () => {
  // Cleanup realtime subscriptions
  if (state.realtimeChannel) {
    state.realtimeChannel.unsubscribe();
  }
});

console.log("✅ [SIDE PANEL MODERN] Full script loaded");

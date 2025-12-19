// ============================================
// SYNCADS AI SIDE PANEL - COMPLETE LOGIC
// ============================================

console.log("🚀 [SIDE PANEL] Script loading...");

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  SUPABASE_URL: "https://ovskepqggmxlfckxqgbr.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
  CHAT_API_URL: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream", // UPDATED TO chat-stream
  MAX_MESSAGE_LENGTH: 2000,
};

// ============================================
// STATE MANAGEMENT
// ============================================
const state = {
  userId: null,
  accessToken: null,
  deviceId: null,
  conversationId: null,
  messages: [],
  conversations: [],
  isTyping: false,
  isAuthenticated: false,
  currentView: "welcome", // welcome, chat, tabs
  commandHistory: [],
  commandHistoryIndex: -1,
  suggestions: [],
  activeTabId: null,
};

// ============================================
// COMMAND SUGGESTIONS & AUTOCOMPLETE
// ============================================
const COMMAND_SUGGESTIONS = [
  { text: "Liste minhas abas abertas", description: "Ver todas as abas" },
  { text: "Qual o título desta página?", description: "Info da página" },
  { text: "Feche esta aba", description: "Fechar aba atual" },
  { text: "Abra https://", description: "Abrir URL em nova aba" },
  { text: "Clique no botão de login", description: "Clicar em elemento" },
  { text: "Preencha o formulário", description: "Preencher campos" },
  { text: "Extraia os emails desta página", description: "Web scraping" },
  { text: "Extraia a tabela", description: "Capturar tabela" },
  { text: "Tire uma screenshot", description: "Capturar tela" },
  { text: "Role até o final", description: "Scroll página" },
  { text: "Aguarde 2 segundos", description: "Pausar execução" },
  { text: "Execute: document.title", description: "Executar JS" },
];

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
  // Containers
  welcomeScreen: document.getElementById("welcomeScreen"),
  chatContainer: document.getElementById("chatContainer"),
  messagesArea: document.getElementById("messagesArea"),

  // Input
  messageInput: document.getElementById("messageInput"),
  sendBtn: document.getElementById("sendBtn"),
  activeTabSelector: document.getElementById("activeTabSelector"),
  refreshTabsBtn: document.getElementById("refreshTabsBtn"),

  // Overlays
  overlay: document.getElementById("overlay"),

  // History
  historyBtn: document.getElementById("historyBtn"),
  chatHistory: document.getElementById("chatHistory"),
  closeHistory: document.getElementById("closeHistory"),
  historyList: document.getElementById("historyList"),
  newChatBtn: document.getElementById("newChatFromHistory"),
  searchChats: document.getElementById("searchChats"),
};

// ============================================
// TABS MANAGEMENT
// ============================================

/**
 * Get all open tabs
 */
async function getAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    return tabs;
  } catch (error) {
    console.error("❌ [TABS] Error getting tabs:", error);
    return [];
  }
}

/**
 * Load tabs into selector
 */
async function loadTabsForSelector() {
  try {
    const tabs = await getAllTabs();
    const selector = elements.activeTabSelector;

    selector.innerHTML = '<option value="" disabled>Selecione uma aba...</option>';

    // Get active tab to default to
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    tabs.forEach((tab) => {
      const option = document.createElement("option");
      option.value = tab.id;
      let title = tab.title || tab.url || "Sem título";
      if (title.length > 40) title = title.substring(0, 40) + "...";

      option.textContent = (tab.active ? "📍 " : "") + title;
      selector.appendChild(option);
    });

    // Set selection
    if (state.activeTabId && tabs.find(t => t.id == state.activeTabId)) {
      selector.value = state.activeTabId;
    } else if (activeTab) {
      selector.value = activeTab.id;
      state.activeTabId = activeTab.id;
    }

    // Listener for change
    selector.onchange = (e) => {
      state.activeTabId = parseInt(e.target.value);
      console.log("📍 [TABS] Selected tab:", state.activeTabId);
    };

  } catch (error) {
    console.error("❌ [TABS] Error loading selector:", error);
  }
}

/**
 * Show tabs list in chat
 */
async function showTabsList() {
  try {
    console.log("🗂️ [TABS] Loading tabs list...");

    const tabs = await getAllTabs();

    if (tabs.length === 0) {
      addMessage("assistant", "Não há abas abertas no momento.");
      return;
    }

    // Group tabs by window
    const windows = {};
    tabs.forEach((tab) => {
      if (!windows[tab.windowId]) {
        windows[tab.windowId] = [];
      }
      windows[tab.windowId].push(tab);
    });

    let message = `📋 **Abas Abertas** (${tabs.length} total)\n\n`;

    Object.keys(windows).forEach((windowId, index) => {
      const windowTabs = windows[windowId];
      message += `**Janela ${index + 1}** (${windowTabs.length} abas):\n`;

      windowTabs.forEach((tab, tabIndex) => {
        const active = tab.active ? "✓ " : "";
        message += `${tabIndex + 1}. ${active}${tab.title}\n`;
        message += `   ${tab.url}\n\n`;
      });
    });

    addMessage("assistant", message);
  } catch (error) {
    console.error("❌ [TABS] Error showing tabs:", error);
    addMessage("assistant", "❌ Erro ao listar abas. Tente novamente.");
  }
}



// ============================================
// AUTHENTICATION
// ============================================

/**
 * Load authentication data from storage
 */
async function loadAuthData() {
  try {
    console.log("🔐 [AUTH] Loading authentication data...");

    const data = await chrome.storage.local.get([
      "userId",
      "accessToken",
      "deviceId",
      "conversationId",
    ]);

    console.log("📦 [AUTH] Storage data:", {
      hasUserId: !!data.userId,
      hasToken: !!data.accessToken,
      hasDeviceId: !!data.deviceId,
    });

    state.userId = data.userId;
    state.accessToken = data.accessToken;
    state.deviceId = data.deviceId;
    state.conversationId = data.conversationId;
    state.isAuthenticated = !!(data.userId && data.accessToken);

    if (state.isAuthenticated) {
      console.log("✅ [AUTH] User authenticated");
      await loadConversations();
      // Enable input for authenticated users
      elements.messageInput.disabled = false;
      elements.sendBtn.disabled = false;
      elements.messageInput.placeholder = "Digite sua mensagem... (Shift+Enter para nova linha)";
    } else {
      console.log("⚠️ [AUTH] User not authenticated");
      showAuthRequired();
    }

    return state.isAuthenticated;
  } catch (error) {
    console.error("❌ [AUTH] Error loading auth data:", error);
    return false;
  }
}

/**
 * Show authentication required message
 */
function showAuthRequired() {
  addMessage(
    "assistant",
    "👋 Olá! Para usar o assistente, você precisa fazer login no painel SyncAds.\n\n" +
    "Clique no ícone da extensão e faça login para começar.",
  );
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;
}

// ============================================
// CONVERSATIONS MANAGEMENT
// ============================================

/**
 * Load conversations from database
 */
async function loadConversations() {
  try {
    console.log("💬 [CONVERSATIONS] Loading conversations...");

    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation?userId=eq.${state.userId}&context=eq.extension&order=createdAt.desc&limit=50`,
      {
        headers: {
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${state.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    state.conversations = data;

    console.log(`✅ [CONVERSATIONS] Loaded ${data.length} conversations`);
    renderConversationsList();

    // Load or create conversation
    if (state.conversationId) {
      await loadConversation(state.conversationId);
    } else if (data.length > 0) {
      await loadConversation(data[0].id);
    } // REMOVED auto-create on load to prevent loop if user fails
  } catch (error) {
    console.error("❌ [CONVERSATIONS] Error loading:", error);
  }
}

/**
 * Create new conversation (FIXED 400 ERROR)
 */
async function createNewConversation() {
  try {
    console.log("🆕 [CONVERSATIONS] Creating new conversation...");

    // Double check auth
    if (!state.userId) {
      console.warn("⚠️ User ID missing, reloading auth...");
      await loadAuthData();
      if (!state.userId) throw new Error("Usuário não autenticado.");
    }

    const payload = {
      userId: state.userId,
      title: `Chat ${new Date().toLocaleDateString("pt-BR")}`,
      context: "extension",
      // Removed manual 'createdAt' to let Supabase handle default if possible, or keep explicit iso string
      createdAt: new Date().toISOString(),
    };

    console.log("🆕 Payload:", payload);

    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${state.accessToken}`,
          Prefer: "return=representation",
        },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const txt = await response.text();
      console.error("❌ CREATE ERROR BODY:", txt);
      throw new Error(`HTTP ${response.status}: ${txt}`);
    }

    const data = await response.json();
    const conversation = data[0];

    state.conversationId = conversation.id;
    state.messages = [];

    await chrome.storage.local.set({ conversationId: conversation.id });

    console.log("✅ [CONVERSATIONS] Created:", conversation.id);

    // Update conversations list manually to avoid reload
    state.conversations.unshift(conversation);
    renderConversationsList();

    // Clear UI and show new chat
    renderMessages(); // Clears DOM since state.messages is []
    switchToChat();
    addMessage("assistant", "👋 Nova conversa iniciada! Como posso ajudar?");

  } catch (error) {
    console.error("❌ [CONVERSATIONS] Error creating:", error);
    addMessage("assistant", `❌ Erro ao criar conversa: ${error.message}`);
  }
}

/**
 * Delete conversation
 */
async function deleteConversation(conversationId) {
  try {
    console.log("🗑️ [CONVERSATIONS] Deleting conversation:", conversationId);

    if (!confirm("Tem certeza que deseja excluir esta conversa?")) {
      return;
    }

    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation?id=eq.${conversationId}`,
      {
        method: "DELETE",
        headers: {
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${state.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log("✅ [CONVERSATIONS] Deleted:", conversationId);

    // Update local state
    state.conversations = state.conversations.filter(
      (c) => c.id !== conversationId,
    );

    // If deleted current conversation, create new one or switch
    if (state.conversationId === conversationId) {
      if (state.conversations.length > 0) {
        loadConversation(state.conversations[0].id);
      } else {
        createNewConversation();
      }
    }

    renderConversationsList();
  } catch (error) {
    console.error("❌ [CONVERSATIONS] Error deleting:", error);
    alert("Erro ao excluir conversa. Tente novamente.");
  }
}

/**
 * Load specific conversation
 */
async function loadConversation(conversationId) {
  try {
    console.log("📖 [CONVERSATIONS] Loading conversation:", conversationId);

    const response = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/ChatMessage?conversationId=eq.${conversationId}&order=createdAt.asc`,
      {
        headers: {
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${state.accessToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const messages = await response.json();

    state.conversationId = conversationId;
    // Map with safety check
    state.messages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role ? msg.role.toLowerCase() : "assistant",
      content: msg.content || "",
      createdAt: msg.createdAt,
    }));

    await chrome.storage.local.set({ conversationId });

    console.log(`✅ [CONVERSATIONS] Loaded ${messages.length} messages`);

    // Render messages
    renderMessages();
    switchToChat();
  } catch (error) {
    console.error("❌ [CONVERSATIONS] Error loading:", error);
  }
}

/**
 * Render conversations list
 */
function renderConversationsList() {
  const list = elements.historyList;
  list.innerHTML = "";

  if (state.conversations.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
        <p>Nenhuma conversa ainda</p>
        <p style="font-size: 12px; margin-top: 8px;">Inicie uma nova conversa!</p>
      </div>
    `;
    return;
  }

  state.conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "history-item";
    if (conv.id === state.conversationId) {
      item.classList.add("active");
    }

    const date = new Date(conv.createdAt).toLocaleDateString("pt-BR");

    item.innerHTML = `
      <div class="history-content">
        <div class="history-item-title">${conv.title || "Nova Conversa"}</div>
        <div class="history-item-date">${date}</div>
      </div>
      <button class="delete-chat-btn" title="Excluir conversa">🗑️</button>
    `;

    // Click to load
    item.addEventListener("click", () => {
      loadConversation(conv.id);
      closeHistoryPanel();
    });

    // Click to delete
    const deleteBtn = item.querySelector(".delete-chat-btn");
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteConversation(conv.id);
    });

    list.appendChild(item);
  });
}

// ============================================
// MESSAGES & CHAT
// ============================================

/**
 * Render all messages
 */
function renderMessages() {
  elements.messagesArea.innerHTML = "";

  state.messages.forEach((msg) => {
    appendMessageToDOM(msg);
  });

  scrollToBottom();
}

/**
 * Add message to state and DOM
 */
function addMessage(role, content) {
  console.log(`💬 [CHAT] Adding ${role} message`);

  const message = {
    id: `temp-${Date.now()}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  state.messages.push(message);
  appendMessageToDOM(message);
  scrollToBottom();
}

/**
 * Append message to DOM
 */
function appendMessageToDOM(message) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${message.role}`;
  messageDiv.dataset.id = message.id;

  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = message.role === "user" ? "👤" : "🤖";

  const content = document.createElement("div");
  content.className = "message-content";

  // Check for antigravity_thinking tags (FIXED REGEX)
  let thinkingContent = null;
  let cleanContent = message.content;

  // Improved regex that handles multi-line content robustly
  const thinkingMatch = /<antigravity_thinking>([\s\S]*?)<\/antigravity_thinking>/i.exec(message.content);

  if (thinkingMatch) {
    thinkingContent = thinkingMatch[1].trim();
    cleanContent = message.content.replace(/<antigravity_thinking>[\s\S]*?<\/antigravity_thinking>/i, "").trim();
  }

  // Render Thinking Block if exists
  if (thinkingContent) {
    const details = document.createElement("details");
    details.className = "thinking-block";
    details.open = false; // Collapse by default to be cleaner

    // Calculate duration estimate (visual gimmick)
    const duration = Math.max(1, Math.round(thinkingContent.length / 50));

    const summary = document.createElement("summary");
    summary.innerHTML = `<span style="display:inline-flex; align-items:center; gap:4px">🧠 Pensamento <span style="font-weight:normal; opacity:0.6; font-size:10px">(${duration}s)</span></span>`;
    summary.style.cursor = "pointer";
    summary.style.marginBottom = "8px";
    summary.style.fontWeight = "600";
    summary.style.fontSize = "12px";
    summary.style.color = "#a5b4fc"; // Indigo-300-ish
    summary.style.userSelect = "none";

    const p = document.createElement("div");
    p.style.whiteSpace = "pre-wrap";
    p.style.fontSize = "12px";
    p.style.color = "#e0e7ff"; // Indigo-100-ish
    p.style.padding = "10px";
    p.style.backgroundColor = "rgba(79, 70, 229, 0.2)"; // Indigo-600 with opacity
    p.style.borderRadius = "4px";
    p.style.marginTop = "4px";
    p.style.fontFamily = "monospace";

    // Basic markdown parsing for thinking block (optional)
    p.textContent = thinkingContent;

    details.appendChild(summary);
    details.appendChild(p);

    // Style the details block container
    details.style.marginBottom = "12px";
    details.style.border = "1px solid rgba(79, 70, 229, 0.3)";
    details.style.borderRadius = "6px";
    details.style.padding = "8px";
    details.style.backgroundColor = "rgba(49, 46, 129, 0.4)"; // Darker indigo background

    content.appendChild(details);
  }

  // Render Main Content Bubble
  if (cleanContent) {
    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    let displayContent = cleanContent;

    // Check for JSON-like start/end
    const trimmed = cleanContent.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const data = JSON.parse(trimmed);
        if (data.success || data.message) {
          const icon = data.success ? "✅" : "⚠️";
          const text = data.message || (data.success ? "Ação concluída." : "Ação pendente.");
          displayContent = `${icon} ${text}`;
        }
      } catch (e) { }
    }

    bubble.innerText = displayContent;
    content.appendChild(bubble);
  }

  const time = document.createElement("div");
  time.className = "message-time";
  const date = new Date(message.createdAt);
  time.textContent = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  content.appendChild(time);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);

  elements.messagesArea.appendChild(messageDiv);
}

// ... [RESTANT OF DOM UTILS - Scrolling, Typing, etc - kept same] ...
function scrollToBottom() {
  elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
}

function showTypingIndicator() {
  if (state.isTyping) return;
  state.isTyping = true;
  const typingDiv = document.createElement("div");
  typingDiv.className = "message assistant";
  typingDiv.id = "typingIndicator";
  const avatar = document.createElement("div");
  avatar.className = "message-avatar";
  avatar.textContent = "🤖";
  const content = document.createElement("div");
  content.className = "message-content";
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = `<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>`;
  content.appendChild(indicator);
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(content);
  elements.messagesArea.appendChild(typingDiv);
  scrollToBottom();
}

function hideTypingIndicator() {
  state.isTyping = false;
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

async function sendMessage() {
  const message = elements.messageInput.value.trim();
  if (!message) return;
  if (!state.isAuthenticated) {
    alert("Por favor, faça login no painel SyncAds primeiro.");
    return;
  }
  console.log("📤 [CHAT] Sending message:", message);
  state.commandHistory.unshift(message);
  if (state.commandHistory.length > 50) state.commandHistory = state.commandHistory.slice(0, 50);
  state.commandHistoryIndex = -1;
  addMessage("user", message);
  clearInput();
  hideSuggestions();
  switchToChat();
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;
  showTypingIndicator();

  try {
    if (!state.conversationId) await createNewConversation();

    const response = await fetch(CONFIG.CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.accessToken}` },
      body: JSON.stringify({
        message: message,
        conversationId: state.conversationId,
        extensionConnected: true,
        // Include conversation history? The edge function now fetches it from DB or expects it.
        // Let's rely on Edge Function fetching from DB for context.
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    hideTypingIndicator();
    let cleanResponse = data.content || "Sem resposta."; // Changed from data.response to data.content (standard)

    // Check if response is raw JSON (tool result)
    if (typeof cleanResponse === 'object') cleanResponse = JSON.stringify(cleanResponse);

    if (cleanResponse) {
      addMessage("assistant", cleanResponse);
    }

    // Command execution? The edge function now executes commands server side or inserts into DB.
    // Client side execution is legacy but we can keep handling if needed.
    // For now, assume Edge Function does the heavy lifting.

  } catch (error) {
    console.error("❌ [CHAT] Error sending message:", error);
    hideTypingIndicator();
    addMessage("assistant", `❌ Erro: ${error.message}`);
  } finally {
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.focus();
  }
}

function clearInput() { elements.messageInput.value = ""; adjustTextareaHeight(); }
function adjustTextareaHeight() {
  elements.messageInput.style.height = "auto";
  elements.messageInput.style.height = elements.messageInput.scrollHeight + "px";
}

// ... [UI SWITCHING HELPERS] ...
function switchToChat() {
  elements.welcomeScreen.classList.remove("active");
  elements.chatContainer.classList.add("active");
  state.currentView = "chat";
}

function closeHistoryPanel() {
  elements.chatHistory.classList.remove("active");
  elements.overlay.classList.remove("active");
}

function hideSuggestions() {
  // Implementation of suggestion hiding
}

// ... [INIT] ...
document.addEventListener("DOMContentLoaded", async () => {
  // Basic init
  const auth = await loadAuthData();
  if (auth) {
    // Init UI
  }

  // Event listeners
  elements.sendBtn.addEventListener("click", sendMessage);
  elements.messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Tabs refresh
  elements.refreshTabsBtn?.addEventListener("click", loadTabsForSelector);

  // Initial tabs load
  await loadTabsForSelector();
});

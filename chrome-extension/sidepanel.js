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
  CHAT_API_URL: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream",
  MAX_MESSAGE_LENGTH: 2000,
};

// ============================================
// UTILS
// ============================================
function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

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
// DOM ELEMENTS
// ============================================
const elements = {
  // Configured in DOMContentLoaded
  welcomeScreen: null,
  chatContainer: null,
  messagesArea: null,
  messageInput: null,
  sendBtn: null,
  activeTabSelector: null,
  refreshTabsBtn: null,
  overlay: null,
  historyBtn: null,
  chatHistory: null,
  closeHistory: null,
  historyList: null,
  newChatBtn: null,
  searchChats: null,
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener("DOMContentLoaded", async () => {
  // 1. Bind Elements
  elements.welcomeScreen = document.getElementById("welcomeScreen");
  elements.chatContainer = document.getElementById("chatContainer");
  elements.messagesArea = document.getElementById("messagesArea");
  elements.messageInput = document.getElementById("messageInput");
  elements.sendBtn = document.getElementById("sendBtn");
  elements.activeTabSelector = document.getElementById("activeTabSelector");
  elements.refreshTabsBtn = document.getElementById("refreshTabsBtn");
  elements.overlay = document.getElementById("overlay");
  elements.historyBtn = document.getElementById("historyBtn");
  elements.chatHistory = document.getElementById("chatHistory");
  elements.closeHistory = document.getElementById("closeHistory");
  elements.historyList = document.getElementById("historyList");
  elements.newChatBtn = document.getElementById("newChatFromHistory");
  elements.searchChats = document.getElementById("searchChats");

  // 2. Event Listeners
  setupEventListeners();

  // 3. Load Auth & Initial State
  const auth = await loadAuthData();
  if (auth) {
    // Load tabs interactions
    await loadTabsForSelector();
  }
});

function setupEventListeners() {
  // Send Message
  elements.sendBtn?.addEventListener("click", sendMessage);
  elements.messageInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Sidebar Toggle (FIXED)
  elements.historyBtn?.addEventListener("click", () => {
    console.log("OPEN HISTORY");
    elements.chatHistory.classList.add("open");
    elements.overlay.classList.add("active");
  });

  elements.closeHistory?.addEventListener("click", closeHistoryPanel);
  elements.overlay?.addEventListener("click", closeHistoryPanel);

  // New Chat
  elements.newChatBtn?.addEventListener("click", () => {
    createNewConversation();
    closeHistoryPanel();
  });

  // Refresh Tabs
  elements.refreshTabsBtn?.addEventListener("click", async () => {
    const btn = elements.refreshTabsBtn;
    btn.classList.add("rotate");
    await loadTabsForSelector();
    setTimeout(() => btn.classList.remove("rotate"), 500);
  });
}

function closeHistoryPanel() {
  elements.chatHistory.classList.remove("open");
  elements.overlay.classList.remove("active");
}


// ============================================
// AUTHENTICATION
// ============================================
async function loadAuthData() {
  try {
    console.log("🔐 [AUTH] Loading authentication data...");
    const data = await chrome.storage.local.get(["userId", "accessToken", "deviceId", "conversationId"]);

    state.userId = data.userId;
    state.accessToken = data.accessToken;
    state.deviceId = data.deviceId;
    state.conversationId = data.conversationId;
    state.isAuthenticated = !!(data.userId && data.accessToken);

    if (state.isAuthenticated) {
      console.log("✅ [AUTH] Authenticated");
      await loadConversations();
      enableInput();
    } else {
      console.log("⚠️ [AUTH] Not authenticated");
      showAuthRequired();
    }
    return state.isAuthenticated;
  } catch (error) {
    console.error("❌ [AUTH] Error:", error);
    return false;
  }
}

function showAuthRequired() {
  addMessage("assistant", "👋 Olá! Para usar o assistente, faça login na extensão/popup primeiro.");
  disableInput();
}

function enableInput() {
  elements.messageInput.disabled = false;
  elements.sendBtn.disabled = false;
  elements.messageInput.placeholder = "Digite aqui... (Shift+Enter quebra linha)";
}

function disableInput() {
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;
}

// ============================================
// CONVERSATIONS
// ============================================
async function loadConversations() {
  try {
    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation?userId=eq.${state.userId}&context=eq.extension&order=createdAt.desc&limit=20`, {
      headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${state.accessToken}` }
    });
    if (!response.ok) throw new Error("Falha ao carregar conversas");
    state.conversations = await response.json();
    renderConversationsList();

    // Auto-load last conversation if exists, else create
    if (state.conversationId) {
      await loadConversation(state.conversationId);
    } // else user can create new
  } catch (error) {
    console.error("❌ [CONV] Load error:", error);
  }
}

async function createNewConversation() {
  try {
    if (!state.userId) await loadAuthData();
    if (!state.userId) throw new Error("Usuário não logado.");

    // Generate Client-Side ID to prevent 400 Error
    const newId = uuidv4();

    const payload = {
      id: newId, // EXPLICIT ID
      userId: state.userId,
      title: `Chat ${new Date().toLocaleDateString("pt-BR")}`,
      context: "extension",
      createdAt: new Date().toISOString()
    };

    const response = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: CONFIG.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${state.accessToken}`,
        Prefer: "return=representation"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const conv = data[0];

    state.conversationId = conv.id;
    state.messages = [];
    await chrome.storage.local.set({ conversationId: conv.id });

    state.conversations.unshift(conv);
    renderConversationsList();
    renderMessages();
    switchToChat();
    addMessage("assistant", "👋 Nova conversa! Como posso ajudar?");

  } catch (error) {
    console.error("❌ [CONV] Create error:", error);
    addMessage("assistant", `❌ Erro ao criar chat: ${error.message}`);
  }
}

async function loadConversation(id) {
  try {
    console.log("Loading chat:", id);
    const res = await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/ChatMessage?conversationId=eq.${id}&order=createdAt.asc`, {
      headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${state.accessToken}` }
    });
    if (!res.ok) throw new Error("Erro ao buscar mensagens");

    const msgs = await res.json();
    state.conversationId = id;
    state.messages = msgs.map(m => ({
      id: m.id,
      role: m.role.toLowerCase(),
      content: m.content,
      createdAt: m.createdAt
    }));
    await chrome.storage.local.set({ conversationId: id });

    renderMessages();
    switchToChat();
  } catch (e) {
    console.error("Load conv error:", e);
  }
}

function renderConversationsList() {
  elements.historyList.innerHTML = "";
  state.conversations.forEach(c => {
    const div = document.createElement("div");
    div.className = `history-item ${c.id === state.conversationId ? 'active' : ''}`;
    div.innerHTML = `
            <div class="history-content">
                <div class="history-item-title">${c.title}</div>
                <div class="history-item-date">${new Date(c.createdAt).toLocaleDateString()}</div>
            </div>
            <button class="delete-chat-btn" title="Excluir">🗑️</button>
        `;
    div.addEventListener("click", () => { loadConversation(c.id); closeHistoryPanel(); });
    div.querySelector(".delete-chat-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm("Excluir?")) deleteConversation(c.id);
    });
    elements.historyList.appendChild(div);
  });
}

async function deleteConversation(id) {
  // Basic delete logic... (omitted for brevity, same as before)
  await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: CONFIG.SUPABASE_ANON_KEY, Authorization: `Bearer ${state.accessToken}` }
  });
  state.conversations = state.conversations.filter(c => c.id !== id);
  if (state.conversationId === id) state.conversationId = null;
  renderConversationsList();
}


// ============================================
// CHAT LOGIC
// ============================================
async function sendMessage() {
  const txt = elements.messageInput.value.trim();
  if (!txt) return;

  // UI Updates
  addMessage("user", txt);
  elements.messageInput.value = "";
  elements.messageInput.style.height = "auto";
  disableInput();
  showTyping();

  // Ensure Conversation
  if (!state.conversationId) {
    try { await createNewConversation(); }
    catch (e) {
      hideTyping(); enableInput(); return;
    }
  }

  try {
    const res = await fetch(CONFIG.CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.accessToken}` },
      body: JSON.stringify({
        message: txt,
        conversationId: state.conversationId,
        extensionConnected: true,
        // Pass extra context about tabs if needed?
        activeTabId: state.activeTabId
      })
    });

    const data = await res.json();
    hideTyping();

    if (data.error) throw new Error(data.error);

    let content = data.content || data.response || "Sem resposta.";
    if (typeof content === 'object') content = JSON.stringify(content);

    addMessage("assistant", content);

  } catch (e) {
    hideTyping();
    addMessage("assistant", `❌ Erro: ${e.message}`);
  } finally {
    enableInput();
    elements.messageInput.focus();
  }
}


// ============================================
// RENDERING
// ============================================
function addMessage(role, text) {
  state.messages.push({ role, content: text, createdAt: new Date().toISOString() });
  appendMessage(state.messages[state.messages.length - 1]);
}

function appendMessage(msg) {
  const div = document.createElement("div");
  div.className = `message ${msg.role}`;

  // Parse Thinking
  let contentHtml = msg.content;
  const thinkMatch = /<antigravity_thinking>([\s\S]*?)<\/antigravity_thinking>/i.exec(msg.content);
  let thinkBlock = "";

  if (thinkMatch) {
    const thoughtText = thinkMatch[1].trim();
    contentHtml = msg.content.replace(thinkMatch[0], "").trim();
    thinkBlock = `
            <details class="thinking-block">
                <summary>🧠 Raciocínio (Expandir)</summary>
                <div class="thinking-content">${thoughtText}</div>
            </details>
        `;
  }

  // Clean JSON if needed
  if (contentHtml.trim().startsWith("{") && contentHtml.trim().endsWith("}")) {
    try {
      const j = JSON.parse(contentHtml);
      if (j.success) contentHtml = `✅ Ação: ${j.message || "Concluída"}`;
    } catch (e) { }
  }

  div.innerHTML = `
        <div class="message-avatar">${msg.role === 'user' ? '👤' : '🤖'}</div>
        <div class="message-content">
            ${thinkBlock}
            <div class="message-bubble">${contentHtml}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        </div>
    `;
  elements.messagesArea.appendChild(div);
  elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
}

function showTyping() { state.isTyping = true; /* Add simple typing indicator to DOM */ }
function hideTyping() { state.isTyping = false; /* Remove indicator */ }
function switchToChat() {
  elements.welcomeScreen.classList.remove("active");
  elements.chatContainer.classList.add("active");
}


// ============================================
// TABS
// ============================================
async function loadTabsForSelector() {
  try {
    const tabs = await chrome.tabs.query({});
    const sel = elements.activeTabSelector;
    sel.innerHTML = '<option value="">Selecionar aba...</option>';
    tabs.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = (t.active ? "📍 " : "") + (t.title.substring(0, 30) || "Sem título");
      sel.appendChild(opt);
    });
    sel.onchange = (e) => state.activeTabId = parseInt(e.target.value);
  } catch (e) { console.error("Tabs error", e); }
}

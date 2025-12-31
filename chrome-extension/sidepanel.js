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
// VISUAL INDICATORS
// ============================================
let indicatorElements = {
  typing: null,
  spinner: null,
  navigation: null
};

function initializeIndicators() {
  indicatorElements.typing = document.getElementById('typingIndicator');
  indicatorElements.spinner = document.getElementById('processingSpinner');
  indicatorElements.navigation = document.getElementById('navigationIndicator');
  console.log('✅ [INDICATORS] Initialized');
}

function showTyping() {
  if (indicatorElements.typing) {
    indicatorElements.typing.classList.add('active');
    console.log('💬 [INDICATOR] Typing shown');
  }
}

function hideTyping() {
  if (indicatorElements.typing) {
    indicatorElements.typing.classList.remove('active');
    console.log('💬 [INDICATOR] Typing hidden');
  }
}

function showProcessing(text = 'Processando...') {
  if (indicatorElements.spinner) {
    const textEl = indicatorElements.spinner.querySelector('.spinner-text');
    if (textEl) textEl.textContent = text;
    indicatorElements.spinner.classList.add('active');
    console.log('⏳ [INDICATOR] Processing shown:', text);
  }
}

function hideProcessing() {
  if (indicatorElements.spinner) {
    indicatorElements.spinner.classList.remove('active');
    console.log('⏳ [INDICATOR] Processing hidden');
  }
}

function showNavigation(action = 'Navegando...') {
  if (indicatorElements.navigation) {
    const textEl = indicatorElements.navigation.querySelector('.nav-text');
    if (textEl) textEl.textContent = action;
    indicatorElements.navigation.classList.add('active');
    console.log('🌐 [INDICATOR] Navigation shown:', action);
  }
}

function hideNavigation() {
  if (indicatorElements.navigation) {
    indicatorElements.navigation.classList.remove('active');
    console.log('🌐 [INDICATOR] Navigation hidden');
  }
}

// ============================================

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

  // 3. Initialize Indicators
  initializeIndicators();

  // 4. Load Auth & Initial State
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

    // Auto-load ONLY if we have a stored conversationId
    if (state.conversationId) {
      console.log("📂 [CONV] Auto-loading last conversation:", state.conversationId);
      await loadConversation(state.conversationId);
    } else {
      console.log("📝 [CONV] No previous conversation. User can start a new chat.");
      switchToChat(); // Show chat interface but empty
    }
  } catch (error) {
    console.error("❌ [CONV] Load error:", error);
  }
}

async function createNewConversation() {
  try {
    console.log("🚀 Creating new conversation...");
    if (!state.userId) await loadAuthData();
    if (!state.userId) {
      console.error("❌ Cannot create conversation: No User ID");
      throw new Error("Usuário não logado. Por favor, faça login.");
    }

    // Generate Client-Side ID
    const newId = uuidv4();
    const now = new Date().toISOString();

    const payload = {
      id: newId,
      userId: state.userId,
      title: `Chat ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}`,
      context: "extension",
      createdAt: now,
      updatedAt: now // Garantindo que o campo existe
    };

    console.log("📦 Payload:", JSON.stringify(payload, null, 2));

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

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ API Error:", response.status, errText);
      throw new Error(`Erro API (${response.status}): ${errText}`);
    }

    const data = await response.json();
    console.log("✅ Conversation created:", data);

    // Fallback: se data for array vazio ou null (não deveria com return=representation)
    const conv = (data && data.length > 0) ? data[0] : payload;

    state.conversationId = conv.id;
    state.messages = [];
    await chrome.storage.local.set({ conversationId: conv.id });

    state.conversations.unshift(conv);
    renderConversationsList();
    renderMessages(); // Limpa a tela
    switchToChat();
    addMessage("assistant", "👋 Nova conversa iniciada!");

  } catch (error) {
    console.error("❌ [CONV] Create error:", error);
    addMessage("assistant", `❌ Erro ao criar chat: ${error.message}`);
    throw error; // Re-throw para parar sendMessage se chamado dali
  }
}

async function loadConversation(id) {
  try {
    console.log("📂 [CONV] Loading conversation:", id);

    // Mostrar loading indicator
    elements.messagesArea.innerHTML = '<div class="loading-message">⏳ Carregando mensagens...</div>';

    const res = await fetch(
      `${CONFIG.SUPABASE_URL}/rest/v1/ChatMessage?conversationId=eq.${id}&order=createdAt.asc`,
      {
        headers: {
          apikey: CONFIG.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${state.accessToken}`
        }
      }
    );

    if (!res.ok) {
      if (res.status === 400 || res.status === 404) {
        console.warn("⚠️ Conversation not found or invalid");
        state.conversationId = null;
        await chrome.storage.local.remove("conversationId");

        // NOVO: Mostrar mensagem ao usuário
        elements.messagesArea.innerHTML = '';
        addMessage("assistant", "❌ Esta conversa não foi encontrada. Por favor, inicie uma nova conversa.");
        return;
      }

      throw new Error(`Erro ao buscar mensagens: ${res.status}`);
    }

    const msgs = await res.json();
    console.log(`✅ [CONV] Loaded ${msgs.length} messages`);

    // Atualizar estado
    state.conversationId = id;
    state.messages = msgs.map(m => ({
      id: m.id,
      role: m.role.toLowerCase(),
      content: m.content,
      createdAt: m.createdAt
    }));

    await chrome.storage.local.set({ conversationId: id });

    // NOVO: Se não há mensagens, mostrar aviso
    if (state.messages.length === 0) {
      console.log("📝 [CONV] No messages in this conversation");
      renderMessages(); // Limpar tela
      addMessage("assistant", "👋 Esta conversa está vazia. Digite algo para começar!");
    } else {
      renderMessages();
    }

    switchToChat();

  } catch (e) {
    console.error("❌ [CONV] Load error:", e);

    // NOVO: Feedback visual de erro
    elements.messagesArea.innerHTML = '';
    addMessage("assistant", `❌ Erro ao carregar conversa: ${e.message}`);

    // Não limpar o ID se for erro temporário de rede
    if (e.message.includes("404") || e.message.includes("400")) {
      state.conversationId = null;
      await chrome.storage.local.remove("conversationId");
    }
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
    div.addEventListener("click", async () => {
      // NOVO: Feedback visual
      div.style.opacity = "0.5";

      await loadConversation(c.id);
      closeHistoryPanel();

      // Restaurar opacity
      setTimeout(() => div.style.opacity = "1", 300);
    });
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

  // Garantir que a tela de chat está visível
  switchToChat();

  // UI Updates
  addMessage("user", txt);
  elements.messageInput.value = "";
  elements.messageInput.style.height = "auto";
  disableInput();

  // NOVO: Mostrar typing indicator
  showTyping();

  // Ensure Conversation
  if (!state.conversationId) {
    try { await createNewConversation(); }
    catch (e) {
      hideTyping();
      hideProcessing();
      hideNavigation();
      enableInput();
      return;
    }
  }

  // NOVO: Detectar se é comando de navegação
  const isNavigationCommand = /abr(a|ir|e)|naveg(ar|ue)|v(a|á) para|vou para|ir para/i.test(txt);

  if (isNavigationCommand) {
    const destination = txt.replace(/.*?(abr(a|ir|e)|naveg(ar|ue)|v(a|á) para|vou para|ir para)\s*/i, '').trim();
    showNavigation(`Abrindo ${destination || 'página'}...`);
    showProcessing('Planejando navegação...');
  } else {
    showProcessing('Analisando solicitação...');
  }

  try {
    const res = await fetch(CONFIG.CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${state.accessToken}` },
      body: JSON.stringify({
        message: txt,
        conversationId: state.conversationId,
        extensionConnected: true,
        deviceId: state.deviceId, // CRITICAL: Send deviceId for command routing
        activeTabId: state.activeTabId
      })
    });

    if (!res.ok) throw new Error(`Erro API: ${res.statusText}`);

    // STREAMING READER
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // Create assistant message bubble immediately
    addMessage("assistant", "");
    const msgs = elements.messagesArea.querySelectorAll('.message.assistant');
    const bubble = msgs[msgs.length - 1].querySelector('.message-bubble');
    const thinkingContainer = msgs[msgs.length - 1].querySelector('.thinking-content') || createThinkingBlock(msgs[msgs.length - 1]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const data = JSON.parse(line);

          if (data.type === 'state') {
            showProcessing(`🤖 ${data.content}`);
          } else if (data.type === 'plan') {
            // console.log("Plan received:", data.content);
          } else if (data.type === 'content') {
            bubble.innerHTML += data.content;
            elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
          } else if (data.type === 'error') {
            bubble.innerHTML += `<br>❌ ${data.content}`;
          }
        } catch (e) {
          // If text only
          if (line.trim().startsWith("{")) continue;
          bubble.innerHTML += line;
        }
      }
    }

    hideTyping();
    hideProcessing();
    hideNavigation();

  } catch (e) {
    hideTyping();
    hideProcessing();
    hideNavigation();
    addMessage("assistant", `❌ Erro: ${e.message}`);
  } finally {
    enableInput();
    elements.messageInput.focus();
  }
}

function createThinkingBlock(msgDiv) {
  // Helper if needed, but for now we append to bubble
  return null;
}

// LISTEN FOR STATUS UPDATES
// LISTEN FOR STATUS UPDATES
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'COMMAND_STATUS') {
    const { status, commandType, error } = message;

    // MAPA DE STATUS VISUAL (Ticking Effect)
    const STATUS_MAP = {
      'pending': 'Aguardando...',
      'processing': 'Processando...',
      'executing': 'Executando...',
      'DONE': '✅ Concluído',
      'completed': '✅ Concluído',
      'ERROR': '❌ Erro',
      'failed': '❌ Falha'
    };

    let displayText = STATUS_MAP[status] || STATUS_MAP['executing'];

    // Refinar status baseado no tipo de comando se estiver processando
    if (status === 'processing' || status === 'executing') {
      const type = (commandType || '').toUpperCase();
      if (type === 'NAVIGATE') displayText = '🌐 Navegando...';
      else if (type === 'DOM_WAIT') displayText = '🔍 Analisando página...';
      else if (type.includes('CLICK') || type.includes('TYPE') || type.includes('SCROLL')) displayText = '🖱️ Interagindo com elementos...';
      else if (type === 'SCAN_PAGE') displayText = '👀 Lendo tela...';
    }

    if (status === 'done' || status === 'completed') {
      showProcessing(displayText); // Shows "Concluído" or generic
      setTimeout(() => hideProcessing(), 2000);
    }
    else if (status === 'error' || status === 'failed') {
      showProcessing(displayText);
      addMessage("assistant", `❌ Erro: ${error || 'Falha desconhecida'} `);
    }
    else {
      // Estado intermediário (ticking)
      showProcessing(displayText);
    }
  }
});


// ============================================
// RENDERING
// ============================================
/**
 * Render all messages in the messages area
 * Clears and re-renders the entire message list
 */
function renderMessages() {
  elements.messagesArea.innerHTML = "";
  state.messages.forEach(msg => appendMessage(msg));
}

function addMessage(role, text) {
  state.messages.push({ role, content: text, createdAt: new Date().toISOString() });
  appendMessage(state.messages[state.messages.length - 1]);
}

function appendMessage(msg) {
  const div = document.createElement("div");
  div.className = `message ${msg.role} `;

  // Parse Thinking
  let contentHtml = msg.content;
  const thinkMatch = /<antigravity_thinking>([\s\S]*?)<\/antigravity_thinking>/i.exec(msg.content);
  let thinkBlock = "";

  if (thinkMatch) {
    const thoughtText = thinkMatch[1].trim();
    contentHtml = msg.content.replace(thinkMatch[0], "").trim();
    thinkBlock = `
    < details class="thinking-block" >
                <summary>🧠 Raciocínio (Expandir)</summary>
                <div class="thinking-content">${thoughtText}</div>
            </details >
    `;
  }

  // Clean JSON if needed
  if (contentHtml.trim().startsWith("{") && contentHtml.trim().endsWith("}")) {
    try {
      const j = JSON.parse(contentHtml);
      if (j.success) contentHtml = `✅ Ação: ${j.message || "Concluída"} `;
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

function switchToChat() {
  elements.welcomeScreen.classList.remove("active");
  elements.chatContainer.classList.add("active");
}


// ============================================
// TABS
// ============================================
async function loadTabsForSelector() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true }); // Apenas janela atual
    const sel = elements.activeTabSelector;
    if (!sel) return;

    // Guardar seleção atual
    const currentSelection = state.activeTabId;

    sel.innerHTML = '<option value="">Selecionar aba...</option>';

    let activeFound = false;

    tabs.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t.id;
      // Mostrar indicador visual de aba ativa
      opt.textContent = (t.active ? "📍 " : "") + (t.title?.substring(0, 40) || "Sem título");

      // Auto-selecionar se for a aba ativa
      if (t.active) {
        opt.selected = true;
        state.activeTabId = t.id;
        activeFound = true;
      }

      sel.appendChild(opt);
    });

    // Se usuário tinha selecionado outra aba manualmente, tentar manter (se ainda existir)
    if (state.activeTabId && !activeFound) {
      // ... lógica opcional, por enquanto vamos priorizar a aba ativa do navegador
    }

    sel.onchange = (e) => {
      state.activeTabId = parseInt(e.target.value);
      console.log("👆 Tab selected manually:", state.activeTabId);
    };

    console.log("🔄 Tabs list refreshed, active:", state.activeTabId);

  } catch (e) { console.error("Tabs error", e); }
}

// Ouvir mudanças de aba para atualizar lista
chrome.tabs.onActivated.addListener(() => loadTabsForSelector());
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' || changeInfo.title) {
    loadTabsForSelector();
  }
});

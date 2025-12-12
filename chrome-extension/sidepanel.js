// ============================================
// SYNCADS AI SIDE PANEL - COMPLETE LOGIC
// ============================================

console.log("🚀 [SIDE PANEL] Script loading...");

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
  SUPABASE_URL: "https://ovskepqggmxlfckxqgbr.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
  CHAT_API_URL:
    "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced",
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

/**
 * Execute command on active tab
 */
async function executeCommandOnTab(command) {
  try {
    console.log("⚡ [COMMAND] Executing on active tab:", command);

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab) {
      throw new Error("Nenhuma aba ativa encontrada");
    }

    // Send command to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "EXECUTE_COMMAND",
      command: command,
    });

    console.log("✅ [COMMAND] Response:", response);
    return response;
  } catch (error) {
    console.error("❌ [COMMAND] Error:", error);
    throw error;
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
      `${CONFIG.SUPABASE_URL}/rest/v1/ChatConversation?userId=eq.${state.userId}&order=createdAt.desc&limit=50`,
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
    } else {
      await createNewConversation();
    }
  } catch (error) {
    console.error("❌ [CONVERSATIONS] Error loading:", error);
  }
}

/**
 * Create new conversation
 */
async function createNewConversation() {
  try {
    console.log("🆕 [CONVERSATIONS] Creating new conversation...");

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
        body: JSON.stringify({
          userId: state.userId,
          title: `Chat ${new Date().toLocaleDateString("pt-BR")}`,
          createdAt: new Date().toISOString(),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
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
    state.messages = messages.map((msg) => ({
      id: msg.id,
      role: msg.role.toLowerCase(),
      content: msg.content,
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

  const bubble = document.createElement("div");
  bubble.className = "message-bubble";
  bubble.textContent = message.content;

  const time = document.createElement("div");
  time.className = "message-time";
  const date = new Date(message.createdAt);
  time.textContent = date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  content.appendChild(bubble);
  content.appendChild(time);

  messageDiv.appendChild(avatar);
  messageDiv.appendChild(content);

  elements.messagesArea.appendChild(messageDiv);
}

/**
 * Show typing indicator
 */
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
  indicator.innerHTML = `
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
    <div class="typing-dot"></div>
  `;

  content.appendChild(indicator);
  typingDiv.appendChild(avatar);
  typingDiv.appendChild(content);

  elements.messagesArea.appendChild(typingDiv);
  scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
  state.isTyping = false;
  const indicator = document.getElementById("typingIndicator");
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Send message to AI
 */
async function sendMessage() {
  const message = elements.messageInput.value.trim();

  if (!message) return;

  if (!state.isAuthenticated) {
    alert("Por favor, faça login no painel SyncAds primeiro.");
    return;
  }

  console.log("📤 [CHAT] Sending message:", message);

  // Add to command history
  state.commandHistory.unshift(message);
  if (state.commandHistory.length > 50) {
    state.commandHistory = state.commandHistory.slice(0, 50); // Manter últimos 50
  }
  state.commandHistoryIndex = -1;

  // Add user message
  addMessage("user", message);
  clearInput();
  hideSuggestions();

  // Switch to chat view
  switchToChat();

  // Disable input
  elements.messageInput.disabled = true;
  elements.sendBtn.disabled = true;

  // Show typing
  showTypingIndicator();

  try {
    // Ensure conversation exists
    if (!state.conversationId) {
      await createNewConversation();
    }

    // Call AI API
    const response = await fetch(CONFIG.CHAT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.accessToken}`,
      },
      body: JSON.stringify({
        message: message + ` (SYSTEM: If user just greets or asks general questions, REPLY DIRECTLY. ONLY use browser commands (NAVIGATE, DOM_CLICK, DOM_FILL) if user EXPLICITLY asks to interact with the page. Do NOT use Serper/External Search APIs. Active Tab ID: ${state.activeTabId || 'current'})`,
        conversationId: state.conversationId,
        extensionConnected: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // Hide typing
    hideTypingIndicator();

    // Clean response (remove JSON blocks)
    let cleanResponse =
      data.response || "Desculpe, não consegui gerar uma resposta.";
    cleanResponse = cleanResponse
      .replace(/```json[\s\S]*?```/g, "")
      .replace(/\{[\s\S]*?"type"[\s\S]*?\}/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (cleanResponse) {
      addMessage("assistant", cleanResponse);
    }

    // Try to detect and execute local commands
    await detectAndExecuteCommands(message);
  } catch (error) {
    console.error("❌ [CHAT] Error sending message:", error);
    hideTypingIndicator();
    addMessage(
      "assistant",
      `❌ Erro: ${error.message}\n\nTente novamente ou verifique sua conexão.`,
    );
  } finally {
    // Re-enable input
    elements.messageInput.disabled = false;
    elements.sendBtn.disabled = false;
    elements.messageInput.focus();
  }
}

/**
 * Clear input
 */
function clearInput() {
  elements.messageInput.value = "";
  adjustTextareaHeight();
  hideSuggestions();
  state.commandHistoryIndex = -1;
}

/**
 * Adjust textarea height
 */
function adjustTextareaHeight() {
  elements.messageInput.style.height = "auto";
  const newHeight = Math.min(elements.messageInput.scrollHeight, 120);
  elements.messageInput.style.height = newHeight + "px";
}

/**
 * Scroll to bottom
 */
function scrollToBottom() {
  setTimeout(() => {
    elements.messagesArea.scrollTop = elements.messagesArea.scrollHeight;
  }, 100);
}

// ============================================
// VIEW SWITCHING
// ============================================

/**
 * Switch to welcome view
 */
function switchToWelcome() {
  state.currentView = "welcome";
  elements.welcomeScreen.classList.remove("hidden");
  elements.chatContainer.classList.add("hidden");
}

/**
 * Switch to chat view
 */
function switchToChat() {
  state.currentView = "chat";
  elements.welcomeScreen.classList.add("hidden");
  elements.chatContainer.classList.remove("hidden");
}

// ============================================
// MENU & NAVIGATION
// ============================================

/**
 * Toggle history panel
 */
function toggleHistory() {
  const isOpen = elements.chatHistory.classList.toggle("open");

  if (isOpen) {
    elements.overlay.classList.add("active");
    console.log("📂 [HISTORY] Opened");
  } else {
    elements.overlay.classList.remove("active");
    console.log("📁 [HISTORY] Closed");
  }
}

/**
 * Close history panel
 */
function closeHistoryPanel() {
  elements.chatHistory.classList.remove("open");
  elements.overlay.classList.remove("active");
}

// ============================================
// QUICK ACTIONS
// ============================================

/**
 * Handle quick action click
 */
function handleQuickAction(action) {
  console.log("⚡ [ACTION] Quick action:", action);

  const messages = {
    automate: "Como posso automatizar tarefas nesta página?",
    extract: "Extraia os dados principais desta página",
    crawl: "Liste todas as páginas/links disponíveis aqui",
    docs: "Crie um documento com as informações desta página",
    apis: "Quais APIs posso usar para integração?",
    sheets: "Como exportar dados para Google Sheets?",
  };

  const message = messages[action];
  if (message) {
    elements.messageInput.value = message;
    sendMessage();
  }
}

/**
 * Detect commands in message
 */
async function detectAndExecuteCommands(message) {
  const lowerMessage = message.toLowerCase();

  // List tabs
  if (
    lowerMessage.includes("lista") &&
    (lowerMessage.includes("aba") || lowerMessage.includes("tab"))
  ) {
    await showTabsList();
    return true;
  }

  // Get page info
  if (
    lowerMessage.includes("título") ||
    lowerMessage.includes("página atual")
  ) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      addMessage(
        "assistant",
        `📄 **Página Atual**\n\n**Título:** ${tab.title}\n**URL:** ${tab.url}`,
      );
      return true;
    } catch (error) {
      console.error("❌ [COMMAND] Error getting page info:", error);
    }
  }

  // Close tab
  if (lowerMessage.includes("fechar") && lowerMessage.includes("aba")) {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.tabs.remove(tab.id);
      addMessage("assistant", "✅ Aba fechada com sucesso!");
      return true;
    } catch (error) {
      console.error("❌ [COMMAND] Error closing tab:", error);
    }
  }

  // Open URL
  const urlMatch = message.match(/abr(?:a|ir)?.*?(https?:\/\/[^\s]+)/i);
  if (urlMatch) {
    try {
      const url = urlMatch[1];
      await chrome.tabs.create({ url });
      addMessage("assistant", `✅ Abrindo: ${url}`);
      return true;
    } catch (error) {
      console.error("❌ [COMMAND] Error opening URL:", error);
    }
  }

  return false;
}

/**
 * Handle tool button click
 */


// ============================================
// EVENT LISTENERS
// ============================================

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Send button
  elements.sendBtn.addEventListener("click", sendMessage);

  // Enter to send (Shift+Enter for new line)
  elements.messageInput.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + K - Foco no input (atalho rápido)
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      elements.messageInput.focus();
      elements.messageInput.select();
      return;
    }

    // Seta para cima - Navegar histórico de comandos
    if (e.key === "ArrowUp" && elements.messageInput.value === "") {
      e.preventDefault();
      navigateCommandHistory("up");
      return;
    }

    // Seta para baixo - Navegar histórico de comandos
    if (e.key === "ArrowDown") {
      e.preventDefault();
      navigateCommandHistory("down");
      return;
    }

    // Tab - Aceitar sugestão (se houver)
    if (e.key === "Tab" && state.suggestions.length > 0) {
      e.preventDefault();
      acceptSuggestion();
      return;
    }

    // Escape - Limpar input
    if (e.key === "Escape") {
      e.preventDefault();
      clearInput();
      hideSuggestions();
      return;
    }

    // Enter - Enviar mensagem
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Auto-resize textarea e mostrar sugestões
  elements.messageInput.addEventListener("input", () => {
    adjustTextareaHeight();
    showSuggestions();
  });

  // Blur - esconder sugestões
  elements.messageInput.addEventListener("blur", () => {
    // Delay para permitir clique na sugestão
    setTimeout(hideSuggestions, 200);
  });

  // Overlay
  elements.overlay.addEventListener("click", () => {
    console.log("🖱️ [OVERLAY] Overlay clicked, closing all");
    closeHistoryPanel();
  });

  // History buttons
  elements.historyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    console.log("🖱️ [HISTORY] History button clicked");
    toggleHistory();
  });

  elements.closeHistory.addEventListener("click", (e) => {
    e.stopPropagation();
    console.log("🖱️ [HISTORY] Close history clicked");
    closeHistoryPanel();
  });

  elements.newChatBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    console.log("🖱️ [HISTORY] New chat button clicked");
    await createNewConversation();
    closeHistoryPanel();
    switchToChat();
  });

  // Tab selector refresh
  elements.refreshTabsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("🔄 [TABS] Refreshing tabs list...");
    loadTabsForSelector();
  });

  // Quick actions
  document.querySelectorAll(".action-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const action = card.dataset.action;
      console.log("⚡ [QUICK ACTION] Card clicked:", action);
      handleQuickAction(action);
    });
  });



  // Search chats
  elements.searchChats.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    document.querySelectorAll(".history-item").forEach((item) => {
      const title = item
        .querySelector(".history-item-title")
        .textContent.toLowerCase();
      item.style.display = title.includes(query) ? "block" : "none";
    });
  });

  console.log("✅ [EVENTS] All event listeners registered");

  // Atalhos globais
  setupGlobalShortcuts();
}

// ============================================
// KEYBOARD SHORTCUTS & COMMAND HISTORY
// ============================================

/**
 * Setup global keyboard shortcuts
 */
function setupGlobalShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + / - Abrir menu de atalhos
    if ((e.ctrlKey || e.metaKey) && e.key === "/") {
      e.preventDefault();
      showKeyboardShortcuts();
    }

    // Ctrl/Cmd + H - Toggle histórico
    if ((e.ctrlKey || e.metaKey) && e.key === "h") {
      e.preventDefault();
      toggleHistory();
    }

    // Ctrl/Cmd + N - Nova conversa
    if ((e.ctrlKey || e.metaKey) && e.key === "n") {
      e.preventDefault();
      createNewConversation();
    }
  });

  console.log("⌨️ [SHORTCUTS] Global shortcuts registered");
}

/**
 * Navigate command history
 */
function navigateCommandHistory(direction) {
  if (state.commandHistory.length === 0) return;

  if (direction === "up") {
    if (state.commandHistoryIndex < state.commandHistory.length - 1) {
      state.commandHistoryIndex++;
      elements.messageInput.value =
        state.commandHistory[state.commandHistoryIndex];
    }
  } else if (direction === "down") {
    if (state.commandHistoryIndex > 0) {
      state.commandHistoryIndex--;
      elements.messageInput.value =
        state.commandHistory[state.commandHistoryIndex];
    } else {
      state.commandHistoryIndex = -1;
      elements.messageInput.value = "";
    }
  }

  adjustTextareaHeight();
}

/**
 * Show command suggestions
 */
function showSuggestions() {
  const input = elements.messageInput.value.toLowerCase();

  // Esconder se vazio
  if (input.length < 2) {
    hideSuggestions();
    return;
  }

  // Filtrar sugestões
  const matches = COMMAND_SUGGESTIONS.filter(
    (cmd) =>
      cmd.text.toLowerCase().includes(input) ||
      cmd.description.toLowerCase().includes(input),
  ).slice(0, 5); // Máximo 5 sugestões

  if (matches.length === 0) {
    hideSuggestions();
    return;
  }

  state.suggestions = matches;

  // Criar/atualizar container de sugestões
  let container = document.getElementById("suggestions-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "suggestions-container";
    container.style.cssText = `
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      margin-bottom: 8px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    `;
    elements.messageInput.parentElement.style.position = "relative";
    elements.messageInput.parentElement.appendChild(container);
  }

  // Renderizar sugestões
  container.innerHTML = matches
    .map(
      (cmd, index) => `
    <div class="suggestion-item" data-index="${index}" style="
      padding: 10px 12px;
      cursor: pointer;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s;
    ">
      <div style="font-size: 13px; color: var(--text-primary); margin-bottom: 2px;">
        ${highlightMatch(cmd.text, input)}
      </div>
      <div style="font-size: 11px; color: var(--text-muted);">
        ${cmd.description}
      </div>
    </div>
  `,
    )
    .join("");

  // Add hover effects
  container.querySelectorAll(".suggestion-item").forEach((item) => {
    item.addEventListener("mouseenter", function () {
      this.style.background = "var(--bg-hover)";
    });
    item.addEventListener("mouseleave", function () {
      this.style.background = "transparent";
    });
    item.addEventListener("click", function () {
      const index = parseInt(this.dataset.index);
      elements.messageInput.value = matches[index].text;
      hideSuggestions();
      elements.messageInput.focus();
    });
  });
}

/**
 * Hide suggestions
 */
function hideSuggestions() {
  const container = document.getElementById("suggestions-container");
  if (container) {
    container.remove();
  }
  state.suggestions = [];
}

/**
 * Accept first suggestion
 */
function acceptSuggestion() {
  if (state.suggestions.length > 0) {
    elements.messageInput.value = state.suggestions[0].text;
    hideSuggestions();
  }
}

/**
 * Highlight matching text
 */
function highlightMatch(text, query) {
  const regex = new RegExp(`(${query})`, "gi");
  return text.replace(
    regex,
    '<span style="background: rgba(59, 130, 246, 0.3); color: var(--accent-primary);">$1</span>',
  );
}

/**
 * Show keyboard shortcuts help
 */
function showKeyboardShortcuts() {
  if (state.currentView === "welcome") {
    switchToChat();
  }

  addMessage(
    "assistant",
    `⌨️ **Atalhos de Teclado**

**Navegação:**
• \`Ctrl/Cmd + K\` - Foco no input
• \`Ctrl/Cmd + N\` - Nova conversa
• \`Ctrl/Cmd + H\` - Abrir histórico
• \`Ctrl/Cmd + /\` - Este menu de atalhos

**No Input:**
• \`Enter\` - Enviar mensagem
• \`Shift + Enter\` - Nova linha
• \`Tab\` - Aceitar sugestão
• \`Esc\` - Limpar input
• \`↑\` - Comando anterior
• \`↓\` - Próximo comando

**Dicas:**
• Digite pelo menos 2 caracteres para ver sugestões
• Use Tab para autocompletar rapidamente
• Use ↑/↓ para navegar no histórico de comandos

Experimente agora! Digite algo e veja as sugestões aparecerem. 😊`,
  );
}

// ============================================
// STORAGE LISTENERS
// ============================================

/**
 * Listen for storage changes
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    console.log("💾 [STORAGE] Changes detected:", Object.keys(changes));

    if (changes.userId || changes.accessToken) {
      console.log("🔄 [STORAGE] Auth changed, reloading...");
      loadAuthData();
    }
  }
});

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize side panel
 */
async function initialize() {
  console.log("🚀 [SIDE PANEL] Initializing...");

  try {
    // Setup event listeners
    setupEventListeners();

    // Load authentication
    const isAuthenticated = await loadAuthData();

    if (isAuthenticated) {
      console.log("✅ [SIDE PANEL] Initialized with authentication");
    } else {
      console.log("⚠️ [SIDE PANEL] Initialized without authentication");
    }

    // Load tabs
    await loadTabsForSelector();

    // Focus input
    elements.messageInput.focus();

    console.log("✅ [SIDE PANEL] Initialization complete");
  } catch (error) {
    console.error("❌ [SIDE PANEL] Initialization error:", error);
  }
}

// Wait for DOM to be ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}

console.log("✅ [SIDE PANEL] Script loaded successfully");

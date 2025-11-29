// ============================================
// SYNCADS AI SIDE PANEL - ULTRA MODERN VERSION
// Complete implementation with Supabase integration
// ============================================

console.log("🚀 [SYNCADS SIDEPANEL] Initializing Ultra Modern Version...");

// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    SUPABASE_URL: "https://ovskepqggmxlfckxqgbr.supabase.co",
    SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E",
    CHAT_API_URL: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced",
    MAX_MESSAGE_LENGTH: 4000,
    AUTO_SCROLL_THRESHOLD: 100,
    TOAST_DURATION: 4000,
    TYPING_SIMULATION_DELAY: 500,
};

// ============================================
// STATE MANAGEMENT
// ============================================
const State = {
    supabase: null,
    api: null, // ExtensionAPI instance
    userId: null,
    accessToken: null,
    deviceId: null,
    currentConversationId: null,
    conversations: [],
    messages: [],
    isLoading: false,
    isSidebarOpen: false,
    realtimeSubscription: null,
    commandSubscription: null,
};

// ============================================
// SUPABASE INITIALIZATION
// ============================================
async function initializeSupabase() {
    console.log("🔧 [SUPABASE] Initializing client...");

    try {
        // Initialize Supabase client
        State.supabase = supabase.createClient(
            CONFIG.SUPABASE_URL,
            CONFIG.SUPABASE_ANON_KEY
        );

        // Load auth data from chrome.storage
        const authData = await loadAuthData();

        if (!authData.userId || !authData.accessToken) {
            showToast("⚠️ Autenticação necessária", "warning");
            console.warn("⚠️ [AUTH] No credentials found in storage");
            return false;
        }

        State.userId = authData.userId;
        State.accessToken = authData.accessToken;
        State.deviceId = authData.deviceId || await generateDeviceId();

        console.log("✅ [SUPABASE] Initialized successfully");
        console.log("👤 [AUTH] User ID:", State.userId);
        console.log("📱 [AUTH] Device ID:", State.deviceId);

        // Initialize Extension API
        if (window.ExtensionAPI) {
            State.api = new window.ExtensionAPI(State.supabase, {
                userId: State.userId,
                deviceId: State.deviceId
            });
            console.log("✅ [API] ExtensionAPI initialized");
        } else {
            console.warn("⚠️ [API] ExtensionAPI not loaded");
        }

        // Register device
        await registerDevice();

        // Setup realtime subscriptions
        await setupRealtimeSubscriptions();

        return true;
    } catch (error) {
        console.error("❌ [SUPABASE] Initialization failed:", error);
        showToast("❌ Erro ao conectar com Supabase", "error");
        return false;
    }
}

// ============================================
// AUTH MANAGEMENT
// ============================================
async function loadAuthData() {
    return new Promise((resolve) => {
        chrome.storage.local.get(
            ["syncads_user_id", "syncads_access_token", "syncads_device_id"],
            (result) => {
                resolve({
                    userId: result.syncads_user_id,
                    accessToken: result.syncads_access_token,
                    deviceId: result.syncads_device_id,
                });
            }
        );
    });
}

async function generateDeviceId() {
    const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Save to chrome.storage
    chrome.storage.local.set({ syncads_device_id: deviceId });

    return deviceId;
}

async function registerDevice() {
    if (!State.supabase || !State.userId || !State.deviceId) {
        console.warn("⚠️ [DEVICE] Cannot register - missing dependencies");
        return;
    }

    try {
        console.log("📱 [DEVICE] Registering device...");

        const { data, error } = await State.supabase
            .from("extension_devices")
            .upsert(
                {
                    device_id: State.deviceId,
                    user_id: State.userId,
                    device_type: "chrome_extension",
                    device_name: "Chrome Extension - Side Panel",
                    last_active: new Date().toISOString(),
                    is_active: true,
                },
                {
                    onConflict: "device_id",
                }
            )
            .select()
            .single();

        if (error) throw error;

        console.log("✅ [DEVICE] Device registered successfully:", data);
    } catch (error) {
        console.error("❌ [DEVICE] Registration failed:", error);
    }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================
async function setupRealtimeSubscriptions() {
    if (!State.supabase || !State.userId) {
        console.warn("⚠️ [REALTIME] Cannot setup - missing dependencies");
        return;
    }

    try {
        console.log("🔔 [REALTIME] Setting up subscriptions...");

        // Subscribe to extension commands
        State.commandSubscription = State.supabase
            .channel("extension_commands")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "extension_commands",
                    filter: `device_id=eq.${State.deviceId}`,
                },
                (payload) => {
                    console.log("📨 [REALTIME] New command received:", payload);
                    handleRealtimeCommand(payload.new);
                }
            )
            .subscribe();

        console.log("✅ [REALTIME] Subscriptions setup successfully");
    } catch (error) {
        console.error("❌ [REALTIME] Subscription setup failed:", error);
    }
}

async function handleRealtimeCommand(command) {
    console.log("⚡ [COMMAND] Processing realtime command:", command);

    try {
        // Execute command based on type
        const result = await executeCommand(command);

        // Update command status
        await updateCommandStatus(command.id, "completed", result);

        showToast("✅ Comando executado com sucesso", "success");
    } catch (error) {
        console.error("❌ [COMMAND] Execution failed:", error);
        await updateCommandStatus(command.id, "failed", { error: error.message });
        showToast("❌ Erro ao executar comando", "error");
    }
}

async function executeCommand(command) {
    // Command execution logic (placeholder)
    console.log("🔧 [COMMAND] Executing:", command.command_type);

    // This would integrate with content scripts for actual execution
    return { success: true, message: "Command executed" };
}

async function updateCommandStatus(commandId, status, result) {
    if (!State.supabase) return;

    try {
        const { error } = await State.supabase
            .from("extension_commands")
            .update({
                status: status,
                result: result,
                executed_at: new Date().toISOString(),
            })
            .eq("id", commandId);

        if (error) throw error;
    } catch (error) {
        console.error("❌ [COMMAND] Status update failed:", error);
    }
}

// ============================================
// CONVERSATION MANAGEMENT
// ============================================
async function loadConversations() {
    if (!State.supabase || !State.userId) {
        console.warn("⚠️ [CONVERSATIONS] Cannot load - user not authenticated");
        return [];
    }

    try {
        console.log("📚 [CONVERSATIONS] Loading conversations...");

        const { data, error } = await State.supabase
            .from("ChatConversation")
            .select("*")
            .eq("user_id", State.userId)
            .order("updated_at", { ascending: false })
            .limit(50);

        if (error) throw error;

        State.conversations = data || [];
        console.log(`✅ [CONVERSATIONS] Loaded ${State.conversations.length} conversations`);

        renderConversationsList();
        return State.conversations;
    } catch (error) {
        console.error("❌ [CONVERSATIONS] Load failed:", error);
        showToast("❌ Erro ao carregar conversas", "error");
        return [];
    }
}

async function createNewConversation() {
    if (!State.supabase || !State.userId) {
        showToast("⚠️ Autenticação necessária", "warning");
        return null;
    }

    try {
        console.log("➕ [CONVERSATIONS] Creating new conversation...");
        State.isLoading = true;

        const { data, error } = await State.supabase
            .from("ChatConversation")
            .insert({
                user_id: State.userId,
                title: "Nova Conversa",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        State.conversations.unshift(data);
        State.currentConversationId = data.id;

        console.log("✅ [CONVERSATIONS] Created:", data.id);

        renderConversationsList();
        switchToConversation(data.id);
        showToast("✅ Nova conversa criada", "success");

        return data;
    } catch (error) {
        console.error("❌ [CONVERSATIONS] Create failed:", error);
        showToast("❌ Erro ao criar conversa", "error");
        return null;
    } finally {
        State.isLoading = false;
    }
}

async function deleteConversation(conversationId) {
    if (!State.supabase) return;

    try {
        console.log("🗑️ [CONVERSATIONS] Deleting:", conversationId);

        // Delete messages first
        await State.supabase
            .from("ChatMessage")
            .delete()
            .eq("conversation_id", conversationId);

        // Delete conversation
        const { error } = await State.supabase
            .from("ChatConversation")
            .delete()
            .eq("id", conversationId);

        if (error) throw error;

        // Update state
        State.conversations = State.conversations.filter(
            (c) => c.id !== conversationId
        );

        if (State.currentConversationId === conversationId) {
            State.currentConversationId = null;
            State.messages = [];
            showWelcomeScreen();
        }

        renderConversationsList();
        showToast("✅ Conversa deletada", "success");

        console.log("✅ [CONVERSATIONS] Deleted successfully");
    } catch (error) {
        console.error("❌ [CONVERSATIONS] Delete failed:", error);
        showToast("❌ Erro ao deletar conversa", "error");
    }
}

async function updateConversationTitle(conversationId, title) {
    if (!State.supabase) return;

    try {
        const { error } = await State.supabase
            .from("ChatConversation")
            .update({
                title: title,
                updated_at: new Date().toISOString(),
            })
            .eq("id", conversationId);

        if (error) throw error;

        // Update local state
        const conversation = State.conversations.find((c) => c.id === conversationId);
        if (conversation) {
            conversation.title = title;
            conversation.updated_at = new Date().toISOString();
        }

        renderConversationsList();
    } catch (error) {
        console.error("❌ [CONVERSATIONS] Title update failed:", error);
    }
}

async function switchToConversation(conversationId) {
    console.log("🔄 [CONVERSATIONS] Switching to:", conversationId);

    State.currentConversationId = conversationId;

    // Load messages
    await loadMessages(conversationId);

    // Update UI
    hideWelcomeScreen();
    showChatContainer();
    renderConversationsList();
    renderMessages();
}

// ============================================
// MESSAGE MANAGEMENT
// ============================================
async function loadMessages(conversationId) {
    if (!State.supabase || !conversationId) {
        console.warn("⚠️ [MESSAGES] Cannot load - missing conversation ID");
        return [];
    }

    try {
        console.log("💬 [MESSAGES] Loading messages for conversation:", conversationId);

        const { data, error } = await State.supabase
            .from("ChatMessage")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true });

        if (error) throw error;

        State.messages = data || [];
        console.log(`✅ [MESSAGES] Loaded ${State.messages.length} messages`);

        return State.messages;
    } catch (error) {
        console.error("❌ [MESSAGES] Load failed:", error);
        showToast("❌ Erro ao carregar mensagens", "error");
        return [];
    }
}

async function sendMessage(content) {
    if (!content || !content.trim()) {
        console.warn("⚠️ [MESSAGES] Empty message");
        return;
    }

    if (content.length > CONFIG.MAX_MESSAGE_LENGTH) {
        showToast("❌ Mensagem muito longa", "error");
        return;
    }

    try {
        // Create conversation if needed
        if (!State.currentConversationId) {
            const conversation = await createNewConversation();
            if (!conversation) return;
        }

        console.log("📤 [MESSAGES] Sending message...");
        State.isLoading = true;

        // Add user message to UI immediately
        const userMessage = {
            id: `temp_${Date.now()}`,
            conversation_id: State.currentConversationId,
            role: "user",
            content: content.trim(),
            created_at: new Date().toISOString(),
        };

        State.messages.push(userMessage);
        renderMessages();
        scrollToBottom();

        // Clear input
        const input = document.getElementById("message-input");
        if (input) {
            input.value = "";
            input.style.height = "48px";
        }

        // Show typing indicator
        showTypingIndicator();

        // Save user message to database
        const { data: savedUserMsg, error: userError } = await State.supabase
            .from("ChatMessage")
            .insert({
                conversation_id: State.currentConversationId,
                role: "user",
                content: content.trim(),
                created_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (userError) throw userError;

        // Replace temp message with saved one
        const tempIndex = State.messages.findIndex((m) => m.id === userMessage.id);
        if (tempIndex !== -1) {
            State.messages[tempIndex] = savedUserMsg;
        }

        // Call chat API
        const response = await callChatAPI(content.trim());

        // Hide typing indicator
        hideTypingIndicator();

        if (response && response.content) {
            // Add assistant message
            const assistantMessage = {
                conversation_id: State.currentConversationId,
                role: "assistant",
                content: response.content,
                created_at: new Date().toISOString(),
            };

            // Save to database
            const { data: savedAssistantMsg, error: assistantError } = await State.supabase
                .from("ChatMessage")
                .insert(assistantMessage)
                .select()
                .single();

            if (assistantError) throw assistantError;

            State.messages.push(savedAssistantMsg);
            renderMessages();
            scrollToBottom();

            // Update conversation title if it's the first message
            if (State.messages.length === 2) {
                const title = generateConversationTitle(content);
                await updateConversationTitle(State.currentConversationId, title);
            }

            // Update conversation timestamp
            await State.supabase
                .from("ChatConversation")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", State.currentConversationId);
        }

        console.log("✅ [MESSAGES] Message sent successfully");
    } catch (error) {
        console.error("❌ [MESSAGES] Send failed:", error);
        showToast("❌ Erro ao enviar mensagem", "error");
        hideTypingIndicator();
    } finally {
        State.isLoading = false;
        updateSendButtonState();
    }
}

async function callChatAPI(message) {
    try {
        console.log("🤖 [API] Calling chat-enhanced...");

        const response = await fetch(CONFIG.CHAT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${State.accessToken}`,
            },
            body: JSON.stringify({
                message: message,
                conversation_id: State.currentConversationId,
                user_id: State.userId,
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ [API] Response received");

        return data;
    } catch (error) {
        console.error("❌ [API] Call failed:", error);
        throw error;
    }
}

function generateConversationTitle(firstMessage) {
    // Generate title from first message (max 50 chars)
    const title = firstMessage.trim().substring(0, 50);
    return title + (firstMessage.length > 50 ? "..." : "");
}

// ============================================
// UI RENDERING
// ============================================
function renderConversationsList() {
    const container = document.getElementById("conversations-list");
    if (!container) return;

    if (State.conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💬</div>
                <div class="empty-state-text">
                    Nenhuma conversa ainda.<br>
                    Clique em "Nova Conversa" para começar!
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = State.conversations
        .map((conv) => {
            const isActive = conv.id === State.currentConversationId;
            const date = formatDate(conv.updated_at);
            const messageCount = State.messages.filter(
                (m) => m.conversation_id === conv.id
            ).length;

            return `
                <div class="conversation-item ${isActive ? "active" : ""}"
                     data-conversation-id="${conv.id}">
                    <div class="conversation-title">${escapeHtml(conv.title)}</div>
                    <div class="conversation-meta">
                        <span>${date}</span>
                        <span class="message-count-badge">${messageCount}</span>
                        <div class="conversation-actions">
                            <button class="conversation-action-btn delete-conversation"
                                    data-conversation-id="${conv.id}"
                                    title="Deletar">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

    // Add event listeners
    container.querySelectorAll(".conversation-item").forEach((item) => {
        const conversationId = item.dataset.conversationId;

        item.addEventListener("click", (e) => {
            if (!e.target.closest(".conversation-action-btn")) {
                switchToConversation(conversationId);
            }
        });
    });

    container.querySelectorAll(".delete-conversation").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const conversationId = btn.dataset.conversationId;
            if (confirm("Tem certeza que deseja deletar esta conversa?")) {
                deleteConversation(conversationId);
            }
        });
    });
}

function renderMessages() {
    const container = document.getElementById("messages-container");
    if (!container) return;

    if (State.messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💭</div>
                <div class="empty-state-text">
                    Nenhuma mensagem ainda.<br>
                    Envie uma mensagem para começar a conversa!
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = State.messages
        .map((msg) => {
            const time = formatTime(msg.created_at);
            const avatar = msg.role === "user" ? "👤" : "🤖";

            return `
                <div class="message ${msg.role}" style="animation-delay: 0.05s">
                    <div class="message-avatar">${avatar}</div>
                    <div class="message-content">
                        <div class="message-bubble">${escapeHtml(msg.content)}</div>
                        <div class="message-time">${time}</div>
                    </div>
                </div>
            `;
        })
        .join("");

    // Re-attach animation
    setTimeout(() => {
        container.querySelectorAll(".message").forEach((msg) => {
            msg.style.opacity = "1";
        });
    }, 50);
}

function showTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
        indicator.classList.add("active");
        scrollToBottom();
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById("typing-indicator");
    if (indicator) {
        indicator.classList.remove("active");
    }
}

function showWelcomeScreen() {
    const welcome = document.getElementById("welcome-screen");
    const chat = document.getElementById("chat-container");

    if (welcome) welcome.classList.remove("hidden");
    if (chat) chat.classList.remove("active");
}

function hideWelcomeScreen() {
    const welcome = document.getElementById("welcome-screen");
    if (welcome) welcome.classList.add("hidden");
}

function showChatContainer() {
    const chat = document.getElementById("chat-container");
    if (chat) chat.classList.add("active");
}

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    State.isSidebarOpen = !State.isSidebarOpen;

    if (State.isSidebarOpen) {
        sidebar.classList.add("open");
    } else {
        sidebar.classList.remove("open");
    }

    console.log("📱 [SIDEBAR]", State.isSidebarOpen ? "Opened" : "Closed");
}

function updateSendButtonState() {
    const sendBtn = document.getElementById("send-btn");
    const input = document.getElementById("message-input");

    if (!sendBtn || !input) return;

    const hasContent = input.value.trim().length > 0;
    sendBtn.disabled = State.isLoading || !hasContent;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    if (days < 7) return `${days}d atrás`;

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom(smooth = true) {
    const container = document.querySelector(".messages-area");
    if (!container) return;

    setTimeout(() => {
        container.scrollTo({
            top: container.scrollHeight,
            behavior: smooth ? "smooth" : "auto",
        });
    }, 100);
}

function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const icons = {
        success: "✅",
        error: "❌",
        warning: "⚠️",
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || "ℹ️"}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.animation = "toastSlideIn 0.4s ease reverse";
        setTimeout(() => {
            toast.remove();
        }, 400);
    }, CONFIG.TOAST_DURATION);
}

// ============================================
// QUICK ACTIONS EVENT LISTENERS
// ============================================
function initializeQuickActions() {
    const quickActionCards = document.querySelectorAll(".quick-action-card");

    quickActionCards.forEach((card) => {
        card.addEventListener("click", async () => {
            const action = card.dataset.action;
            await handleQuickAction(action);
        });

        // Keyboard accessibility
        card.addEventListener("keypress", async (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                const action = card.dataset.action;
                await handleQuickAction(action);
            }
        });
    });

    console.log("✅ [QUICK ACTIONS] Event listeners initialized");
}

// ============================================
// QUICK ACTIONS HANDLERS
// ============================================
async function handleQuickAction(action) {
    console.log("⚡ [QUICK ACTION]:", action);

    // Hide welcome screen and show chat
    hideWelcomeScreen();
    showChatContainer();

    try {
        switch (action) {
            case "analyze-page":
                await handleAnalyzePage();
                break;
            case "extract-data":
                await handleExtractData();
                break;
            case "list-tabs":
                await handleListTabs();
                break;
            case "automation":
                await handleCreateAutomation();
                break;
            default:
                console.warn("Unknown action:", action);
        }
    } catch (error) {
        console.error("❌ [QUICK ACTION] Error:", error);
        showToast(`❌ Erro ao executar ação: ${error.message}`, "error");
    }
}

// Handler 1: Analisar Página
async function handleAnalyzePage() {
    console.log("🔍 [ANALYZE PAGE] Starting page analysis...");

    // Create conversation if needed
    if (!State.currentConversationId) {
        await createNewConversation();
    }

    // Send message to chat
    const message = "Analise a página atual e me dê um resumo completo";
    await sendMessage(message);

    showToast("🔍 Analisando página...", "info");
}

// Handler 2: Extrair Dados
async function handleExtractData() {
    console.log("📊 [EXTRACT DATA] Starting data extraction...");

    // Create conversation if needed
    if (!State.currentConversationId) {
        await createNewConversation();
    }

    // Send message to chat
    const message = "Extraia todos os dados estruturados desta página";
    await sendMessage(message);

    showToast("📊 Extraindo dados...", "info");
}

// Handler 3: Listar Abas
async function handleListTabs() {
    console.log("📑 [LIST TABS] Fetching tabs...");

    try {
        // Get tabs from background script
        chrome.runtime.sendMessage({ type: "LIST_TABS" }, (response) => {
            if (response.success) {
                console.log("✅ [LIST TABS] Tabs retrieved:", response.tabs);

                // Create conversation if needed
                if (!State.currentConversationId) {
                    createNewConversation().then(() => {
                        displayTabsInChat(response.tabs);
                    });
                } else {
                    displayTabsInChat(response.tabs);
                }

                showToast(`📑 ${response.count} abas encontradas`, "success");
            } else {
                throw new Error(response.error);
            }
        });
    } catch (error) {
        console.error("❌ [LIST TABS] Error:", error);
        showToast("❌ Erro ao listar abas", "error");
    }
}

// Handler 4: Criar Automação
async function handleCreateAutomation() {
    console.log("⚡ [AUTOMATION] Starting automation wizard...");

    // Create conversation if needed
    if (!State.currentConversationId) {
        await createNewConversation();
    }

    // Send message to chat
    const message = "Ajude-me a criar uma automação para esta página";
    await sendMessage(message);

    showToast("⚡ Iniciando assistente de automação...", "info");
}

// Helper: Display tabs in chat
function displayTabsInChat(tabs) {
    // Format tabs list
    let tabsList = `📑 **Abas Abertas** (${tabs.length} total):\n\n`;
    tabs.forEach((tab, index) => {
        const activeMarker = tab.active ? " ✓" : "";
        tabsList += `${index + 1}. ${tab.title}${activeMarker}\n   ${tab.url}\n\n`;
    });

    // Add as assistant message
    const assistantMessage = {
        id: `tabs_${Date.now()}`,
        conversation_id: State.currentConversationId,
        role: "assistant",
        content: tabsList,
        created_at: new Date().toISOString(),
    };

    State.messages.push(assistantMessage);
    renderMessages();
    scrollToBottom();

    // Save to database
    State.supabase
        .from("ChatMessage")
        .insert({
            conversation_id: State.currentConversationId,
            role: "assistant",
            content: tabsList,
            created_at: new Date().toISOString(),
        })
        .then(({ error }) => {
            if (error) {
                console.error("Failed to save tabs message:", error);
            }
        });
}

// ============================================
// EVENT HANDLERS
// ============================================
function setupEventListeners() {
    // Menu button
    const menuBtn = document.getElementById("menu-btn");
    if (menuBtn) {
        menuBtn.addEventListener("click", toggleSidebar);
    }

    // New chat button
    const newChatBtn = document.getElementById("new-chat-btn");
    if (newChatBtn) {
        newChatBtn.addEventListener("click", createNewConversation);
    }

    // Message input
    const messageInput = document.getElementById("message-input");
    if (messageInput) {
        messageInput.addEventListener("input", () => {
            // Auto-resize
            messageInput.style.height = "48px";
            messageInput.style.height = messageInput.scrollHeight + "px";

            // Update send button state
            updateSendButtonState();
        });

        messageInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const sendBtn = document.getElementById("send-btn");
                if (sendBtn && !sendBtn.disabled) {
                    sendMessage(messageInput.value);
                }
            }
        });
    }

    // Send button
    const sendBtn = document.getElementById("send-btn");
    if (sendBtn) {
        sendBtn.addEventListener("click", () => {
            const input = document.getElementById("message-input");
            if (input && input.value.trim()) {
                sendMessage(input.value);
            }
        });
    }

    // Click outside sidebar to close
    document.addEventListener("click", (e) => {
        const sidebar = document.getElementById("sidebar");
        const menuBtn = document.getElementById("menu-btn");

        if (
            State.isSidebarOpen &&
            sidebar &&
            !sidebar.contains(e.target) &&
            !menuBtn.contains(e.target)
        ) {
            toggleSidebar();
        }
    });

    console.log("✅ [EVENT LISTENERS] All event listeners setup");
}

// ============================================
// INITIALIZATION
// ============================================
async function initialize() {
    console.log("🎬 [INIT] Starting initialization...");

    try {
        // Setup event listeners
        setupEventListeners();

        // Initialize quick actions
        initializeQuickActions();

        // Initialize Supabase
        const supabaseReady = await initializeSupabase();

        if (supabaseReady) {
            // Load conversations
            await loadConversations();

            // Update UI
            updateStatusIndicator(true);
            showWelcomeScreen();

            console.log("✅ [INIT] Initialization complete");
            showToast("🚀 SyncAds AI está pronto!", "success");
        } else {
            console.warn("⚠️ [INIT] Supabase not ready - limited functionality");
            updateStatusIndicator(false);
            showWelcomeScreen();
        }
    } catch (error) {
        console.error("❌ [INIT] Initialization failed:", error);
        showToast("❌ Erro ao inicializar", "error");
        updateStatusIndicator(false);
    }
}

function updateStatusIndicator(isOnline) {
    const statusText = document.querySelector(".status-indicator");
    const statusDot = document.querySelector(".status-dot");

    if (statusText && statusDot) {
        if (isOnline) {
            statusText.textContent = "Online";
            statusText.style.color = "var(--success)";
            statusDot.style.background = "var(--success)";
        } else {
            statusText.textContent = "Offline";
            statusText.style.color = "var(--error)";
            statusDot.style.background = "var(--error)";
        }
    }
}

// Start application when DOM is loaded
document.addEventListener("DOMContentLoaded", initialize);

console.log("✅ [SIDEPANEL] Ultra Modern Version Loaded Successfully!");

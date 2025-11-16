// ============================================
// SYNCADS EXTENSION - POPUP SCRIPT
// Interface do usuário da extensão
// ============================================

console.log('🎨 SyncAds Popup Loaded');

// ============================================
// ELEMENTOS DO DOM
// ============================================
const elements = {
  loadingSection: document.getElementById('loadingSection'),
  loginSection: document.getElementById('loginSection'),
  mainSection: document.getElementById('mainSection'),
  loginButton: document.getElementById('loginButton'),
  logoutButton: document.getElementById('logoutButton'),
  reconnectButton: document.getElementById('reconnectButton'),
  openDashboardButton: document.getElementById('openDashboardButton'),
  userInfo: document.getElementById('userInfo'),
  userName: document.getElementById('userName'),
  userEmail: document.getElementById('userEmail'),
  userInitial: document.getElementById('userInitial'),
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  deviceId: document.getElementById('deviceId'),
  lastActivity: document.getElementById('lastActivity'),
  statsTotal: document.getElementById('statsTotal'),
  statsSuccess: document.getElementById('statsSuccess'),
  statsFailed: document.getElementById('statsFailed')
};

// ============================================
// ESTADO GLOBAL
// ============================================
let state = {
  deviceId: null,
  userId: null,
  isConnected: false,
  stats: {
    commandsExecuted: 0,
    commandsSuccess: 0,
    commandsFailed: 0
  },
  config: null
};

// ============================================
// INICIALIZAÇÃO
// ============================================
async function initialize() {
  try {
    console.log('🚀 Initializing popup...');

    // Obter estado do background
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

    if (response) {
      state = response;
      console.log('📊 State received:', state);
    }

    // Obter estatísticas
    const statsResponse = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

    if (statsResponse) {
      state.stats = statsResponse;
    }

    // Atualizar UI
    updateUI();

    // Ocultar loading
    elements.loadingSection.classList.remove('active');
    elements.loadingSection.classList.add('hidden');

    // Escutar mudanças de estado
    listenForUpdates();

  } catch (error) {
    console.error('❌ Initialization error:', error);
    showError('Erro ao carregar extensão');
  }
}

// ============================================
// ATUALIZAR UI
// ============================================
function updateUI() {
  console.log('🔄 Updating UI...');

  // Verificar se usuário está logado
  if (state.userId) {
    // Mostrar seção principal
    elements.loginSection.classList.add('hidden');
    elements.mainSection.classList.remove('hidden');
    elements.mainSection.classList.add('active');

    // Atualizar informações do usuário
    updateUserInfo();

    // Atualizar status de conexão
    updateConnectionStatus();

    // Atualizar estatísticas
    updateStats();

  } else {
    // Mostrar seção de login
    elements.loginSection.classList.remove('hidden');
    elements.mainSection.classList.add('hidden');
  }
}

// ============================================
// ATUALIZAR INFO DO USUÁRIO
// ============================================
function updateUserInfo() {
  // Por enquanto, mostrar ID do usuário
  // TODO: Buscar informações reais do usuário do Supabase

  const userId = state.userId || 'Usuário';
  const userInitial = userId.charAt(0).toUpperCase();

  elements.userName.textContent = userId;
  elements.userEmail.textContent = `ID: ${userId}`;
  elements.userInitial.textContent = userInitial;
  elements.userInfo.classList.remove('hidden');

  // Atualizar device ID
  elements.deviceId.textContent = state.deviceId
    ? state.deviceId.substring(0, 20) + '...'
    : '-';
}

// ============================================
// ATUALIZAR STATUS DE CONEXÃO
// ============================================
function updateConnectionStatus() {
  if (state.isConnected) {
    elements.statusDot.className = 'status-dot online';
    elements.statusText.textContent = 'Conectado';
    elements.reconnectButton.classList.add('hidden');
  } else {
    elements.statusDot.className = 'status-dot offline';
    elements.statusText.textContent = 'Desconectado';
    elements.reconnectButton.classList.remove('hidden');
  }

  // Atualizar última atividade
  if (state.stats && state.stats.lastActivity) {
    const lastActivity = new Date(state.stats.lastActivity);
    const now = new Date();
    const diff = Math.floor((now - lastActivity) / 1000); // segundos

    let activityText;

    if (diff < 60) {
      activityText = 'Agora mesmo';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      activityText = `${minutes} min atrás`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      activityText = `${hours}h atrás`;
    } else {
      activityText = 'Há mais de 1 dia';
    }

    elements.lastActivity.textContent = activityText;
  } else {
    elements.lastActivity.textContent = 'Nunca';
  }
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================
function updateStats() {
  elements.statsTotal.textContent = state.stats.commandsExecuted || 0;
  elements.statsSuccess.textContent = state.stats.commandsSuccess || 0;
  elements.statsFailed.textContent = state.stats.commandsFailed || 0;
}

// ============================================
// EVENT LISTENERS
// ============================================

// Login
elements.loginButton.addEventListener('click', async () => {
  try {
    const dashboardUrl = state.config?.serverUrl || 'https://syncads-d8hhiutcx-fatima-drivias-projects.vercel.app';

    // Abrir dashboard em nova aba
    await chrome.tabs.create({ url: `${dashboardUrl}/login` });

    // Fechar popup
    window.close();

  } catch (error) {
    console.error('❌ Login error:', error);
    showError('Erro ao abrir página de login');
  }
});

// Logout
elements.logoutButton.addEventListener('click', async () => {
  try {
    // Confirmar logout
    if (!confirm('Deseja realmente sair?')) {
      return;
    }

    // Enviar mensagem de logout para background
    await chrome.runtime.sendMessage({ type: 'LOGOUT' });

    // Atualizar estado local
    state.userId = null;
    state.isConnected = false;

    // Atualizar UI
    updateUI();

    showSuccess('Logout realizado com sucesso');

  } catch (error) {
    console.error('❌ Logout error:', error);
    showError('Erro ao fazer logout');
  }
});

// Reconectar
elements.reconnectButton.addEventListener('click', async () => {
  try {
    elements.reconnectButton.disabled = true;
    elements.reconnectButton.textContent = '🔄 Conectando...';

    // Enviar mensagem de reconexão
    await chrome.runtime.sendMessage({ type: 'RECONNECT' });

    setTimeout(async () => {
      // Atualizar estado
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      if (response) {
        state = response;
        updateUI();
      }

      elements.reconnectButton.disabled = false;
      elements.reconnectButton.textContent = '🔄 Reconectar';

      if (state.isConnected) {
        showSuccess('Reconectado com sucesso!');
      } else {
        showError('Falha ao reconectar');
      }
    }, 2000);

  } catch (error) {
    console.error('❌ Reconnect error:', error);
    showError('Erro ao reconectar');
    elements.reconnectButton.disabled = false;
    elements.reconnectButton.textContent = '🔄 Reconectar';
  }
});

// Abrir Dashboard
elements.openDashboardButton.addEventListener('click', async () => {
  try {
    const dashboardUrl = state.config?.serverUrl || 'https://syncads-d8hhiutcx-fatima-drivias-projects.vercel.app';

    // Abrir dashboard em nova aba
    await chrome.tabs.create({ url: dashboardUrl });

    // Fechar popup
    window.close();

  } catch (error) {
    console.error('❌ Open dashboard error:', error);
    showError('Erro ao abrir dashboard');
  }
});

// ============================================
// ESCUTAR ATUALIZAÇÕES DO BACKGROUND
// ============================================
function listenForUpdates() {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Popup received message:', request.type);

    if (request.type === 'CONNECTION_STATUS') {
      state.isConnected = request.connected;
      updateConnectionStatus();
    }

    if (request.type === 'STATS_UPDATE') {
      state.stats = request.stats;
      updateStats();
    }

    return true;
  });

  // Atualizar periodicamente
  setInterval(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      if (response) {
        state = response;
        updateUI();
      }
    } catch (error) {
      // Background pode não estar disponível
    }
  }, 3000);
}

// ============================================
// MOSTRAR MENSAGENS
// ============================================
function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.textContent = message;

  elements.mainSection.insertBefore(successDiv, elements.mainSection.firstChild);

  setTimeout(() => {
    successDiv.remove();
  }, 3000);
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;

  const target = state.userId ? elements.mainSection : elements.loginSection;
  target.insertBefore(errorDiv, target.firstChild);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
}

// ============================================
// INICIALIZAR AO CARREGAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM Content Loaded');
  initialize();
});

// ============================================
// TESTES DE DESENVOLVIMENTO
// ============================================
if (typeof chrome === 'undefined') {
  console.warn('⚠️ Chrome API not available - running in test mode');

  // Simular estado para desenvolvimento
  state = {
    deviceId: 'device_test_123456',
    userId: 'test_user',
    isConnected: true,
    stats: {
      commandsExecuted: 42,
      commandsSuccess: 38,
      commandsFailed: 4,
      lastActivity: Date.now() - 60000
    },
    config: {
      serverUrl: 'https://syncads-d8hhiutcx-fatima-drivias-projects.vercel.app'
    }
  };

  setTimeout(() => {
    elements.loadingSection.classList.add('hidden');
    updateUI();
  }, 500);
}

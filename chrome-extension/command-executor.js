// ============================================================================
// COMMAND EXECUTOR - Busca e Executa Comandos do Servidor
// ============================================================================
// Faz polling na tabela extension_commands e executa ações no navegador
// ============================================================================

console.log('🎯 Command Executor carregado');

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const POLLING_INTERVAL = 2000; // 2 segundos
const COMMAND_TIMEOUT = 30000; // 30 segundos
let pollingTimer = null;
let isPolling = false;

// ============================================================================
// POLLING DE COMANDOS
// ============================================================================

/**
 * Inicia polling de comandos
 */
function startCommandPolling() {
  if (isPolling) {
    console.log('⚠️ Polling já está ativo');
    return;
  }

  console.log('🔄 Iniciando polling de comandos...');
  isPolling = true;

  // Executar primeira vez imediatamente
  pollCommands();

  // Depois executar a cada intervalo
  pollingTimer = setInterval(() => {
    pollCommands();
  }, POLLING_INTERVAL);
}

/**
 * Para polling de comandos
 */
function stopCommandPolling() {
  console.log('⏹️ Parando polling de comandos...');
  isPolling = false;

  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
  }
}

/**
 * Busca comandos pendentes no servidor
 */
async function pollCommands() {
  try {
    // Obter estado da extensão
    const result = await chrome.storage.local.get(['deviceId', 'accessToken', 'userId']);

    if (!result.deviceId || !result.accessToken) {
      // Não logado, parar polling
      if (isPolling) {
        console.log('⚠️ Sem device_id ou token, parando polling');
        stopCommandPolling();
      }
      return;
    }

    // Buscar comandos pendentes
    const response = await fetch(
      `${CONFIG.functionsUrl}/extension-commands/${result.deviceId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${result.accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('⚠️ Token expirado, tentando renovar...');
        // Tentar renovar token (implementar se necessário)
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.commands && data.commands.length > 0) {
      console.log(`📥 ${data.commands.length} comando(s) pendente(s)`);

      // Executar cada comando
      for (const command of data.commands) {
        await executeCommand(command);
      }
    }
  } catch (error) {
    console.error('❌ Erro no polling:', error);
  }
}

/**
 * Executa um comando
 */
async function executeCommand(command) {
  console.log('⚡ Executando comando:', {
    id: command.id,
    type: command.command_type,
    params: command.params,
  });

  try {
    let result = null;

    switch (command.command_type) {
      case 'NAVIGATE':
        result = await executeNavigate(command.params);
        break;

      case 'CLICK':
        result = await executeClick(command.params);
        break;

      case 'FILL_FORM':
        result = await executeFillForm(command.params);
        break;

      case 'SCREENSHOT':
        result = await executeScreenshot(command.params);
        break;

      case 'EXECUTE_JS':
        result = await executeJS(command.params);
        break;

      case 'READ_TEXT':
        result = await executeReadText(command.params);
        break;

      case 'SCROLL_TO':
        result = await executeScrollTo(command.params);
        break;

      default:
        throw new Error(`Comando desconhecido: ${command.command_type}`);
    }

    // Marcar comando como completado
    await updateCommandStatus(command.id, 'completed', result);

    console.log('✅ Comando executado com sucesso:', command.id);
  } catch (error) {
    console.error('❌ Erro ao executar comando:', error);

    // Marcar comando como falho
    await updateCommandStatus(command.id, 'failed', null, error.message);
  }
}

// ============================================================================
// EXECUTORES DE COMANDOS
// ============================================================================

/**
 * NAVIGATE - Navega para uma URL
 */
async function executeNavigate(params) {
  const { url } = params;

  if (!url) {
    throw new Error('URL é obrigatória para NAVIGATE');
  }

  console.log('🌐 Navegando para:', url);

  // Obter ou criar aba ativa
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs.length > 0) {
    // Atualizar aba ativa
    await chrome.tabs.update(tabs[0].id, { url });
  } else {
    // Criar nova aba
    await chrome.tabs.create({ url, active: true });
  }

  // Aguardar página carregar
  return new Promise((resolve) => {
    const listener = (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url === url) {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve({ success: true, url: tab.url });
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Timeout de segurança
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve({ success: true, url, timeout: true });
    }, COMMAND_TIMEOUT);
  });
}

/**
 * CLICK - Clica em um elemento
 */
async function executeClick(params) {
  const { selector } = params;

  if (!selector) {
    throw new Error('Selector é obrigatório para CLICK');
  }

  return await executeInContentScript('click', { selector });
}

/**
 * FILL_FORM - Preenche um formulário
 */
async function executeFillForm(params) {
  const { formData } = params;

  if (!formData) {
    throw new Error('formData é obrigatório para FILL_FORM');
  }

  return await executeInContentScript('fillForm', { formData });
}

/**
 * SCREENSHOT - Tira screenshot
 */
async function executeScreenshot(params) {
  console.log('📸 Tirando screenshot...');

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs.length === 0) {
    throw new Error('Nenhuma aba ativa encontrada');
  }

  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 90,
  });

  return { success: true, screenshot: dataUrl };
}

/**
 * EXECUTE_JS - Executa código JavaScript
 */
async function executeJS(params) {
  const { code } = params;

  if (!code) {
    throw new Error('code é obrigatório para EXECUTE_JS');
  }

  return await executeInContentScript('executeJS', { code });
}

/**
 * READ_TEXT - Lê texto da página
 */
async function executeReadText(params) {
  const { selector } = params;

  return await executeInContentScript('readText', { selector });
}

/**
 * SCROLL_TO - Rola página
 */
async function executeScrollTo(params) {
  const { selector, position } = params;

  return await executeInContentScript('scrollTo', { selector, position });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Executa ação no content script
 */
async function executeInContentScript(action, params) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tabs.length === 0) {
    throw new Error('Nenhuma aba ativa encontrada');
  }

  const response = await chrome.tabs.sendMessage(tabs[0].id, {
    action,
    params,
  });

  return response;
}

/**
 * Atualiza status do comando no servidor
 */
async function updateCommandStatus(commandId, status, result = null, error = null) {
  try {
    const storage = await chrome.storage.local.get(['accessToken']);

    if (!storage.accessToken) {
      console.warn('⚠️ Sem token para atualizar comando');
      return;
    }

    const response = await fetch(
      `${CONFIG.restUrl}/extension_commands?id=eq.${commandId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${storage.accessToken}`,
          'Content-Type': 'application/json',
          'apikey': CONFIG.supabaseAnonKey,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          status,
          result: result ? JSON.stringify(result) : null,
          error: error || null,
          executed_at: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      console.error('❌ Erro ao atualizar status do comando:', response.status);
    } else {
      console.log('✅ Status do comando atualizado:', status);
    }
  } catch (error) {
    console.error('❌ Erro ao atualizar comando:', error);
  }
}

// ============================================================================
// LISTENERS
// ============================================================================

// Escutar mensagens de outros contextos
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startPolling') {
    startCommandPolling();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'stopPolling') {
    stopCommandPolling();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === 'getPollingStatus') {
    sendResponse({ isPolling });
    return true;
  }
});

// Iniciar polling quando extensão carrega
chrome.runtime.onStartup.addListener(() => {
  console.log('🚀 Extension startup - verificando se deve iniciar polling');

  // Verificar se está logado
  chrome.storage.local.get(['deviceId', 'accessToken'], (result) => {
    if (result.deviceId && result.accessToken) {
      console.log('✅ Usuário logado, iniciando polling');
      startCommandPolling();
    }
  });
});

// Monitorar mudanças no storage (login/logout)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    // Se device_id ou token mudou
    if (changes.deviceId || changes.accessToken) {
      const hasDeviceId = changes.deviceId?.newValue;
      const hasToken = changes.accessToken?.newValue;

      if (hasDeviceId && hasToken) {
        console.log('✅ Usuário logado, iniciando polling');
        startCommandPolling();
      } else if (!hasDeviceId || !hasToken) {
        console.log('🚪 Usuário deslogado, parando polling');
        stopCommandPolling();
      }
    }
  }
});

console.log('✅ Command Executor inicializado');

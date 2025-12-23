// ============================================
// COMMAND POLLING SYSTEM
// Poll for pending commands and execute them
// ============================================

let commandPollingInterval = null;
const COMMAND_POLL_INTERVAL = 2000; // 2 segundos (reduzido de 5s)

async function pollAndExecuteCommands() {
    // Só executar se tiver token válido
    if (!state.accessToken || !state.deviceId) {
        Logger.debug('Skipping command poll - No access token or device ID');
        return;
    }

    try {
        Logger.debug('🔍 Polling for pending commands...');

        // Buscar comandos pendentes para este dispositivo
        const response = await fetch(
            `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=eq.pending&order=created_at.asc&limit=5`,
            {
                headers: {
                    'Authorization': `Bearer ${state.accessToken}`,
                    'apikey': CONFIG.supabaseAnonKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            Logger.warn('Command polling failed', { status: response.status });
            return;
        }

        const commands = await response.json();
        if (!commands || commands.length === 0) {
            return; // Sem comandos pendentes
        }

        Logger.info(`📥 Found ${commands.length} pending command(s)`, { commands });

        // Executar cada comando
        for (const command of commands) {
            await executeCommand(command);
        }

    } catch (error) {
        Logger.error('Error polling commands', error);
    }
}

async function executeCommand(command) {
    const commandId = command.id;
    const commandType = command.type || command.command || command.command_type;
    const options = command.options || {};

    Logger.info(`⚡ Executing command: ${commandType}`, { commandId, options });

    try {
        // Atualizar status para 'executing'
        await updateCommandStatus(commandId, 'executing', null, null);

        let result = null;
        let error = null;

        // Executar baseado no tipo de comando
        switch (commandType.toUpperCase()) {
            case 'NAVIGATE':
                result = await executeNavigate(options.url);
                break;

            case 'CLICK':
                result = await executeClick(command.selector || options.selector);
                break;

            case 'FILL':
                result = await executeFill(command.selector || options.selector, command.value || options.value);
                break;

            case 'SCROLL':
                result = await executeScroll(options.y || 500);
                break;

            default:
                error = `Unknown command type: ${commandType}`;
                Logger.warn(error);
        }

        // Atualizar status final
        if (error) {
            await updateCommandStatus(commandId, 'failed', null, error);
            Logger.error(`❌ Command ${commandId} failed:`, error);
        } else {
            await updateCommandStatus(commandId, 'completed', result, null);
            Logger.info(`✅ Command ${commandId} completed successfully`);
        }

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        Logger.error(`❌ Error executing command ${commandId}:`, err);
        await updateCommandStatus(commandId, 'failed', null, errorMessage);
    }
}

// Executar NAVIGATE - SEMPRE cria nova aba
async function executeNavigate(url) {
    if (!url) {
        throw new Error('URL is required for NAVIGATE command');
    }

    Logger.info(`🌐 Navigating to: ${url}`);

    try {
        // SEMPRE criar nova aba (fix para o problema de "no active tab")
        const tab = await chrome.tabs.create({ url: url, active: true });

        // VERIFICAR SE CARREGOU (Fix para "mentir que abriu")
        Logger.info(`⏳ Waiting for tab ${tab.id} to complete loading...`);
        const loadedTab = await waitForTabComplete(tab.id, 15000); // 15s timeout

        return {
            success: true,
            tabId: loadedTab.id,
            url: loadedTab.url,
            title: loadedTab.title,
            message: `✅ Site opened and verified: ${loadedTab.title}`,
        };
    } catch (error) {
        Logger.error(`❌ Navigation failed for ${url}:`, error);
        throw new Error(`Failed to open ${url}: ${error.message}`);
    }
}

// Executar CLICK
async function executeClick(selector) {
    if (!selector) {
        throw new Error('Selector is required for CLICK command');
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        throw new Error('No active tab found');
    }

    const tabId = tabs[0].id;

    await chrome.scripting.executeScript({
        target: { tabId },
        func: (sel) => {
            const element = document.querySelector(sel);
            if (!element) throw new Error(`Element not found: ${sel}`);
            element.click();
            return { clicked: sel };
        },
        args: [selector],
    });

    return { success: true, selector, message: `Clicked ${selector}` };
}

// Executar FILL
async function executeFill(selector, value) {
    if (!selector || value === undefined) {
        throw new Error('Selector and value are required for FILL command');
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        throw new Error('No active tab found');
    }

    const tabId = tabs[0].id;

    await chrome.scripting.executeScript({
        target: { tabId },
        func: (sel, val) => {
            const element = document.querySelector(sel);
            if (!element) throw new Error(`Element not found: ${sel}`);
            element.value = val;
            const event = new Event('input', { bubbles: true });
            element.dispatchEvent(event);
            return { filled: sel, value: val };
        },
        args: [selector, value],
    });

    return { success: true, selector, value, message: `Filled ${selector}` };
}

// Executar SCROLL
async function executeScroll(y) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0) {
        throw new Error('No active tab found');
    }

    const tabId = tabs[0].id;

    await chrome.scripting.executeScript({
        target: { tabId },
        func: (scrollY) => {
            window.scrollBy({ top: scrollY, behavior: 'smooth' });
            return { scrolled: scrollY };
        },
        args: [y],
    });

    return { success: true, y, message: `Scrolled ${y}px` };
}

// Atualizar status do comando no banco
async function updateCommandStatus(commandId, status, result, error) {
    if (!state.accessToken) {
        Logger.warn('Cannot update command status - No access token');
        return;
    }

    try {
        const payload = {
            status,
            executed_at: status === 'executing' ? new Date().toISOString() : undefined,
            completed_at: (status === 'completed' || status === 'failed') ? new Date().toISOString() : undefined,
        };

        if (result) {
            payload.result = result;
        }

        if (error) {
            payload.error = error;
        }

        const response = await fetch(
            `${CONFIG.restUrl}/extension_commands?id=eq.${commandId}`,
            {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${state.accessToken}`,
                    'apikey': CONFIG.supabaseAnonKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation',
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            Logger.warn('Failed to update command status', {
                commandId,
                status: response.status,
            });
        } else {
            Logger.debug(`Updated command ${commandId} to status: ${status}`);
        }
    } catch (err) {
        Logger.error('Error updating command status', err);
    }
}

// Iniciar polling de comandos
function startCommandPolling() {
    if (commandPollingInterval) {
        clearInterval(commandPollingInterval);
    }

    Logger.info(`🔄 Starting command polling (every ${COMMAND_POLL_INTERVAL}ms)`);

    // Executar imediatamente
    pollAndExecuteCommands();

    // Depois continuar no intervalo
    commandPollingInterval = setInterval(pollAndExecuteCommands, COMMAND_POLL_INTERVAL);
}

function stopCommandPolling() {
    if (commandPollingInterval) {
        clearInterval(commandPollingInterval);
        commandPollingInterval = null;
        Logger.info('Command polling stopped');
    }
}

// Iniciar polling ao carregar o background script
Logger.info('🚀 Initializing command polling system...');
startCommandPolling();

// Helper: Wait for tab to complete loading
function waitForTabComplete(tabId, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            cleanup();
            reject(new Error(`Timeout waiting for tab ${tabId} to load`));
        }, timeoutMs);

        function onUpdated(tid, changeInfo, tab) {
            if (tid === tabId && changeInfo.status === 'complete') {
                cleanup();
                resolve(tab);
            }
        }

        function onRemoved(tid) {
            if (tid === tabId) {
                cleanup();
                reject(new Error(`Tab ${tabId} was closed during loading`));
            }
        }

        function cleanup() {
            clearTimeout(timer);
            chrome.tabs.onUpdated.removeListener(onUpdated);
            chrome.tabs.onRemoved.removeListener(onRemoved);
        }

        chrome.tabs.onUpdated.addListener(onUpdated);
        chrome.tabs.onRemoved.addListener(onRemoved);
    });
}

console.log('✅ Command Polling System initialized');

// ============================================
// ACTION ROUTER CLIENT — PONTE CANÔNICA
// ============================================
/**
 * Cliente do Action Router para Chrome Extension
 * 
 * REGRA INQUEBRÁVEL:
 * Toda ação de browser DEVE passar por callActionRouter()
 * 
 * Esta é a ÚNICA função autorizada a chamar:
 * - action-router Supabase Function
 * 
 * Nenhuma execução nativa é permitida sem passar aqui primeiro.
 */

const ACTION_ROUTER_CONFIG = {
    functionsUrl: "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1",
    timeout: 30000, // 30s
    maxRetries: 2,
};

/**
 * Chama o Action Router (Supabase Function)
 * 
 * @param {Object} action - Action payload
 * @param {string} action.action - Action type (BROWSER_NAVIGATE, BROWSER_TYPE, etc)
 * @param {Object} action.params - Action parameters
 * @param {Object} action.context - Context (userId, sessionId, etc)
 * @param {string} accessToken - Supabase access token
 * @returns {Promise<ActionResult>}
 */
async function callActionRouter(action, accessToken) {
    console.log(`🎯 [ACTION ROUTER CLIENT] Calling router for: ${action.action}`);

    if (!accessToken) {
        throw new Error("Access token required to call Action Router");
    }

    // Validação básica
    if (!action.action) {
        throw new Error("action.action is required");
    }

    if (!action.params) {
        throw new Error("action.params is required");
    }

    if (!action.context) {
        throw new Error("action.context is required");
    }

    const url = `${ACTION_ROUTER_CONFIG.functionsUrl}/action-router`;

    let lastError = null;
    let attempt = 0;

    while (attempt <= ACTION_ROUTER_CONFIG.maxRetries) {
        attempt++;

        try {
            console.log(`🔄 [ACTION ROUTER CLIENT] Attempt ${attempt}/${ACTION_ROUTER_CONFIG.maxRetries + 1}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                ACTION_ROUTER_CONFIG.timeout
            );

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                },
                body: JSON.stringify(action),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            console.log(`📥 [ACTION ROUTER CLIENT] Response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Action Router returned ${response.status}: ${errorText}`
                );
            }

            const result = await response.json();

            console.log(`✅ [ACTION ROUTER CLIENT] Success:`, {
                action: action.action,
                success: result.success,
                executionTime: result.executionTime,
            });

            // Validação do resultado
            if (!result.hasOwnProperty("success")) {
                throw new Error("Action Router response missing 'success' field");
            }

            return result;
        } catch (error) {
            lastError = error;

            if (error.name === "AbortError") {
                console.error(`⏱️ [ACTION ROUTER CLIENT] Timeout on attempt ${attempt}`);
            } else {
                console.error(`❌ [ACTION ROUTER CLIENT] Error on attempt ${attempt}:`, error);
            }

            // Retry apenas se não for o último attempt
            if (attempt <= ACTION_ROUTER_CONFIG.maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff
                console.log(`⏳ [ACTION ROUTER CLIENT] Retrying in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }

    // Se chegou aqui, todas as tentativas falharam
    console.error(`❌ [ACTION ROUTER CLIENT] All attempts failed for ${action.action}`);
    throw lastError || new Error("Action Router failed after all retries");
}

/**
 * Helper: Mapeia command type (da extensão) para action type (do Action Router)
 * 
 * Examples:
 * - "navigate" -> "BROWSER_NAVIGATE"
 * - "type" -> "BROWSER_TYPE"
 * - "click" -> "BROWSER_CLICK"
 */
function mapCommandToAction(commandType) {
    const mapping = {
        navigate: "BROWSER_NAVIGATE",
        type: "BROWSER_TYPE",
        fill_input: "BROWSER_TYPE",
        click: "BROWSER_CLICK",
        scroll: "BROWSER_SCROLL",
        insert_content: "BROWSER_INSERT",
        screenshot: "BROWSER_SCREENSHOT",
    };

    return mapping[commandType] || commandType.toUpperCase();
}

/**
 * Constrói ActionPayload a partir de um extension command
 * 
 * @param {Object} cmd - Extension command
 * @param {Object} context - Context (userId, sessionId, etc)
 * @returns {Object} ActionPayload
 */
function buildActionPayload(cmd, context) {
    const actionType = mapCommandToAction(cmd.type);

    // Extrair params do comando
    let params = {};

    switch (cmd.type) {
        case "navigate":
            params = {
                url: cmd.payload?.url || cmd.options?.url || cmd.value,
            };
            break;

        case "type":
        case "fill_input":
            params = {
                selector: cmd.payload?.selector || cmd.selector,
                text: cmd.payload?.text || cmd.payload?.value || cmd.value,
            };
            break;

        case "click":
            params = {
                selector: cmd.payload?.selector || cmd.selector,
            };
            break;

        case "scroll":
            params = {
                y: cmd.payload?.amount || 500,
                x: 0,
            };
            break;

        case "insert_content":
            params = {
                selector: cmd.payload?.selector || cmd.selector,
                value: cmd.payload?.value || cmd.value,
                format: cmd.payload?.format || "html",
            };
            break;

        case "screenshot":
            params = {};
            break;

        default:
            // Fallback: usar cmd.payload ou cmd.options
            params = cmd.payload || cmd.options || {};
    }

    return {
        action: actionType,
        params: params,
        context: {
            userId: context.userId,
            sessionId: context.sessionId,
            conversationId: context.conversationId,
            commandId: cmd.id, // Link back to extension command
        },
        metadata: {
            timeout: 30000,
            requiresVerification: true,
        },
    };
}

// Export for use in background.js
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        callActionRouter,
        mapCommandToAction,
        buildActionPayload,
    };
}

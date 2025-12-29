/**
 * =====================================================
 * ACTION ROUTER — NÚCLEO INQUEBRÁVEL DO SISTEMA
 * =====================================================
 * 
 * RESPONSABILIDADES EXCLUSIVAS:
 * - Validar actions do Planner
 * - Roteardash para executor correto (Browser/API/CLI)
 * - Garantir execução REAL (nunca simulada)
 * - Reportar resultado + logs
 * - Persistir tudo no Supabase
 * 
 * REGRA INQUEBRÁVEL:
 * Esta é a ÚNICA função autorizada a chamar:
 * - Playwright
 * - Selenium
 * - Puppeteer
 * - Qualquer automação de navegador
 * 
 * =====================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// =====================================================
// ACTION SCHEMA OBRIGATÓRIO
// =====================================================

type ActionType =
    | "BROWSER_NAVIGATE"
    | "BROWSER_CLICK"
    | "BROWSER_TYPE"
    | "BROWSER_SCROLL"
    | "BROWSER_SCREENSHOT"
    | "BROWSER_WAIT"
    | "CREATE_DOC"
    | "SEARCH_WEB"
    | "API_CALL";

interface ActionPayload {
    action: ActionType;
    params: Record<string, any>;
    context: {
        userId: string;
        sessionId: string;
        conversationId?: string;
        tabId?: string;
    };
    metadata?: {
        retryCount?: number;
        timeout?: number;
        requiresVerification?: boolean;
    };
}

interface ActionResult {
    success: boolean;
    action: ActionType;
    executedAt: string;
    executionTime: number;
    result?: any;
    error?: string;
    logs: string[];
    screenshot?: string;
    verification?: {
        method: "visual" | "dom" | "url";
        verified: boolean;
        evidence: string;
    };
}

// =====================================================
// ENV CONFIGS
// =====================================================

const HUGGINGFACE_PLAYWRIGHT_URL = "https://bigodetonton-syncads.hf.space";

// ✅ PLAYWRIGHT ÚNICO EXECUTOR (Extensão Chrome removida em 2025-12-29)

// =====================================================
// LOGGER
// =====================================================

class ActionLogger {
    private logs: string[] = [];
    private supabase: any;
    private sessionId: string;

    constructor(supabase: any, sessionId: string) {
        this.supabase = supabase;
        this.sessionId = sessionId;
    }

    log(level: "info" | "warn" | "error", message: string, data?: any) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        this.logs.push(logEntry);

        console.log(logEntry, data || "");

        // Persist to Supabase immediately
        this.persistLog(level, message, data).catch((err) =>
            console.error("Failed to persist log:", err)
        );
    }

    private async persistLog(level: string, message: string, data?: any) {
        await this.supabase.from("action_logs").insert({
            session_id: this.sessionId,
            level,
            message,
            data: data ? JSON.stringify(data) : null,
            created_at: new Date().toISOString(),
        });
    }

    getLogs(): string[] {
        return this.logs;
    }
}

// =====================================================
// VALIDATION
// =====================================================

function validateAction(payload: ActionPayload): { valid: boolean; error?: string } {
    if (!payload.action) {
        return { valid: false, error: "Missing action type" };
    }

    if (!payload.params) {
        return { valid: false, error: "Missing params" };
    }

    if (!payload.context || !payload.context.userId || !payload.context.sessionId) {
        return { valid: false, error: "Missing context (userId or sessionId)" };
    }

    // Action-specific validation
    switch (payload.action) {
        case "BROWSER_NAVIGATE":
            if (!payload.params.url) {
                return { valid: false, error: "BROWSER_NAVIGATE requires params.url" };
            }
            break;

        case "BROWSER_CLICK":
            if (!payload.params.selector) {
                return { valid: false, error: "BROWSER_CLICK requires params.selector" };
            }
            break;

        case "BROWSER_TYPE":
            if (!payload.params.selector || !payload.params.text) {
                return {
                    valid: false,
                    error: "BROWSER_TYPE requires params.selector and params.text",
                };
            }
            break;
    }

    return { valid: true };
}

// =====================================================
// BROWSER EXECUTOR (Playwright)
// =====================================================

class BrowserExecutor {
    private logger: ActionLogger;
    private supabase: any;

    constructor(logger: ActionLogger, supabase: any) {
        this.logger = logger;
        this.supabase = supabase;
    }

    async navigate(url: string, context: ActionPayload["context"]): Promise<ActionResult> {
        const startTime = Date.now();
        const logs: string[] = [];

        // ✅ AUTO-FIX URL (ROBUST)
        // 1. Remove whitespace
        let finalUrl = url ? url.trim() : "";

        // 2. Add protocol if missing
        if (finalUrl && !finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
            finalUrl = `https://${finalUrl}`;
            this.logger.log("warn", "URL corrigida (protocolo adicionado)", { original: url, final: finalUrl });
        } else {
            this.logger.log("info", "URL validada", { final: finalUrl });
        }

        try {
            this.logger.log("info", "🚀 BrowserExecutor.navigate sending to Playwright", { url: finalUrl });

            // 1. NAVIGATE REQUEST (To existing /automation endpoint)
            const navResponse = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "navigate",
                    url: finalUrl,
                    sessionId: context.sessionId // Sent for context
                }),
            });

            if (!navResponse.ok) {
                const errText = await navResponse.text();
                throw new Error(`Playwright Navigation error (${navResponse.status}): ${errText}`);
            }

            const navResult = await navResponse.json();
            this.logger.log("info", "✅ Navigation successful", navResult);

            return {
                success: navResult.success,
                action: "BROWSER_NAVIGATE",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                result: navResult,
                logs: this.logger.getLogs()
            };

        } catch (error: any) {
            this.logger.log("error", "Playwright navigate failed", error.message);
            return {
                success: false,
                action: "BROWSER_NAVIGATE",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                error: error.message,
                logs: this.logger.getLogs()
            };
        }
    }

    async type(selector: string, text: string, context: ActionPayload["context"]): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            this.logger.log("info", "BrowserExecutor.type called", { selector, text });

            const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "type",
                    selector,
                    text,
                    sessionId: context.sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Playwright type failed: ${response.statusText}`);
            }

            const result = await response.json();

            // ⭐ VERIFICATION: Read-after-write
            const verification = await this.verifyTyping(selector, text, context);

            return {
                success: verification.verified,
                action: "BROWSER_TYPE",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                result,
                logs: this.logger.getLogs(),
                verification,
            };
        } catch (error: any) {
            this.logger.log("error", "BrowserExecutor.type failed", error.message);

            return {
                success: false,
                action: "BROWSER_TYPE",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                error: error.message,
                logs: this.logger.getLogs(),
            };
        }
    }

    async click(selector: string, context: ActionPayload["context"]): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            this.logger.log("info", "BrowserExecutor.click called", { selector });

            const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "click",
                    selector,
                    sessionId: context.sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error(`Playwright click failed: ${response.statusText}`);
            }

            const result = await response.json();

            // Capture screenshot after click
            const screenshot = await this.captureScreenshot(context);

            return {
                success: true,
                action: "BROWSER_CLICK",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                result,
                logs: this.logger.getLogs(),
                screenshot,
            };
        } catch (error: any) {
            this.logger.log("error", "BrowserExecutor.click failed", error.message);

            return {
                success: false,
                action: "BROWSER_CLICK",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                error: error.message,
                logs: this.logger.getLogs(),
            };
        }
    }

    async captureScreenshot(context: ActionPayload["context"]): Promise<string | undefined> {
        try {
            const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "screenshot",
                    sessionId: context.sessionId
                }),
            });

            if (!response.ok) {
                this.logger.log("warn", "Screenshot failed", response.statusText);
                return undefined;
            }

            const result = await response.json();
            return result.screenshot; // Base64 encoded
        } catch (error: any) {
            this.logger.log("warn", "Screenshot error", error.message);
            return undefined;
        }
    }

    async verifyTyping(
        selector: string,
        expectedText: string,
        context: ActionPayload["context"]
    ): Promise<{ method: string; verified: boolean; evidence: string }> {
        try {
            // Read back the value
            const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/get_value`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    selector,
                    sessionId: context.sessionId,
                }),
            });

            if (!response.ok) {
                return {
                    method: "dom",
                    verified: false,
                    evidence: "Could not read value back",
                };
            }

            const result = await response.json();
            const actualValue = result.value || "";

            const verified = actualValue === expectedText;

            return {
                method: "dom",
                verified,
                evidence: verified
                    ? `Value confirmed: "${actualValue}"`
                    : `Expected "${expectedText}", got "${actualValue}"`,
            };
        } catch (error: any) {
            return {
                method: "dom",
                verified: false,
                evidence: `Verification failed: ${error.message}`,
            };
        }
    }
}

// =====================================================
// ❌ EXTENSION EXECUTOR — REMOVIDO (2025-12-29)
// Motivo: Playwright é o único executor
// Código morto removido: ~95 linhas
// =====================================================

// =====================================================
// CALL EXTENSION ROUTER — FUNÇÃO OBRIGATÓRIA
// =====================================================

async function callExtensionRouter(
    action: ActionPayload,
    supabase: any
): Promise<ActionResult> {
    // Create logger
    const logger = new ActionLogger(supabase, action.context.sessionId);

    logger.log("info", "action_received", action);

    // Validate
    const validation = validateAction(action);
    if (!validation.valid) {
        logger.log("error", "validation_failed", validation.error);

        return {
            success: false,
            action: action.action,
            executedAt: new Date().toISOString(),
            executionTime: 0,
            error: `Validation failed: ${validation.error}`,
            logs: logger.getLogs(),
        };
    }

    logger.log("info", "routing_to_playwright_executor", { action: action.action });

    // ✅ SEMPRE usa Playwright (único executor)
    if (action.action.startsWith("BROWSER_")) {
        const executor = new BrowserExecutor(logger, supabase);

        switch (action.action) {
            case "BROWSER_NAVIGATE":
                return await executor.navigate(action.params.url, action.context);

            case "BROWSER_TYPE":
                return await executor.type(
                    action.params.selector,
                    action.params.text,
                    action.context
                );

            case "BROWSER_CLICK":
                return await executor.click(action.params.selector, action.context);

            default:
                throw new Error(`Unsupported action: ${action.action}`);
        }
    } else {
        throw new Error(`Unsupported action type: ${action.action}`);
    }
}

// =====================================================
// HTTP HANDLER
// =====================================================

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const actionPayload: ActionPayload = await req.json();

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // ⭐ CALL THE OBLIGATORY ROUTER
        const result = await callExtensionRouter(actionPayload, supabaseClient);

        // Persist result WITH EVIDENCE
        await supabaseClient.from("action_results").insert({
            session_id: actionPayload.context.sessionId,
            user_id: actionPayload.context.userId,
            action: actionPayload.action,
            executor_type: "playwright", // ✅ EVIDÊNCIA: executor usado
            success: result.success,
            result: result.result ? JSON.stringify(result.result) : null,
            playwright_url: result.result?.playwrightUrl || result.result?.url, // ✅ EVIDÊNCIA: URL executada
            playwright_title: result.result?.playwrightTitle || result.result?.title, // ✅ EVIDÊNCIA: Título da página
            error: result.error,
            execution_time: result.executionTime,
            logs: result.logs,
            created_at: result.executedAt,
        });

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("❌ Action Router Error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || "Internal error",
                logs: [error.stack || ""],
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});

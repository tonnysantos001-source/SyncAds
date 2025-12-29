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

const HUGGINGFACE_PLAYWRIGHT_URL =
    Deno.env.get("HUGGINGFACE_PLAYWRIGHT_URL") ||
    "https://bigodetonton-syncads.hf.space";

const CHROME_EXTENSION_ENABLED = false; // Toggle para usar extensão vs Playwright (Force Playwright)

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

        // ✅ AUTO-FIX URL
        let finalUrl = url;
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            finalUrl = `https://${url}`;
            this.logger.log("warn", "URL sem protocolo detectada. Corrigindo para:", finalUrl);
        }

        try {
            this.logger.log("info", "BrowserExecutor.navigate called", { url: finalUrl });

            // Call Playwright service
            const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "navigate",
                    url: finalUrl,
                    sessionId: context.sessionId
                }),
            });

            if (!response.ok) {
                throw new Error(`Playwright service error: ${response.statusText}`);
            }

            const result = await response.json();

            this.logger.log("info", "Playwright navigate successful", result);

            // ⭐ CRITICAL: Wait for page load verification
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // ⭐ Capture screenshot for verification
            const screenshot = await this.captureScreenshot(context);

            return {
                success: true,
                action: "BROWSER_NAVIGATE",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                result: {
                    url: result.url || url,
                    title: result.title || "",
                    status: result.status || "unknown",
                },
                logs: this.logger.getLogs(),
                screenshot,
            };
        } catch (error: any) {
            this.logger.log("error", "BrowserExecutor.navigate failed", error.message);

            return {
                success: false,
                action: "BROWSER_NAVIGATE",
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                error: error.message,
                logs: this.logger.getLogs(),
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
            const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/screenshot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: context.sessionId }),
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
// EXTENSION EXECUTOR (Chrome Extension)
// =====================================================

class ExtensionExecutor {
    private logger: ActionLogger;
    private supabase: any;

    constructor(logger: ActionLogger, supabase: any) {
        this.logger = logger;
        this.supabase = supabase;
    }

    async execute(action: ActionPayload): Promise<ActionResult> {
        const startTime = Date.now();

        try {
            this.logger.log("info", "ExtensionExecutor called", { action: action.action });

            // Create command in extension_commands table
            const { data: command, error: insertError } = await this.supabase
                .from("extension_commands")
                .insert({
                    user_id: action.context.userId,
                    session_id: action.context.sessionId,
                    action: action.action,
                    params: action.params,
                    status: "pending",
                    created_at: new Date().toISOString(),
                })
                .select()
                .single();

            if (insertError || !command) {
                throw new Error(`Failed to create command: ${insertError?.message}`);
            }

            this.logger.log("info", "Command created in DB", { commandId: command.id });

            // Poll for completion
            const result = await this.pollForCompletion(command.id, action.metadata?.timeout || 30000);

            return {
                success: result.success,
                action: action.action,
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                result: result.result,
                error: result.error,
                logs: this.logger.getLogs(),
            };
        } catch (error: any) {
            this.logger.log("error", "ExtensionExecutor failed", error.message);

            return {
                success: false,
                action: action.action,
                executedAt: new Date().toISOString(),
                executionTime: Date.now() - startTime,
                error: error.message,
                logs: this.logger.getLogs(),
            };
        }
    }

    private async pollForCompletion(
        commandId: string,
        timeout: number
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        const startTime = Date.now();
        const pollInterval = 500;

        while (Date.now() - startTime < timeout) {
            const { data: command } = await this.supabase
                .from("extension_commands")
                .select("status, result, error")
                .eq("id", commandId)
                .single();

            if (command?.status === "completed") {
                this.logger.log("info", "Command completed", { commandId });
                return { success: true, result: command.result };
            }

            if (command?.status === "failed") {
                this.logger.log("error", "Command failed", { commandId, error: command.error });
                return { success: false, error: command.error };
            }

            await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }

        this.logger.log("error", "Command timeout", { commandId });
        return { success: false, error: "Timeout: Extension did not respond" };
    }
}

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

    logger.log("info", "router_dispatch", { action: action.action });

    // Route to appropriate executor
    if (action.action.startsWith("BROWSER_")) {
        if (CHROME_EXTENSION_ENABLED && action.context.tabId) {
            // Use Chrome Extension
            const executor = new ExtensionExecutor(logger, supabase);
            return await executor.execute(action);
        } else {
            // Use Playwright
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

        // Persist result
        await supabaseClient.from("action_results").insert({
            session_id: actionPayload.context.sessionId,
            user_id: actionPayload.context.userId,
            action: actionPayload.action,
            success: result.success,
            result: result.result ? JSON.stringify(result.result) : null,
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

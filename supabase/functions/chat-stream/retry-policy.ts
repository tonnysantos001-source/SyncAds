import { ExecutionResult } from "./types.ts";

export class RetryPolicy {
    private static MAX_RETRIES = 2; // Reduced to 2 as requested

    public static shouldRetry(result: ExecutionResult, attemptCount: number): boolean {
        // Validation Checks
        if (result.success) return false;
        if (attemptCount >= this.MAX_RETRIES) return false;

        // Strict Signal Analysis for Non-Retryable Conditions
        const signals = result.dom_signals || [];

        // 1. NEVER RETRY UNEXPECTED NAVIGATION
        if (signals.some(s => s.signal === "UNEXPECTED_NAVIGATION")) return false;

        // 2. NEVER RETRY IF URL INVALID
        if (result.url_after && result.url_after.endsWith("/u/0")) return false;

        // 3. ALLOW RETRY CONDITIONS
        if (result.retryable) return true; // Explicitly marked by Executor
        if (signals.some(s => s.signal === "TIMEOUT")) return true;
        if (signals.some(s => s.signal === "DOM_STALE")) return true;

        // Default to false if no specific retry condition met
        return false;
    }

    public static getNewStrategy(result: ExecutionResult, originalCommandType: string): string {
        const signals = result.dom_signals || [];

        // 1. EDITOR NOT READY
        if (signals.some(s => s.signal === "EDITOR_READY" && s.editorReady === false) || result.reason === "Editor não pronto") {
            return "O editor não estava pronto. Tente aumentar o tempo de espera (wait) antes de interagir ou verifique se há popups bloqueando.";
        }

        // 2. TIMEOUT
        if (signals.some(s => s.signal === "TIMEOUT")) {
            return "Ocorreu timeout. A página está lenta. Aumente drasticamente os tempos de espera.";
        }

        // 3. Falha em DOM_TYPE -> Sugerir INSERT_CONTENT
        if (originalCommandType === "type" || originalCommandType === "fill_input") {
            return "A digitação falhou. Tente usar 'insert_content' para colar o texto diretamente.";
        }

        // 4. Falha em CLICK -> Sugerir WAIT mais longo ou Seletor alternativo
        if (originalCommandType === "click") {
            return "O clique falhou. Tente aumentar o wait ou usar um seletor mais genérico (ex: buscar por texto com scan_page).";
        }

        return "Tente uma estratégia alternativa baseada no erro reportado.";
    }
}

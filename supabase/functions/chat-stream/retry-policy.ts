import { ExecutionResult } from "./types.ts";

export class RetryPolicy {
    private static MAX_RETRIES = 3;

    public static shouldRetry(result: ExecutionResult, attemptCount: number): boolean {
        if (result.success) return false;
        if (attemptCount >= this.MAX_RETRIES) return false;
        return result.retryable;
    }

    public static getNewStrategy(result: ExecutionResult, originalCommandType: string): string {
        // 1. Falha em DOM_TYPE -> Sugerir INSERT_CONTENT
        if (originalCommandType === "type" || originalCommandType === "fill_input") {
            if (result.dom_signals?.error_message?.includes("timeout") || !result.dom_signals?.editor_detected) {
                return "A digitação falhou. Tente usar 'insert_content' para colar o texto diretamente.";
            }
        }

        // 2. Falha em CLICK -> Sugerir WAIT mais longo ou Seletor alternativo
        if (originalCommandType === "click") {
            return "O clique falhou. Tente aumentar o wait ou usar um seletor mais genérico (ex: buscar por texto com scan_page).";
        }

        // 3. Falha em INSERT_CONTENT -> Sugerir Clipboard API explícita
        if (originalCommandType === "insert_content") {
            return "A injeção de conteúdo falhou. Verifique se o editor está focado antes de inserir.";
        }

        return "Tente uma estratégia alternativa baseada no erro reportado.";
    }
}


import { ExecutionResult, ReasonerOutput, VerifierOutput } from "./types.ts";
import { RetryPolicy } from "./retry-policy.ts";

export const VERIFIER_PROMPT = `
# SYSTEM PROMPT: THE VERIFIER (Quality Assurance Agent)

Você é o Verificador Técnico do SyncAds.
Sua ÚNICA missão é validar se a execução do Planner/Executor teve sucesso REAL.

## 🎯 SEUS INPUTS
Você recebe o \`ExecutionResult\` do comando executado.

## 🧠 LÓGICA DE DECISÃO

### 1. SUCESSO DEVE SER PROVADO
Para marcar como SUCCESS, você precisa de evidência:
- Navegação: URL mudou para o esperado?
- Criação Docs: \`title_after\` é válido? \`content_length\` > 0?
- Digitação: \`elements_detected\` é true?

### 2. RETRY vs PARTIAL_SUCCESS vs FAILURE
- **RETRY**: Erro técnico transiente (timeout, selector not found, focus lost) E \`retryable\` é true.
- **PARTIAL_SUCCESS**: O comando principal funcionou (ex: criou o doc), mas talvez parte do texto falhou. O link é utilizável.
- **FAILURE**: Erro fatal ou esgotou tentativas.

## 📋 FORMATO DE SAÍDA (JSON PURO)

\`\`\`json
{
  "status": "SUCCESS" | "RETRY" | "PARTIAL_SUCCESS" | "FAILURE",
  "reason": "Explicação técnica curta.",
  "final_message_to_user": "Mensagem amigável com o LINK se sucesso (ex: 'Criei seu documento: [Titulo](url)').",
  "new_strategy_hint": "Dica para o Planner se RETRY (ex: 'Use insert_content em vez de type')."
}
\`\`\`
`;

export class ReasonerVerifier {
    public static async verify(
        groqKey: string,
        originalIntent: ReasonerOutput,
        result: ExecutionResult,
        attemptCount: number,
        callGroqJSON: (key: string, msgs: any[]) => Promise<any>
    ): Promise<VerifierOutput> {

        // 1. Hard Rules Logic (Code-based verification first)
        const domReport = result.dom_signals;
        const signals = domReport?.signals || [];
        const rawUrl = domReport?.final_url || result.url_after || "";
        const finalUrl = rawUrl.replace(/\/$/, "");

        // A. URL Validation
        if (finalUrl.endsWith("/u/0")) {
            return {
                status: "BLOCKED",
                reason: "URL inválida retornada (/u/0). O documento não foi criado ou salvo corretamente.",
                final_message_to_user: "Falha na criação do documento: URL inválida detectada."
            };
        }

        // B. Intent Validation vs Signals
        const intent = originalIntent.intent;

        if (intent === "create_document") {
            // ⚠️ SKIP DOM SIGNAL VALIDATION for insert_via_api (uses Google Docs API directly)
            if (result.command_type === "insert_via_api") {
                // API-based insertion - check success from API result
                if (result.success) {
                    // Extract document URL from multiple possible locations
                    const docUrl = result.doc_url ||
                        result.url_after ||
                        result.result?.doc_url ||
                        result.result?.url ||
                        "";

                    // Extract title if available
                    const docTitle = result.title_after ||
                        result.result?.title ||
                        "Documento sem nome";

                    return {
                        status: "SUCCESS",
                        reason: "Content inserted successfully via Google Docs API",
                        final_message_to_user: docUrl
                            ? `✅ **${docTitle}** criado com sucesso!\n\n🔗 [Abrir documento](${docUrl})`
                            : "✅ Conteúdo inserido via API do Google Docs!",
                        verification_score: 100
                    };
                }
                // If API failed, return failure
                return {
                    status: "FAILURE",
                    reason: result.result?.error || result.error || "API insertion failed",
                    final_message_to_user: `❌ Falha ao inserir conteúdo via API: ${result.result?.error || result.error || "Erro desconhecido"}`
                };
            }

            // Legacy DOM-based document creation (insert_content command)
            // Rule: Missing DOCUMENT_CREATED -> FAILURE
            if (!signals.some(s => s.type === "DOCUMENT_CREATED")) {
                return {
                    status: "FAILURE",
                    reason: "Document not confirmed (Missing DOCUMENT_CREATED signal)",
                    final_message_to_user: "Falha: O documento não foi confirmado como criado."
                };
            }
            // Rule: Missing EDITOR_READY -> RETRY
            if (!signals.some(s => s.type === "EDITOR_READY")) {
                return {
                    status: "RETRY",
                    reason: "Editor not ready",
                    new_strategy_hint: "Aguardar mais tempo ou verificar seletores do editor.",
                    final_message_to_user: "Ainda processando o editor do documento..."
                };
            }

            // Rule: Missing CONTENT_INSERTED -> FAILURE (if explicitly inserting content)
            if (result.command_type === "insert_content" && !signals.some(s => s.type === "CONTENT_INSERTED")) {
                return {
                    status: "FAILURE",
                    reason: "Content not inserted (Missing CONTENT_INSERTED signal)",
                    final_message_to_user: "Falha: O conteúdo não foi inserido no documento."
                };
            }
        }

        if (!result.success && !result.retryable) {
            return {
                status: "FAILURE",
                reason: `Erro fatal reportado pelo executor: ${result.reason || "Erro desconhecido"}`,
                final_message_to_user: `❌ Falha ao executar ação. Motivo: ${result.reason || "Erro desconhecido"}`
            };
        }

        // 2. AI Verification
        const messages = [
            { role: "system", content: VERIFIER_PROMPT },
            {
                role: "user", content: `
INTENÇÃO ORIGINAL: ${JSON.stringify(originalIntent)}

RESULTADO DA EXECUÇÃO:
${JSON.stringify(result, null, 2)}

TENTATIVAS: ${attemptCount}

Decida o status.
` }
        ];

        try {
            const verification: VerifierOutput = await callGroqJSON(groqKey, messages);

            // Enrich Retry Strategy from Policy
            if (verification.status === "RETRY") {
                const policyHint = RetryPolicy.getNewStrategy(result, result.command_type);
                verification.new_strategy_hint = `${verification.new_strategy_hint || ""} [AUTO-POLICY: ${policyHint}]`;
            }

            return verification;

        } catch (e) {
            console.error("Verifier Error:", e);
            // Fallback safe
            return {
                status: "FAILURE",
                reason: "Erro interno no Verifier AI.",
                final_message_to_user: "Erro interno de validação."
            };
        }
    }
}

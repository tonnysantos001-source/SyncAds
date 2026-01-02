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
- Digitação: \`dom_signals.editor_detected\` é true?

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
        if (!result.success && !result.retryable) {
            return {
                status: "FAILURE",
                reason: `Erro fatal reportado pelo executor: ${result.errors?.join(", ")}`,
                final_message_to_user: `❌ Falha ao executar ação. Motivo: ${result.errors?.[0] || "Erro desconhecido"}`
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

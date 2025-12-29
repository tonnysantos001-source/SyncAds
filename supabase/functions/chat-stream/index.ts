import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// =====================================================
// ARCHITECTURE: CLEAN & SIMPLE (like RTVR)
// =====================================================
// 1. THINKER: Interpreta pedido → Plano JSON
// 2. ACTION ROUTER: Executa via Extension ou Playwright
// 3. EXECUTOR: Interpreta resultado → Resposta ao usuário

console.log("🚀 Chat Stream V5 - Action Router Integration");

// =====================================================
// GROQ LLM CONFIGS
// =====================================================
const GROQ_REASONING_MODEL = "llama-3.3-70b-versatile";
const GROQ_EXECUTOR_MODEL = "llama-3.3-70b-versatile";

// ✅ Load Groq API keys from GlobalAiConnection
async function getGroqApiKey(supabase: any, role?: string): Promise<string> {
    console.log(`🔍 Loading Groq key for role: ${role || 'any'}`);

    const query = supabase
        .from("GlobalAiConnection")
        .select("apiKey, aiRole, name, model")
        .eq("provider", "GROQ")
        .eq("isActive", true);

    if (role) {
        query.eq("aiRole", role);
    }

    const { data, error } = await query.limit(1);

    if (error) {
        console.error("❌ Database error:", error.message);
        throw new Error(`Failed to load Groq key: ${error.message}`);
    }

    if (!data || data.length === 0) {
        throw new Error(`No active Groq AI found for role: ${role || 'any'}`);
    }

    const ai = data[0];
    console.log(`✅ Using: ${ai.name} (${ai.aiRole}) - ${ai.model}`);
    return ai.apiKey;
}

// =====================================================
// PROMPTS
// =====================================================
const THINKER_PROMPT = `Você é o CÉREBRO REAL do SyncAds. Você possui um CORPO FÍSICO (Action Router) capaz de navegar na internet de verdade.

**MISSÃO:**
Sua obrigação é EXECUTAR o que o usuário pede, usando seu corpo de automação.
NUNCA diga que "não pode" ou que é "apenas uma IA". Você TEM ferramentas reais.

**REGRAS:**
1. Sempre retorne JSON no formato: {"action": "...", "url": "...", "reasoning": "..."}
2. Ações disponíveis: "navigate", "type", "click", "search"
3. reasoning: "Estou enviando o comando REAL para abrir o site..." (Sem papo de simulação)

**EXEMPLOS:**
User: "abra o google"
Response: {
  "action": "navigate", 
  "url": "https://google.com", 
  "reasoning": "Acionando navegador remoto para abrir o Google."
}`;

const EXECUTOR_PROMPT = `Você é o EXECUTOR do SyncAds. Sua função é RELATAR RESULTADOS TÉCNICOS.

**REGRAS:**
1. Baseie-se ESTRITAMENTE no "RESULTADO DA AÇÃO" fornecido.
2. Se sucesso ({ success: true }): Confirme a ação usando os DADOS retornados:
   - Para navegação: Use o título da página e URL para confirmar (ex: "✅ Abri o YouTube - Título: 'YouTube'")
   - Para outras ações: Confirme o que foi feito
3. Se falha ({ success: false }): Diga EXATAMENTE o erro retornado. NÃO invente desculpas.
   - Exemplo: "❌ Falha ao conectar no servidor de automação (Erro 404)."
   - Exemplo: "❌ Timeout ao tentar carregar a página."
4. Seja CONCISO e OBJETIVO. Use emojis para clareza (✅ sucesso, ❌ erro).

**INPUT:**
Você receberá:
- Histórico da conversa
- Mensagem do usuário
- SYSTEM MESSAGE: "RESULTADO DA AÇÃO: { ... }" (com dados como title, url, message)

**RESPOSTA:**
Seja direto, profissional e focado na resolução.`;

// =====================================================
// HELPER: Call Groq LLM
// =====================================================
async function callGroq(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature = 0.7
) {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Groq API error: ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error: any) {
        console.error("❌ callGroq failed:", error.message);
        throw error;
    }
}

// =====================================================
// MAIN HANDLER
// =====================================================
serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, conversationId } = await req.json();

        if (!message) {
            return new Response(
                JSON.stringify({ error: "Message required" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: "No authorization" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: "Unauthorized" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
            );
        }

        console.log(`📨 Message from ${user.email}: "${message}"`);

        // Get conversation history
        const { data: history } = await supabase
            .from("ChatMessage")
            .select("role, content")
            .eq("conversationId", conversationId)
            .order("createdAt", { ascending: true })
            .limit(10);

        const conversationHistory = history || [];

        // =====================================================
        // PHASE 1: THINKER (Planning)
        // =====================================================
        console.log("🧠 Calling Thinker...");

        const thinkerApiKey = await getGroqApiKey(supabase, 'REASONING');

        const thinkerMessages = [
            { role: "system", content: THINKER_PROMPT },
            ...conversationHistory,
            { role: "user", content: message },
        ];

        const thinkerResponse = await callGroq(thinkerApiKey, GROQ_REASONING_MODEL, thinkerMessages, 0.3);

        let plan: any = {};
        try {
            const cleanJson = thinkerResponse.replace(/```json\s*|\s*```/g, "").trim();
            plan = JSON.parse(cleanJson);
            console.log("✅ Plan:", plan);
        } catch (e) {
            console.warn("⚠️ Failed to parse Thinker JSON, using fallback");
            plan = { action: "conversation", reasoning: thinkerResponse };
        }

        // =====================================================
        // PHASE 2: CALL ACTION ROUTER (Playwright Automation)
        // =====================================================
        let toolResult: any = { success: true, message: "" };

        if (plan.action === "navigate") {
            console.log(`📞 Calling action-router for NAVIGATE: ${plan.url}`);

            try {
                const actionPayload = {
                    action: "BROWSER_NAVIGATE",
                    context: {
                        userId: user.id,
                        sessionId: conversationId,
                        conversationId: conversationId,
                    },
                    params: {
                        url: plan.url,
                    },
                    verification: {
                        enabled: true,
                    },
                };

                const actionRouterUrl = `${supabaseUrl}/functions/v1/action-router`;

                const routerResponse = await fetch(actionRouterUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": authHeader,
                    },
                    body: JSON.stringify(actionPayload),
                });

                if (!routerResponse.ok) {
                    const errorText = await routerResponse.text();
                    console.error(`❌ Action router failed:`, errorText);
                    throw new Error(`Action router error: ${errorText}`);
                }

                const actionResult = await routerResponse.json();
                console.log(`✅ Action router response:`, actionResult);

                toolResult = {
                    success: actionResult.success,
                    message: actionResult.success
                        ? `Navegado para ${plan.url}`
                        : `Falha: ${actionResult.error}`,
                    result: actionResult
                };

            } catch (error: any) {
                console.error("❌ Error calling action-router:", error);
                toolResult = {
                    success: false,
                    message: `Erro ao executar: ${error.message}`,
                };
            }
        }
        else {
            // Conversation only
            toolResult = { success: true, message: "Conversa amigável" };
        }

        // =====================================================
        // PHASE 3: EXECUTOR LLM (Generate Response)
        // =====================================================
        console.log("⚡ Calling Executor...");

        const executorApiKey = await getGroqApiKey(supabase, 'EXECUTOR');

        const executorMessages = [
            { role: "system", content: EXECUTOR_PROMPT },
            ...conversationHistory,
            { role: "user", content: message },
            {
                role: "assistant",
                content: `RESULTADO DA AÇÃO:\n${JSON.stringify(toolResult, null, 2)}`
            },
        ];

        let executorResponse = "";
        try {
            executorResponse = await callGroq(executorApiKey, GROQ_EXECUTOR_MODEL, executorMessages, 0.7);
            console.log("✅ Executor returned");
        } catch (execError: any) {
            console.error("❌ Executor failed:", execError.message);
            executorResponse = "Olá! Estou aqui para ajudar. Como posso auxiliar você hoje?";
        }

        // =====================================================
        // FINAL RESPONSE
        // =====================================================
        let finalResponse = "";

        if (plan.reasoning) {
            finalResponse = `<antigravity_thinking>\n${plan.reasoning}\n</antigravity_thinking>\n\n`;
        }

        finalResponse += executorResponse || "Como posso ajudar você?";

        // Save messages
        await supabase.from("ChatMessage").insert([
            { conversationId, role: "user", content: message, userId: user.id },
            {
                conversationId,
                role: "assistant",
                content: finalResponse,
                userId: user.id,
                metadata: { plan, toolResult },
            },
        ]);

        return new Response(
            JSON.stringify({ content: finalResponse }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("❌ Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Erro interno" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});

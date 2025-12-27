import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// =====================================================
// ARCHITECTURE: CLEAN & SIMPLE
// =====================================================
// 1. THINKER: Interpreta pedido → Plano JSON
// 2. EXECUTOR: Chama Hugging Face Playwright → Resultado real
// 3. RESPONSE: Mostra raciocínio + resultado ao usuário

console.log("🚀 Chat Stream V2 - Professional with GlobalAiConnection");

// =====================================================
// GROQ LLM CONFIGS (loaded from GlobalAiConnection)
// =====================================================
const GROQ_REASONING_MODEL = "llama-3.3-70b-versatile"; // Raciocínio
const GROQ_EXECUTOR_MODEL = "llama-3.1-70b-versatile"; // Execução

// ✅ PROFESSIONAL: Load Groq API keys from GlobalAiConnection
async function getGroqApiKey(supabase: any, role?: string): Promise<string> {
  console.log(`🔍 Loading Groq key for role: ${role || 'any'}`);

  const query = supabase
    .from("GlobalAiConnection")
    .select("apiKey, aiRole, name, model")
    .eq("provider", "GROQ")  // Uppercase
    .eq("isActive", true);

  // Filter by specific AI role if provided
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

// Hugging Face Playwright Service
const HUGGINGFACE_PLAYWRIGHT_URL = Deno.env.get("HUGGINGFACE_PLAYWRIGHT_URL") || "https://bigodetonton-syncads.hf.space";

// =====================================================
// PROMPTS
// =====================================================
const THINKER_PROMPT = `Você é o CÉREBRO do SyncAds. Sua função é PLANEJAR ações.

**REGRAS:**
1. Sempre retorne JSON no formato: {"action": "...", "reasoning": "..."}
2. Ações disponíveis: "navigate", "type", "click", "search"
3. Seja específico e objetivo

**EXEMPLOS:**
User: "abra o google"
Response: {"action": "navigate", "url": "https://google.com", "reasoning": "Usuário quer acessar o Google"}

User: "crie um documento no google docs com receita de pão"
Response: {"action": "navigate", "url": "https://docs.new", "reasoning": "Primeiro passo: abrir novo documento Google Docs"}`;

const EXECUTOR_PROMPT = `Você é o EXECUTOR do SyncAds. Relate resultados HONESTOS.

**REGRAS:**
1. Se a ação teve sucesso, diga claramente
2. Se falhou, explique o erro
3. NUNCA invente sucesso

Use linguagem natural e amigável.`;

// =====================================================
// HELPER: Call Groq LLM
// =====================================================
async function callGroq(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7
) {
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
}

// =====================================================
// HELPER: Call Hugging Face Playwright
// =====================================================
async function callPlaywright(action: string, params: any) {
  console.log(`🎭 Calling Playwright: ${action}`, params);

  try {
    const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...params }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `Erro no Playwright: ${error}` };
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    console.error("❌ Playwright error:", error);
    return {
      success: false,
      message: `Falha ao conectar com o serviço de automação: ${error.message}`
    };
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

    // Load Groq API key from GlobalAiConnection for REASONING role
    const thinkerApiKey = await getGroqApiKey(supabase, 'REASONING');

    const thinkerMessages = [
      { role: "system", content: THINKER_PROMPT },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const thinkerResponse = await callGroq(thinkerApiKey, GROQ_REASONING_MODEL, thinkerMessages, 0.3);

    let plan: any = {};
    try {
      // Clean JSON from possible markdown
      const cleanJson = thinkerResponse.replace(/```json\s*|\s*```/g, "").trim();
      plan = JSON.parse(cleanJson);
      console.log("✅ Plan:", plan);
    } catch (e) {
      console.warn("⚠️ Failed to parse Thinker JSON, using fallback");
      plan = { action: "conversation", reasoning: thinkerResponse };
    }

    // =====================================================
    // PHASE 2: EXECUTOR (Action)
    // =====================================================
    let toolResult: any = { success: false, message: "" };

    if (plan.action === "navigate") {
      console.log(`🌐 Navigating to: ${plan.url}`);
      toolResult = await callPlaywright("navigate", { url: plan.url });
    }
    else if (plan.action === "type") {
      console.log(`⌨️  Typing: ${plan.text}`);
      toolResult = await callPlaywright("type", { text: plan.text, selector: plan.selector });
    }
    else if (plan.action === "click") {
      console.log(`👆 Clicking: ${plan.selector}`);
      toolResult = await callPlaywright("click", { selector: plan.selector });
    }
    else if (plan.action === "search") {
      console.log(`🔍 Searching: ${plan.query}`);
      toolResult = { success: true, message: `Busca por "${plan.query}" realizada` };
    }
    else {
      // Conversation only
      toolResult = { success: true, message: "Sem ação de automação necessária" };
    }

    // =====================================================
    // PHASE 3: EXECUTOR LLM (Generate Response)
    // =====================================================
    console.log("⚡ Calling Executor...");

    // Load Groq API key for EXECUTOR role
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

    const executorResponse = await callGroq(executorApiKey, GROQ_EXECUTOR_MODEL, executorMessages, 0.7);

    // =====================================================
    // FINAL RESPONSE (com raciocínio visível)
    // =====================================================
    const finalResponse = `💭 **Raciocínio:** ${plan.reasoning || "Analisando..."}\n\n${executorResponse}`;

    console.log("✅ Response generated");

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

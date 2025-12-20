import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkRateLimit,
  createRateLimitResponse,
} from "../_utils/rate-limiter.ts";
import {
  corsHeaders,
  handlePreflightRequest,
  errorResponse,
} from "../_utils/cors.ts";

// ===================================
// TOOLS (Browser Automation, etc)
// ===================================

async function userBrowserAutomation(
  ctx: { supabase: any; userId: string },
  action: string,
  url?: string
): Promise<string> {
  const { data: devices } = await ctx.supabase
    .from("extension_devices")
    .select("device_id")
    .eq("user_id", ctx.userId)
    .eq("status", "online")
    .limit(1)
    .maybeSingle();

  if (!devices) return "⚠️ Sua extensão não está online.";

  const { error } = await ctx.supabase
    .from("extension_commands")
    .insert({
      device_id: devices.device_id,
      command: "BROWSER_ACTION",
      params: { action, url },
      status: "pending",
    });

  return error ? `❌ Erro: ${error.message}` : "✅ Comando enviado para extensão.";
}

async function cloudBrowserAutomation(
  action: string,
  sessionId: string,
  url?: string
): Promise<string> {
  const pythonUrl = Deno.env.get("PYTHON_SERVICE_URL");
  if (!pythonUrl) return "❌ PYTHON_SERVICE_URL não configurada.";

  try {
    const res = await fetch(`${pythonUrl}/browser-automation/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, session_id: sessionId, url, use_ai: true }),
    });

    if (!res.ok) return `❌ Erro Cloud: ${await res.text()}`;

    const data = await res.json();
    return data.success ? `✅ Cloud: ${JSON.stringify(data.result)}` : `❌ Falha: ${data.error}`;
  } catch (e: any) {
    return `❌ Erro Conexão: ${e.message}`;
  }
}

async function webSearch(query: string): Promise<string> {
  return `Busca simulada: ${query}`;
}

// ===================================
// LLM CALLER
// ===================================

async function callLLM(
  provider: string,
  apiKey: string,
  model: string,
  messages: any[],
  temp: number = 0.7
): Promise<string> {
  let url = "";
  let headers: any = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  if (provider === "GROQ") url = "https://api.groq.com/openai/v1/chat/completions";
  else if (provider === "OPENROUTER") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers["HTTP-Referer"] = "https://syncads.com";
  } else if (provider === "OPENAI") url = "https://api.openai.com/v1/chat/completions";
  else return "Provider not supported";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages, temperature: temp, stream: false }),
    });

    if (!res.ok) return `Error: ${await res.text()}`;

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

// ===================================
// INTENT DETECTION (Simple)
// ===================================

function detectIntent(message: string): { tool: string; params?: any } | null {
  const lower = message.toLowerCase();

  if (
    lower.includes("naveg") ||
    lower.includes("acesse") ||
    lower.includes("clique") ||
    lower.includes("abra") ||
    lower.includes("vá para") ||
    lower.includes("entre")
  ) {
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    let url = urlMatch?.[0];
    if (!url && lower.includes("amazon")) url = "https://www.amazon.com.br";
    if (!url && lower.includes("google")) url = "https://www.google.com";
    return { tool: "decide_browser", params: { action: message, url } };
  }

  if (lower.includes("pesquis") || lower.includes("busc")) {
    return { tool: "web_search", params: message };
  }

  return null;
}

// ===================================
// MAIN HANDLER
// ===================================

serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflightRequest();

  try {
    const body = await req.json();
    const { message, conversationId, conversationHistory = [] } = body;

    console.log("📨 New message:", message);

    // AUTH
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    // ==================================
    // STEP 1: FETCH 3 AIs
    // ==================================

    const { data: thinkerAI } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .eq("aiRole", "REASONING")
      .limit(1)
      .maybeSingle();

    const { data: criticAI } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .eq("aiRole", "GENERAL") // Critic usa GENERAL
      .limit(1)
      .maybeSingle();

    const { data: executorAI } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .eq("aiRole", "EXECUTOR")
      .limit(1)
      .maybeSingle();

    // Fallback se alguma não existir
    if (!thinkerAI || !criticAI || !executorAI) {
      const { data: fallbackAIs } = await supabase
        .from("GlobalAiConnection")
        .select("*")
        .eq("isActive", true)
        .limit(3);

      if (!fallbackAIs?.length) throw new Error("No AI configured");

      const thinker = thinkerAI || fallbackAIs[0];
      const critic = criticAI || fallbackAIs[1] || fallbackAIs[0];
      const executor = executorAI || fallbackAIs[2] || fallbackAIs[0];

      console.log("⚠️ Using fallback AIs");
    }

    const thinker = thinkerAI!;
    const critic = criticAI!;
    const executor = executorAI!;

    // ==================================
    // STEP 2: LOAD PROMPTS
    // ==================================

    let thinkerPrompt = "";
    let criticPrompt = "";
    let executorPrompt = "";

    try {
      const thinkerUrl = new URL("./prompts/SYSTEM_PROMPT_THINKER_V2.md", import.meta.url);
      const criticUrl = new URL("./prompts/SYSTEM_PROMPT_CRITIC.md", import.meta.url);
      const executorUrl = new URL("./prompts/SYSTEM_PROMPT_EXECUTOR_V2.md", import.meta.url);

      const [tResp, cResp, eResp] = await Promise.all([
        fetch(thinkerUrl),
        fetch(criticUrl),
        fetch(executorUrl),
      ]);

      if (tResp.ok) thinkerPrompt = await tResp.text();
      if (cResp.ok) criticPrompt = await cResp.text();
      if (eResp.ok) executorPrompt = await eResp.text();

      console.log("✅ Prompts loaded");
    } catch (e) {
      console.error("Failed to load prompts, using fallbacks", e);
      thinkerPrompt = "You are the Thinker. Plan actions.";
      criticPrompt = "You are the Critic. Validate plans.";
      executorPrompt = "You are the Executor. Execute and communicate.";
    }

    // ==================================
    // STEP 3: THINKER PHASE
    // ==================================

    console.log("🧠 Calling Thinker...");

    const fullHistory = conversationHistory.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const thinkerMessages = [
      { role: "system", content: thinkerPrompt },
      ...fullHistory,
      { role: "user", content: `NEW REQUEST:\n${message}` },
    ];

    const thinkerResponse = await callLLM(
      thinker.provider,
      thinker.apiKey,
      thinker.model,
      thinkerMessages,
      thinker.temperature
    );

    console.log("🧠 Thinker response:", thinkerResponse.substring(0, 200));

    // Tentar parsear como JSON (plano estruturado)
    let plan: any = {};
    try {
      plan = JSON.parse(thinkerResponse);
    } catch {
      // Se não for JSON, tratar como raciocínio em texto livre
      plan = {
        reasoning: thinkerResponse,
        tool: "none",
      };
    }

    // ==================================
    // STEP 4: CRITIC VALIDATION
    // ==================================

    console.log("🔍 Calling Critic...");

    const criticMessages = [
      { role: "system", content: criticPrompt },
      {
        role: "user",
        content: `VALIDATE THIS PLAN:\n\`\`\`json\n${JSON.stringify(plan, null, 2)}\n\`\`\`\n\nUser request: "${message}"`,
      },
    ];

    const criticResponse = await callLLM(
      critic.provider,
      critic.apiKey,
      critic.model,
      criticMessages,
      critic.temperature
    );

    console.log("🔍 Critic response:", criticResponse.substring(0, 200));

    let validation: any = {};
    try {
      validation = JSON.parse(criticResponse);
    } catch {
      // Fallback: assumir aprovado se não for JSON
      validation = { status: "approved", notes: criticResponse };
    }

    // Se rejeitado, poderia fazer loop de volta ao Thinker (futuro)
    // Por agora, continuar mesmo que rejeitado

    // ==================================
    // STEP 5: TOOL EXECUTION (if needed)
    // ==================================

    let toolResult = "";
    const intent = detectIntent(message);

    if (intent) {
      console.log("🛠️ Executing tool:", intent.tool);

      if (intent.tool === "web_search") {
        toolResult = await webSearch(intent.params);
      } else if (intent.tool === "decide_browser") {
        const { data: devices } = await supabase
          .from("extension_devices")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "online")
          .limit(1);

        if (devices && devices.length > 0 || message.toLowerCase().includes("meu")) {
          toolResult = await userBrowserAutomation(
            { supabase, userId: user.id },
            intent.params.action,
            intent.params.url
          );
        } else {
          toolResult = await cloudBrowserAutomation(
            intent.params.action,
            `sess_${conversationId}`,
            intent.params.url
          );
        }
      }
    }

    // ==================================
    // STEP 6: EXECUTOR PHASE
    // ==================================

    console.log("⚡ Calling Executor...");

    const executorMessages = [
      { role: "system", content: executorPrompt },
      ...fullHistory,
      {
        role: "system",
        content: `[THINKER PLAN]:\n${plan.reasoning || JSON.stringify(plan)}`,
      },
    ];

    if (toolResult) {
      executorMessages.push({
        role: "system",
        content: `[TOOL RESULT]:\n${toolResult}`,
      });
    }

    executorMessages.push({ role: "user", content: message });

    const executorResponse = await callLLM(
      executor.provider,
      executor.apiKey,
      executor.model,
      executorMessages,
      executor.temperature
    );

    console.log("⚡ Executor response:", executorResponse.substring(0, 200));

    // ==================================
    // STEP 7: COMBINE & SAVE
    // ==================================

    const thoughtBlock = `<antigravity_thinking>${plan.reasoning || thinkerResponse}</antigravity_thinking>`;
    const finalPayload = `${thoughtBlock}\n\n${executorResponse}`;

    // Save messages
    await supabase.from("ChatMessage").insert([
      {
        conversationId,
        role: "user",
        content: message,
        userId: user.id,
      },
      {
        conversationId,
        role: "assistant",
        content: finalPayload,
        userId: user.id,
        metadata: {
          thinker_plan: plan,
          critic_validation: validation,
          tool_used: intent?.tool,
          tool_result: toolResult,
        },
      },
    ]);

    console.log("✅ Response complete");

    return new Response(JSON.stringify({ content: finalPayload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("❌ Error:", e);
    return errorResponse(e);
  }
});

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

// ... [IMPORTS E TOOLS ANTERIORES - User Browser Automation, etc] ...
// Replicando Tools para manter integridade do arquivo durante overwrite
async function userBrowserAutomation(ctx: { supabase: any; userId: string }, action: string, url?: string): Promise<string> {
  const { data: devices } = await ctx.supabase.from("extension_devices").select("device_id").eq("user_id", ctx.userId).eq("status", "online").limit(1).maybeSingle();
  if (!devices) return "⚠️ Sua extensão não está online.";
  const { error } = await ctx.supabase.from("extension_commands").insert({ device_id: devices.device_id, command: "BROWSER_ACTION", params: { action, url }, status: "pending" });
  return error ? `❌ Erro: ${error.message}` : "✅ Comando enviado para extensão.";
}

async function cloudBrowserAutomation(action: string, sessionId: string, url?: string): Promise<string> {
  const pythonUrl = Deno.env.get("PYTHON_SERVICE_URL");
  if (!pythonUrl) return "❌ PYTHON_SERVICE_URL não configurada.";
  try {
    const res = await fetch(`${pythonUrl}/browser-automation/execute`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, session_id: sessionId, url, use_ai: true }) });
    if (!res.ok) return `❌ Erro Cloud: ${await res.text()}`;
    const data = await res.json();
    return data.success ? `✅ Cloud: ${JSON.stringify(data.result)}` : `❌ Falha: ${data.error}`;
  } catch (e: any) { return `❌ Erro Conexão: ${e.message}`; }
}

async function webSearch(query: string): Promise<string> { return `Busca simulada: ${query}`; }

function detectIntent(message: string): { tool: string; params?: any } | null {
  const lower = message.toLowerCase();
  if (lower.includes("naveg") || lower.includes("acesse") || lower.includes("clique") || lower.includes("abra") || lower.includes("v[áa] para") || lower.includes("entr[ae]")) {
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    let url = urlMatch?.[0];
    if (!url && lower.includes("amazon")) url = "https://www.amazon.com.br";
    if (!url && lower.includes("google")) url = "https://www.google.com";
    return { tool: "decide_browser", params: { action: message, url } };
  }
  if (lower.includes("pesquis") || lower.includes("busc")) return { tool: "web_search", params: message };
  return null;
}

async function callLLM(provider: string, apiKey: string, model: string, messages: any[], temp: number = 0.7): Promise<string> {
  let url = "";
  let headers: any = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };
  if (provider === "GROQ") url = "https://api.groq.com/openai/v1/chat/completions";
  else if (provider === "OPENROUTER") { url = "https://openrouter.ai/api/v1/chat/completions"; headers["HTTP-Referer"] = "https://syncads.com"; }
  else if (provider === "OPENAI") url = "https://api.openai.com/v1/chat/completions";
  else return "Provider not supported";
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ model, messages, temperature: temp, stream: false }) });
    if (!res.ok) return `Error: ${await res.text()}`;
    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (e: any) { return `Error: ${e.message}`; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflightRequest();

  try {
    const body = await req.json();
    const { message, conversationId, conversationHistory = [] } = body;

    // Auth & Setup
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    // Query for specific AI roles
    const { data: reasoningAI } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .eq("aiRole", "REASONING")
      .limit(1)
      .maybeSingle();

    const { data: executorAI } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .in("aiRole", ["EXECUTOR", "GENERAL"]) // Fallback to GENERAL if no EXECUTOR
      .limit(1)
      .maybeSingle();

    // Fallback: If no roles specified, use first active AI
    if ((!reasoningAI || !executorAI)) {
      const { data: fallbackAIs } = await supabase
        .from("GlobalAiConnection")
        .select("*")
        .eq("isActive", true)
        .limit(2);

      if (!fallbackAIs?.length) throw new Error("No AI configured");

      const thinkerAi = reasoningAI || fallbackAIs[0];
      const mainAi = executorAI || fallbackAIs[fallbackAIs.length > 1 ? 1 : 0];
    } else {
      // Use role-specific AIs
      var thinkerAi = reasoningAI;
      var mainAi = executorAI;
    }

    // Intent
    const intent = detectIntent(message);
    let toolResult = "";
    if (intent) {
      if (intent.tool === "web_search") toolResult = await webSearch(intent.params);
      else if (intent.tool === "decide_browser") {
        const { data: devices } = await supabase.from("extension_devices").select("id").eq("user_id", user.id).eq("status", "online").limit(1);
        if ((devices && devices.length > 0) || message.toLowerCase().includes("meu")) {
          toolResult = await userBrowserAutomation({ supabase, userId: user.id }, intent.params.action, intent.params.url);
        } else {
          toolResult = await cloudBrowserAutomation(intent.params.action, `sess_${conversationId}`, intent.params.url);
        }
      }
    }

    // === NEW PROMPT LOADING LOGIC ===
    let thinkerPrompt = "";
    let executorPrompt = "";

    // Attempt to read the new markdown files
    try {
      // Construct URLs relative to current module for Deno
      // Note: For this to work, 'prompts' dir must be deployed via supabase functions deploy
      const thinkerUrl = new URL("./prompts/SYSTEM_PROMPT_THINKER.md", import.meta.url);
      const executorUrl = new URL("./prompts/SYSTEM_PROMPT_EXECUTOR.md", import.meta.url);

      const thinkerResp = await fetch(thinkerUrl);
      const executorResp = await fetch(executorUrl);

      if (thinkerResp.ok) thinkerPrompt = await thinkerResp.text();
      else thinkerPrompt = "Você é o Agente Pensador. Interprete gírias e planeje a ação.";

      if (executorResp.ok) executorPrompt = await executorResp.text();
      else executorPrompt = "Você é o Agente Executor. Execute o plano com precisão.";

    } catch (e) {
      console.error("Failed to load prompt files, using fallback.", e);
      thinkerPrompt = "Você é o Agente Pensador. Interprete e planeje.";
      executorPrompt = "Você é o Agente Executor. Mão na massa.";
    }

    // Thinking Phase
    let thoughtBlock = "";
    if (!toolResult) {
      const fullThinkPrompt = `${thinkerPrompt}\n\n### REQUISIÇÃO DO USUÁRIO:\n"${message}"`;
      const thoughtResponse = await callLLM(thinkerAi.provider, thinkerAi.apiKey, thinkerAi.model,
        [{ role: "system", content: "Architecture: Thinker/Strategist" }, { role: "user", content: fullThinkPrompt }], 0.5);
      thoughtBlock = `<antigravity_thinking>${thoughtResponse}</antigravity_thinking>`;
    }

    // Response Phase
    const context = conversationHistory.map((m: any) => ({ role: m.role, content: m.content }));
    // Use EXECUTOR prompt instead of DB prompt
    const finalMessages = [{ role: "system", content: executorPrompt }, ...context];

    if (thoughtBlock) finalMessages.push({ role: "system", content: `[INTERNAL PLAN from Thinker]:\n${thoughtBlock.replace(/<[^>]+>/g, '')}` });
    if (toolResult) finalMessages.push({ role: "system", content: `Tool Result: ${toolResult}` });

    finalMessages.push({ role: "user", content: message });

    let finalKeyResponse = await callLLM(mainAi.provider, mainAi.apiKey, mainAi.model, finalMessages);

    let finalPayload = finalKeyResponse;
    if (thoughtBlock) finalPayload = thoughtBlock + "\n\n" + finalKeyResponse;
    else if (toolResult && !finalKeyResponse) finalPayload = toolResult;

    await supabase.from("ChatMessage").insert([{ conversationId, role: "user", content: message, userId: user.id }, { conversationId, role: "assistant", content: finalPayload, userId: user.id }]);
    return new Response(JSON.stringify({ content: finalPayload }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) { return errorResponse(e); }
});

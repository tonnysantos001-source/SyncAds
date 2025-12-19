import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkRateLimit,
  createRateLimitResponse,
} from "../_utils/rate-limiter.ts";
import { circuitBreaker } from "../_utils/circuit-breaker.ts";
import { fetchWithTimeout } from "../_utils/fetch-with-timeout.ts";
import { retry } from "../_utils/retry.ts";
import {
  countConversationTokens,
  estimateConversationTokens,
  validateTokenLimit,
  formatTokenCount,
} from "../_utils/token-counter.ts";
import { callWithFallback } from "../_utils/model-fallback.ts";
import {
  corsHeaders,
  handlePreflightRequest,
  isOriginAllowed,
  jsonResponse,
  errorResponse,
} from "../_utils/cors.ts";
import {
  searchGoogle,
  searchYouTube,
  searchNews,
  searchImages,
  searchShopping,
  searchPlaces,
} from "../_utils/search-tools.ts";

// ==================== FERRAMENTAS & INTERFACES ====================

interface ToolContext {
  supabase: any;
  userId: string;
  conversationId?: string;
}

const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 3600000;

function getCached(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function webSearch(query: string): Promise<string> {
  try {
    const cached = getCached(`search:${query}`);
    if (cached) return cached;

    let results = null;

    // Exa AI
    const exaKey = Deno.env.get("EXA_API_KEY");
    if (exaKey) {
      try {
        const exaResponse = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: { "x-api-key": exaKey, "Content-Type": "application/json" },
          body: JSON.stringify({ query, numResults: 5, type: "neural", useAutoprompt: true })
        });
        if (exaResponse.ok) {
          const data = await exaResponse.json();
          if (data.results?.length) {
            results = data.results.map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.text || r.url}\n   ${r.url}`).join("\n\n");
          }
        }
      } catch (e) { }
    }

    if (!results) {
      // Tavily
      const tavilyKey = Deno.env.get("TAVILY_API_KEY");
      if (tavilyKey) {
        try {
          const tRes = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: tavilyKey, query, max_results: 5, include_answer: true })
          });
          if (tRes.ok) {
            const data = await tRes.json();
            if (data.results?.length) {
              results = data.results.map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.content}\n   ${r.url}`).join("\n\n");
              if (data.answer) results = `💡 **AI Answer:**\n${data.answer}\n\n📚 **Sounces:**\n\n${results}`;
            }
          }
        } catch (e) { }
      }
    }

    // Google Serper Fallback
    if (!results) {
      const serperKey = Deno.env.get("SERPER_API_KEY");
      if (serperKey) {
        const sRes = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
          body: JSON.stringify({ q: query, num: 5 })
        });
        if (sRes.ok) {
          const data = await sRes.json();
          if (data.organic?.length) {
            results = data.organic.map((r: any, i: number) => `${i + 1}. **${r.title}**\n   ${r.snippet}\n   ${r.link}`).join("\n\n");
          }
        }
      }
    }

    if (!results) return "❌ Busca falhou. Tente novamente.";
    setCache(`search:${query}`, results);
    return results;
  } catch (e) { return "Erro na busca."; }
}

async function listCampaigns(ctx: ToolContext): Promise<string> {
  return "Lista de campanhas mock: Campanha 1 (Ativa), Campanha 2 (Pausada)";
}

async function browserAutomationTool(action: string, sessionId: string, url?: string): Promise<string> {
  const pythonUrl = Deno.env.get("PYTHON_SERVICE_URL");
  if (!pythonUrl) return "❌ PYTHON_SERVICE_URL não configurada.";

  try {
    const res = await fetch(`${pythonUrl}/browser-automation/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, session_id: sessionId, url, use_ai: true })
    });
    if (!res.ok) return `❌ Erro: ${await res.text()}`;
    const data = await res.json();
    return data.success ? `✅ Ação realizada: ${JSON.stringify(data.result)}` : `❌ Falha: ${data.error}`;
  } catch (e: any) { return `❌ Erro de conexão: ${e.message}`; }
}

function detectIntent(message: string): { tool: string; params?: any } | null {
  const lower = message.toLowerCase();

  // Browser Automation
  if (lower.includes("naveg") || lower.includes("acesse") || lower.includes("clique")) {
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    return { tool: "browser_automation", params: { action: message, url: urlMatch?.[0] } };
  }

  // Generic Search
  if (lower.includes("pesquis") || lower.includes("busc")) {
    return { tool: "web_search", params: message };
  }

  return null;
}

// === LLM API HELPER ===
async function callLLM(
  provider: string,
  apiKey: string,
  model: string,
  messages: any[],
  temp: number = 0.7
): Promise<string> {
  let url = "";
  let headers: any = { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` };

  if (provider === "GROQ") url = "https://api.groq.com/openai/v1/chat/completions";
  else if (provider === "OPENROUTER") {
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers["HTTP-Referer"] = "https://syncads.com";
  }
  else if (provider === "OPENAI") url = "https://api.openai.com/v1/chat/completions";
  else return "Provider not supported"; // Fallback/Error

  try {
    const res = await fetch(url, {
      method: "POST", headers,
      body: JSON.stringify({ model, messages, temperature: temp, stream: false })
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error(`LLM Error (${provider}):`, txt);
      return `Error: ${txt}`;
    }

    const json = await res.json();
    return json.choices?.[0]?.message?.content || "";
  } catch (e: any) {
    return `Connection Error: ${e.message}`;
  }
}


serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflightRequest();

  try {
    const body = await req.json();
    const { message, conversationId, conversationHistory = [] } = body;

    // 1. Auth & Rate Limit
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    // 2. Fetch Active AIs
    // Try to fetch 2 active connections to support multi-agent thought
    const { data: aiConfigs } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .order("createdAt", { ascending: true }) // Stable order
      .limit(2);

    if (!aiConfigs || aiConfigs.length === 0) throw new Error("No AI Configured");

    // Main Agent (Responder) vs Thinker Agent (Reasoning)
    const mainAi = aiConfigs[0];
    const thinkerAi = aiConfigs.length > 1 ? aiConfigs[1] : aiConfigs[0];

    console.log(`🤖 Setup: Main=${mainAi.provider}/${mainAi.model} | Thinker=${thinkerAi.provider}/${thinkerAi.model}`);

    // 3. Detect Tool
    const intent = detectIntent(message);
    let toolResult = "";
    if (intent) {
      console.log("Tool Intent:", intent.tool);
      if (intent.tool === "web_search") toolResult = await webSearch(intent.params);
      else if (intent.tool === "browser_automation") toolResult = await browserAutomationTool(intent.params.action, `sess_${conversationId}`, intent.params.url);
    }

    // 4. Construct Context
    const chatHistory = conversationHistory.map((m: any) => ({ role: m.role, content: m.content }));
    const systemPrompt = mainAi.systemPrompt || "You are a helpful assistant.";

    // 5. === THINKING PHASE (The New Feature) ===
    let thoughtBlock = "";

    if (!toolResult) {
      console.log("🧠 Entering Thinking Phase (ARC-AGI Mode)...");
      // UPDATED PROMPT: ARC-AGI SELF-CORRECTION
      const thinkPrompt = `
You are the Meta-Reasoning Engine (ARC-AGI Architecture).
Your goal is NOT to answer the user directly, but to GUIDE the final Execution Agent.

Apply "Fluid Intelligence" and strict "Self-Criticism" to the user's request.

Cognitive Process:
1. 📍 **Decomposition**: Break the request into atomic steps.
2. 🧠 **Pattern Recognition**: Identify the task type (e.g., "Navigation", "Creative", "Coding", "Analysis").
3. 🧪 **Strategy Calculation**: What is the most efficient path? (e.g., Use scraping instead of manual clicking).
4. 🛡️ **Self-Correction (CRITICAL)**: Play "Devil's Advocate".
   - Ask: "What if the website blocks me?"
   - Ask: "Is this the user's real intent?"
   - Ask: "Did I miss a constraint?"
   - *Refine the plan based on these critiques.*
5. 📝 **Final Guidance**: Give clear, executable instructions to the Responder Agent.

User Request: "${message}"
`;
      const thoughtResponse = await callLLM(
        thinkerAi.provider,
        thinkerAi.apiKey,
        thinkerAi.model,
        [{ role: "system", content: "You are a reasoning engine." }, { role: "user", content: thinkPrompt }],
        0.5
      );

      thoughtBlock = `<antigravity_thinking>${thoughtResponse}</antigravity_thinking>`;
      console.log("🧠 Thought Generated (ARC-AGI).");
    }

    // 6. === RESPONSE PHASE ===
    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...chatHistory,
    ];

    if (thoughtBlock && !toolResult) {
      finalMessages.push({
        role: "system",
        content: `[INTERNAL THOUGHT & STRATEGY]: ${thoughtBlock.replace(/<[^>]+>/g, '')}\n\nUse this strategies to construct your final response.`
      });
    }

    if (toolResult) {
      finalMessages.push({ role: "system", content: `Tool Result: ${toolResult}` });
    }

    finalMessages.push({ role: "user", content: message });

    const finalResponseKey = await callLLM(
      mainAi.provider,
      mainAi.apiKey,
      mainAi.model,
      finalMessages,
      mainAi.temperature || 0.7
    );

    let fullContent = finalResponseKey;
    if (thoughtBlock) {
      fullContent = thoughtBlock + "\n\n" + finalResponseKey;
    } else if (toolResult && !fullContent) {
      fullContent = toolResult;
    }

    await supabase.from("ChatMessage").insert([
      { conversationId, role: "user", content: message, userId: user.id },
      { conversationId, role: "assistant", content: fullContent, userId: user.id }
    ]);

    return new Response(JSON.stringify({ content: fullContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (e: any) {
    return errorResponse(e);
  }
});

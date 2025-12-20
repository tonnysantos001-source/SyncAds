import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  handlePreflightRequest,
  errorResponse,
} from "../_utils/cors.ts";

// =====================================================
// PROMPTS INLINE (GARANTIA DE FUNCIONAMENTO)
// =====================================================

const THINKER_PROMPT = `
# VOCÊ É O AGENTE DE RACIOCÍNIO (THINKER) DO SYNCADS

## FERRAMENTAS DISPONÍVEIS

Você TEM acesso a ferramentas de automação. SEMPRE use-as ao invés de dar instruções manuais!

### 1. Browser Automation
Para abrir sites, clicar, navegar, etc.
Exemplos: "abra o google", "vá para amazon.com", "clique em login"

### 2. Web Search
Para buscar informações
Exemplos: "qual o preço do iPhone", "busque notícias sobre IA"

## REGRAS CRÍTICAS

❌ NUNCA dê instruções manuais como:
"Para abrir o Google, vá no navegador..."
"Você pode acessar o site..."

✅ SEMPRE responda ações diretas:
"Abrindo o Google agora..."
"Buscando informações sobre..."

## FORMATO DE RESPOSTA

Retorne JSON estruturado:
{
  "intent": "browser_action | search | other",
  "tool": "browser | search | none",
  "action": "descrição da ação",
  "reasoning": "por que escolhi isso"
}

Se não souber usar ferramentas, use "intent": "conversation"
`;

const EXECUTOR_PROMPT = `
# VOCÊ É O AGENTE EXECUTOR DO SYNCADS

## SUA MISSÃO
- Receber planos do Thinker
- EXECUTAR ferramentas
- Comunicar resultados em Português BR de forma amigável

## REGRAS
- Seja direto e amigável
- Use emojis (🌐 🔍 ✅ ⏳)
- NUNCA mostre erros técnicos brutos
- Se algo falhar, seja positivo sobre retry

## EXEMPLOS

❌ ERRADO:
"Error 500: Internal Server Timeout at line 42..."

✅ CERTO:
"⏳ O site está demorando um pouco. Tentando novamente..."
`;

// =====================================================
// TOOLS
// =====================================================

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

  if (!devices) return "⚠️ Extensão offline. Usando navegador em nuvem...";

  const { error } = await ctx.supabase
    .from("extension_commands")
    .insert({
      device_id: devices.device_id,
      command: "BROWSER_ACTION",
      params: { action, url },
      status: "pending",
    });

  return error ? `❌ ${error.message}` : "✅ Comando enviado para sua extensão.";
}

async function cloudBrowserAutomation(
  action: string,
  sessionId: string,
  url?: string
): Promise<string> {
  const pythonUrl = Deno.env.get("PYTHON_SERVICE_URL");
  if (!pythonUrl) {
    console.warn("PYTHON_SERVICE_URL not configured");
    return "⚠️ Navegador em nuvem indisponível. Configure PYTHON_SERVICE_URL.";
  }

  try {
    const res = await fetch(`${pythonUrl}/browser-automation/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, session_id: sessionId, url, use_ai: true }),
    });

    if (!res.ok) {
      console.error("Cloud browser error:", await res.text());
      return "❌ Navegador em nuvem não respondeu.";
    }

    const data = await res.json();
    return data.success ? `✅ ${JSON.stringify(data.result)}` : `⚠️ ${data.error}`;
  } catch (e: any) {
    console.error("Cloud browser exception:", e);
    return `❌ Erro ao conectar com navegador em nuvem: ${e.message}`;
  }
}

async function webSearch(query: string): Promise<string> {
  // TODO: Integrar com Tavily/Serper API
  return `🔎 Busca: "${query}" (Integração de busca será implementada)`;
}

// =====================================================
// LLM CALLER
// =====================================================

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
  else throw new Error(`Provider ${provider} not supported`);

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, temperature: temp, stream: false }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`LLM API error: ${error}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

// =====================================================
// INTENT DETECTION (EXPANDIDO)
// =====================================================

function detectIntent(message: string): { tool: string; action: string; url?: string } | null {
  const lower = message.toLowerCase();

  // Detectar URLs explícitos
  const urlMatch = message.match(/https?:\/\/[^\s]+/);
  const explicitUrl = urlMatch?.[0];

  // BROWSER ACTIONS - Lista expandida de gatilhos
  const browserTriggers = [
    "abr",    // abra, abre, abrir, abrindo
    "vá",     // vá, vai
    "acesse", // acesse, acessar
    "entr",   // entre, entrar, entrada
    "cliqu",  // clique, clica, clicar
    "naveg",  // navega, navegue, navegar
    "visit",  // visite, visitar
    "ir para",
    "veja",
    "mostre",
  ];

  for (const trigger of browserTriggers) {
    if (lower.includes(trigger)) {
      // Inferir URL de sites conhecidos
      let inferredUrl = explicitUrl;
      if (!inferredUrl) {
        if (lower.includes("google")) inferredUrl = "https://google.com";
        else if (lower.includes("amazon")) inferredUrl = "https://amazon.com.br";
        else if (lower.includes("facebook")) inferredUrl = "https://facebook.com";
        else if (lower.includes("instagram")) inferredUrl = "https://instagram.com";
        else if (lower.includes("youtube")) inferredUrl = "https://youtube.com";
        else if (lower.includes("twitter") || lower.includes("x.com")) inferredUrl = "https://twitter.com";
      }

      return {
        tool: "browser",
        action: message, // Ação completa para o browser
        url: inferredUrl,
      };
    }
  }

  // SEARCH ACTIONS
  const searchTriggers = ["pesquis", "busc", "procur", "ache", "encontr", "qual", "quanto"];
  for (const trigger of searchTriggers) {
    if (lower.includes(trigger)) {
      return {
        tool: "search",
        action: message,
      };
    }
  }

  return null;
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflightRequest();

  try {
    const body = await req.json();
    const { message, conversationId, conversationHistory = [] } = body;

    console.log("📨 Message:", message);

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

    // FETCH EXECUTOR AI (simplificado - usar apenas 1 IA por agora)
    const { data: executorAI } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .in("aiRole", ["EXECUTOR", "REASONING", "GENERAL"]) // Aceitar qualquer
      .limit(1)
      .maybeSingle();

    if (!executorAI) throw new Error("No AI configured");

    const ai = executorAI;

    // DETECT INTENT
    const intent = detectIntent(message);
    let toolResult = "";

    if (intent) {
      console.log("🛠️ Intent:", intent.tool);

      if (intent.tool === "browser") {
        // Decidir entre user browser (extensão) ou cloud browser
        const { data: devices } = await supabase
          .from("extension_devices")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "online")
          .limit(1);

        const useUserBrowser = (devices && devices.length > 0) || message.toLowerCase().includes("meu") || message.toLowerCase().includes("minha");

        if (useUserBrowser) {
          console.log("🌐 Using USER browser (extension)");
          toolResult = await userBrowserAutomation(
            { supabase, userId: user.id },
            intent.action,
            intent.url
          );
        } else {
          console.log("☁️ Using CLOUD browser");
          toolResult = await cloudBrowserAutomation(
            intent.action,
            `sess_${conversationId}`,
            intent.url
          );
        }
      } else if (intent.tool === "search") {
        console.log("🔍 Using WEB SEARCH");
        toolResult = await webSearch(intent.action);
      }
    }

    // BUILD EXECUTOR MESSAGES
    const history = conversationHistory.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const executorMessages = [
      { role: "system", content: EXECUTOR_PROMPT },
      ...history,
    ];

    if (toolResult) {
      executorMessages.push({
        role: "system",
        content: `[TOOL EXECUTED]:\n${toolResult}`,
      });
    }

    executorMessages.push({ role: "user", content: message });

    // CALL LLM
    console.log("⚡ Calling Executor AI...");
    const response = await callLLM(ai.provider, ai.apiKey, ai.model, executorMessages, ai.temperature);

    console.log("✅ Response generated");

    // SAVE
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
        content: response,
        userId: user.id,
        metadata: {
          intent: intent?.tool,
          tool_result: toolResult,
        },
      },
    ]);

    return new Response(JSON.stringify({ content: response }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("❌ Error:", e);
    return errorResponse(e);
  }
});

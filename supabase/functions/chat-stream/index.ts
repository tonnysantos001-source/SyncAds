import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  handlePreflightRequest,
  errorResponse,
} from "../_utils/cors.ts";

// =====================================================
// PROMPTS INLINE
// =====================================================

const THINKER_PROMPT = `
# AGENTE DE RACIOCÍNIO (THINKER)

Você planeja ações. Retorne JSON:
{
  "tool": "browser | search | none",
  "action": "descrição",
  "reasoning": "por que"
}

SEMPRE use ferramentas! Não dê instruções manuais.
`;

const EXECUTOR_PROMPT = `
# AGENTE EXECUTOR

## REGRA CRÍTICA DE HONESTIDADE

❌ **NUNCA** minta que executou algo se falhou!

Se receber:
- "⚠️ Navegador em nuvem indisponível" → DIGA AO USUÁRIO!
- "❌ Erro..." → EXPLIQUE O ERRO!
- "✅ Comando enviado" → Pode confirmar

## COMO REPORTAR ERROS

❌ ERRADO:
"Abrindo o Google... ✅ Google aberto!"
(quando na verdade falhou)

✅ CERTO:
"❌ Desculpe, não consegui abrir o Google. 

**Problema**: Navegador em nuvem está offline.

**O que fazer**: Configure a variável PYTHON_SERVICE_URL no Supabase ou use a extensão Chrome."

## FORMATO DE RESPOSTA

Sempre inclua:
1. Status real da ação
2. Se erro, explicar qual
3. Próximos passos

Seja HONESTO e útil!
`;

// =====================================================
// TOOLS
// =====================================================

async function userBrowserAutomation(
  ctx: { supabase: any; userId: string },
  action: string,
  url?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: devices } = await ctx.supabase
      .from("extension_devices")
      .select("device_id")
      .eq("user_id", ctx.userId)
      .eq("status", "online")
      .limit(1)
      .maybeSingle();

    if (!devices) {
      return {
        success: false,
        message: "❌ Extensão Chrome está offline. Por favor, abra a extensão e faça login.",
      };
    }

    const { error } = await ctx.supabase
      .from("extension_commands")
      .insert({
        device_id: devices.device_id,
        command: "BROWSER_ACTION",
        params: { action, url },
        status: "pending",
      });

    if (error) {
      return {
        success: false,
        message: `❌ Erro ao enviar comando: ${error.message}`,
      };
    }

    return {
      success: true,
      message: "✅ Comando enviado para sua extensão Chrome.",
    };
  } catch (e: any) {
    return {
      success: false,
      message: `❌ Erro inesperado: ${e.message}`,
    };
  }
}

async function cloudBrowserAutomation(
  action: string,
  sessionId: string,
  url?: string
): Promise<{ success: boolean; message: string }> {
  const pythonUrl = Deno.env.get("PYTHON_SERVICE_URL");

  if (!pythonUrl) {
    return {
      success: false,
      message: `❌ Navegador em nuvem NÃO CONFIGURADO.

**Problema**: Variável PYTHON_SERVICE_URL não está definida no Supabase.

**Como resolver**:
1. Acesse Supabase Dashboard → Settings → Edge Functions
2. Adicione variável: PYTHON_SERVICE_URL = [URL do Railway]
3. Faça redeploy da função

**Ou**: Use a extensão Chrome para automação local.`,
    };
  }

  try {
    console.log("🌐 Calling Python service:", pythonUrl);

    const res = await fetch(`${pythonUrl}/browser-automation/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, session_id: sessionId, url, use_ai: true }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Python service error:", errorText);

      return {
        success: false,
        message: `❌ Navegador em nuvem falhou (HTTP ${res.status}).

**Erro**: ${errorText}

**Possível causa**: Railway offline ou bibliotecas (Playwright) não instaladas.

**Como resolver**:
1. Verifique se Railway está rodando
2. Verifique logs do Railway
3. Reinstale dependências: \`pip install browser-use playwright\``,
      };
    }

    const data = await res.json();

    if (!data.success) {
      return {
        success: false,
        message: `❌ Navegador retornou erro: ${data.error}

**Próximos passos**: Verifique logs do Railway para mais detalhes.`,
      };
    }

    return {
      success: true,
      message: `✅ Ação executada no navegador em nuvem.\n\nResultado: ${JSON.stringify(data.result)}`,
    };
  } catch (e: any) {
    console.error("Cloud browser exception:", e);

    return {
      success: false,
      message: `❌ Não foi possível conectar ao navegador em nuvem.

**Erro**: ${e.message}

**Causas comuns**:
- Railway está offline
- URL incorreta: ${pythonUrl}
- Firewall bloqueando conexão

**Como resolver**: Verifique status no Railway Dashboard.`,
    };
  }
}

async function webSearch(query: string): Promise<{ success: boolean; message: string }> {
  // TODO: Integrar API real
  return {
    success: false,
    message: `⚠️ Busca web ainda não implementada.

**Query**: "${query}"

**Status**: Integração com Tavily/Serper será adicionada em breve.

**Alternativa**: Use "pesquise [termo] no google" para abrir busca no navegador.`,
  };
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
// INTENT DETECTION
// =====================================================

function detectIntent(message: string): { tool: string; action: string; url?: string } | null {
  const lower = message.toLowerCase();
  const urlMatch = message.match(/https?:\/\/[^\s]+/);
  const explicitUrl = urlMatch?.[0];

  const browserTriggers = ["abr", "vá", "acesse", "entr", "cliqu", "naveg", "visit", "ir para", "veja", "mostre"];
  for (const trigger of browserTriggers) {
    if (lower.includes(trigger)) {
      let inferredUrl = explicitUrl;
      if (!inferredUrl) {
        if (lower.includes("google")) inferredUrl = "https://google.com";
        else if (lower.includes("amazon")) inferredUrl = "https://amazon.com.br";
        else if (lower.includes("facebook")) inferredUrl = "https://facebook.com";
        else if (lower.includes("instagram")) inferredUrl = "https://instagram.com";
        else if (lower.includes("youtube")) inferredUrl = "https://youtube.com";
      }

      return { tool: "browser", action: message, url: inferredUrl };
    }
  }

  const searchTriggers = ["pesquis", "busc", "procur", "ache", "encontr", "qual", "quanto"];
  for (const trigger of searchTriggers) {
    if (lower.includes(trigger)) {
      return { tool: "search", action: message };
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

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) throw new Error("Unauthorized");

    // FETCH AI
    const { data: thinkerAI } = await supabase
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
      .in("aiRole", ["EXECUTOR", "GENERAL"])
      .limit(1)
      .maybeSingle();

    const thinker = thinkerAI || executorAI;
    const executor = executorAI || thinkerAI;

    if (!thinker || !executor) throw new Error("No AI configured");

    // THINKER PHASE
    console.log("🧠 Calling Thinker...");

    const thinkerMessages = [
      { role: "system", content: THINKER_PROMPT },
      ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const thinkerResponse = await callLLM(thinker.provider, thinker.apiKey, thinker.model, thinkerMessages, 0.5);

    let plan: any = {};
    try {
      plan = JSON.parse(thinkerResponse);
    } catch {
      plan = { tool: "none", reasoning: thinkerResponse };
    }

    console.log("🧠 Plan:", plan);

    // TOOL EXECUTION
    const intent = detectIntent(message);
    let toolResultObj: { success: boolean; message: string } = { success: false, message: "" };

    if (intent) {
      console.log("🛠️ Executing:", intent.tool);

      if (intent.tool === "browser") {
        const { data: devices } = await supabase
          .from("extension_devices")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "online")
          .limit(1);

        const useUserBrowser = (devices && devices.length > 0) || message.toLowerCase().includes("meu");

        if (useUserBrowser) {
          console.log("🌐 Using USER browser");
          toolResultObj = await userBrowserAutomation({ supabase, userId: user.id }, intent.action, intent.url);
        } else {
          console.log("☁️ Using CLOUD browser");
          toolResultObj = await cloudBrowserAutomation(intent.action, `sess_${conversationId}`, intent.url);
        }
      } else if (intent.tool === "search") {
        console.log("🔍 Using SEARCH");
        toolResultObj = await webSearch(intent.action);
      }
    }

    // EXECUTOR PHASE
    console.log("⚡ Calling Executor...");

    const executorMessages = [
      { role: "system", content: EXECUTOR_PROMPT },
      ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    if (toolResultObj.message) {
      executorMessages.push({
        role: "system",
        content: `[RESULTADO DA FERRAMENTA]:\n${toolResultObj.message}\n\n**Status**: ${toolResultObj.success ? "✅ Sucesso" : "❌ Falha"}\n\nIMPORTANTE: Seja HONESTO com o usuário sobre este resultado!`,
      });
    }

    executorMessages.push({ role: "user", content: message });

    const executorResponse = await callLLM(executor.provider, executor.apiKey, executor.model, executorMessages, executor.temperature);

    // COMBINE WITH THINKING
    const thinkingBlock = `<antigravity_thinking>${plan.reasoning || thinkerResponse}</antigravity_thinking>`;
    const finalPayload = `${thinkingBlock}\n\n${executorResponse}`;

    console.log("✅ Response complete");

    // SAVE
    await supabase.from("ChatMessage").insert([
      { conversationId, role: "user", content: message, userId: user.id },
      {
        conversationId,
        role: "assistant",
        content: finalPayload,
        userId: user.id,
        metadata: {
          plan,
          tool_success: toolResultObj.success,
          tool_message: toolResultObj.message,
        },
      },
    ]);

    return new Response(JSON.stringify({ content: finalPayload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("❌ Error:", e);
    return errorResponse(e);
  }
});

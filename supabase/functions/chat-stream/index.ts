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

// =====================================================
// LOCAL BROWSER AUTOMATION (Chrome Extension)
// =====================================================

async function executeLocalBrowser(
  ctx: { supabase: any; userId: string },
  action: string,
  url?: string
): Promise<{ success: boolean; message: string }> {
  console.log("🌐 Starting LOCAL browser automation", { action, url });

  try {
    // 1. Check if extension is online
    const { data: device } = await ctx.supabase
      .from("extension_devices")
      .select("device_id, id")
      .eq("user_id", ctx.userId)
      .eq("status", "online")
      .limit(1)
      .maybeSingle();

    if (!device) {
      return {
        success: false,
        message: "❌ Extensão Chrome não conectada.\n\n**Como resolver**: Abra a extensão Chrome e faça login no SyncAds.",
      };
    }

    console.log("✅ Extension online:", device.device_id);

    // 2. Parse action to DOM command
    const domCommand = parseActionToDomCommand(action, url);
    console.log("🔧 Parsed command:", domCommand);

    // 3. Create command in database
    const { data: command, error: insertError } = await ctx.supabase
      .from("extension_commands")
      .insert({
        device_id: device.device_id,
        user_id: ctx.userId,
        type: domCommand.type,
        selector: domCommand.selector || null,
        value: domCommand.value || null,
        options: { url: domCommand.url, ...domCommand },
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("❌ Failed to create command:", insertError);
      return {
        success: false,
        message: `❌ Erro ao criar comando: ${insertError.message}`,
      };
    }

    console.log("📝 Command created:", command.id);
    console.log("⏱️ Waiting for execution...");

    // 4. Wait for command completion
    const result = await waitForCommandCompletion(ctx.supabase, command.id);

    if (result.success) {
      // Verificar se realmente executou
      const executionDetails = result.result ? JSON.stringify(result.result, null, 2) : "";

      return {
        success: true,
        message: `✅ Ação executada com sucesso!

**Comando:** ${domCommand.type}
**Status:** Completado
${domCommand.url ? `**URL:** ${domCommand.url}\n` : ""}
${executionDetails ? `**Detalhes:**\n\`\`\`\n${executionDetails}\n\`\`\`\n` : ""}

A ação foi confirmada pela extensão Chrome.`,
      };
    } else {
      return {
        success: false,
        message: `❌ Falha na execução

**Erro:** ${result.error || 'Desconhecido'}
**Comando:** ${domCommand.type}

**Possíveis causas:**
- Extensão Chrome não está rodando
- Tab não está ativa
- Elemento não encontrado (se tentou clicar/preencher)
- Timeout (comando demorou mais de 30s)

**Solução:** Verifique se a extensão está ativa e tente novamente.`,
      };
    }
  } catch (e: any) {
    console.error("❌ Local browser automation error:", e);
    return {
      success: false,
      message: `❌ Erro inesperado: ${e.message}`,
    };
  }
}

// Helper: Parse natural language action to DOM command
function parseActionToDomCommand(action: string, url?: string): any {
  const lower = action.toLowerCase();

  // NAVIGATE: "abrir", "vá para", "acesse"
  if (lower.includes("abr") || lower.includes("vá") || lower.includes("acesse") || lower.includes("naveg")) {
    const targetUrl =
      url ||
      extractUrl(action) ||
      inferUrlFromAction(lower);

    return {
      type: "NAVIGATE",
      url: targetUrl,
    };
  }

  // CLICK: "clicar", "clique"
  if (lower.includes("clic")) {
    return {
      type: "CLICK",
      selector: extractSelector(action) || "button",
    };
  }

  // FILL: "preencher", "digite", "escreva"
  if (lower.includes("preenche") || lower.includes("digite") || lower.includes("escrev")) {
    return {
      type: "FILL",
      selector: "input",
      value: extractValue(action) || "",
    };
  }

  // SCROLL: "rolar", "scroll"
  if (lower.includes("rola") || lower.includes("scroll")) {
    return {
      type: "SCROLL",
      y: 500,
    };
  }

  // Default: try to navigate if there's a URL
  if (url) {
    return {
      type: "NAVIGATE",
      url: url,
    };
  }

  return {
    type: "UNKNOWN",
    raw: action,
  };
}

// Helper: Infer URL from action text
function inferUrlFromAction(action: string): string {
  if (action.includes("google")) return "https://google.com";
  if (action.includes("facebook")) return "https://facebook.com";
  if (action.includes("instagram")) return "https://instagram.com";
  if (action.includes("youtube")) return "https://youtube.com";
  if (action.includes("twitter") || action.includes("x.com")) return "https://x.com";
  return "";
}

// Helper: Extract URL from text
function extractUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/);
  return urlMatch ? urlMatch[0] : null;
}

// Helper: Extract selector (placeholder - could be improved with AI)
function extractSelector(text: string): string {
  // Simple extraction - in production, use AI to identify selector
  if (text.includes("botão")) return "button";
  if (text.includes("link")) return "a";
  if (text.includes("campo")) return "input";
  return "*";
}

// Helper: Extract value to fill
function extractValue(text: string): string {
  // Extract quoted text or text after "com"
  const quotedMatch = text.match(/"([^"]+)"/);
  if (quotedMatch) return quotedMatch[1];

  const comMatch = text.match(/com\s+(.+)/);
  if (comMatch) return comMatch[1].trim();

  return "";
}

// Helper: Wait for command completion (polling)
async function waitForCommandCompletion(
  supabase: any,
  commandId: string,
  timeout = 30000
): Promise<{ success: boolean; result?: any; error?: string }> {
  const startTime = Date.now();
  const pollInterval = 500; // Check every 500ms

  while (Date.now() - startTime < timeout) {
    const { data: command } = await supabase
      .from("extension_commands")
      .select("status, result, error")
      .eq("id", commandId)
      .single();

    if (!command) {
      return { success: false, error: "Comando não encontrado" };
    }

    if (command.status === "completed") {
      console.log("✅ Command completed successfully");
      return { success: true, result: command.result };
    }

    if (command.status === "failed") {
      console.log("❌ Command failed:", command.error);
      return { success: false, error: command.error };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  console.log("⏱️ Command timeout");
  return { success: false, error: "Timeout: comando não foi executado a tempo" };
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
        // SEMPRE usar automação local (via extensão Chrome)
        console.log("🌐 Using LOCAL browser (Chrome Extension)");
        toolResultObj = await executeLocalBrowser(
          { supabase, userId: user.id },
          intent.action,
          intent.url
        );
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

    // COMBINE WITH THINKING (apenas o reasoning, não o JSON completo)
    const reasoning = plan.reasoning || "Processando sua solicitação...";
    const thinkingBlock = `<antigravity_thinking>${reasoning}</antigravity_thinking>`;
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

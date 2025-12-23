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

Você é responsável por PLANEJAR ações. Analise a mensagem do usuário e retorne APENAS um objeto JSON válido.

## FORMATO OBRIGATÓRIO

Retorne SOMENTE o JSON a seguir (pode usar \`\`\`json ou JSON puro):

{
  "tool": "browser" | "search" | "admin" | "none",
  "action": "descrição da ação a executar",
  "reasoning": "raciocínio sobre por que esta ferramenta é necessária"
}

## REGRAS DE FERRAMENTAS

### Browser (Automação)
- Use quando usuário pedir: "abra", "navegue", "clique", "acesse", "vá para"
- Exemplo: "abra o google" → tool: "browser"

### Search (Pesquisa Web)
- Use quando usuário pedir: "pesquise", "procure informações sobre", "busque"
- Exemplo: "pesquise sobre IA" → tool: "search"

### Admin (Ferramentas Administrativas) 🔐
- Use quando usuário pedir: "auditoria", "verificar sistema", "diagnosticar", "ver logs", "corrigir banco", "limpar co

mandos"
- Exemplo: "faça uma auditoria" → tool: "admin"
- **IMPORTANTE**: Esta ferramenta só funciona para usuários ADMIN/SUPER_ADMIN

### None (Apenas Conversa)
- Use quando: conversa normal, perguntas gerais, sem necessidade de ferramentas
- Exemplo: "como você está?" → tool: "none"

## REGRA CRÍTICA

SEMPRE prefira usar ferramentas REAIS em vez de dar instruções manuais ao usuário.
NÃO invente que ferramentas foram executadas quando você apenas planejou a ação.
Retorne APENAS o JSON, sem texto adicional.
`;

const EXECUTOR_PROMPT = `
# AGENTE EXECUTOR

## SUA FUNÇÃO

Você EXECUTA ações e RELATA o resultado HONESTAMENTE ao usuário.

## ⚠️ REGRA CRÍTICA #1: HONESTIDADE BRUTAL ⚠️

**VOCÊ NÃO PODE MENTIR, INVENTAR OU FINGIR QUE FEZ ALGO.**

### ✅ O que você DEVE fazer:
1. Ler o [RESULTADO DA FERRAMENTA] que será enviado a você
2. Copiar a mensagem de erro/sucesso EXATAMENTE como recebeu
3. Admitir se algo falhou
4. Ser específico sobre o erro real

### ❌ O que você NÃO PODE fazer:
1. ❌ Inventar que executou uma ação se o resultado foi falha
2. ❌ Dizer "executei uma auditoria" se recebeu timeout/erro
3. ❌ Ignorar mensagens de erro e fingir que deu certo
4. ❌ Criar análises "falsas" baseadas em imaginação
5. ❌ Dizer "verifiquei o banco de dados" se não recebeu dados reais

## EXEMPLOS DE HONESTIDADE

### ✅ Correto (Ferramenta Falhou):
**[RESULTADO DA FERRAMENTA]:** \`{ "success": false, "error": "Timeout: Extension não executou o comando em 30s" }\`

**Sua Resposta:**
"❌ Falha ao executar. Erro: Timeout - a extensão Chrome não executou o comando em 30 segundos. Verifique se a extensão está ativa."

### ❌ ERRADO (Mentindo):
**[RESULTADO DA FERRAMENTA]:** \`{ "success": false, "error": "Timeout" }\`

**Sua Resposta:**  
"✅ Executei o comando! O navegador abriu com sucesso." ← **MENTIRA PROIBIDA**

## ⚠️ REGRA CRÍTICA #2: FERRAMENTAS ADMIN ⚠️

Se você receber:
- \`[ADMIN ERROR]: User role 'USER' não tem permissão\`
- \`[ADMIN ERROR]: Função admin-tools não disponível\`

**DIGA ISSO AO USUÁRIO**. Não invente que fez auditoria.

## FORMATO DE RESPOSTA

1. **Status**: ✅/❌ baseado NO RESULTADO REAL
2. **Ação**: O que foi tentado
3. **Erro** (se houver): Copie EXATAMENTE a mensa

gem de erro
4. **Próximos passos** (se aplicável): Como resolver
`;

// =====================================================
// HELPER: Clean JSON from LLM Response
// =====================================================

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.trim();

  // Remove ```json and ``` wrappers
  cleaned = cleaned.replace(/^```json\s*\n?/i, '');
  cleaned = cleaned.replace(/^```\s*\n?/, '');
  cleaned = cleaned.replace(/\n?```\s*$/, '');

  return cleaned.trim();
}

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
): Promise<{ success: boolean; message: string; executionLog?: string[] }> {
  const executionLog: string[] = [];

  executionLog.push(`🌐 [INÍCIO] Iniciando automação local`);
  executionLog.push(`📋 [AÇÃO] ${action}`);
  if (url) executionLog.push(`🔗 [URL] ${url}`);

  console.log("🌐 Starting LOCAL browser automation", { action, url });

  try {
    // 1. Check if extension is online
    executionLog.push(`🔍 [BUSCA] Procurando dispositivo online...`);

    // Busca simplificada usando apenas colunas existentes
    const { data: device } = await ctx.supabase
      .from("extension_devices")
      .select("device_id, id, status, last_seen")
      .eq("user_id", ctx.userId)
      .eq("status", "online")
      .limit(1)
      .maybeSingle();

    if (!device) {
      executionLog.push(`❌ [ERRO] Nenhum dispositivo online encontrado`);

      // Verificar último status conhecido para debug
      const { data: anyDevice } = await ctx.supabase
        .from("extension_devices")
        .select("device_id, status, last_seen")
        .eq("user_id", ctx.userId)
        .order("last_seen", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (anyDevice) {
        const lastSeen = anyDevice.last_seen ? new Date(anyDevice.last_seen).toLocaleString() : 'nunca';
        executionLog.push(`📱 [INFO] Dispositivo encontrado: ${anyDevice.status} (Visto em: ${lastSeen})`);

        return {
          success: false,
          message: `❌ Extensão Chrome encontrada mas está **${anyDevice.status}**.\n\n**Última conexão**: ${lastSeen}\n**Como resolver**: Reabra a extensão Chrome e certifique-se que ela está conectada.`,
          executionLog,
        };
      }

      executionLog.push(`📱 [INFO] Nenhum dispositivo registrado no banco`);
      return {
        success: false,
        message: "❌ Extensão Chrome não registrada.\n\n**Como resolver**: Abra a extensão Chrome e faça login no SyncAds pela primeira vez.",
        executionLog,
      };
    }

    executionLog.push(`✅ [DISPOSITIVO] Encontrado: ${device.device_id}`);
    console.log("✅ Extension online:", device.device_id);

    // 2. Parse action to DOM command
    const domCommand = parseActionToDomCommand(action, url);
    executionLog.push(`🔧 [COMANDO] Tipo: ${domCommand.type}`);
    if (domCommand.url) executionLog.push(`🔗 [DESTINO] ${domCommand.url}`);
    console.log("🔧 Parsed command:", domCommand);
    console.log("🔍 [DEBUG] Full domCommand object:", JSON.stringify(domCommand, null, 2));

    // 3. Create command in database
    executionLog.push(`💾 [DB] Criando comando no banco...`);

    const commandToInsert = {
      device_id: device.device_id,
      user_id: ctx.userId,
      type: domCommand.type,
      command_type: domCommand.type,
      selector: domCommand.selector || null,
      value: domCommand.value || null,
      options: { url: domCommand.url, ...domCommand },
      status: "pending",
    };

    console.log("🔍 [DEBUG] About to insert command:", JSON.stringify(commandToInsert, null, 2));

    const { data: command, error: insertError } = await ctx.supabase
      .from("extension_commands")
      .insert(commandToInsert)
      .select()
      .single();

    if (insertError) {
      executionLog.push(`❌ [ERRO DB] ${insertError.message}`);
      console.error("❌ Failed to create command:", insertError);
      console.error("❌ [INSERT ERROR DETAILS]:", JSON.stringify(insertError, null, 2));
      console.error("❌ [COMMAND DATA]:", JSON.stringify(commandToInsert, null, 2));
      return {
        success: false,
        message: `❌ Erro ao criar comando: ${insertError.message}\n\n**Código**: ${insertError.code}\n**Detalhes**: ${insertError.details || 'N/A'}\n**Hint**: ${insertError.hint || 'N/A'}`,
        executionLog,
      };
    }

    executionLog.push(`✅ [DB] Comando criado: ID ${command.id}`);
    executionLog.push(`⏱️ [ESPERA] Aguardando extensão executar (timeout: 30s)...`);
    console.log("📝 Command created:", command.id);
    console.log("⏱️ Waiting for execution...");

    // 4. Wait for command completion
    const result = await waitForCommandCompletion(ctx.supabase, command.id, executionLog);

    if (result.success) {
      executionLog.push(`✅ [SUCESSO] Comando executado com sucesso!`);
      const executionDetails = result.result ? JSON.stringify(result.result, null, 2) : "";

      return {
        success: true,
        message: `✅ Ação executada com sucesso!

**Comando:** ${domCommand.type}
**Status:** Completado
${domCommand.url ? `**URL:** ${domCommand.url}\n` : ""}
${executionDetails ? `**Detalhes:**\n\`\`\`\n${executionDetails}\n\`\`\`\n` : ""}

A ação foi confirmada pela extensão Chrome.`,
        executionLog,
      };
    } else {
      executionLog.push(`❌ [FALHA] ${result.error}`);
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
        executionLog,
      };
    }
  } catch (e: any) {
    executionLog.push(`❌ [EXCEÇÃO] ${e.message}`);
    console.error("❌ Local browser automation error:", e);
    return {
      success: false,
      message: `❌ Erro inesperado: ${e.message}`,
      executionLog,
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
  executionLog?: string[],
  timeout = 30000
): Promise<{ success: boolean; result?: any; error?: string }> {
  const startTime = Date.now();
  const pollInterval = 500; // Check every 500ms
  let lastStatus = "pending";

  while (Date.now() - startTime < timeout) {
    const { data: command } = await supabase
      .from("extension_commands")
      .select("status, result, error")
      .eq("id", commandId)
      .single();

    if (!command) {
      const errorMsg = "Comando não encontrado no banco de dados";
      executionLog?.push(`❌ [ERRO] ${errorMsg}`);
      return { success: false, error: errorMsg };
    }

    // Log mudança de status
    if (command.status !== lastStatus) {
      executionLog?.push(`📊 [STATUS] ${lastStatus} → ${command.status}`);
      console.log(`📊 Command status changed: ${lastStatus} → ${command.status}`);
      lastStatus = command.status;
    }

    if (command.status === "completed") {
      executionLog?.push(`✅ [COMPLETO] Comando executado pela extensão`);
      console.log("✅ Command completed successfully");
      return { success: true, result: command.result };
    }

    if (command.status === "failed") {
      const errorMsg = command.error || "Erro desconhecido";
      executionLog?.push(`❌ [FALHOU] ${errorMsg}`);
      console.log("❌ Command failed:", errorMsg);
      return { success: false, error: errorMsg };
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  const timeoutMsg = `Timeout: Extensão não executou o comando em ${timeout / 1000}s. Verifique se a extensão está ativa.`;
  executionLog?.push(`⏱️ [TIMEOUT] ${timeoutMsg}`);
  console.log("⏱️ Command timeout");
  return { success: false, error: timeoutMsg };
}

async function webSearch(query: string): Promise<{ success: boolean; message: string; executionLog?: string[] }> {
  // TODO: Integrar API real
  return {
    success: false,
    message: `⚠️ Busca web ainda não implementada.

**Query**: "${query}"

**Status**: Integração com Tavily/Serper será adicionada em breve.

**Alternativa**: Use "pesquise [termo] no google" para abrir busca no navegador.`,
    executionLog: [`⚠️ Busca web não implementada ainda`],
  };
}

// =====================================================
// ADMIN TOOLS
// =====================================================

function detectAdminIntent(message: string): string | null {
  const lower = message.toLowerCase();

  const adminKeywords = [
    'auditoria', 'auditar', 'verificar sistema', 'diagnosticar',
    'ver logs', 'corrigir banco', 'executar sql', 'deploy',
    'restart', 'reiniciar serviço', 'limpar comandos'
  ];

  for (const keyword of adminKeywords) {
    if (lower.includes(keyword)) {
      if (lower.includes('auditoria') || lower.includes('auditar')) return 'audit';
      if (lower.includes('log')) return 'logs';
      if (lower.includes('sql')) return 'sql';
      if (lower.includes('deploy') || lower.includes('restart')) return 'deploy';
      return 'general';
    }
  }

  return null;
}

async function executeAdminTool(
  ctx: { supabase: any; userId: string },
  action: string,
  adminAction?: string
): Promise<{ success: boolean; message: string; data?: any }> {

  const { data: profile, error: profileError } = await ctx.supabase
    .from('profiles')
    .select('role')
    .eq('id', ctx.userId)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      message: '[ADMIN ERROR]: Não foi possível verificar seu perfil.'
    };
  }

  const userRole = profile.role;

  if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
    return {
      success: false,
      message: `[ADMIN ERROR]: User role '${userRole}' não tem permissão. Apenas ADMIN ou SUPER_ADMIN.`
    };
  }

  try {
    const adminToolsUrl = Deno.env.get('VITE_ADMIN_TOOLS_URL');
    if (!adminToolsUrl) {
      return {
        success: false,
        message: '[ADMIN ERROR]: URL admin-tools não configurada.'
      };
    }

    const response = await fetch(adminToolsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        action: adminAction || action,
        userId: ctx.userId
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: `[ADMIN ERROR]: ${result.error || 'Falha ao executar'}`
      };
    }

    return {
      success: true,
      message: `[ADMIN RESULT]: ${result.message || 'Sucesso'}`,
      data: result.data
    };

  } catch (error) {
    return {
      success: false,
      message: `[ADMIN ERROR]: ${error.message}`
    };
  }
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

function detectIntent(message: string): { tool: string; action: string; url?: string; adminAction?: string } | null {
  const lower = message.toLowerCase();
  const urlMatch = message.match(/https?:\/\/[^\s]+/);
  const explicitUrl = urlMatch?.[0];

  // Admin intent (PRIMEIRO)
  const adminAction = detectAdminIntent(message);
  if (adminAction) {
    return {
      tool: 'admin',
      action: message,
      adminAction
    };
  }

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
    console.log("🚀 SyncAds Chat Stream v5.1 - Local Automation Ready");

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
      // Limpar a resposta antes de fazer parse
      const cleanedResponse = cleanJsonResponse(thinkerResponse);
      plan = JSON.parse(cleanedResponse);
      console.log("✅ Thinker plan parsed successfully");
    } catch (e) {
      console.warn("⚠️ Failed to parse Thinker response as JSON, using fallback", e);
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
      } else if (intent.tool === "admin") {
        // NOVO: Executar ferramenta admin
        console.log("🔐 Using ADMIN tools");
        toolResultObj = await executeAdminTool(
          { supabase, userId: user.id },
          intent.action,
          intent.adminAction
        );
      }
    }

    // Preparar logs de execução para o THINKER ver
    const executionLogs = toolResultObj.executionLog?.join("\n") || "Sem logs de execução";

    // EXECUTOR PHASE
    console.log("⚡ Calling Executor...");

    const executorMessages = [
      { role: "system", content: EXECUTOR_PROMPT },
      ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    if (toolResultObj.message) {
      // Incluir logs de execução para contexto
      const feedbackMessage = `[RESULTADO DA FERRAMENTA]:\n${toolResultObj.message}\n\n**Status**: ${toolResultObj.success ? "✅ Sucesso" : "❌ Falha"}\n\n**Logs de Execução**:\n${executionLogs}\n\nIMPORTANTE: Seja HONESTO com o usuário sobre este resultado!`;

      executorMessages.push({
        role: "system",
        content: feedbackMessage,
      });
    }

    executorMessages.push({ role: "user", content: message });

    const executorResponse = await callLLM(executor.provider, executor.apiKey, executor.model, executorMessages, executor.temperature);

    // COMBINE WITH THINKING (apenas o reasoning, não o JSON completo)
    const reasoning = plan.reasoning || "Processando sua solicitação...";
    const thinkingBlock = `<antigravity_thinking>${reasoning}</antigravity_thinking>`;
    const finalPayload = `${thinkingBlock}\n\n${executorResponse}`;

    console.log("✅ Response complete");

    // SAVE (incluir logs de execução no metadata para memória)
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
          execution_logs: toolResultObj.executionLog || [],
          timestamp: new Date().toISOString(),
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

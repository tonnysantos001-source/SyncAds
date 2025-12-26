import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  handlePreflightRequest,
  errorResponse,
} from "../_utils/cors.ts";
import { captureAndStoreScreenshot, createScreenshotEvidence } from "../_utils/screenshot-capture.ts";
import { validateResult } from "../_utils/verification-guard.ts";
import { verifyWithVision, createVisionEvidence } from "../_utils/vision-verification.ts";

// =====================================================
// PROMPTS V2 - LOADED FROM FILES (ANTI-LIE)
// =====================================================

/**
 * ⚠️ CRITICAL: Load prompts from .md files instead of inline
 * This ensures we use the superior V2 prompts that include
 * verification requirements and anti-hallucination rules
 */

let THINKER_PROMPT = "";
let EXECUTOR_PROMPT = "";

async function loadPrompts() {
  try {
    console.log("📋 [PROMPTS] Loading V2 prompts from files...");

    const thinkerPath = new URL('./prompts/SYSTEM_PROMPT_THINKER_V2.md', import.meta.url);
    const executorPath = new URL('./prompts/SYSTEM_PROMPT_EXECUTOR_V2.md', import.meta.url);

    THINKER_PROMPT = await Deno.readTextFile(thinkerPath);
    EXECUTOR_PROMPT = await Deno.readTextFile(executorPath);

    console.log("✅ [PROMPTS] THINKER_V2 LOADED - Length:", THINKER_PROMPT.length, "chars");
    console.log("✅ [PROMPTS] EXECUTOR_V2 LOADED - Length:", EXECUTOR_PROMPT.length, "chars");
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  🧠 PROMPTS V2 ACTIVE                                 ║
║                                                        ║
║  Superior prompts with verification requirements      ║
║  loaded from .md files successfully.                  ║
║                                                        ║
║  Anti-hallucination rules: ENABLED                    ║
╚═══════════════════════════════════════════════════════╝
    `);

    return true;
  } catch (error) {
    console.error("❌ [PROMPTS] FAILED to load V2 prompts:", error);
    console.error("⚠️ [PROMPTS] Falling back to inline prompts (INFERIOR)");

    // Fallback to minimal inline prompts if files not found
    THINKER_PROMPT = `You are a planning agent. Return JSON with: {tool, action, reasoning}`;
    EXECUTOR_PROMPT = `You execute actions and report results HONESTLY. Never claim success without evidence.`;

    return false;
  }
}

// Load prompts immediately on module initialization
await loadPrompts();

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

async function executeMemorize(
  ctx: { supabase: any; userId: string; userToken: string },
  content: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Extrair o conteúdo real (remover "aprenda isso:" do começo)
    const cleanContent = content.replace(/^(aprenda|memorize|leia|estude)\s+(isso|isto|este texto|o seguinte)?[:\s]*/i, "").trim();

    if (cleanContent.length < 10) {
      return { success: false, message: "O texto é muito curto para memorizar." };
    }

    const functionsUrl = Deno.env.get("SUPABASE_URL")?.replace(".co", ".co/functions/v1/embed-documents")!;

    // Call embed-documents
    const res = await fetch(functionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ctx.userToken}`
      },
      body: JSON.stringify({
        title: `Nota Rápida via Chat - ${new Date().toLocaleString()}`,
        content: cleanContent,
        type: "text/plain"
      })
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, message: `Erro ao memorizar: ${err}` };
    }

    const data = await res.json();
    return {
      success: true,
      message: `🧠 Memória atualizada! O conhecimento foi salvo e fragmentado em ${data.chunksProcessed} partes.`
    };

  } catch (e: any) {
    return { success: false, message: `Erro: ${e.message}` };
  }
}

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
      .order("last_seen", { ascending: false }) // FIX CRÍTICO: Pegar sempre o mais recente
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

    // ⭐ FASE 4: SCREENSHOT BEFORE (MANDATORY EVIDENCE)
    executionLog.push(`📸 [SCREENSHOT] Capturing BEFORE state...`);
    const screenshotBefore = await captureAndStoreScreenshot(
      ctx.supabase,
      ctx.userId,
      command.id,
      "before"
    );

    if (screenshotBefore.success) {
      executionLog.push(`✅ [SCREENSHOT] Before captured: ${screenshotBefore.url || 'base64'}`);
    } else {
      executionLog.push(`⚠️ [SCREENSHOT] Before failed: ${screenshotBefore.error}`);
    }

    executionLog.push(`⏱️ [ESPERA] Aguardando extensão executar (timeout: 30s)...`);
    console.log("📝 Command created:", command.id);
    console.log("⏱️ Waiting for execution...");

    // 4. Wait for command completion
    const result = await waitForCommandCompletion(ctx.supabase, command.id, executionLog);

    // ⭐ FASE 4: SCREENSHOT AFTER (MANDATORY EVIDENCE)
    executionLog.push(`📸 [SCREENSHOT] Capturing AFTER state...`);
    const screenshotAfter = await captureAndStoreScreenshot(
      ctx.supabase,
      ctx.userId,
      command.id,
      "after"
    );

    if (screenshotAfter.success) {
      executionLog.push(`✅ [SCREENSHOT] After captured: ${screenshotAfter.url || 'base64'}`);
    } else {
      executionLog.push(`⚠️ [SCREENSHOT] After failed: ${screenshotAfter.error}`);
    }

    if (result.success) {
      executionLog.push(`✅ [SUCESSO] Comando executado com sucesso!`);
      const executionDetails = result.result ? JSON.stringify(result.result, null, 2) : "";

      // ⭐ CREATE EVIDENCE ARRAY (ANTI-LIE)
      const evidence = [];

      // Add screenshot evidence
      if (screenshotBefore.success) {
        evidence.push(createScreenshotEvidence(screenshotBefore, "before", action));
      }
      if (screenshotAfter.success) {
        evidence.push(createScreenshotEvidence(screenshotAfter, "after", action));
      }

      // Add execution result as evidence
      evidence.push({
        type: "dom_state",
        data: {
          commandType: domCommand.type,
          commandResult: result.result,
          executionLog: executionLog.slice(-10), // Last 10 log entries
        },
        timestamp: Date.now(),
        verificationMethod: "command_completion",
      });

      const successResult = {
        success: true,
        message: `✅ Ação executada com sucesso!

**Comando:** ${domCommand.type}
**Status:** Completado e Verificado
${domCommand.url ? `**URL:** ${domCommand.url}\n` : ""}
${executionDetails ? `**Detalhes:**\n\`\`\`\n${executionDetails}\n\`\`\`\n` : ""}

📸 **Evidências Visuais:**
${screenshotBefore.success ? `- [Screenshot ANTES](${screenshotBefore.url})\n` : ''}
${screenshotAfter.success ? `- [Screenshot DEPOIS](${screenshotAfter.url})\n` : ''}

A ação foi confirmada pela extensão Chrome e capturada visualmente.`,
        executionLog,
        evidence, // ⭐ EVIDENCE ARRAY
      };

      // ⭐ VALIDATE WITH VERIFICATION GUARD
      return validateResult(successResult);
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
  if (lower.includes("preench") || lower.includes("digite") || lower.includes("escreva") || lower.includes("insira")) {
    return {
      type: "FILL",
      selector: extractSelector(action) || "input[type='text'], input[type='search'], textarea, [contenteditable='true']", // Improved default selector
      value: extractValue(action) || "",
    };
  }

  // SCROLL: "rolar", "scroll", "desça", "suba"
  if (lower.includes("rola") || lower.includes("scroll") || lower.includes("desça") || lower.includes("suba")) {
    let y = 500;
    if (lower.includes("suba") || lower.includes("cima")) y = -500;

    return {
      type: "SCROLL",
      y: y,
    };
  }

  // SCAN: "scan", "leia", "veja"
  if (action === "SCAN_PAGE" || lower.includes("scan") || lower.includes("leia")) {
    return {
      type: "SCAN_PAGE"
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

// Helper: Infer URL from action text (SMART DEEP LINKING)
function inferUrlFromAction(action: string): string {
  const lower = action.toLowerCase();
  const queryMatch = lower.match(/(?:busque|procure|pesquise|sobre|por)\s+(.+)/);
  const query = queryMatch ? encodeURIComponent(queryMatch[1].trim()) : "";

  // 1. Mercado Livre
  if (lower.includes("mercado livre") || lower.includes("mercadolivre")) {
    if (query) return `https://lista.mercadolivre.com.br/${query}`;
    return "https://www.mercadolivre.com.br";
  }

  // 2. Amazon BR
  if (lower.includes("amazon")) {
    if (query) return `https://www.amazon.com.br/s?k=${query}`;
    return "https://www.amazon.com.br";
  }

  // 3. Magalu
  if (lower.includes("magalu") || lower.includes("magazine luiza")) {
    if (query) return `https://www.magazineluiza.com.br/busca/${query}/`;
    return "https://www.magazineluiza.com.br";
  }

  // 4. Shopee
  if (lower.includes("shopee")) {
    if (query) return `https://shopee.com.br/search?keyword=${query}`;
    return "https://shopee.com.br";
  }

  // 5. Google (Default Search)
  if (lower.includes("google") || query) {
    if (query) return `https://www.google.com/search?q=${query}`;
    return "https://www.google.com";
  }

  // App Shortcuts (Phase 4)
  if (lower.includes("zap") || lower.includes("whatsapp")) return "https://web.whatsapp.com";
  if (lower.includes("email") || lower.includes("gmail")) return "https://mail.google.com";
  if (lower.includes("docs") || lower.includes("documento")) return "https://docs.google.com/create";
  if (lower.includes("sheets") || lower.includes("planilha")) return "https://sheets.google.com/create";

  // Documentation Shortcuts (Phase 7 - Ad Expert)
  if (lower.includes("meta ads") || lower.includes("facebook ads")) return "https://www.facebook.com/business/help/744354708981227"; // Guide: Create Campaign
  if (lower.includes("google ads")) return "https://support.google.com/google-ads/answer/6451500"; // Guide: Create Campaign
  if (lower.includes("tiktok ads")) return "https://ads.tiktok.com/help/article/getting-started-create-campaign";

  // Social Media defaults
  if (lower.includes("facebook")) return "https://facebook.com";
  if (lower.includes("instagram")) return "https://instagram.com";
  if (lower.includes("youtube")) return "https://youtube.com";
  if (lower.includes("twitter") || lower.includes("x.com")) return "https://x.com";

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
  // Extract quoted text or text after "com" or "digite"
  const quotedMatch = text.match(/"([^"]+)"/);
  if (quotedMatch) return quotedMatch[1];

  const comMatch = text.match(/(?:com|digite|escreva)\s+(.+)/);
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

async function webSearch(
  ctx: { supabase: any; userId: string },
  query: string
): Promise<{ success: boolean; message: string; executionLog?: string[] }> {
  const executionLog: string[] = [];
  executionLog.push(`🔍 [BUSCA] Iniciando pesquisa: "${query}"`);

  // 1. Tentar API Dedicada (Tavily/Serper) - Futuro
  const tavilyKey = Deno.env.get("TAVILY_API_KEY");
  if (tavilyKey) {
    // TODO: Implementar tavily integration
  }

  // 2. Fallback: Browser Automation (Google)
  executionLog.push(`🌐 [FALLBACK] Usando navegação local (Google)`);
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  // Reutilizar a função de automação local
  const browserResult = await executeLocalBrowser(ctx, "NAVIGATE", googleUrl);

  if (browserResult.success) {
    return {
      success: true,
      message: `✅ Pesquisa iniciada no Google.
          
**Query:** "${query}"
**Ação:** Aba aberta com os resultados.

**Próximo Passo:** O Agente pode usar a ferramenta "scan" ou "leia" para ver os resultados desta página.`,
      executionLog: [...executionLog, ...browserResult.executionLog || []]
    };
  }

  return {
    success: false,
    message: `❌ Falha ao abrir pesquisa: ${browserResult.message}`,
    executionLog: [...executionLog, ...browserResult.executionLog || []],
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
    // Fallback gracefully if model doesn't support vision but we sent vision
    if (error.includes("image_url") || error.includes("multimodal")) {
      console.warn("⚠️ Model doesn't support vision, retrying with text only...");
      const textOnlyMessages = messages.map(m => ({
        role: m.role,
        content: Array.isArray(m.content) ? m.content.find((c: any) => c.type === "text")?.text || "" : m.content
      }));
      return callLLM(provider, apiKey, model, textOnlyMessages, temp);
    }
    throw new Error(`LLM API error: ${error}`);
  }

  const json = await res.json();
  return json.choices?.[0]?.message?.content || "";
}

// Helper: Format message for Vision if screenshot present
function formatVisionMessage(role: string, text: string, screenshotUrl?: string): any {
  if (!screenshotUrl) return { role, content: text };

  // Only OpenAI/OpenRouter generic supports this format usually
  return {
    role,
    content: [
      { type: "text", text },
      {
        type: "image_url",
        image_url: {
          url: screenshotUrl,
          detail: "high"
        }
      }
    ]
  };
}

// =====================================================
// RAG / MEMORY SYSTEM
// =====================================================

async function generateEmbedding(text: string, apiKey: string, provider: string): Promise<number[] | null> {
  // Por enquanto, suporte primário a OpenAI para embeddings
  // Se usar outro provider para chat, tentaremos usar a mesma key se for compatível, ou falhar silenciosamente
  let url = "https://api.openai.com/v1/embeddings";

  // Ajuste se necessário para outros providers
  if (provider === "OPENROUTER") {
    // OpenRouter geralmente não tem endpoint de embeddings padronizado igual chat, 
    // mas alguns modelos suportam. Vamos assumir OpenAI por enquanto para estabilidade.
    // Se a chave for OpenRouter, isso vai falhar se não rotear.
    // TODO: Adicionar suporte explícito a outros providers de embedding.
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: text.replace(/\n/g, " "),
        model: "text-embedding-3-small"
      })
    });

    if (!res.ok) {
      console.warn("⚠️ Embedding API failed:", await res.text());
      return null;
    }

    const json = await res.json();
    return json.data?.[0]?.embedding || null;
  } catch (e) {
    console.error("❌ Embedding generation error:", e);
    return null;
  }
}

async function searchMemory(
  ctx: { supabase: any; userId: string },
  query: string,
  apiKey: string,
  provider: string
): Promise<string> {
  console.log("🧠 Searching memory for:", query.substring(0, 50) + "...");

  const embedding = await generateEmbedding(query, apiKey, provider);
  if (!embedding) {
    console.log("⚠️ No embedding generated, skipping memory search.");
    return "";
  }

  const { data: chunks, error } = await ctx.supabase.rpc('match_memory_chunks', {
    query_embedding: embedding,
    match_threshold: 0.5, // Similaridade mínima
    match_count: 3,       // Top 3 chunks
    p_user_id: ctx.userId
  });

  if (error) {
    console.error("❌ Memory search DB error:", error);
    return "";
  }

  if (!chunks || chunks.length === 0) {
    console.log("🧠 No relevant memories found.");
    return "";
  }

  console.log(`🧠 Found ${chunks.length} relevant memories.`);
  return chunks.map((c: any) => `[Conteúdo Recuperado da Memória: ${c.document_filename}]\n${c.content}`).join("\n\n");
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

  const scanTriggers = ["leia", "veja", "visão", "scan", "mapear", "quais botões", "analise a tela"];
  for (const trigger of scanTriggers) {
    if (lower.includes(trigger)) {
      return { tool: "scan", action: message };
    }
  }

  const searchTriggers = ["pesquis", "busc", "procur", "ache", "encontr", "qual", "quanto"];
  for (const trigger of searchTriggers) {
    if (lower.includes(trigger)) {
      return null;
    }
  }

  const memorizeTriggers = ["aprenda", "memorize", "estude", "leia isso", "guarde esta informação"];
  for (const trigger of memorizeTriggers) {
    if (lower.startsWith(trigger)) { // StartsWith para pegar comandos diretos
      return { tool: "memorize", action: message };
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

    // 1. Search Memory (RAG)
    const memoryContext = await searchMemory(
      { supabase, userId: user.id },
      message,
      thinker.apiKey,
      thinker.provider
    );

    // 2. Add Context to Prompt
    const thinkerPromptWithMemory = memoryContext
      ? `${THINKER_PROMPT}\n\n## 🧠 MEMÓRIA DE LONGO PRAZO RECUPERADA\nO usuário tem documentos salvos que podem ser relevantes:\n\n${memoryContext}\n\nUse essas informações se fizerem sentido para a pergunta.`
      : THINKER_PROMPT;

    const thinkerMessages = [
      { role: "system", content: thinkerPromptWithMemory },
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
      } else if (intent.tool === "scan") {
        console.log("👁️ Using SCAN (Vision)");
        toolResultObj = await executeLocalBrowser(
          { supabase, userId: user.id },
          "SCAN_PAGE"
        );
      } else if (intent.tool === "search") {
        console.log("🔍 Using SEARCH");
        toolResultObj = await webSearch(
          { supabase, userId: user.id },
          intent.action
        );
      } else if (intent.tool === "admin") {
        // NOVO: Executar ferramenta admin
        console.log("🔐 Using ADMIN tools");
        toolResultObj = await executeAdminTool(
          { supabase, userId: user.id },
          intent.action,
          intent.adminAction
        );
      } else if (intent.tool === "memorize") {
        console.log("🧠 Using MEMORIZE tool");
        toolResultObj = await executeMemorize(
          { supabase, userId: user.id, userToken: authHeader.replace("Bearer ", "") },
          intent.action
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
      // Incluir logs de execução e SCREENSHOT se houver
      const resultObj = toolResultObj.result || {};
      const screenshotUrl = resultObj?.originalResponse?.screenshotUrl || resultObj.screenshotUrl; // Fallback paths

      let feedbackText = `[RESULTADO DA FERRAMENTA]:\n${toolResultObj.message}\n\n**Status**: ${toolResultObj.success ? "✅ Sucesso" : "❌ Falha"}\n\n**Logs de Execução**:\n${executionLogs}`;

      if (screenshotUrl) {
        feedbackText += `\n\n📸 **Screenshot Capturado**: ${screenshotUrl}`;
        console.log("📸 Attaching screenshot to Executor context:", screenshotUrl);

        executorMessages.push(formatVisionMessage("system", feedbackText, screenshotUrl));
      } else {
        executorMessages.push({
          role: "system",
          content: feedbackText,
        });
      }
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

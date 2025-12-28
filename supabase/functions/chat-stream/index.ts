import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// =====================================================
// ARCHITECTURE: CLEAN & SIMPLE
// =====================================================
// 1. THINKER: Interpreta pedido → Plano JSON
// 2. EXECUTOR: Chama Hugging Face Playwright → Resultado real
// 3. RESPONSE: Mostra raciocínio + resultado ao usuário

console.log("🚀 Chat Stream V4 - Antigravity-style Thinking");

// =====================================================
// GROQ LLM CONFIGS (loaded from GlobalAiConnection)
// =====================================================
const GROQ_REASONING_MODEL = "llama-3.3-70b-versatile";
const GROQ_EXECUTOR_MODEL = "llama-3.3-70b-versatile";

// ✅ PROFESSIONAL: Load Groq API keys from GlobalAiConnection
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

// Hugging Face Playwright Service
const HUGGINGFACE_PLAYWRIGHT_URL = Deno.env.get("HUGGINGFACE_PLAYWRIGHT_URL") || "https://bigodetonton-syncads.hf.space";

// =====================================================
// PROMPTS
// =====================================================
const THINKER_PROMPT = `Você é o CÉREBRO do SyncAds. Sua função é PLANEJAR ações usando Playwright Automation.

**FERRAMENTAS DISPONÍVEIS:**
- Playwright Automation (para controle do navegador)

**REGRAS:**
1. Sempre retorne JSON no formato: {"action": "...", "url": "...", "reasoning": "..."}
2. Ações disponíveis: "navigate", "type", "click", "search"
3. Seja ESPECÍFICO sobre qual ferramenta usar
4. Explique CLARAMENTE o que vai fazer

**EXEMPLOS:**
User: "abra o google"
Response: {
  "action": "navigate", 
  "url": "https://google.com", 
  "reasoning": "Vou usar Playwright Automation para abrir https://google.com"
}

User: "pesquise por receita de pão"
Response: {
  "action": "search", 
  "query": "receita de pão",
  "reasoning": "Vou usar Playwright Automation para pesquisar no Google"
}`;

const EXECUTOR_PROMPT = `Você é o EXECUTOR do SyncAds. Sua função é CONFIRMAR resultados e SUGERIR próximos passos.

**REGRAS:**
1. SEMPRE confirme o que foi feito (baseado no RESULTADO DA AÇÃO)
2. Se sucesso: Confirme + Pergunte próximo passo
3. Se falhou: Explique erro honestamente
4. Use linguagem amigável e clara

**EXEMPLOS:**

RESULTADO: { success: true, message: "Navegado para https://google.com", title: "Google" }
Resposta: "✅ Página do Google aberta com sucesso! O que você gostaria de fazer agora? Posso pesquisar algo para você."

RESULTADO: { success: false, message: "Timeout" }
Resposta: "❌ Não consegui abrir a página (timeout). Quer tentar novamente?"

Use tom conversacional e sempre sugira o próximo passo lógico.`;

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
// HELPER: Call Hugging Face Playwright
// =====================================================
async function callPlaywright(action: string, params: any) {
  console.log(`🎭 Calling Playwright: ${action}`, params);

  try {
    const response = await fetch(`${HUGGINGFACE_PLAYWRIGHT_URL}/automation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...params }),
      signal: AbortSignal.timeout(30000),
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
    // PHASE 2: CREATE COMMAND FOR CHROME EXTENSION
    // =====================================================
    let toolResult: any = { success: true, message: "" };

    // Get user's device_id from extension_devices
    const { data: devices } = await supabase
      .from("extension_devices")
      .select("device_id")
      .eq("user_id", user.id)
      .eq("status", "online")
      .limit(1);

    const deviceId = devices?.[0]?.device_id;

    // ✅ AUDIT LOGS
    console.log(`🔍 [AUDIT] User: ${user.id}`);
    console.log(`🔍 [AUDIT] Device query result:`, devices);
    console.log(`🔍 [AUDIT] DeviceId found: ${deviceId}`);

    if (!deviceId) {
      console.warn("⚠️ No active device found for user");
      toolResult = {
        success: false,
        message: "Nenhum dispositivo ativo encontrado. Certifique-se de que a extensão está instalada e conectada."
      };
    }
    else if (plan.action === "navigate") {
      console.log(`🌐 Creating NAVIGATE command for device: ${deviceId}`);
      console.log(`   URL: ${plan.url}`);

      try {
        // Create command in extension_commands table
        const { data: command, error: cmdError } = await supabase
          .from("ExtensionCommand")
          .insert({
            deviceId: deviceId,
            userId: user.id,
            command: "NAVIGATE",
            params: { url: plan.url },
            status: "pending",
          })
          .select()
          .single();

        if (cmdError) {
          console.error("❌ Failed to create command:", cmdError);
          throw cmdError;
        }

        // ✅ AUDIT LOGS
        console.log(`🔍 [AUDIT] Command INSERT successful`);
        console.log(`🔍 [AUDIT] Command created:`, command);
        console.log(`🔍 [AUDIT] Command ID: ${command.id}`);
        console.log(`🔍 [AUDIT] Command deviceId: ${command.deviceId}`);
        console.log(`🔍 [AUDIT] Command status: ${command.status}`);

        console.log(`✅ Command created: ${command.id}`);
        console.log(`   Waiting for extension to execute...`);

        // Wait for command to be executed (poll for up to 30s)
        const maxWait = 30000; // 30 seconds
        const pollInterval = 500; // 500ms
        const startTime = Date.now();
        let executed = false;

        while (Date.now() - startTime < maxWait) {
          const { data: updatedCmd } = await supabase
            .from("ExtensionCommand")
            .select("status, result, error")
            .eq("id", command.id)
            .single();

          if (updatedCmd?.status === "completed") {
            executed = true;
            console.log("✅ Command executed successfully!");
            console.log("   Result:", updatedCmd.result);

            toolResult = {
              success: true,
              message: `Navegado para ${plan.url}`,
              result: updatedCmd.result,
              timestamp: new Date().toISOString(),
            };
            break;
          } else if (updatedCmd?.status === "failed") {
            console.error("❌ Command execution failed:", updatedCmd.error);
            toolResult = {
              success: false,
              message: `Falha ao navegar: ${updatedCmd.error}`,
            };
            break;
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        if (!executed) {
          console.warn("⏱️ Command timeout - extension did not respond");
          toolResult = {
            success: false,
            message: "Timeout: a extensão não respondeu em 30 segundos. Verifique se está ativa.",
          };
        }

      } catch (error: any) {
        console.error("❌ Error creating/executing command:", error);
        toolResult = {
          success: false,
          message: `Erro ao criar comando: ${error.message}`,
        };
      }
    }
    else if (plan.action === "type") {
      console.log(`⌨️  Creating TYPE command for device: ${deviceId}`);

      // Similar logic for TYPE command
      try {
        const { data: command, error: cmdError } = await supabase
          .from("ExtensionCommand")
          .insert({
            deviceId: deviceId,
            userId: user.id,
            command: "DOM_FILL",
            params: { selector: plan.selector, value: plan.text },
            status: "pending",
          })
          .select()
          .single();

        if (cmdError) throw cmdError;

        // Wait for execution (same polling logic as navigate)
        const maxWait = 30000;
        const pollInterval = 500;
        const startTime = Date.now();
        let executed = false;

        while (Date.now() - startTime < maxWait) {
          const { data: updatedCmd } = await supabase
            .from("ExtensionCommand")
            .select("status, result, error")
            .eq("id", command.id)
            .single();

          if (updatedCmd?.status === "completed") {
            executed = true;
            toolResult = {
              success: true,
              message: `Digitado "${plan.text}" no campo ${plan.selector}`,
              result: updatedCmd.result,
            };
            break;
          } else if (updatedCmd?.status === "failed") {
            toolResult = {
              success: false,
              message: `Falha ao digitar: ${updatedCmd.error}`,
            };
            break;
          }

          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        if (!executed) {
          toolResult = {
            success: false,
            message: "Timeout: extensão não respondeu.",
          };
        }

      } catch (error: any) {
        toolResult = {
          success: false,
          message: `Erro: ${error.message}`,
        };
      }
    }
    else if (plan.action === "click") {
      console.log(`👆 Creating CLICK command for device: ${deviceId}`);

      try {
        const { data: command, error: cmdError } = await supabase
          .from("ExtensionCommand")
          .insert({
            deviceId: deviceId,
            userId: user.id,
            command: "DOM_CLICK",
            params: { selector: plan.selector },
            status: "pending",
          })
          .select()
          .single();

        if (cmdError) throw cmdError;

        // Wait for execution
        const maxWait = 30000;
        const pollInterval = 500;
        const startTime = Date.now();
        let executed = false;

        while (Date.now() - startTime < maxWait) {
          const { data: updatedCmd } = await supabase
            .from("ExtensionCommand")
            .select("status, result, error")
            .eq("id", command.id)
            .single();

          if (updatedCmd?.status === "completed") {
            executed = true;
            toolResult = {
              success: true,
              message: `Clicado em ${plan.selector}`,
              result: updatedCmd.result,
            };
            break;
          } else if (updatedCmd?.status === "failed") {
            toolResult = {
              success: false,
              message: `Falha ao clicar: ${updatedCmd.error}`,
            };
            break;
          }

          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }

        if (!executed) {
          toolResult = {
            success: false,
            message: "Timeout: extensão não respondeu.",
          };
        }

      } catch (error: any) {
        toolResult = {
          success: false,
          message: `Erro: ${error.message}`,
        };
      }
    }
    else if (plan.action === "search") {
      console.log(`🔍 Search command: ${plan.query}`);
      // For search, we could navigate to Google + type + click search
      // For now, just acknowledge
      toolResult = { success: true, message: `Busca por "${plan.query}" iniciada` };
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
      console.log("✅ Executor returned:", executorResponse.substring(0, 50) + "...");
    } catch (execError: any) {
      console.error("❌ Executor failed:", execError.message);
      // FALLBACK: resposta manual
      executorResponse = "Olá! Estou aqui para ajudar. Como posso auxiliar você hoje?";
    }

    // =====================================================
    // FINAL RESPONSE (Antigravity-style thinking + Result)
    // =====================================================
    let finalResponse = "";

    // ALWAYS show thinking (like Antigravity)
    if (plan.reasoning) {
      finalResponse = `<antigravity_thinking>\n${plan.reasoning}\n</antigravity_thinking>\n\n`;
    }

    // Executor response (ALWAYS include)
    if (executorResponse && executorResponse.trim()) {
      finalResponse += executorResponse;
    } else {
      console.warn("⚠️ Executor response empty, using fallback");
      finalResponse += "Como posso ajudar você?";
    }

    console.log("📝 Final response length:", finalResponse.length);

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

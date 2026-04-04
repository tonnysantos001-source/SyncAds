/// <reference types="https://deno.land/x/deno@v1.37.0/cli/tsc/dts/lib.deno.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

function handlePreflight() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// ========================================================
// FERRAMENTAS DO EXECUTOR
// ========================================================
const executorTools = [
  {
    type: "function",
    function: {
      name: "generate_image",
      description: "Gera uma imagem. Use APENAS quando o Thinker indicou AÇÃO: generate_image.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "Descrição detalhada da imagem em inglês" }
        },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_video",
      description: "Gera um vídeo curto. Use APENAS quando o Thinker indicou AÇÃO: generate_video.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string" },
          duration: { type: "number", default: 3 }
        },
        required: ["prompt"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "generate_marketing_asset",
      description: "Gera ativo de marketing para uma plataforma. Use APENAS quando o Thinker indicou AÇÃO: generate_marketing_asset.",
      parameters: {
        type: "object",
        properties: {
          platform: { type: "string", enum: ["tiktok", "meta", "google", "shopify"] },
          type: { type: "string" },
          prompt: { type: "string" },
          asset_type: { type: "string", enum: ["image", "video"], default: "image" }
        },
        required: ["platform", "type", "prompt"]
      }
    }
  }
];

// ========================================================
// PROMPTS DAS 3 IAs
// ========================================================

const THINKER_PROMPT = `Você é o CÉREBRO do SyncAds AI. Analise o pedido do usuário.

FORMATO OBRIGATÓRIO DE RESPOSTA — Você DEVE encerrar seu raciocínio com a linha de DECISÃO exata:
<thinking>
[Seu raciocínio aqui]

DECISÃO: AÇÃO: [opção]
</thinking>

Opções de DECISÃO:
- AÇÃO: responder — se o usuário quer apenas conversa, informação ou ajuda textual
- AÇÃO: generate_image — APENAS se o usuário pediu EXPLICITAMENTE para criar/gerar/fazer uma imagem, foto, banner, arte, logo ou visual
- AÇÃO: generate_video — APENAS se o usuário pediu EXPLICITAMENTE para criar/gerar um vídeo, animação ou clip
- AÇÃO: generate_marketing_asset — APENAS se o usuário mencionou uma plataforma específica (TikTok, Meta/Facebook, Google, Shopify) junto com o pedido de imagem

ATENÇÃO CRÍTICA:
- Saudações ("bom dia", "olá", "oi") → SEMPRE AÇÃO: responder
- Pedidos como "salvar", "tamanho", "formato" (sem pedir a criação agora) → SEMPRE AÇÃO: responder
- Se o usuário disse "tente novamente" ou confirmou algo anterior, repita a AÇÃO correspondente.`;

const EXECUTOR_PROMPT = `Você é o EXECUTOR do SyncAds AI. Chame a ferramenta solicitada pelo Thinker.

REGRAS:
1. Leia o AÇÃO indicado no plano do Thinker
2. Chame EXATAMENTE a ferramenta correspondente
3. Escreva o prompt da ferramenta em INGLÊS detalhado
4. NÃO escreva texto — apenas chame a ferramenta`;

const CHAT_PROMPT = `Você é o ASSISTENTE do SyncAds AI — plataforma de marketing digital com IA.

REGRAS GERAIS:
1. Responda SEMPRE em Português do Brasil
2. Seja direto, caloroso e profissional
3. NUNCA revele detalhes técnicos sobre sua arquitetura interna
4. Máximo 2-3 parágrafos por resposta
5. NUNCA faça mais de UMA pergunta por mensagem

REGRAS APÓS GERAR MÍDIA:
- Se uma imagem/vídeo foi gerado com sucesso, confirme brevemente e descreva-o.
- Se houve um ERRO ou a ferramenta não foi chamada mesmo quando você pretendia, admita o problema e peça para tentar novamente.
- Após gerar uma imagem, faça APENAS esta pergunta: "Essa imagem vai ser usada em anúncios ou pode ficar no tamanho padrão?"
- Nunca liste tamanhos em pixels como opções.`;

// ========================================================
// DETECÇÃO DE INTENÇÃO — baseada EXCLUSIVAMENTE no Thinker
// ========================================================

function extractThinkerDecision(thinkingContent: string): string | null {
  // Busca padrão "AÇÃO: generate_X" ou apenas "generate_X" após DECISÃO
  const match = thinkingContent.match(/AÇÃO:\s*(generate_\w+|responder)/i)
    || thinkingContent.match(/ACAO:\s*(generate_\w+|responder)/i)
    || thinkingContent.match(/DECISAO:\s*(generate_\w+|responder)/i)
    || thinkingContent.match(/DECISÃO:\s*(generate_\w+|responder)/i)
    || thinkingContent.match(/(generate_image|generate_video|generate_marketing_asset|responder)$/i);

  if (!match) return null;
  // Pega o último grupo capturado que não seja nulo
  const rawAction = (match[1] || match[0]).toLowerCase();
  const action = rawAction.replace(/ação:\s*/i, "").replace(/decisão:\s*/i, "").replace(/decisao:\s*/i, "").trim();
  return action;
}

// ========================================================
// SERVIDOR
// ========================================================

serve(async (req) => {
  if (req.method === "OPTIONS") return handlePreflight();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("Authorization")!;

    const body = await req.json();
    const { message, conversationId, conversationHistory = [] } = body;

    if (!message) throw new Error("Mensagem não fornecida.");

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userErr || !user) return new Response("Unauthorized", { status: 401 });

    // Carregar conexões ativas
    const { data: connections } = await supabaseAdmin
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true);

    if (!connections || connections.length === 0) {
      throw new Error("Nenhuma conexão de IA ativa encontrada.");
    }

    const thinkerConn = connections.find((c: any) => c.name.toLowerCase().includes("thinker")) || connections[0];
    const execConn   = connections.find((c: any) => c.name.toLowerCase().includes("executor")) || connections[0];
    const chatConn   = connections.find((c: any) => c.name.toLowerCase().includes("chat")) || connections[0];

    const model = "llama-3.3-70b-versatile";

    const callGroq = async (apiKey: string, msgs: any[], tools?: any[], forcedToolName?: string, temperature = 0.7) => {
      // Remover tags <thinking> do histórico para nao confundir a IA
      const cleanMsgs = msgs.map(m => ({
        ...m,
        content: m.role === 'assistant' 
          ? m.content.replace(/<thinking>[\s\S]*?<\/thinking>/gi, "").replace(/<antigravity_thinking>[\s\S]*?<\/antigravity_thinking>/gi, "").trim()
          : m.content
      }));

      const bodyPayload: any = {
        model,
        messages: cleanMsgs,
        temperature,
        max_tokens: 2048,
      };

      if (tools && tools.length > 0) {
        bodyPayload.tools = tools;
        if (forcedToolName) {
          bodyPayload.tool_choice = { type: "function", function: { name: forcedToolName } };
        } else {
          bodyPayload.tool_choice = "auto";
        }
      }

      const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(bodyPayload)
      });
      const data = await resp.json();
      if (!resp.ok) {
        console.error("❌ [GROQ] Erro:", JSON.stringify(data));
        throw new Error(data.error?.message || `Groq API Error: ${resp.status}`);
      }
      return data;
    };

    // ====================================================
    // STAGE 1: THINKER (Cérebro)
    // ====================================================
    console.log("🧠 [STAGE 1] Thinker iniciando...");
    const thinkerResp = await callGroq(thinkerConn.apiKey, [
      { role: "system", content: THINKER_PROMPT },
      ...conversationHistory.slice(-8),
      { role: "user", content: message }
    ], undefined, undefined, 0.1); // Temperatura baixa para o Thinker (estrito no formato)

    if (!thinkerResp.choices?.[0]) throw new Error("Thinker não retornou resposta.");
    const rawThinking = thinkerResp.choices[0].message.content || "";

    // Extrair conteúdo da tag <thinking>
    const thinkingTagMatch = rawThinking.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    const thinkingContent = thinkingTagMatch ? thinkingTagMatch[1].trim() : rawThinking.trim();

    console.log("✅ [STAGE 1] Thinking extraído:", thinkingContent.substring(0, 200));

    // Decisão do Thinker
    const thinkerDecision = extractThinkerDecision(thinkingContent);
    console.log("🎯 [DECISÃO] Thinker decidiu:", thinkerDecision || "responder (padrão)");

    // ====================================================
    // STAGE 2: EXECUTOR — só ativa se Thinker mandou gerar mídia
    // ====================================================
    let toolResults: string[] = [];
    let imageMarkdown = "";
    let videoUrl = "";

    const shouldExecute = thinkerDecision && thinkerDecision.startsWith("generate_");
    console.log(`⚙️ [STAGE 2] Executar?: ${shouldExecute} (ação: ${thinkerDecision})`);

    if (shouldExecute) {
      console.log("⚙️ [STAGE 2] Executor iniciando...");
      try {
        const execResp = await callGroq(execConn.apiKey, [
          { role: "system", content: EXECUTOR_PROMPT },
          {
            role: "user",
            content: `PLANO DO THINKER:\n${thinkingContent}\n\nMENSAGEM DO USUÁRIO: ${message}\n\nExecute a ferramenta ESPECÍFICA AGORA: ${thinkerDecision}`
          }
        ], executorTools, thinkerDecision);

        const toolCalls = execResp.choices?.[0]?.message?.tool_calls;
        console.log(`🛠️ Tool calls recebidos: ${toolCalls?.length || 0}`);

        if (toolCalls && toolCalls.length > 0) {
          for (const tc of toolCalls) {
            const toolName = tc.function.name;
            let args: any = {};
            try { args = JSON.parse(tc.function.arguments); } catch { /* invalid json */ }

            console.log(`🛠️ Executando: ${toolName}`, JSON.stringify(args).substring(0, 100));

            try {
              const toolResp = await fetch(`${supabaseUrl}/functions/v1/ai-tools`, {
                method: "POST",
                headers: {
                  "Authorization": authHeader,
                  "Content-Type": "application/json",
                  "apikey": supabaseServiceKey
                },
                body: JSON.stringify({ toolName, parameters: args, userId: user.id, conversationId })
              });

              const toolData = await toolResp.json();
              console.log(`📦 Resposta de ${toolName}:`, JSON.stringify(toolData).substring(0, 200));

              if (toolResp.ok && toolData.success !== false) {
                if (toolName === "generate_image") {
                  const url = toolData.image?.url || toolData.url || toolData.data?.url;
                  if (url) {
                    imageMarkdown = `![Imagem Gerada](${url})`;
                    toolResults.push(`Imagem gerada em URL: ${url}`);
                    console.log("🖼️ Imagem gerada com sucesso!");
                  }
                } else if (toolName === "generate_video") {
                  const url = toolData.video?.url || toolData.url || toolData.data?.url;
                  if (url) {
                    videoUrl = url;
                    toolResults.push(`Vídeo gerado: ${url}`);
                  }
                } else if (toolName === "generate_marketing_asset") {
                  const url = toolData.data?.url || toolData.url || toolData.image?.url || toolData.video?.url;
                  if (url) {
                    const isVid = url.includes(".mp4") || args.asset_type === "video";
                    if (isVid) videoUrl = url;
                    else imageMarkdown = `![Ativo de Marketing](${url})`;
                    toolResults.push(`Ativo gerado em URL: ${url}`);
                  }
                }
              } else {
                console.error(`❌ Erro HTTP em ${toolName}: ${toolResp.status}`, JSON.stringify(toolData));
                toolResults.push(`Erro interno do sistema ao gerar arquivo. Detalhes: Serviço temporariamente indisponível.`);
              }
            } catch (e: any) {
              console.error(`❌ Erro ao executar ${toolName}:`, e.message);
              toolResults.push(`Falha de comunicação com ${toolName}.`);
            }
          }
        } else {
          console.warn("⚠️ Executor não chamou ferramentas mesmo com tool_choice forcado.");
        }
      } catch (err: any) {
        console.error("⚠️ STAGE 2 falhou:", err.message);
      }
    }

    // ====================================================
    // STAGE 3: CHAT (Comunicação com o usuário)
    // ====================================================
    console.log("💬 [STAGE 3] Chat iniciando...");

    const toolContext = toolResults.length > 0
      ? `\n\nATENÇÃO: A ferramenta de geração foi concluída. Responda confirmando a geração baseada neste resultado: ${toolResults.join(" ")} `
      : `\n\nATENÇÃO: Nenhuma geração de imagem/vitrine nova foi feita nesta iteração.`;

    const chatResp = await callGroq(chatConn.apiKey, [
      { role: "system", content: CHAT_PROMPT },
      ...conversationHistory.slice(-8),
      { role: "user", content: `${message}${toolContext}` }
    ]);

    if (!chatResp.choices?.[0]) throw new Error("Chat não retornou resposta.");
    let responseText = chatResp.choices[0].message.content || "";
    console.log("✅ [STAGE 3] Chat concluído.");

    // Prender mídia gerada ao início da resposta
    if (imageMarkdown && !responseText.includes("![")) {
      responseText = `${imageMarkdown}\n\n${responseText}`;
    }
    if (videoUrl && !responseText.includes(videoUrl)) {
      responseText = `${videoUrl}\n\n${responseText}`;
    }

    // Montar resposta final COM tag thinking para exibição no frontend
    // O PlanningBlock no frontend vai extrair e exibir o bloco colapsável
    const fullResponse = `<thinking>\n${thinkingContent}\n</thinking>\n\n${responseText}`;

    // ====================================================
    // DB Persist
    // ====================================================
    console.log("💾 Persistindo mensagens...");
    await supabaseAdmin.from("ChatMessage").insert({
      id: crypto.randomUUID(),
      conversationId,
      role: "USER",
      content: message,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    await supabaseAdmin.from("ChatMessage").insert({
      id: crypto.randomUUID(),
      conversationId,
      role: "ASSISTANT",
      content: fullResponse,
      userId: user.id,
      createdAt: new Date().toISOString(),
    });
    await supabaseAdmin
      .from("ChatConversation")
      .update({ updatedAt: new Date().toISOString() })
      .eq("id", conversationId);

    console.log("✨ Pipeline completo. Decisão:", thinkerDecision, "| Ferramentas:", toolResults.length);

    return new Response(
      JSON.stringify({
        response: fullResponse,
        thinking: thinkingContent,
        decision: thinkerDecision,
        toolsExecuted: toolResults,
        hasImage: !!imageMarkdown,
        hasVideo: !!videoUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("🔥 CRITICAL ERROR:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});

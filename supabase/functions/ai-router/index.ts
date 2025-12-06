/**
 * ============================================
 * AI ROUTER - ROTEADOR INTELIGENTE DE IAs
 * ============================================
 *
 * Seleciona automaticamente a melhor IA entre Groq, Gemini e Python Backend
 * baseado no tipo de tarefa solicitada pelo usuário.
 *
 * IAs Disponíveis:
 * - GROQ (Llama 3.3 70B) - Chat rápido, grátis, 500-800 tokens/seg
 * - GEMINI (2.0 Flash) - Multimodal, imagens, PDFs, 1M tokens contexto
 * - PYTHON - Browser automation com Browser-Use e Playwright
 *
 * Autor: SyncAds AI Team
 * Data: 05/12/2025
 * ============================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES
// ============================================

interface AIRouterRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  context?: {
    extensionActive?: boolean;
    currentUrl?: string;
    attachments?: Array<{
      type: string;
      url: string;
      size: number;
    }>;
  };
}

interface AISelection {
  provider: "GROQ" | "GOOGLE" | "PYTHON";
  model: string;
  reason: string;
  confidence: number; // 0-100
  pythonEndpoint?: string;
}

interface AIRouterResponse {
  selection: AISelection;
  alternatives?: AISelection[];
  analysis: {
    needsImage: boolean;
    needsMultimodal: boolean;
    hasAttachment: boolean;
    needsAutomation: boolean;
    complexity: "low" | "medium" | "high";
    messageLength: number;
  };
}

// ============================================
// CONFIGURATION
// ============================================

const PYTHON_SERVICE_URL =
  Deno.env.get("PYTHON_SERVICE_URL") ||
  "https://syncads-python-service.railway.app";

// ============================================
// CORS HEADERS
// ============================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData: AIRouterRequest = await req.json();
    const { message, context } = requestData;

    if (!message || message.trim() === "") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🤖 [AI Router] Analyzing message:", {
      messagePreview: message.substring(0, 100),
      hasAttachments: context?.attachments?.length || 0,
    });

    // Analisar mensagem e contexto
    const analysis = analyzeMessage(message, context);

    // Selecionar IA
    const selection = selectAI(analysis, message, context);

    // Gerar alternativas (para debugging)
    const alternatives = generateAlternatives(selection);

    const response: AIRouterResponse = {
      selection,
      alternatives,
      analysis: {
        needsImage: analysis.needsImage,
        needsMultimodal: analysis.needsMultimodal,
        hasAttachment: analysis.hasAttachment,
        needsAutomation: analysis.needsAutomation,
        complexity: analysis.complexity,
        messageLength: message.length,
      },
    };

    console.log("✅ [AI Router] Selected:", {
      provider: selection.provider,
      reason: selection.reason,
      confidence: selection.confidence,
    });

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ [AI Router] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// ============================================
// ANÁLISE DE MENSAGEM
// ============================================

interface MessageAnalysis {
  needsImage: boolean;
  needsMultimodal: boolean;
  hasAttachment: boolean;
  needsAutomation: boolean;
  complexity: "low" | "medium" | "high";
  keywords: string[];
}

function analyzeMessage(
  message: string,
  context?: AIRouterRequest["context"],
): MessageAnalysis {
  const lowerMessage = message.toLowerCase();
  const keywords: string[] = [];

  // 1. DETECTAR NECESSIDADE DE IMAGEM
  const imageKeywords = [
    "crie imagem",
    "gere imagem",
    "faça imagem",
    "criar banner",
    "gerar banner",
    "fazer banner",
    "crie logo",
    "gere logo",
    "faça logo",
    "criar foto",
    "gerar foto",
    "fazer foto",
    "design de",
    "arte de",
    "arte para",
    "ilustração",
    "ilustração de",
    "thumbnail",
    "capa para",
    "desenhe",
    "desenhar",
    "arte digital",
    "visual de",
  ];

  const needsImage = imageKeywords.some((kw) => {
    if (lowerMessage.includes(kw)) {
      keywords.push(kw);
      return true;
    }
    return false;
  });

  // 2. DETECTAR NECESSIDADE MULTIMODAL (análise de imagem/vídeo)
  const multimodalKeywords = [
    "analise esta imagem",
    "analise este vídeo",
    "analise esta foto",
    "analise esse",
    "o que tem nesta imagem",
    "o que tem nessa",
    "descreva esta imagem",
    "descreva essa",
    "leia esta imagem",
    "leia esse",
    "extraia texto de",
    "extrair texto",
    "ocr",
    "reconheça",
    "reconhecer",
    "identifique na imagem",
  ];

  const needsMultimodal = multimodalKeywords.some((kw) => {
    if (lowerMessage.includes(kw)) {
      keywords.push(kw);
      return true;
    }
    return false;
  });

  // 3. VERIFICAR SE TEM ANEXO
  const hasAttachment =
    (context?.attachments && context.attachments.length > 0) || false;

  // 4. DETECTAR NECESSIDADE DE AUTOMAÇÃO (Browser/Scraping)
  const automationKeywords = [
    "navegue para",
    "abra o site",
    "clique em",
    "preencha o formulário",
    "extraia dados de",
    "faça scraping",
    "colete informações de",
    "automatize",
    "busque no google",
    "pesquise em",
    "acesse",
    "faça login em",
    "encontre na página",
    "capture da página",
    "controle o navegador",
  ];

  const needsAutomation = automationKeywords.some((kw) => {
    if (lowerMessage.includes(kw)) {
      keywords.push(kw);
      return true;
    }
    return false;
  });

  // 5. ESTIMAR COMPLEXIDADE
  let complexity: "low" | "medium" | "high" = "low";

  if (message.length > 1000) {
    complexity = "high";
  } else if (message.length > 300) {
    complexity = "medium";
  }

  // Complexidade alta se tem múltiplas perguntas
  const questionMarks = (message.match(/\?/g) || []).length;
  if (questionMarks >= 3) {
    complexity = "high";
  }

  return {
    needsImage,
    needsMultimodal,
    hasAttachment,
    needsAutomation,
    complexity,
    keywords,
  };
}

// ============================================
// SELEÇÃO DE IA
// ============================================

function selectAI(
  analysis: MessageAnalysis,
  message: string,
  context?: AIRouterRequest["context"],
): AISelection {
  console.log("🔍 [AI Router] Analyzing message for AI selection:", {
    needsImage: analysis.needsImage,
    needsMultimodal: analysis.needsMultimodal,
    hasAttachment: analysis.hasAttachment,
    needsAutomation: analysis.needsAutomation,
    messageLength: message.length,
    keywords: analysis.keywords,
  });

  // ============================================
  // REGRA 1: AUTOMAÇÃO BROWSER → PYTHON BACKEND
  // ============================================
  if (analysis.needsAutomation) {
    console.log("✅ [AI Router] Selected PYTHON for browser automation");
    return {
      provider: "PYTHON",
      model: "browser-use + playwright",
      reason:
        "Automação browser/scraping solicitada - Python Backend com Browser-Use",
      confidence: 95,
      pythonEndpoint: `${PYTHON_SERVICE_URL}/api/browser-automation/execute`,
    };
  }

  // ============================================
  // REGRA 2: GERAÇÃO DE IMAGEM → GOOGLE/GEMINI
  // ============================================
  if (analysis.needsImage) {
    console.log("✅ [AI Router] Selected GOOGLE (Gemini) for image generation");
    return {
      provider: "GOOGLE",
      model: "gemini-2.0-flash-exp",
      reason:
        "Geração de imagem solicitada - Gemini tem capacidade de criar imagens",
      confidence: 100,
    };
  }

  // ============================================
  // REGRA 3: ANÁLISE DE IMAGEM/VÍDEO → GOOGLE/GEMINI
  // ============================================
  if (analysis.needsMultimodal || analysis.hasAttachment) {
    console.log(
      "✅ [AI Router] Selected GOOGLE (Gemini) for multimodal analysis",
    );
    return {
      provider: "GOOGLE",
      model: "gemini-2.0-flash-exp",
      reason: "Análise multimodal necessária - Gemini suporta imagens e vídeos",
      confidence: 100,
    };
  }

  // ============================================
  // REGRA 4: CONTEXTO MUITO GRANDE → GOOGLE/GEMINI
  // ============================================
  if (message.length > 50000) {
    console.log("✅ [AI Router] Selected GOOGLE (Gemini) for long context");
    return {
      provider: "GOOGLE",
      model: "gemini-2.0-flash-exp",
      reason: "Contexto muito grande (>50k chars) - Gemini tem 1M tokens",
      confidence: 90,
    };
  }

  // ============================================
  // REGRA 5: ANÁLISE DE DOCUMENTOS → GOOGLE/GEMINI
  // ============================================
  const documentKeywords = [
    "analise este pdf",
    "analise esse pdf",
    "leia este documento",
    "leia esse documento",
    "extraia informações de",
    "extrair informações",
    "resuma este texto",
    "resuma esse texto",
    "resumir este",
  ];

  if (documentKeywords.some((kw) => message.toLowerCase().includes(kw))) {
    console.log(
      "✅ [AI Router] Selected GOOGLE (Gemini) for document analysis",
    );
    return {
      provider: "GOOGLE",
      model: "gemini-2.0-flash-exp",
      reason:
        "Análise de documento - Gemini lida melhor com PDFs e textos longos",
      confidence: 85,
    };
  }

  // ============================================
  // REGRA 6 (DEFAULT): CHAT RÁPIDO → GROQ
  // ============================================
  console.log("✅ [AI Router] Selected GROQ for conversational chat (default)");
  return {
    provider: "GROQ",
    model: "llama-3.3-70b-versatile",
    reason:
      "Chat conversacional - Groq é mais rápido (500-800 tokens/seg) e gratuito",
    confidence: 95,
  };
}

// ============================================
// GERAR ALTERNATIVAS
// ============================================

function generateAlternatives(selected: AISelection): AISelection[] {
  const alternatives: AISelection[] = [];

  // Se selecionou Groq, Gemini é alternativa
  if (selected.provider === "GROQ") {
    alternatives.push({
      provider: "GOOGLE",
      model: "gemini-2.0-flash-exp",
      reason:
        "Alternativa com maior contexto (1M tokens) e capacidades multimodais",
      confidence: 70,
    });
  }

  // Se selecionou Gemini, Groq é alternativa
  if (selected.provider === "GOOGLE") {
    alternatives.push({
      provider: "GROQ",
      model: "llama-3.3-70b-versatile",
      reason: "Alternativa mais rápida para chat simples (500-800 tokens/seg)",
      confidence: 60,
    });
  }

  // Adicionar alternativa Python se aplicável
  if (selected.provider !== "PYTHON") {
    alternatives.push({
      provider: "PYTHON",
      model: "browser-use + playwright",
      reason: "Alternativa para automação browser e scraping",
      confidence: 50,
      pythonEndpoint: `${PYTHON_SERVICE_URL}/api/browser-automation/execute`,
    });
  }

  return alternatives;
}

// ============================================
// HEALTH CHECK
// ============================================

// Se for GET, retornar status
if (Deno.env.get("DENO_DEPLOYMENT_ID")) {
  console.log("🚀 [AI Router] Edge Function initialized");
  console.log("📊 [AI Router] Available models:");
  console.log("   - GROQ: llama-3.3-70b-versatile (default para chat)");
  console.log("   - GOOGLE: gemini-2.0-flash-exp (imagens e multimodal)");
  console.log("   - PYTHON: browser-use + playwright (automação e scraping)");
  console.log(`🐍 [Python Service] ${PYTHON_SERVICE_URL}`);
}

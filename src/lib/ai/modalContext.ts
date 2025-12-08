/**
 * MODAL CONTEXT DETECTION SYSTEM
 * Sistema inteligente de detecção de contexto para modais adaptativos
 *
 * Detecta automaticamente qual modal exibir baseado na intenção do usuário:
 * - Visual Editor: criar/editar páginas, landing pages, designs
 * - Image Gallery: gerar/editar imagens
 * - Video Gallery: criar/editar vídeos
 * - Chat Normal: conversas gerais
 *
 * @version 1.0.0
 * @date 2025-01-08
 */

/**
 * Tipos de modal disponíveis
 */
export type ModalType =
  | "chat" // Chat normal
  | "visual-editor" // Editor visual tipo Dualite
  | "image-gallery" // Galeria de imagens tipo Canva
  | "video-gallery" // Galeria de vídeos
  | "code-editor"; // Editor de código

/**
 * Contexto detectado da mensagem do usuário
 */
export interface ModalContext {
  type: ModalType;
  confidence: number; // 0-1
  params: Record<string, any>;
  metadata?: {
    keywords?: string[];
    intent?: string;
    suggestedAction?: string;
  };
}

/**
 * Padrões de detecção para cada tipo de modal
 */
const MODAL_PATTERNS: Record<ModalType, RegExp[]> = {
  "visual-editor": [
    // Criar/clonar páginas
    /cri(e|ar)\s+(uma?\s+)?(p[aá]gina|landing\s*page|site|layout)/i,
    /clon(e|ar)\s+(uma?\s+)?(p[aá]gina|landing\s*page|site)/i,
    /fa(ça|z|zer)\s+(uma?\s+)?(p[aá]gina|landing\s*page|site)/i,
    /desenh(e|ar)\s+(uma?\s+)?(p[aá]gina|layout|interface)/i,
    /constru(a|ir)\s+(uma?\s+)?(p[aá]gina|site|landing)/i,
    /desenvolv(a|er)\s+(uma?\s+)?(p[aá]gina|site)/i,
    /preciso\s+(de\s+)?(uma?\s+)?(p[aá]gina|landing\s*page)/i,
    /quero\s+(una?\s+)?(p[aá]gina|landing\s*page|site)/i,
    /edit(e|ar)\s+(uma?\s+|essa?\s+|a\s+)?(p[aá]gina|landing|layout)/i,
    /modific(ar|ue)\s+(uma?\s+|essa?\s+|a\s+)?(p[aá]gina|layout)/i,
    /ajust(e|ar)\s+(uma?\s+|essa?\s+|a\s+)?(p[aá]gina|layout)/i,
    // Design visual
    /design\s+(de\s+)?(p[aá]gina|landing|site)/i,
    /interface\s+(de\s+|para\s+)?(p[aá]gina|site)/i,
    /layout\s+(de\s+|para\s+)?(p[aá]gina|site)/i,
    /protótipo\s+(de\s+)?(p[aá]gina|site)/i,
    /mockup\s+(de\s+)?(p[aá]gina|site)/i,
    // ✨ NOVOS: Casos de uso reais
    /mont(e|ar)\s+(uma?\s+)?(p[aá]gina|site|landing)/i,
    /faz\s+(um\s+)?(site|p[aá]gina)/i,
    /web\s*(page|site)/i,
    /landing\s*page/i,
    /p[aá]gina\s+(de\s+)?(vendas|captura|obrigado)/i,
    /formul[aá]rio\s+(de\s+)?(contato|cadastro)/i,
    /home\s*page/i,
  ],

  "image-gallery": [
    // Gerar imagens
    /ger(e|ar)\s+(una?\s+)?(imagem|foto|ilustra[çc][aã]o|arte)/i,
    /cri(e|ar)\s+(uma?\s+)?(imagem|foto|ilustra[çc][aã]o|arte)/i,
    /fa(ça|z|zer)\s+(uma?\s+)?(imagem|foto|ilustra[çc][aã]o)/i,
    /desenh(e|ar)\s+(uma?\s+)?(imagem|ilustra[çc][aã]o)/i,
    /ilustr(e|ar)/i,
    /preciso\s+(de\s+)?(uma?\s+)?(imagem|foto|arte)/i,
    /quero\s+(uma?\s+)?(imagem|foto|ilustra[çc][aã]o)/i,
    // Editar imagens
    /edit(e|ar)\s+(uma?\s+|essa?\s+|a\s+)?(imagem|foto)/i,
    /modific(ar|ue)\s+(uma?\s+|essa?\s+|a\s+)?(imagem|foto)/i,
    /ajust(e|ar)\s+(uma?\s+|essa?\s+|a\s+)?(imagem|foto)/i,
    /melhor(e|ar)\s+(uma?\s+|essa?\s+|a\s+)?(imagem|foto)/i,
    // Ver/listar imagens
    /most?r(e|ar)\s+(minhas?\s+|as\s+)?imagens/i,
    /list(e|ar)\s+(minhas?\s+|as\s+)?imagens/i,
    /ver\s+(minhas?\s+|as\s+)?imagens/i,
    /minhas?\s+imagens/i,
    /galeria\s+(de\s+)?imagens/i,
    // Palavras-chave fortes
    /dall[\s-]?e/i,
    /stable\s*diffusion/i,
    /midjourney/i,
    // ✨ NOVOS: Casos de uso reais
    /faz\s+(um\s+)?(banner|logo|thumbnail)/i,
    /cri(e|ar)\s+(um\s+)?(banner|logo|thumbnail|avatar)/i,
    /imagem\s+(para|de)\s+(produto|post|instagram|facebook)/i,
    /arte\s+(para|de)\s+(capa|perfil|post)/i,
    /render/i,
    /concept\s*art/i,
  ],

  "video-gallery": [
    // Gerar vídeos
    /ger(e|ar)\s+(um\s+)?(v[ií]deo|anima[çc][aã]o|clip)/i,
    /cri(e|ar)\s+(um\s+)?(v[ií]deo|anima[çc][aã]o)/i,
    /fa(ça|z|zer)\s+(um\s+)?(v[ií]deo|anima[çc][aã]o)/i,
    /produz(a|ir)\s+(um\s+)?(v[ií]deo|anima[çc][aã]o)/i,
    /preciso\s+(de\s+)?(um\s+)?(v[ií]deo|anima[çc][aã]o)/i,
    /quero\s+(um\s+)?(v[ií]deo|anima[çc][aã]o)/i,
    // Editar vídeos
    /edit(e|ar)\s+(um\s+|esse\s+|o\s+)?(v[ií]deo|anima[çc][aã]o)/i,
    /modific(ar|ue)\s+(um\s+|esse\s+|o\s+)?(v[ií]deo)/i,
    /corta(r|e)\s+(um\s+|esse\s+|o\s+)?(v[ií]deo)/i,
    // Ver/listar vídeos
    /most?r(e|ar)\s+(meus\s+|os\s+)?v[ií]deos/i,
    /list(e|ar)\s+(meus\s+|os\s+)?v[ií]deos/i,
    /ver\s+(meus\s+|os\s+)?v[ií]deos/i,
    /meus\s+v[ií]deos/i,
    /galeria\s+(de\s+)?v[ií]deos/i,
    // Palavras-chave fortes
    /runway/i,
    /pika\s*labs?/i,
    /sora/i,
    // ✨ NOVOS: Casos de uso reais
    /faz\s+(um\s+)?(v[ií]deo|reel|short)/i,
    /anima(r|[çc][aã]o)\s+(de\s+)?(texto|logo)/i,
    /v[ií]deo\s+(para|de)\s+(tiktok|instagram|youtube)/i,
    /reel/i,
    /short/i,
    /motion\s*graphics/i,
  ],

  "code-editor": [
    // Editar/criar código
    /edit(e|ar)\s+(o\s+)?c[óo]digo/i,
    /modific(ar|ue)\s+(o\s+)?c[óo]digo/i,
    /escrev(a|er)\s+(um\s+)?c[óo]digo/i,
    /cri(e|ar)\s+(uma?\s+)?fun[çc][aã]o/i,
    /cri(e|ar)\s+(um\s+)?componente/i,
    /desenvolv(a|er)\s+(um\s+)?script/i,
    /fa(ça|z|zer)\s+(um\s+)?algoritmo/i,
    /implementa(r|e)\s+/i,
    /program(e|ar)/i,
    // Linguagens específicas
    /python|javascript|typescript|react|node/i,
    /html|css|sql|json/i,
    // Contextos de código
    /debug|refator(e|ar)|otimiz(e|ar)\s+c[óo]digo/i,
    /corrija?\s+(o\s+)?(bug|erro)/i,
    /revis(e|ar)\s+(o\s+)?c[óo]digo/i,
  ],

  chat: [
    // Fallback - chat normal
    /.*/i,
  ],
};

/**
 * Palavras-chave que aumentam a confiança da detecção
 */
const CONFIDENCE_BOOSTERS: Record<ModalType, string[]> = {
  "visual-editor": [
    "responsiv",
    "mobile",
    "desktop",
    "bootstrap",
    "tailwind",
    "css",
    "html",
    "componente",
    "seção",
    "header",
    "footer",
    "hero",
    "cta",
    "formulário",
    // ✨ NOVOS
    "botão",
    "menu",
    "navbar",
    "sidebar",
    "card",
    "grid",
    "flexbox",
    "container",
    "section",
    "modal",
    "popup",
    "dropdown",
  ],
  "image-gallery": [
    "prompt",
    "estilo",
    "realista",
    "abstrato",
    "cartoon",
    "foto",
    "arte",
    "banner",
    "logo",
    "thumbnail",
    "4k",
    "alta resolução",
    // ✨ NOVOS
    "hd",
    "wallpaper",
    "background",
    "textura",
    "pattern",
    "ícone",
    "avatar",
    "capa",
    "post",
    "story",
    "feed",
    "pinterest",
  ],
  "video-gallery": [
    "fps",
    "resolução",
    "duração",
    "segundos",
    "minutos",
    "timeline",
    "transição",
    "efeito",
    "trilha",
    "áudio",
    // ✨ NOVOS
    "montagem",
    "edição",
    "corte",
    "zoom",
    "fade",
    "legendas",
    "música",
    "som",
    "voz",
    "narração",
  ],
  "code-editor": [
    "função",
    "classe",
    "typescript",
    "javascript",
    "python",
    "react",
    "node",
    "api",
    "backend",
    "frontend",
    "component",
    "hook",
    "async",
    "await",
    "import",
    "export",
    "const",
    "let",
    "var",
    "algorithm",
    "loop",
    "array",
    "object",
    "string",
    "number",
    "boolean",
  ],
  chat: [],
};

/**
 * Detecta o contexto da mensagem e retorna o tipo de modal apropriado
 */
export function detectModalContext(message: string): ModalContext {
  const messageLower = message.toLowerCase();
  const results: Array<{
    type: ModalType;
    confidence: number;
    matches: number;
  }> = [];

  // Testar cada tipo de modal
  for (const [type, patterns] of Object.entries(MODAL_PATTERNS)) {
    if (type === "chat") continue; // Skip chat, é o fallback

    let matches = 0;
    let confidence = 0;

    // Contar matches de padrões
    for (const pattern of patterns) {
      if (pattern.test(message)) {
        matches++;
        confidence += 0.3; // Cada padrão adiciona 30% de confiança
      }
    }

    // Verificar confidence boosters
    const boosters = CONFIDENCE_BOOSTERS[type as ModalType] || [];
    for (const booster of boosters) {
      if (messageLower.includes(booster.toLowerCase())) {
        confidence += 0.1; // Cada booster adiciona 10%
        matches++;
      }
    }

    if (matches > 0) {
      results.push({
        type: type as ModalType,
        confidence: Math.min(confidence, 1), // Max 100%
        matches,
      });
    }
  }

  // Ordenar por confiança e número de matches
  results.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return b.matches - a.matches;
  });

  // Se encontrou algo com confiança >= 50%, usar
  if (results.length > 0 && results[0].confidence >= 0.5) {
    const winner = results[0];
    return {
      type: winner.type,
      confidence: winner.confidence,
      params: extractParams(message, winner.type),
      metadata: {
        keywords: extractKeywords(message, winner.type),
        intent: getIntent(winner.type),
        suggestedAction: getSuggestedAction(winner.type),
      },
    };
  }

  // Fallback para chat normal
  return {
    type: "chat",
    confidence: 1.0,
    params: {},
    metadata: {
      intent: "general-conversation",
    },
  };
}

/**
 * Extrai parâmetros específicos da mensagem para cada tipo
 */
function extractParams(message: string, type: ModalType): Record<string, any> {
  const params: Record<string, any> = {};

  switch (type) {
    case "visual-editor":
      // Extrair tipo de página
      if (/landing\s*page/i.test(message)) {
        params.pageType = "landing-page";
      } else if (/site/i.test(message)) {
        params.pageType = "website";
      } else {
        params.pageType = "page";
      }

      // Extrair tema/nicho
      const themeMatch = message.match(
        /para\s+(\w+)|sobre\s+(\w+)|de\s+(\w+)/i,
      );
      if (themeMatch) {
        params.theme = themeMatch[1] || themeMatch[2] || themeMatch[3];
      }

      // Detectar se é clone
      if (/clon(e|ar)/i.test(message)) {
        params.isClone = true;
      }

      break;

    case "image-gallery":
      // Extrair prompt da imagem
      const imagePrompt = message
        .replace(
          /ger(e|ar)\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi,
          "",
        )
        .replace(
          /cri(e|ar)\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi,
          "",
        )
        .replace(/fa(ça|z)\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, "")
        .trim();

      if (imagePrompt.length > 0) {
        params.prompt = imagePrompt;
      }

      // Extrair estilo
      if (/realista/i.test(message)) params.style = "realistic";
      else if (/cartoon|desenho/i.test(message)) params.style = "cartoon";
      else if (/abstrato/i.test(message)) params.style = "abstract";
      else if (/fotográfico|foto/i.test(message)) params.style = "photographic";

      // Detectar se quer listar/ver imagens
      if (/most?r|list|ver|minhas?\s+imagens|galeria/i.test(message)) {
        params.action = "list";
      } else {
        params.action = "generate";
      }

      break;

    case "video-gallery":
      // Extrair descrição do vídeo
      const videoPrompt = message
        .replace(
          /ger(e|ar)\s+(um\s+)?v[ií]deo\s+(de\s+|sobre\s+|com\s+)?/gi,
          "",
        )
        .replace(
          /cri(e|ar)\s+(um\s+)?v[ií]deo\s+(de\s+|sobre\s+|com\s+)?/gi,
          "",
        )
        .replace(/fa(ça|z)\s+(um\s+)?v[ií]deo\s+(de\s+|sobre\s+|com\s+)?/gi, "")
        .trim();

      if (videoPrompt.length > 0) {
        params.prompt = videoPrompt;
      }

      // Extrair duração
      const durationMatch = message.match(/(\d+)\s*segundos?/i);
      if (durationMatch) {
        params.duration = parseInt(durationMatch[1]);
      }

      // Detectar se quer listar/ver vídeos
      if (/most?r|list|ver|meus\s+v[ií]deos|galeria/i.test(message)) {
        params.action = "list";
      } else {
        params.action = "generate";
      }

      break;
  }

  return params;
}

/**
 * Extrai palavras-chave relevantes da mensagem
 */
function extractKeywords(message: string, type: ModalType): string[] {
  const keywords: string[] = [];
  const messageLower = message.toLowerCase();
  const boosters = CONFIDENCE_BOOSTERS[type] || [];

  for (const booster of boosters) {
    if (messageLower.includes(booster.toLowerCase())) {
      keywords.push(booster);
    }
  }

  return keywords;
}

/**
 * Retorna a intenção do usuário baseada no tipo
 */
function getIntent(type: ModalType): string {
  const intents: Record<ModalType, string> = {
    "visual-editor": "create-or-edit-page",
    "image-gallery": "generate-or-view-images",
    "video-gallery": "generate-or-view-videos",
    "code-editor": "write-or-debug-code",
    chat: "general-conversation",
  };

  return intents[type] || "unknown";
}

/**
 * Retorna uma ação sugerida para a UI
 */
function getSuggestedAction(type: ModalType): string {
  const actions: Record<ModalType, string> = {
    "visual-editor": "Abrindo editor visual...",
    "image-gallery": "Abrindo galeria de imagens...",
    "video-gallery": "Abrindo galeria de vídeos...",
    "code-editor": "Abrindo editor de código...",
    chat: "",
  };

  return actions[type] || "";
}

/**
 * Determina se deve fazer transição automática para o modal
 */
export function shouldAutoTransition(context: ModalContext): boolean {
  // Auto-transição apenas se confiança >= 70%
  return context.confidence >= 0.7 && context.type !== "chat";
}

/**
 * Retorna configurações de animação para a transição
 */
export function getTransitionConfig(from: ModalType, to: ModalType) {
  return {
    duration: 0.4,
    ease: "easeInOut",
    // Diferentes animações dependendo da transição
    variant: from === "chat" ? "slideLeft" : "fade",
  };
}

/**
 * Hook helper para debug (opcional)
 */
export function debugModalContext(message: string): void {
  if (process.env.NODE_ENV !== "development") return;

  const context = detectModalContext(message);
  console.log("🔍 [Modal Context Detection]", {
    message: message.substring(0, 50) + "...",
    detected: context.type,
    confidence: `${(context.confidence * 100).toFixed(1)}%`,
    params: context.params,
    metadata: context.metadata,
  });
}

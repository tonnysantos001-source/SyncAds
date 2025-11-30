// ============================================================================
// DOM COMMAND DETECTOR - Detecta comandos de navegação e ações DOM
// ============================================================================
// Analisa mensagens do usuário e identifica intenções de navegação/ação
// ============================================================================

export interface DomCommand {
  type:
    | "NAVIGATE"
    | "CLICK"
    | "FILL_FORM"
    | "SCREENSHOT"
    | "EXECUTE_JS"
    | "READ_TEXT"
    | "SCROLL_TO"
    | "WAIT"
    | "SEARCH";
  params: Record<string, any>;
  confidence: number;
  originalMessage: string;
}

export interface DetectionResult {
  hasCommand: boolean;
  commands: DomCommand[];
  processedMessage: string;
}

// ============================================================================
// PADRÕES DE DETECÇÃO
// ============================================================================

const SEARCH_PATTERNS = [
  // Pesquisas gerais
  {
    regex:
      /(?:pesquise?|pesquisar|procure?|procurar|busque?|buscar|encontre?|encontrar|me mostre?|mostre)\s+(?:por\s+)?(.+?)(?:\s+(?:no|na|em)\s+(youtube|google|yt))?$/i,
    confidence: 0.95,
  },
  {
    regex:
      /(?:quero|gostaria de|pode|poderia)\s+(?:pesquisar|procurar|buscar)\s+(?:por\s+)?(.+?)(?:\s+(?:no|na)\s+(youtube|google|yt))?$/i,
    confidence: 0.9,
  },
  {
    regex:
      /(?:faça?|fazer)\s+(?:uma\s+)?(?:pesquisa|busca)\s+(?:por|sobre|de)\s+(.+?)(?:\s+(?:no|na)\s+(youtube|google|yt))?$/i,
    confidence: 0.9,
  },

  // Pesquisas específicas
  {
    regex:
      /(?:abra?|abrir)\s+(?:o\s+)?(youtube|google|yt)\s+e\s+(?:pesquise?|procure?|busque?)\s+(?:por\s+)?(.+?)$/i,
    confidence: 0.98,
  },
  {
    regex:
      /(?:pesquise?|procure?|busque?)\s+(?:por\s+)?(.+?)\s+(?:no|na|em)\s+(youtube|google|yt)$/i,
    confidence: 0.95,
  },
  {
    regex:
      /(?:vídeos?|videos?)\s+(?:de|sobre|do|da)\s+(.+?)(?:\s+(?:no|na)\s+(youtube|yt))?$/i,
    confidence: 0.9,
  },
];

const NAVIGATION_PATTERNS = [
  // Abrir sites (sem pesquisa)
  {
    regex:
      /(?:abra?|abrir|acessar|vai para|vá para|ir para|navegue? para|visite?|entre em)\s+(?:o\s+)?(?:site\s+)?(?:do\s+)?(?:da\s+)?(.+?)(?:\s+(?:por favor|pfv|pf))?$/i,
    confidence: 0.95,
  },
  {
    regex:
      /(?:quero|gostaria de|pode|poderia)\s+(?:abrir|acessar|ir para|entrar)\s+(?:o\s+)?(?:site\s+)?(?:do\s+)?(?:da\s+)?(.+?)$/i,
    confidence: 0.9,
  },
  {
    regex:
      /(?:me leve|leve-me|me leva)\s+(?:para|ao|à)\s+(?:o\s+)?(?:site\s+)?(?:do\s+)?(?:da\s+)?(.+?)$/i,
    confidence: 0.9,
  },

  // URLs diretas
  { regex: /(https?:\/\/[^\s]+)/i, confidence: 0.99 },
  { regex: /(www\.[^\s]+)/i, confidence: 0.95 },

  // Sites conhecidos
  {
    regex:
      /(?:abra?|acessar?|ir para)\s+(?:o\s+)?(facebook|fb|instagram|insta|ig|youtube|yt|twitter|x|linkedin|google|gmail|whatsapp|tiktok|amazon|mercado\s*livre|olx|shopee|aliexpress)/i,
    confidence: 0.98,
  },
];

const KNOWN_SITES: Record<string, string> = {
  // Redes Sociais
  facebook: "https://www.facebook.com",
  fb: "https://www.facebook.com",
  instagram: "https://www.instagram.com",
  insta: "https://www.instagram.com",
  ig: "https://www.instagram.com",
  youtube: "https://www.youtube.com",
  yt: "https://www.youtube.com",
  twitter: "https://twitter.com",
  x: "https://twitter.com",
  linkedin: "https://www.linkedin.com",
  tiktok: "https://www.tiktok.com",
  whatsapp: "https://web.whatsapp.com",

  // E-commerce
  amazon: "https://www.amazon.com.br",
  "mercado livre": "https://www.mercadolivre.com.br",
  mercadolivre: "https://www.mercadolivre.com.br",
  olx: "https://www.olx.com.br",
  shopee: "https://shopee.com.br",
  aliexpress: "https://pt.aliexpress.com",
  magazineluiza: "https://www.magazineluiza.com.br",
  americanas: "https://www.americanas.com.br",
  casasbahia: "https://www.casasbahia.com.br",

  // Google Services
  google: "https://www.google.com",
  gmail: "https://mail.google.com",
  drive: "https://drive.google.com",
  docs: "https://docs.google.com",
  sheets: "https://sheets.google.com",
  meet: "https://meet.google.com",
  maps: "https://maps.google.com",

  // Outros
  github: "https://github.com",
  stackoverflow: "https://stackoverflow.com",
  reddit: "https://reddit.com",
  pinterest: "https://pinterest.com",
  medium: "https://medium.com",
  notion: "https://notion.so",
  trello: "https://trello.com",
  figma: "https://figma.com",
  canva: "https://canva.com",
};

const CLICK_PATTERNS = [
  {
    regex:
      /(?:clique?|clicar|aperte?|apertar|pressione?|pressionar)\s+(?:no|na|em|sobre)\s+(.+?)$/i,
    confidence: 0.9,
  },
  {
    regex:
      /(?:pode|poderia)\s+(?:clicar|apertar|pressionar)\s+(?:no|na|em)\s+(.+?)$/i,
    confidence: 0.85,
  },
];

const FILL_PATTERNS = [
  {
    regex:
      /(?:preencha?|preencher|preenchimento|digite?|digitar|escreva?|escrever)\s+(.+?)\s+(?:no|na|em)\s+(.+?)$/i,
    confidence: 0.85,
  },
  {
    regex:
      /(?:insira?|inserir|coloque?|colocar)\s+(.+?)\s+(?:no|na|em)\s+(.+?)$/i,
    confidence: 0.85,
  },
];

const SCREENSHOT_PATTERNS = [
  {
    regex:
      /(?:tire?|tirar|capture?|capturar|fazer|faz|faça)\s+(?:uma?\s+)?(?:foto|print|screenshot|captura|imagem)\s*(?:da\s+tela)?/i,
    confidence: 0.95,
  },
  {
    regex:
      /(?:pode|poderia)\s+(?:tirar|capturar)\s+(?:uma?\s+)?(?:screenshot|print|foto)/i,
    confidence: 0.9,
  },
];

const READ_PATTERNS = [
  {
    regex:
      /(?:leia?|ler|pegue?|pegar|extraia?|extrair|busque?|buscar)\s+(?:o\s+)?(?:texto|conteúdo|informação|dados?)\s+(?:de|do|da)\s+(.+?)$/i,
    confidence: 0.85,
  },
  {
    regex:
      /(?:qual|quais|me diga?|me diz|mostre?|mostrar)\s+(?:o|a|os|as)\s+(.+?)$/i,
    confidence: 0.7,
  },
];

const SCROLL_PATTERNS = [
  {
    regex:
      /(?:role?|rolar|desça?|descer|suba?|subir)\s+(?:a\s+página|página|para)\s+(.+?)$/i,
    confidence: 0.85,
  },
  {
    regex:
      /(?:vá|ir)\s+(?:para|ao|até)\s+(?:o\s+)?(?:topo|fim|final|início|começo)/i,
    confidence: 0.9,
  },
];

// ============================================================================
// FUNÇÕES DE DETECÇÃO
// ============================================================================

/**
 * Detecta comandos DOM na mensagem do usuário
 */
export function detectDomCommands(message: string): DetectionResult {
  const commands: DomCommand[] = [];
  let processedMessage = message;

  // 0. Detectar pesquisa PRIMEIRO (prioridade sobre navegação simples)
  const searchCommand = detectSearch(message);
  if (searchCommand && searchCommand.confidence > 0.7) {
    commands.push(searchCommand);
    // Se detectou pesquisa, não precisa detectar navegação simples
    return {
      hasCommand: commands.length > 0,
      commands,
      processedMessage,
    };
  }

  // 1. Detectar navegação
  const navCommand = detectNavigation(message);
  if (navCommand && navCommand.confidence > 0.7) {
    commands.push(navCommand);
    // Não remover da mensagem, pois pode ter contexto adicional
  }

  // 2. Detectar screenshot
  const screenshotCommand = detectScreenshot(message);
  if (screenshotCommand && screenshotCommand.confidence > 0.7) {
    commands.push(screenshotCommand);
  }

  // 3. Detectar clique
  const clickCommand = detectClick(message);
  if (clickCommand && clickCommand.confidence > 0.7) {
    commands.push(clickCommand);
  }

  // 4. Detectar preenchimento
  const fillCommand = detectFill(message);
  if (fillCommand && fillCommand.confidence > 0.7) {
    commands.push(fillCommand);
  }

  // 5. Detectar leitura de texto
  const readCommand = detectRead(message);
  if (readCommand && readCommand.confidence > 0.7) {
    commands.push(readCommand);
  }

  // 6. Detectar scroll
  const scrollCommand = detectScroll(message);
  if (scrollCommand && scrollCommand.confidence > 0.7) {
    commands.push(scrollCommand);
  }

  return {
    hasCommand: commands.length > 0,
    commands,
    processedMessage,
  };
}

/**
 * Detecta comando de pesquisa (YouTube, Google, etc)
 */
function detectSearch(message: string): DomCommand | null {
  for (const pattern of SEARCH_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      let searchQuery = "";
      let platform = "google"; // padrão

      // Detectar plataforma e query baseado no padrão
      if (match[2] && match[1]) {
        // Formato: "pesquise X no Y" ou "abra Y e pesquise X"
        const possibleQuery1 = match[1]?.trim().toLowerCase();
        const possibleQuery2 = match[2]?.trim().toLowerCase();

        // Verificar qual é a plataforma
        if (["youtube", "yt"].includes(possibleQuery2)) {
          platform = "youtube";
          searchQuery = possibleQuery1;
        } else if (["google"].includes(possibleQuery2)) {
          platform = "google";
          searchQuery = possibleQuery1;
        } else if (["youtube", "yt"].includes(possibleQuery1)) {
          platform = "youtube";
          searchQuery = possibleQuery2;
        } else if (["google"].includes(possibleQuery1)) {
          platform = "google";
          searchQuery = possibleQuery2;
        } else {
          // Se nenhum dos dois é plataforma, usar o primeiro como query
          searchQuery = possibleQuery1;
        }
      } else if (match[1]) {
        searchQuery = match[1].trim();

        // Se a query menciona "vídeo" ou "video", usar YouTube
        if (/vídeos?|videos?/i.test(searchQuery)) {
          platform = "youtube";
        }
      }

      if (searchQuery) {
        // Limpar a query
        searchQuery = searchQuery
          .replace(/^(o|a|os|as|um|uma|uns|umas)\s+/i, "")
          .replace(/\s+(por favor|pfv|pf|agora)$/i, "")
          .trim();

        // Construir URL baseada na plataforma
        let url = "";
        if (platform === "youtube") {
          url = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        } else {
          url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        }

        return {
          type: "SEARCH",
          params: {
            url,
            query: searchQuery,
            platform,
          },
          confidence: pattern.confidence,
          originalMessage: message,
        };
      }
    }
  }

  return null;
}

/**
 * Detecta comando de navegação
 */
function detectNavigation(message: string): DomCommand | null {
  for (const pattern of NAVIGATION_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      let url = "";
      const captured = match[1]?.trim().toLowerCase();

      // Se é uma URL direta
      if (
        captured &&
        (captured.startsWith("http") || captured.startsWith("www"))
      ) {
        url = captured.startsWith("http") ? captured : `https://${captured}`;
      }
      // Se é um site conhecido
      else if (captured) {
        // Remover palavras desnecessárias
        const cleanedCapture = captured
          .replace(/^(o|a|os|as|site|página|page)\s+/i, "")
          .replace(/\s+(por favor|pfv|pf|agora)$/i, "")
          .trim();

        url = KNOWN_SITES[cleanedCapture] || "";

        // Se não encontrou, tentar criar URL
        if (!url && cleanedCapture) {
          // Se parece com domínio (tem ponto ou não tem espaços)
          if (cleanedCapture.includes(".") || !cleanedCapture.includes(" ")) {
            url = cleanedCapture.includes(".")
              ? `https://${cleanedCapture}`
              : `https://www.${cleanedCapture}.com`;
          } else {
            // Fazer busca no Google
            url = `https://www.google.com/search?q=${encodeURIComponent(cleanedCapture)}`;
          }
        }
      }

      if (url) {
        return {
          type: "NAVIGATE",
          params: { url },
          confidence: pattern.confidence,
          originalMessage: message,
        };
      }
    }
  }

  return null;
}

/**
 * Detecta comando de screenshot
 */
function detectScreenshot(message: string): DomCommand | null {
  for (const pattern of SCREENSHOT_PATTERNS) {
    if (pattern.regex.test(message)) {
      return {
        type: "SCREENSHOT",
        params: {},
        confidence: pattern.confidence,
        originalMessage: message,
      };
    }
  }

  return null;
}

/**
 * Detecta comando de clique
 */
function detectClick(message: string): DomCommand | null {
  for (const pattern of CLICK_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      const selector = match[1]?.trim();
      if (selector) {
        return {
          type: "CLICK",
          params: { selector },
          confidence: pattern.confidence,
          originalMessage: message,
        };
      }
    }
  }

  return null;
}

/**
 * Detecta comando de preenchimento
 */
function detectFill(message: string): DomCommand | null {
  for (const pattern of FILL_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      const value = match[1]?.trim();
      const field = match[2]?.trim();
      if (value && field) {
        return {
          type: "FILL_FORM",
          params: {
            formData: { [field]: value },
          },
          confidence: pattern.confidence,
          originalMessage: message,
        };
      }
    }
  }

  return null;
}

/**
 * Detecta comando de leitura
 */
function detectRead(message: string): DomCommand | null {
  for (const pattern of READ_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      const selector = match[1]?.trim();
      return {
        type: "READ_TEXT",
        params: { selector: selector || "body" },
        confidence: pattern.confidence,
        originalMessage: message,
      };
    }
  }

  return null;
}

/**
 * Detecta comando de scroll
 */
function detectScroll(message: string): DomCommand | null {
  for (const pattern of SCROLL_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      let position = match[1]?.trim().toLowerCase() || "down";

      // Mapear posições em português
      const positionMap: Record<string, string> = {
        topo: "top",
        início: "top",
        começo: "top",
        fim: "bottom",
        final: "bottom",
        baixo: "down",
        cima: "up",
      };

      position = positionMap[position] || position;

      return {
        type: "SCROLL_TO",
        params: { position },
        confidence: pattern.confidence,
        originalMessage: message,
      };
    }
  }

  return null;
}

/**
 * Cria comando de espera
 */
export function createWaitCommand(milliseconds: number): DomCommand {
  return {
    type: "WAIT",
    params: { milliseconds },
    confidence: 1.0,
    originalMessage: `Wait ${milliseconds}ms`,
  };
}

/**
 * Valida se a URL é segura
 */
export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Bloquear protocolos perigosos
    const dangerousProtocols = ["javascript:", "data:", "file:", "vbscript:"];
    if (dangerousProtocols.some((proto) => parsed.protocol.startsWith(proto))) {
      return false;
    }

    // Bloquear localhost/IPs privados em produção
    const hostname = parsed.hostname.toLowerCase();
    const privatePatterns = [
      "localhost",
      "127.0.0.1",
      "0.0.0.0",
      "::1",
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
    ];

    for (const pattern of privatePatterns) {
      if (typeof pattern === "string" && hostname === pattern) {
        return false;
      } else if (pattern instanceof RegExp && pattern.test(hostname)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Normaliza URL
 */
export function normalizeUrl(url: string): string {
  // Se não tem protocolo, adicionar https://
  if (!url.match(/^https?:\/\//i)) {
    // Se começa com www, adicionar https://
    if (url.startsWith("www.")) {
      return `https://${url}`;
    }
    // Se não tem www nem protocolo, adicionar ambos
    if (!url.includes(".")) {
      return `https://www.${url}.com`;
    }
    return `https://${url}`;
  }

  return url;
}

/**
 * Extrai domínio da URL
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

/**
 * Gera resposta da IA com feedback do comando
 */
export function generateCommandResponse(command: DomCommand): string {
  switch (command.type) {
    case "SEARCH":
      const platform =
        command.params.platform === "youtube" ? "YouTube" : "Google";
      return `🔍 Buscando "${command.params.query}" no ${platform}...`;

    case "NAVIGATE":
      const domain = extractDomain(command.params.url);
      return `🌐 Abrindo ${domain}... Aguarde um momento enquanto carrego a página.`;

    case "SCREENSHOT":
      return `📸 Capturando screenshot da página atual...`;

    case "CLICK":
      return `👆 Clicando em "${command.params.selector}"...`;

    case "FILL_FORM":
      return `✍️ Preenchendo formulário...`;

    case "READ_TEXT":
      return `📖 Lendo conteúdo da página...`;

    case "SCROLL_TO":
      return `📜 Rolando a página...`;

    case "WAIT":
      return `⏳ Aguardando ${command.params.milliseconds}ms...`;

    default:
      return `⚡ Executando comando...`;
  }
}

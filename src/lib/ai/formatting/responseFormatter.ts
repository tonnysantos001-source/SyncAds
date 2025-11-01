/**
 * Response Formatter - Formatador de Respostas da IA
 * Transforma respostas técnicas em mensagens bonitas tipo ChatGPT
 */

export interface FormatterOptions {
  addEmojis?: boolean;
  improveMarkdown?: boolean;
  removeTechnicalLogs?: boolean;
  addSectionDividers?: boolean;
}

const DEFAULT_OPTIONS: FormatterOptions = {
  addEmojis: true,
  improveMarkdown: true,
  removeTechnicalLogs: true,
  addSectionDividers: true,
};

/**
 * Formata resposta da IA para ficar bonita
 */
export function formatAIResponse(
  response: string,
  options: FormatterOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let formatted = response;

  // 1. Remover logs técnicos primeiro
  if (opts.removeTechnicalLogs) {
    formatted = removeTechnicalLogs(formatted);
  }

  // 2. Adicionar emojis contextuais
  if (opts.addEmojis) {
    formatted = addContextualEmojis(formatted);
  }

  // 3. Melhorar markdown
  if (opts.improveMarkdown) {
    formatted = improveMarkdown(formatted);
  }

  // 4. Adicionar divisores de seção
  if (opts.addSectionDividers) {
    formatted = addSectionDividers(formatted);
  }

  return formatted.trim();
}

/**
 * Remove completamente logs técnicos e JSON
 */
function removeTechnicalLogs(text: string): string {
  let cleaned = text;

  // Remover JSON completos (single e multi-line)
  cleaned = cleaned.replace(/\{[\s\S]*?"success"[\s\S]*?\}/g, "");
  cleaned = cleaned.replace(/\{[\s\S]*?"data"[\s\S]*?\}/g, "");
  cleaned = cleaned.replace(/\{[\s\S]*?"message"[\s\S]*?\}/g, "");

  // Remover blocos de código JSON
  cleaned = cleaned.replace(/```json[\s\S]*?```/g, "");

  // Remover linhas com propriedades JSON
  cleaned = cleaned.replace(/^\s*"[^"]+"\s*:\s*.+$/gm, "");

  // Remover chaves, colchetes e vírgulas órfãos
  cleaned = cleaned.replace(/^\s*[\{\}\[\],]\s*$/gm, "");

  // Remover linhas que começam com propriedades técnicas
  cleaned = cleaned.replace(
    /^\s*(?:success|message|data|query|provider|results|snippet|url|title|error|status)\s*[:=]/gim,
    "",
  );

  // Remover blocos "Resultados da pesquisa"
  cleaned = cleaned.replace(/\*\*Resultados da pesquisa:\*\*[\s\S]*?(?=\n\n|$)/g, "");

  // Remover múltiplas linhas vazias
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
}

/**
 * Adiciona emojis baseado no contexto
 */
function addContextualEmojis(text: string): string {
  let formatted = text;

  // Sucesso
  formatted = formatted.replace(
    /\b(sucesso|concluído|pronto|completado|finalizado)\b/gi,
    "✅ $1",
  );

  // Erro
  formatted = formatted.replace(/\b(erro|falhou|problema)\b/gi, "❌ $1");

  // Atenção/Importante
  formatted = formatted.replace(
    /\b(importante|atenção|cuidado|aviso)\b/gi,
    "⚠️ $1",
  );

  // Ideias/Sugestões
  formatted = formatted.replace(/\b(sugestão|dica|ideia)\b/gi, "💡 $1");

  // Links/URLs
  formatted = formatted.replace(/\[([^\]]+)\]\(http/g, "🔗 [$1](http");

  // Download
  formatted = formatted.replace(/\b(download|baixar)\b/gi, "📥 $1");

  // Upload
  formatted = formatted.replace(/\b(upload|enviar)\b/gi, "📤 $1");

  // Arquivos
  formatted = formatted.replace(/\b(arquivo|csv|json|zip)\b/gi, "📄 $1");

  // Dados/Analytics
  formatted = formatted.replace(/\b(análise|métricas|dados)\b/gi, "📊 $1");

  // Pesquisa
  formatted = formatted.replace(/\b(pesquisa|busca|procurar)\b/gi, "🔍 $1");

  // Produto
  formatted = formatted.replace(/\b(produto|item)\b/gi, "🛍️ $1");

  // Preço
  formatted = formatted.replace(/\b(preço|valor|R\$)\b/gi, "💰 $1");

  // Campanhas/Marketing
  formatted = formatted.replace(/\b(campanha|anúncio)\b/gi, "🎯 $1");

  // Email
  formatted = formatted.replace(/\b(email|e-mail)\b/gi, "📧 $1");

  // Alerta
  formatted = formatted.replace(/\b(alerta|notificação)\b/gi, "🔔 $1");

  // Velocidade
  formatted = formatted.replace(/\b(rápido|veloz)\b/gi, "⚡ $1");

  // Tempo
  formatted = formatted.replace(/\b(agendado|cronômetro)\b/gi, "⏰ $1");

  // IA/Automação
  formatted = formatted.replace(/\b(automação|inteligente|ia)\b/gi, "🤖 $1");

  return formatted;
}

/**
 * Melhora formatação Markdown
 */
function improveMarkdown(text: string): string {
  let formatted = text;

  // Converter listas simples em listas markdown
  formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, "$1. **$2**");

  // Adicionar negrito em palavras-chave importantes
  formatted = formatted.replace(
    /\b(IMPORTANTE|ATENÇÃO|NOTA|OBS|AVISO)\b/g,
    "**$1**",
  );

  // Melhorar formatação de links
  formatted = formatted.replace(
    /(?<!\[)(https?:\/\/[^\s]+)(?!\])/g,
    "[Link]($1)",
  );

  // Adicionar espaçamento antes de títulos
  formatted = formatted.replace(/\n(#{1,3}\s+)/g, "\n\n$1");

  // Adicionar espaçamento depois de títulos
  formatted = formatted.replace(/(#{1,3}\s+.+)\n(?!\n)/g, "$1\n\n");

  // Melhorar listas
  formatted = formatted.replace(/^-\s+(.+)$/gm, "• $1");

  return formatted;
}

/**
 * Adiciona divisores entre seções
 */
function addSectionDividers(text: string): string {
  let formatted = text;

  // Adicionar linha antes de títulos principais
  formatted = formatted.replace(/\n(##\s+)/g, "\n---\n\n$1");

  return formatted;
}

/**
 * Formata resposta de web search especificamente
 */
export function formatWebSearchResponse(results: any[]): string {
  if (!results || results.length === 0) {
    return "🔍 Não encontrei resultados para sua pesquisa.";
  }

  let formatted = `🔍 **Encontrei ${results.length} resultados:**\n\n`;

  results.slice(0, 5).forEach((result, index) => {
    formatted += `**${index + 1}. [${result.title}](${result.url})**\n`;
    if (result.description) {
      formatted += `   ${result.description}\n`;
    }
    formatted += "\n";
  });

  if (results.length > 5) {
    formatted += `\n_E mais ${results.length - 5} resultados..._\n`;
  }

  return formatted;
}

/**
 * Formata resposta de scraping
 */
export function formatScrapingResponse(
  totalProducts: number,
  products: any[],
  downloadUrl?: string,
): string {
  let formatted = `🛍️ **${totalProducts} produtos extraídos com sucesso!**\n\n`;

  if (products.length > 0) {
    formatted += "**📦 Preview dos produtos:**\n\n";
    products.slice(0, 5).forEach((product, index) => {
      formatted += `${index + 1}. **${product.name}**\n`;
      if (product.price) {
        formatted += `   💰 ${product.price}\n`;
      }
      if (product.link) {
        formatted += `   🔗 [Ver produto](${product.link})\n`;
      }
      formatted += "\n";
    });
  }

  if (downloadUrl) {
    formatted += `\n📥 **[BAIXAR CSV COMPLETO](${downloadUrl})**\n`;
  }

  return formatted;
}

/**
 * Formata resposta de arquivo criado
 */
export function formatFileCreatedResponse(
  fileName: string,
  downloadUrl: string,
  fileType: string,
): string {
  const emoji = fileType === "csv" ? "📊" : fileType === "json" ? "📄" : "📦";

  return `${emoji} **Arquivo criado com sucesso!**\n\n**Nome:** ${fileName}\n\n📥 **[CLIQUE AQUI PARA BAIXAR](${downloadUrl})**\n\n_O link expira em 1 hora._`;
}

/**
 * Formata resposta de erro de forma amigável
 */
export function formatErrorResponse(error: string): string {
  return `❌ **Ops! Algo deu errado**\n\n${error}\n\n💡 **Sugestões:**\n• Tente reformular sua pergunta\n• Verifique se suas credenciais estão configuradas\n• Se o problema persistir, entre em contato com o suporte`;
}

/**
 * Adiciona saudação personalizada
 */
export function addGreeting(name?: string): string {
  const greetings = [
    `👋 Olá${name ? `, ${name}` : ""}! Como posso ajudar você hoje?`,
    `🎉 Seja bem-vindo${name ? `, ${name}` : ""}! O que vamos criar hoje?`,
    `✨ E aí${name ? `, ${name}` : ""}! Pronto para automatizar algo incrível?`,
    `🚀 Olá${name ? `, ${name}` : ""}! Vamos turbinar seu negócio?`,
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}

/**
 * Formata números grandes com separadores
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("pt-BR").format(num);
}

/**
 * Formata moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

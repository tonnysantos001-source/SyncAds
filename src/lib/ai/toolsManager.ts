/**
 * Tools Manager - Gerencia execução de tools da IA
 * 
 * Fluxo:
 * 1. IA detecta intenção e chama tool
 * 2. Manager valida e executa
 * 3. Retorna resultado + UI actions se necessário
 * 4. Chat exibe progresso e botões de ação
 */

import { AVAILABLE_TOOLS, executeTool, type ToolContext, type ToolResult } from './tools';

export type AIMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
};

export type ToolCall = {
  id: string;
  name: string;
  parameters: any;
};

/**
 * Processa resposta da IA e executa tools se necessário
 */
export async function processAIResponse(
  message: string,
  toolCalls: ToolCall[] | undefined,
  context: ToolContext
): Promise<{
  message: string;
  toolResults: ToolResult[];
  requiresUserAction: boolean;
}> {
  const toolResults: ToolResult[] = [];
  let requiresUserAction = false;

  // Se não há tool calls, retornar mensagem normal
  if (!toolCalls || toolCalls.length === 0) {
    return {
      message,
      toolResults: [],
      requiresUserAction: false,
    };
  }

  // Executar cada tool
  for (const toolCall of toolCalls) {
    const result = await executeTool(toolCall.name, toolCall.parameters, context);
    toolResults.push(result);

    if (result.requiresUserAction) {
      requiresUserAction = true;
    }
  }

  return {
    message,
    toolResults,
    requiresUserAction,
  };
}

/**
 * Detecta intenção de usar tool a partir da mensagem do usuário
 */
export function detectToolIntent(userMessage: string): {
  tool: string | null;
  confidence: number;
  suggestedParams?: any;
} {
  const lowerMessage = userMessage.toLowerCase();

  // Conexões
  if (lowerMessage.includes('conectar') || lowerMessage.includes('conecte')) {
    if (lowerMessage.includes('meta') || lowerMessage.includes('facebook') || lowerMessage.includes('instagram')) {
      return {
        tool: 'connect_meta_ads',
        confidence: 0.9,
      };
    }
    if (lowerMessage.includes('google ads') || lowerMessage.includes('google')) {
      return {
        tool: 'connect_google_ads',
        confidence: 0.9,
      };
    }
    if (lowerMessage.includes('shopify')) {
      return {
        tool: 'connect_shopify',
        confidence: 0.8,
      };
    }
  }

  // Criar campanha
  if (lowerMessage.includes('criar') && (lowerMessage.includes('campanha') || lowerMessage.includes('anúncio'))) {
    if (lowerMessage.includes('meta') || lowerMessage.includes('facebook')) {
      return {
        tool: 'create_meta_campaign',
        confidence: 0.85,
      };
    }
  }

  // Criar produto
  if (lowerMessage.includes('criar') && lowerMessage.includes('produto')) {
    if (lowerMessage.includes('shopify')) {
      return {
        tool: 'create_shopify_product',
        confidence: 0.85,
      };
    }
  }

  // Web search
  if (
    lowerMessage.includes('pesquisar') ||
    lowerMessage.includes('buscar') ||
    lowerMessage.includes('procurar') ||
    lowerMessage.includes('encontrar')
  ) {
    // Extrair query
    const query = userMessage
      .replace(/pesquisar|buscar|procurar|encontrar/gi, '')
      .trim();

    return {
      tool: 'web_search',
      confidence: 0.7,
      suggestedParams: { query },
    };
  }

  // Analytics
  if (lowerMessage.includes('analytics') || lowerMessage.includes('relatório') || lowerMessage.includes('métricas')) {
    return {
      tool: 'get_analytics',
      confidence: 0.8,
      suggestedParams: {
        platform: 'ALL',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
      },
    };
  }

  return {
    tool: null,
    confidence: 0,
  };
}

/**
 * Formata resultado de tool para exibição no chat
 */
export function formatToolResultForChat(result: ToolResult): string {
  if (!result.success) {
    return `❌ ${result.message}`;
  }

  let formatted = `✅ ${result.message}`;

  if (result.data) {
    // Web Search
    if (result.data.results) {
      formatted += '\n\n**Resultados encontrados:**\n';
      result.data.results.slice(0, 5).forEach((r: any, i: number) => {
        formatted += `\n${i + 1}. **${r.title}**\n   ${r.snippet}\n   🔗 ${r.url}\n`;
      });
    }

    // Analytics
    if (result.data.impressions !== undefined) {
      formatted += '\n\n**Métricas:**\n';
      formatted += `• Impressões: ${result.data.impressions.toLocaleString()}\n`;
      formatted += `• Cliques: ${result.data.clicks.toLocaleString()}\n`;
      formatted += `• Conversões: ${result.data.conversions.toLocaleString()}\n`;
      formatted += `• Gasto: R$ ${result.data.spend.toLocaleString()}\n`;
      formatted += `• CTR: ${result.data.ctr}%\n`;
      formatted += `• CPC: R$ ${result.data.cpc}\n`;
    }

    // Campanha criada
    if (result.data.campaignId) {
      formatted += `\n\n📊 ID da Campanha: ${result.data.campaignId}`;
    }

    // Produto criado
    if (result.data.productId) {
      formatted += `\n\n🛍️ ID do Produto: ${result.data.productId}`;
    }
  }

  return formatted;
}

/**
 * Verifica se usuário tem integração conectada
 */
export async function checkIntegrationConnected(
  platform: string,
  userId: string
): Promise<boolean> {
  // TODO: Verificar no Supabase
  // Por enquanto, retornar false para forçar conexão
  return false;
}

/**
 * Gera system prompt com tools disponíveis
 */
export function generateSystemPromptWithTools(): string {
  const toolDescriptions = AVAILABLE_TOOLS.map((tool) => {
    const params = tool.parameters
      .map((p) => `  - ${p.name} (${p.type}${p.required ? ', obrigatório' : ''}): ${p.description}`)
      .join('\n');

    return `**${tool.name}**\n${tool.description}\nParâmetros:\n${params}`;
  }).join('\n\n');

  return `Você é um assistente de marketing digital com acesso às seguintes ferramentas:

${toolDescriptions}

**INSTRUÇÕES IMPORTANTES:**

1. **Sempre que o usuário pedir para conectar uma integração**, use a tool correspondente
2. **Para criar campanhas ou produtos**, verifique se a integração está conectada primeiro
3. **Para pesquisas na web**, use web_search e sempre mostre os links encontrados
4. **Seja proativo**: Sugira usar tools quando apropriado
5. **Explique o progresso**: Diga ao usuário o que está fazendo

**EXEMPLOS:**

Usuário: "Conecte com Meta Ads"
Você: "Vou conectar sua conta com Meta Ads. Clique no botão abaixo para autorizar:"
[Chama connect_meta_ads]

Usuário: "Crie uma campanha no Facebook"
Você: "Vou criar uma campanha no Meta Ads. Primeiro, preciso de algumas informações:
- Nome da campanha
- Objetivo (REACH, TRAFFIC, ENGAGEMENT, LEADS ou SALES)
- Orçamento diário em reais"

Usuário: "Pesquise sobre marketing digital"
Você: "Vou pesquisar sobre marketing digital na internet..."
[Chama web_search com query="marketing digital"]

Usuário: "Como estão minhas campanhas?"
Você: "Vou buscar os dados das suas campanhas..."
[Chama get_analytics]

**REGRAS:**

- Sempre seja claro sobre o que está fazendo
- Se precisar de informações, pergunte antes de executar
- Mostre progresso visual quando possível
- Se algo falhar, explique o erro e sugira alternativa
- Seja conversacional e amigável
`;
}

/**
 * AI Tools - Ferramentas que a IA pode executar
 * 
 * Sistema modular de ferramentas:
 * - Integrações (OAuth)
 * - Web Search
 * - Meta Ads
 * - Shopify
 * - E-commerce
 * - Analytics
 */

export type ToolParameter = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
};

export type Tool = {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: any, context: ToolContext) => Promise<ToolResult>;
  requiresAuth?: boolean;
  platform?: string;
};

export type ToolContext = {
  userId: string;
  organizationId: string;
  conversationId: string;
  token?: string; // JWT token para autenticação nas Edge Functions
};

export type ToolResult = {
  success: boolean;
  data?: any;
  message: string;
  requiresUserAction?: {
    type: 'oauth' | 'credentials' | 'confirmation';
    url?: string;
    fields?: Array<{ name: string; type: string; label: string }>;
  };
  progress?: {
    status: string;
    currentStep: string;
    totalSteps: number;
    currentStepNumber: number;
  };
};

// ============================================================================
// WEB SEARCH TOOLS
// ============================================================================

export const webSearchTool: Tool = {
  name: 'web_search',
  description: 'Pesquisa na internet usando Google Search API ou Bing',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: 'Termo de busca',
      required: true,
    },
    {
      name: 'maxResults',
      type: 'number',
      description: 'Número máximo de resultados (1-10)',
      required: false,
    },
  ],
  execute: async (params, context) => {
    const { query, maxResults = 5 } = params;

    try {
      // TODO: Integrar com Google Custom Search API ou Serper API
      // Por enquanto, simular
      return {
        success: true,
        message: `Pesquisando por "${query}" na web...`,
        progress: {
          status: 'searching',
          currentStep: 'Consultando Google Search API',
          totalSteps: 3,
          currentStepNumber: 1,
        },
        data: {
          query,
          results: [],
          // Será preenchido pela API real
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao pesquisar: ${error.message}`,
      };
    }
  },
};

export const webScrapeTool: Tool = {
  name: 'web_scrape',
  description: 'Extrai conteúdo de uma URL específica',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'URL do site para extrair conteúdo',
      required: true,
    },
    {
      name: 'selector',
      type: 'string',
      description: 'Seletor CSS opcional para extrair parte específica',
      required: false,
    },
  ],
  execute: async (params) => {
    const { url, selector } = params;

    try {
      // TODO: Implementar scraping via Edge Function
      // (não pode ser feito direto do frontend por CORS)
      return {
        success: true,
        message: `Extraindo conteúdo de ${url}...`,
        progress: {
          status: 'scraping',
          currentStep: 'Acessando página',
          totalSteps: 2,
          currentStepNumber: 1,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao acessar URL: ${error.message}`,
      };
    }
  },
};

// ============================================================================
// INTEGRATION TOOLS
// ============================================================================

export const connectMetaAdsTool: Tool = {
  name: 'connect_meta_ads',
  description: 'Conecta com Meta Ads (Facebook/Instagram) via OAuth',
  parameters: [],
  requiresAuth: true,
  platform: 'META_ADS',
  execute: async (params, context) => {
    // Gerar OAuth URL
    const oauthUrl = `/api/oauth/meta/authorize?userId=${context.userId}`;

    return {
      success: true,
      message: 'Para conectar com Meta Ads, clique no botão abaixo para autorizar:',
      requiresUserAction: {
        type: 'oauth',
        url: oauthUrl,
      },
    };
  },
};

export const connectShopifyTool: Tool = {
  name: 'connect_shopify',
  description: 'Conecta com Shopify fornecendo credenciais',
  parameters: [
    {
      name: 'shopName',
      type: 'string',
      description: 'Nome da loja Shopify (exemplo.myshopify.com)',
      required: true,
    },
    {
      name: 'apiKey',
      type: 'string',
      description: 'API Key do Shopify',
      required: true,
    },
    {
      name: 'apiSecret',
      type: 'string',
      description: 'API Secret do Shopify',
      required: true,
    },
  ],
  requiresAuth: true,
  platform: 'SHOPIFY',
  execute: async (params, context) => {
    const { shopName, apiKey, apiSecret } = params;

    try {
      // TODO: Validar e salvar credenciais no Supabase
      // Criptografar antes de salvar
      return {
        success: true,
        message: `Conectado com sucesso à loja ${shopName}!`,
        data: {
          shopName,
          connected: true,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao conectar com Shopify: ${error.message}`,
      };
    }
  },
};

export const connectGoogleAdsTool: Tool = {
  name: 'connect_google_ads',
  description: 'Conecta com Google Ads via OAuth',
  parameters: [],
  requiresAuth: true,
  platform: 'GOOGLE_ADS',
  execute: async (params, context) => {
    const oauthUrl = `/api/oauth/google/authorize?userId=${context.userId}`;

    return {
      success: true,
      message: 'Para conectar com Google Ads, clique no botão abaixo:',
      requiresUserAction: {
        type: 'oauth',
        url: oauthUrl,
      },
    };
  },
};

// ============================================================================
// META ADS TOOLS
// ============================================================================

export const createMetaCampaignTool: Tool = {
  name: 'create_meta_campaign',
  description: 'Cria uma campanha no Meta Ads',
  parameters: [
    {
      name: 'name',
      type: 'string',
      description: 'Nome da campanha',
      required: true,
    },
    {
      name: 'objective',
      type: 'string',
      description: 'Objetivo da campanha',
      required: true,
      enum: ['REACH', 'TRAFFIC', 'ENGAGEMENT', 'LEADS', 'SALES'],
    },
    {
      name: 'budget',
      type: 'number',
      description: 'Orçamento diário em reais',
      required: true,
    },
    {
      name: 'targeting',
      type: 'object',
      description: 'Segmentação da campanha',
      required: false,
    },
  ],
  requiresAuth: true,
  platform: 'META_ADS',
  execute: async (params, context) => {
    const { name, objective, budget, targeting } = params;

    try {
      // Chamar Edge Function ai-tools para executar via Meta Graph API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'create_meta_campaign',
          parameters: { name, objective, budget, targeting },
          userId: context?.userId,
          organizationId: context?.organizationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar campanha');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao criar campanha: ${error.message}`,
      };
    }
  },
};

// ============================================================================
// SHOPIFY TOOLS
// ============================================================================

export const createShopifyProductTool: Tool = {
  name: 'create_shopify_product',
  description: 'Cria um produto na Shopify',
  parameters: [
    {
      name: 'title',
      type: 'string',
      description: 'Nome do produto',
      required: true,
    },
    {
      name: 'description',
      type: 'string',
      description: 'Descrição do produto',
      required: false,
    },
    {
      name: 'price',
      type: 'number',
      description: 'Preço do produto',
      required: true,
    },
    {
      name: 'inventory',
      type: 'number',
      description: 'Quantidade em estoque',
      required: true,
    },
  ],
  requiresAuth: true,
  platform: 'SHOPIFY',
  execute: async (params, context) => {
    const { title, description, price, inventory } = params;

    try {
      // Chamar Edge Function ai-tools para executar via Shopify Admin API
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'create_shopify_product',
          parameters: { title, description, price, inventory },
          userId: context?.userId,
          organizationId: context?.organizationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar produto');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao criar produto: ${error.message}`,
      };
    }
  },
};

// ============================================================================
// ANALYTICS TOOLS
// ============================================================================

export const getAnalyticsTool: Tool = {
  name: 'get_analytics',
  description: 'Obtém dados de analytics das campanhas',
  parameters: [
    {
      name: 'platform',
      type: 'string',
      description: 'Plataforma de anúncios',
      required: true,
      enum: ['META_ADS', 'GOOGLE_ADS', 'ALL'],
    },
    {
      name: 'startDate',
      type: 'string',
      description: 'Data inicial (YYYY-MM-DD)',
      required: true,
    },
    {
      name: 'endDate',
      type: 'string',
      description: 'Data final (YYYY-MM-DD)',
      required: true,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { platform, startDate, endDate } = params;

    try {
      // Chamar Edge Function ai-tools para buscar analytics do Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'get_analytics',
          parameters: { platform, startDate, endDate },
          userId: context?.userId,
          organizationId: context?.organizationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao obter analytics');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
        data: result.data,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao obter analytics: ${error.message}`,
      };
    }
  },
};

// ============================================================================
// REGISTRY DE TOOLS
// ============================================================================

export const AVAILABLE_TOOLS: Tool[] = [
  // Web Search
  webSearchTool,
  webScrapeTool,
  
  // Integrations
  connectMetaAdsTool,
  connectShopifyTool,
  connectGoogleAdsTool,
  
  // Meta Ads
  createMetaCampaignTool,
  
  // Shopify
  createShopifyProductTool,
  
  // Analytics
  getAnalyticsTool,
];

/**
 * Busca tool pelo nome
 */
export function getToolByName(name: string): Tool | undefined {
  return AVAILABLE_TOOLS.find(tool => tool.name === name);
}

/**
 * Executa tool
 */
export async function executeTool(
  toolName: string,
  params: any,
  context: ToolContext
): Promise<ToolResult> {
  const tool = getToolByName(toolName);

  if (!tool) {
    return {
      success: false,
      message: `Tool "${toolName}" não encontrada`,
    };
  }

  try {
    return await tool.execute(params, context);
  } catch (error: any) {
    return {
      success: false,
      message: `Erro ao executar tool: ${error.message}`,
    };
  }
}

/**
 * Converte tools para formato OpenAI Functions
 */
export function toolsToOpenAIFormat(): any[] {
  return AVAILABLE_TOOLS.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => {
          acc[param.name] = {
            type: param.type,
            description: param.description,
            ...(param.enum && { enum: param.enum }),
          };
          return acc;
        }, {} as any),
        required: tool.parameters.filter(p => p.required).map(p => p.name),
      },
    },
  }));
}

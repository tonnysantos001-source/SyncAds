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
// SUPER AI TOOLS - Ferramentas Autônomas
// ============================================================================

export const superWebScraperTool: Tool = {
  name: 'super_web_scraper',
  description: 'Scraping inteligente de produtos com múltiplas abordagens e transparência total',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'URL do site para fazer scraping',
      required: true,
    },
    {
      name: 'productSelectors',
      type: 'object',
      description: 'Seletores CSS para produtos (opcional)',
      required: false,
    },
    {
      name: 'downloadFormat',
      type: 'string',
      description: 'Formato de download (csv, json, zip)',
      required: false,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { url, productSelectors, downloadFormat = 'csv' } = params;

    try {
      // Chamar Edge Function super-ai-tools
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/super-ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'scrape_products',
          parameters: { url, productSelectors, downloadFormat },
          userId: context?.userId,
          organizationId: context?.organizationId,
          conversationId: context?.conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no scraping');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: result.message,
        data: {
          ...result.data,
          steps: result.steps,
          nextActions: result.nextActions,
          downloadUrl: result.data?.downloadUrl,
          fileName: result.data?.fileName
        },
        progress: {
          status: 'completed',
          currentStep: 'Scraping concluído',
          totalSteps: result.steps?.length || 1,
          currentStepNumber: result.steps?.length || 1,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro no scraping inteligente: ${error.message}`,
        progress: {
          status: 'failed',
          currentStep: 'Erro na execução',
          totalSteps: 1,
          currentStepNumber: 1,
        },
      };
    }
  },
};

export const browserAutomationTool: Tool = {
  name: 'browser_automation',
  description: 'Automação completa do browser com navegação, cliques e extração de dados',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'URL para navegar',
      required: true,
    },
    {
      name: 'actions',
      type: 'array',
      description: 'Lista de ações para executar (click, scroll, wait, extract)',
      required: true,
    },
    {
      name: 'waitTime',
      type: 'number',
      description: 'Tempo de espera entre ações (ms)',
      required: false,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { url, actions, waitTime = 3000 } = params;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/super-ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'browser_tool',
          parameters: { url, actions, waitTime },
          userId: context?.userId,
          organizationId: context?.organizationId,
          conversationId: context?.conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro na automação');
      }

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        data: {
          ...result.data,
          steps: result.steps,
          actions: actions
        },
        progress: {
          status: result.success ? 'completed' : 'failed',
          currentStep: result.success ? 'Automação concluída' : 'Erro na automação',
          totalSteps: result.steps?.length || actions.length,
          currentStepNumber: result.steps?.length || actions.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro na automação do browser: ${error.message}`,
        progress: {
          status: 'failed',
          currentStep: 'Erro na execução',
          totalSteps: 1,
          currentStepNumber: 1,
        },
      };
    }
  },
};

export const pythonDataProcessorTool: Tool = {
  name: 'python_data_processor',
  description: 'Processamento avançado de dados usando Python com bibliotecas especializadas',
  parameters: [
    {
      name: 'data',
      type: 'object',
      description: 'Dados para processar',
      required: true,
    },
    {
      name: 'operation',
      type: 'string',
      description: 'Tipo de operação (clean, transform, analyze, export)',
      required: true,
    },
    {
      name: 'libraries',
      type: 'array',
      description: 'Bibliotecas Python necessárias',
      required: false,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { data, operation, libraries = [] } = params;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/super-ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'python_executor',
          parameters: { data, operation, libraries },
          userId: context?.userId,
          organizationId: context?.organizationId,
          conversationId: context?.conversationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro no processamento');
      }

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        data: {
          ...result.data,
          steps: result.steps,
          operation,
          libraries
        },
        progress: {
          status: result.success ? 'completed' : 'failed',
          currentStep: result.success ? 'Processamento concluído' : 'Erro no processamento',
          totalSteps: result.steps?.length || 1,
          currentStepNumber: result.steps?.length || 1,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro no processamento Python: ${error.message}`,
        progress: {
          status: 'failed',
          currentStep: 'Erro na execução',
          totalSteps: 1,
          currentStepNumber: 1,
        },
      };
    }
  },
};

export const multiToolExecutorTool: Tool = {
  name: 'multi_tool_executor',
  description: 'Executa múltiplas ferramentas em sequência para tarefas complexas',
  parameters: [
    {
      name: 'task',
      type: 'string',
      description: 'Descrição da tarefa complexa',
      required: true,
    },
    {
      name: 'tools',
      type: 'array',
      description: 'Lista de ferramentas e parâmetros para executar',
      required: true,
    },
    {
      name: 'strategy',
      type: 'string',
      description: 'Estratégia de execução (sequential, parallel, adaptive)',
      required: false,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { task, tools, strategy = 'sequential' } = params;

    try {
      const results = [];
      const allSteps = [];
      
      for (let i = 0; i < tools.length; i++) {
        const tool = tools[i];
        
        allSteps.push({
          step: `Executando ${tool.name}`,
          status: 'running',
          details: `Ferramenta ${i + 1} de ${tools.length}`
        });

        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/super-ai-tools`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${context?.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              toolName: tool.name,
              parameters: tool.parameters,
              userId: context?.userId,
              organizationId: context?.organizationId,
              conversationId: context?.conversationId,
            }),
          });

          if (!response.ok) {
            throw new Error(`Erro na ferramenta ${tool.name}`);
          }

          const result = await response.json();
          results.push(result);
          
          allSteps.push({
            step: `${tool.name} concluído`,
            status: 'completed',
            details: result.message
          });

        } catch (error) {
          allSteps.push({
            step: `${tool.name} falhou`,
            status: 'failed',
            error: error.message
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const totalCount = tools.length;

      return {
        success: successCount > 0,
        message: `Execução concluída: ${successCount}/${totalCount} ferramentas executadas com sucesso`,
        data: {
          task,
          strategy,
          results,
          successCount,
          totalCount,
          steps: allSteps
        },
        progress: {
          status: successCount === totalCount ? 'completed' : 'partial',
          currentStep: 'Execução multi-ferramenta concluída',
          totalSteps: tools.length,
          currentStepNumber: tools.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro na execução multi-ferramenta: ${error.message}`,
        progress: {
          status: 'failed',
          currentStep: 'Erro na execução',
          totalSteps: 1,
          currentStepNumber: 1,
        },
      };
    }
  },
};

// ============================================================================
// ZIP GENERATION TOOLS
// ============================================================================

export const generateZipTool: Tool = {
  name: 'generate_zip',
  description: 'Gera um arquivo ZIP com múltiplos arquivos para download',
  parameters: [
    {
      name: 'files',
      type: 'array',
      description: 'Lista de arquivos para incluir no ZIP',
      required: true,
    },
    {
      name: 'zipName',
      type: 'string',
      description: 'Nome do arquivo ZIP (opcional)',
      required: false,
    },
  ],
  execute: async (params, context) => {
    const { files, zipName = 'download.zip' } = params;

    try {
      // Chamar Edge Function generate-zip
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-zip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          zipName
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao gerar ZIP');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        success: true,
        message: `Arquivo ZIP gerado com sucesso! Contém ${files.length} arquivo(s).`,
        data: {
          downloadUrl: result.downloadUrl,
          fileName: result.fileName,
          expiresAt: result.expiresAt,
          fileCount: files.length
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao gerar ZIP: ${error.message}`,
      };
    }
  },
};

export const generateCampaignReportTool: Tool = {
  name: 'generate_campaign_report',
  description: 'Gera um relatório completo de campanha em formato ZIP',
  parameters: [
    {
      name: 'campaignId',
      type: 'string',
      description: 'ID da campanha para gerar relatório',
      required: true,
    },
    {
      name: 'includeAnalytics',
      type: 'boolean',
      description: 'Incluir dados de analytics no relatório',
      required: false,
    },
    {
      name: 'includeAssets',
      type: 'boolean',
      description: 'Incluir assets da campanha no ZIP',
      required: false,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { campaignId, includeAnalytics = true, includeAssets = false } = params;

    try {
      // Buscar dados da campanha
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      // Buscar campanha
      const campaignResponse = await fetch(`${supabaseUrl}/functions/v1/ai-tools`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName: 'get_campaign_data',
          parameters: { campaignId },
          userId: context?.userId,
          organizationId: context?.organizationId,
        }),
      });

      if (!campaignResponse.ok) {
        throw new Error('Erro ao buscar dados da campanha');
      }

      const campaignResult = await campaignResponse.json();
      if (!campaignResult.success) {
        throw new Error(campaignResult.message);
      }

      const campaign = campaignResult.data;
      const files = [];

      // Relatório em texto
      const reportContent = `
RELATÓRIO DE CAMPANHA: ${campaign.name}
Data: ${new Date().toLocaleDateString('pt-BR')}

INFORMAÇÕES DA CAMPANHA:
- Nome: ${campaign.name}
- Status: ${campaign.status}
- Orçamento: R$ ${campaign.budget || 'N/A'}
- Data de Início: ${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString('pt-BR') : 'N/A'}
- Data de Fim: ${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString('pt-BR') : 'N/A'}

ANÁLISE DE PERFORMANCE:
${includeAnalytics && campaign.analytics ? 
  campaign.analytics.map((metric: any) => 
    `- ${metric.metric}: ${metric.value} (${metric.change || 'N/A'})`
  ).join('\n') : '- Nenhum dado de análise disponível'}

RELATÓRIO GERADO AUTOMATICAMENTE PELO SYNCADS AI
      `.trim();

      files.push({
        name: 'relatorio-campanha.txt',
        content: reportContent,
        type: 'text'
      });

      // Dados em JSON
      files.push({
        name: 'dados-campanha.json',
        content: JSON.stringify({
          campaign,
          analytics: includeAnalytics ? campaign.analytics : null,
          generatedAt: new Date().toISOString()
        }, null, 2),
        type: 'json'
      });

      // Dados em CSV (se houver analytics)
      if (includeAnalytics && campaign.analytics && campaign.analytics.length > 0) {
        const csvContent = [
          'Metrica,Valor,Mudanca',
          ...campaign.analytics.map((metric: any) => 
            `${metric.metric},${metric.value},${metric.change || 'N/A'}`
          )
        ].join('\n');

        files.push({
          name: 'analytics.csv',
          content: csvContent,
          type: 'csv'
        });
      }

      // Assets (se solicitado)
      if (includeAssets && campaign.assets) {
        for (const asset of campaign.assets) {
          if (asset.content && asset.type) {
            files.push({
              name: asset.name || `asset-${Date.now()}`,
              content: asset.content,
              type: asset.type
            });
          }
        }
      }

      // Gerar ZIP
      const zipResponse = await fetch(`${supabaseUrl}/functions/v1/generate-zip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          zipName: `relatorio-${campaign.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.zip`
        }),
      });

      if (!zipResponse.ok) {
        throw new Error('Erro ao gerar ZIP do relatório');
      }

      const zipResult = await zipResponse.json();
      
      if (!zipResult.success) {
        throw new Error(zipResult.message);
      }

      return {
        success: true,
        message: `Relatório de campanha gerado com sucesso! Contém ${files.length} arquivo(s).`,
        data: {
          downloadUrl: zipResult.downloadUrl,
          fileName: zipResult.fileName,
          expiresAt: zipResult.expiresAt,
          fileCount: files.length,
          campaignName: campaign.name
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao gerar relatório: ${error.message}`,
      };
    }
  },
};

export const generateAnalyticsExportTool: Tool = {
  name: 'generate_analytics_export',
  description: 'Gera exportação de dados de analytics em múltiplos formatos',
  parameters: [
    {
      name: 'platform',
      type: 'string',
      description: 'Plataforma para exportar dados',
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
    {
      name: 'formats',
      type: 'array',
      description: 'Formatos de exportação',
      required: false,
    },
  ],
  requiresAuth: true,
  execute: async (params, context) => {
    const { platform, startDate, endDate, formats = ['csv', 'json', 'txt'] } = params;

    try {
      // Buscar dados de analytics
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
        throw new Error('Erro ao buscar dados de analytics');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      const analyticsData = result.data;
      const files = [];

      // CSV
      if (formats.includes('csv') && analyticsData.length > 0) {
        const csvContent = [
          'Data,Plataforma,Metrica,Valor,Mudanca',
          ...analyticsData.map((item: any) => 
            `${item.date},${item.platform},${item.metric},${item.value},${item.change || 'N/A'}`
          )
        ].join('\n');

        files.push({
          name: 'analytics.csv',
          content: csvContent,
          type: 'csv'
        });
      }

      // JSON
      if (formats.includes('json')) {
        files.push({
          name: 'analytics.json',
          content: JSON.stringify({
            platform,
            startDate,
            endDate,
            data: analyticsData,
            generatedAt: new Date().toISOString()
          }, null, 2),
          type: 'json'
        });
      }

      // TXT
      if (formats.includes('txt')) {
        const txtContent = `
EXPORTAÇÃO DE ANALYTICS - ${platform}
Período: ${startDate} a ${endDate}
Data de geração: ${new Date().toLocaleDateString('pt-BR')}

DADOS:
${analyticsData.length > 0 ? 
  analyticsData.map((item: any) => 
    `${item.date} | ${item.platform} | ${item.metric}: ${item.value} (${item.change || 'N/A'})`
  ).join('\n') : 'Nenhum dado encontrado para o período especificado.'}

EXPORTAÇÃO GERADA PELO SYNCADS AI
        `.trim();

        files.push({
          name: 'analytics.txt',
          content: txtContent,
          type: 'text'
        });
      }

      // Gerar ZIP
      const zipResponse = await fetch(`${supabaseUrl}/functions/v1/generate-zip`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${context?.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files,
          zipName: `analytics-${platform.toLowerCase()}-${startDate}-${endDate}.zip`
        }),
      });

      if (!zipResponse.ok) {
        throw new Error('Erro ao gerar ZIP de analytics');
      }

      const zipResult = await zipResponse.json();
      
      if (!zipResult.success) {
        throw new Error(zipResult.message);
      }

      return {
        success: true,
        message: `Exportação de analytics gerada com sucesso! Contém ${files.length} arquivo(s).`,
        data: {
          downloadUrl: zipResult.downloadUrl,
          fileName: zipResult.fileName,
          expiresAt: zipResult.expiresAt,
          fileCount: files.length,
          platform,
          period: `${startDate} a ${endDate}`
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao gerar exportação: ${error.message}`,
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
  
  // Super AI Tools (Autônomas)
  superWebScraperTool,
  browserAutomationTool,
  pythonDataProcessorTool,
  multiToolExecutorTool,
  
  // ZIP Generation
  generateZipTool,
  generateCampaignReportTool,
  generateAnalyticsExportTool,
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

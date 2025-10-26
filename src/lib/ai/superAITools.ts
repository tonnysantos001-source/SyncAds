import { supabase } from '@/lib/supabase'

export interface ToolStep {
  step: string;
  status: 'running' | 'completed' | 'failed';
  details?: string;
  error?: string;
}

export interface ToolExecution {
  toolName: string;
  parameters: any;
  userId: string;
  organizationId: string;
  conversationId: string;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  message: string;
  steps?: ToolStep[];
  nextActions?: string[];
  requiresUserAction?: boolean;
}

export class SuperAITools {
  private userId: string;
  private organizationId: string;
  private conversationId: string;

  constructor(userId: string, organizationId: string, conversationId: string) {
    this.userId = userId;
    this.organizationId = organizationId;
    this.conversationId = conversationId;
  }

  /**
   * Executa uma ferramenta específica
   */
  async executeTool(toolName: string, parameters: any): Promise<ToolResult> {
    try {
      const { data, error } = await supabase.functions.invoke('super-ai-tools', {
        body: {
          toolName,
          parameters,
          userId: this.userId,
          organizationId: this.organizationId,
          conversationId: this.conversationId
        }
      });

      if (error) {
        throw new Error(`Erro na execução da ferramenta: ${error.message}`);
      }

      return data as ToolResult;
    } catch (error) {
      return {
        success: false,
        message: `Erro ao executar ferramenta ${toolName}: ${error.message}`,
        steps: [{
          step: 'Execução da ferramenta',
          status: 'failed',
          error: error.message
        }]
      };
    }
  }

  /**
   * BROWSER_TOOL - Navegação web real
   */
  async browserTool(url: string, action: string, selector?: string): Promise<ToolResult> {
    return this.executeTool('browser_tool', {
      url,
      action,
      selector,
      waitTime: 3000
    });
  }

  /**
   * WEB_SCRAPER - Scraping com múltiplas abordagens
   */
  async webScraper(url: string, selectors?: any, approach: string = 'auto'): Promise<ToolResult> {
    return this.executeTool('web_scraper', {
      url,
      selectors,
      approach
    });
  }

  /**
   * PYTHON_EXECUTOR - Executa código Python
   */
  async pythonExecutor(code: string, libraries: string[] = []): Promise<ToolResult> {
    return this.executeTool('python_executor', {
      code,
      libraries
    });
  }

  /**
   * API_CALLER - Faz chamadas para APIs
   */
  async apiCaller(url: string, method: string = 'GET', headers: any = {}, body?: any): Promise<ToolResult> {
    return this.executeTool('api_caller', {
      url,
      method,
      headers,
      body
    });
  }

  /**
   * DATA_PROCESSOR - Processa dados
   */
  async dataProcessor(data: any, operation: string, format: string): Promise<ToolResult> {
    return this.executeTool('data_processor', {
      data,
      operation,
      format
    });
  }

  /**
   * FILE_DOWNLOADER - Baixa arquivos
   */
  async fileDownloader(url: string, filename?: string, format?: string): Promise<ToolResult> {
    return this.executeTool('file_downloader', {
      url,
      filename,
      format
    });
  }

  /**
   * SCRAPE_PRODUCTS - Função específica para scraping de produtos
   */
  async scrapeProducts(url: string): Promise<ToolResult> {
    const steps: ToolStep[] = [];
    
    try {
      // Passo 1: Analisar a URL
      steps.push({
        step: 'Analisando URL',
        status: 'running',
        details: `Verificando ${url}`
      });

      // Passo 2: Tentar diferentes abordagens
      let result: ToolResult | null = null;
      const approaches = [
        { name: 'web_scraper', method: () => this.webScraper(url) },
        { name: 'browser_tool', method: () => this.browserTool(url, 'get_page_content') },
        { name: 'api_caller', method: () => this.apiCaller(url) }
      ];

      for (const approach of approaches) {
        steps.push({
          step: `Tentando ${approach.name}`,
          status: 'running',
          details: `Testando abordagem ${approach.name}`
        });

        try {
          result = await approach.method();
          
          if (result.success) {
            steps.push({
              step: `${approach.name} bem-sucedido`,
              status: 'completed',
              details: 'Produtos encontrados'
            });
            break;
          } else {
            steps.push({
              step: `${approach.name} falhou`,
              status: 'failed',
              error: result.message
            });
          }
        } catch (error) {
          steps.push({
            step: `${approach.name} erro`,
            status: 'failed',
            error: error.message
          });
        }
      }

      if (!result || !result.success) {
        return {
          success: false,
          message: 'Todas as abordagens de scraping falharam',
          steps,
          nextActions: [
            'Verificar se o site requer autenticação',
            'Tentar com diferentes user agents',
            'Usar proxy ou VPN',
            'Verificar se o site bloqueia bots',
            'Tentar acessar via API se disponível'
          ]
        };
      }

      // Passo 3: Processar dados se necessário
      if (result.data && result.data.products) {
        steps.push({
          step: 'Processando produtos',
          status: 'running',
          details: 'Organizando dados encontrados'
        });

        const processedData = await this.dataProcessor(
          result.data.products,
          'normalize_products',
          'json'
        );

        steps.push({
          step: 'Produtos processados',
          status: 'completed',
          details: `${processedData.data?.processedCount || 0} produtos organizados`
        });
      }

      return {
        success: true,
        message: `Scraping concluído com sucesso! ${result.data?.products?.length || 0} produtos encontrados`,
        data: {
          url,
          products: result.data?.products || [],
          method: result.data?.method || 'unknown',
          timestamp: new Date().toISOString()
        },
        steps
      };

    } catch (error) {
      steps.push({
        step: 'Erro crítico',
        status: 'failed',
        error: error.message
      });

      return {
        success: false,
        message: `Erro crítico no scraping: ${error.message}`,
        steps
      };
    }
  }

  /**
   * DOWNLOAD_PRODUCTS_CSV - Baixa produtos em formato CSV
   */
  async downloadProductsCSV(products: any[], filename?: string): Promise<ToolResult> {
    const steps: ToolStep[] = [];

    try {
      steps.push({
        step: 'Preparando CSV',
        status: 'running',
        details: 'Convertendo produtos para CSV'
      });

      // Criar CSV
      const csvContent = this.createProductsCSV(products);

      steps.push({
        step: 'CSV criado',
        status: 'completed',
        details: `${products.length} produtos convertidos`
      });

      // Gerar ZIP com CSV
      steps.push({
        step: 'Gerando ZIP',
        status: 'running',
        details: 'Criando arquivo para download'
      });

      const zipResult = await supabase.functions.invoke('generate-zip', {
        body: {
          files: [{
            name: filename || `produtos-${Date.now()}.csv`,
            content: csvContent,
            type: 'csv'
          }],
          zipName: `produtos-${Date.now()}.zip`
        }
      });

      if (zipResult.error) {
        throw new Error(zipResult.error.message);
      }

      steps.push({
        step: 'ZIP gerado',
        status: 'completed',
        details: 'Arquivo pronto para download'
      });

      return {
        success: true,
        message: `Arquivo CSV com ${products.length} produtos gerado com sucesso!`,
        data: {
          downloadUrl: zipResult.data.downloadUrl,
          fileName: zipResult.data.fileName,
          expiresAt: zipResult.data.expiresAt,
          productCount: products.length
        },
        steps
      };

    } catch (error) {
      steps.push({
        step: 'Erro na geração',
        status: 'failed',
        error: error.message
      });

      return {
        success: false,
        message: `Erro ao gerar CSV: ${error.message}`,
        steps
      };
    }
  }

  /**
   * Cria CSV a partir de produtos
   */
  private createProductsCSV(products: any[]): string {
    if (!products || products.length === 0) {
      return 'Nome,Preço,Imagem,Descrição\n';
    }

    const headers = Object.keys(products[0]).join(',');
    const rows = products.map(product => 
      Object.values(product).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value.replace(/"/g, '""')}"` 
          : value
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
}

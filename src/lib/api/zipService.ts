import { supabase } from '@/lib/supabase'

export interface ZipFile {
  name: string;
  content: string;
  type: 'text' | 'json' | 'csv' | 'base64';
}

export interface ZipRequest {
  files: ZipFile[];
  zipName?: string;
}

export interface ZipResponse {
  success: boolean;
  downloadUrl: string;
  fileName: string;
  expiresAt: string;
}

export class ZipService {
  /**
   * Gera um arquivo ZIP com os arquivos fornecidos
   */
  static async generateZip(request: ZipRequest): Promise<ZipResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-zip', {
        body: request
      })

      if (error) {
        throw new Error(`Erro ao gerar ZIP: ${error.message}`)
      }

      return data as ZipResponse
    } catch (error) {
      console.error('Zip generation error:', error)
      throw new Error(`Falha ao gerar arquivo ZIP: ${error.message}`)
    }
  }

  /**
   * Cria um arquivo de texto simples
   */
  static createTextFile(name: string, content: string): ZipFile {
    return {
      name: name.endsWith('.txt') ? name : `${name}.txt`,
      content,
      type: 'text'
    }
  }

  /**
   * Cria um arquivo JSON
   */
  static createJsonFile(name: string, data: any): ZipFile {
    return {
      name: name.endsWith('.json') ? name : `${name}.json`,
      content: JSON.stringify(data, null, 2),
      type: 'json'
    }
  }

  /**
   * Cria um arquivo CSV
   */
  static createCsvFile(name: string, data: any[]): ZipFile {
    if (!data || data.length === 0) {
      throw new Error('Dados CSV não podem estar vazios')
    }

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]
          // Escapar vírgulas e aspas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        }).join(',')
      )
    ].join('\n')

    return {
      name: name.endsWith('.csv') ? name : `${name}.csv`,
      content: csvContent,
      type: 'csv'
    }
  }

  /**
   * Cria um arquivo base64 (para imagens, PDFs, etc)
   */
  static createBase64File(name: string, base64Content: string): ZipFile {
    return {
      name,
      content: base64Content,
      type: 'base64'
    }
  }

  /**
   * Gera ZIP com relatório de campanha
   */
  static async generateCampaignReport(campaign: any, analytics: any[]): Promise<ZipResponse> {
    const files: ZipFile[] = []

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
${analytics.length > 0 ? analytics.map(metric => 
  `- ${metric.metric}: ${metric.value} (${metric.change || 'N/A'})`
).join('\n') : '- Nenhum dado de análise disponível'}

RELATÓRIO GERADO AUTOMATICAMENTE PELO SYNCADS AI
    `.trim()

    files.push(this.createTextFile('relatorio-campanha', reportContent))

    // Dados em JSON
    files.push(this.createJsonFile('dados-campanha', {
      campaign,
      analytics,
      generatedAt: new Date().toISOString()
    }))

    // Dados em CSV (se houver analytics)
    if (analytics.length > 0) {
      files.push(this.createCsvFile('analytics', analytics))
    }

    return this.generateZip({
      files,
      zipName: `relatorio-${campaign.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.zip`
    })
  }

  /**
   * Gera ZIP com assets de campanha
   */
  static async generateCampaignAssets(campaign: any, assets: any[]): Promise<ZipResponse> {
    const files: ZipFile[] = []

    // Adicionar cada asset
    for (const asset of assets) {
      if (asset.content && asset.type) {
        files.push({
          name: asset.name || `asset-${Date.now()}`,
          content: asset.content,
          type: asset.type as ZipFile['type']
        })
      }
    }

    // Adicionar manifesto
    const manifest = {
      campaign: campaign.name,
      assets: assets.map(a => ({
        name: a.name,
        type: a.type,
        size: a.size || 'N/A'
      })),
      generatedAt: new Date().toISOString()
    }

    files.push(this.createJsonFile('manifesto-assets', manifest))

    return this.generateZip({
      files,
      zipName: `assets-${campaign.name.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.zip`
    })
  }
}

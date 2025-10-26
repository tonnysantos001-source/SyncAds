import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ==================== FERRAMENTAS ====================

interface ToolContext {
  supabase: any;
  userId: string;
  organizationId: string;
}

// Cache simples em memória (Edge Functions são stateless, mas ajuda durante execução)
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hora

function getCached(key: string): any | null {
  const cached = cache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  return null
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() })
}

// 1. Buscar na Web com Múltiplos Providers (Exa, Tavily, Serper)
async function webSearch(query: string): Promise<string> {
  try {
    // Verificar cache primeiro
    const cached = getCached(`search:${query}`)
    if (cached) {
      console.log('📦 Using cached search results')
      return cached
    }

    // Tentar múltiplos providers em sequência
    let results = null

    // 1. Tentar Exa AI (mais inteligente)
    const exaKey = Deno.env.get('EXA_API_KEY')
    if (exaKey) {
      try {
        console.log('🤖 Trying Exa AI Search...')
        const exaResponse = await fetch('https://api.exa.ai/search', {
          method: 'POST',
          headers: {
            'x-api-key': exaKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            query: query,
            numResults: 5,
            type: 'neural',
            useAutoprompt: true
          })
        })

        if (exaResponse.ok) {
          const exaData = await exaResponse.json()
          if (exaData.results && exaData.results.length > 0) {
            results = exaData.results.map((r: any, i: number) => 
              `${i + 1}. **${r.title}**\n   ${r.text || r.url}\n   ${r.url}`
            ).join('\n\n')
            console.log('✅ Exa AI results found')
          }
        }
      } catch (error) {
        console.log('⚠️ Exa AI failed, trying next provider')
      }
    }

    // 2. Tentar Tavily (otimizado para agents)
    if (!results) {
      const tavilyKey = Deno.env.get('TAVILY_API_KEY')
      if (tavilyKey) {
        try {
          console.log('🔍 Trying Tavily AI...')
          const tavilyResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: query,
              max_results: 5,
              include_answer: true
            })
          })

          if (tavilyResponse.ok) {
            const tavilyData = await tavilyResponse.json()
            if (tavilyData.results && tavilyData.results.length > 0) {
              results = tavilyData.results.map((r: any, i: number) => 
                `${i + 1}. **${r.title}**\n   ${r.content}\n   ${r.url}`
              ).join('\n\n')
              
              // Tavily também retorna uma "answer" gerada pela IA
              if (tavilyData.answer) {
                results = `💡 **Resposta da IA:**\n${tavilyData.answer}\n\n📚 **Fontes:**\n\n${results}`
              }
              
              console.log('✅ Tavily AI results found')
            }
          }
        } catch (error) {
          console.log('⚠️ Tavily failed, trying next provider')
        }
      }
    }

    // 3. Fallback: Serper API (simples e confiável)
    if (!results) {
      const serperKey = Deno.env.get('SERPER_API_KEY')
      if (serperKey) {
        console.log('🔍 Trying Serper API...')
        const serperResponse = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ q: query, num: 5 })
        })

        if (serperResponse.ok) {
          const serperData = await serperResponse.json()
          const organic = serperData.organic?.slice(0, 5) || []
          
          if (organic.length > 0) {
            results = organic.map((r: any, i: number) => 
              `${i + 1}. **${r.title}**\n   ${r.snippet}\n   ${r.link}`
            ).join('\n\n')
            console.log('✅ Serper results found')
          }
        }
      }
    }

    if (!results) {
      return '❌ Nenhum provider de busca configurado ou todos falharam. Configure EXA_API_KEY, TAVILY_API_KEY ou SERPER_API_KEY.'
    }

    // Salvar no cache
    setCache(`search:${query}`, results)

    return results
  } catch (error: any) {
    return `Erro ao buscar: ${error.message}`
  }
}

// 2. Listar Campanhas
async function listCampaigns(ctx: ToolContext): Promise<string> {
  try {
    const { data, error } = await ctx.supabase
      .from('Campaign')
      .select('id, name, platform, status, budget, objective')
      .eq('organizationId', ctx.organizationId)
      .order('createdAt', { ascending: false })
      .limit(10)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'Nenhuma campanha encontrada.'
    }

    return data.map((c: any, i: number) => 
      `${i + 1}. **${c.name}**\n` +
      `   • Plataforma: ${c.platform}\n` +
      `   • Status: ${c.status}\n` +
      `   • Budget: R$ ${c.budget || 0}\n` +
      `   • Objetivo: ${c.objective || 'N/A'}`
    ).join('\n\n')
  } catch (error: any) {
    return `Erro ao listar campanhas: ${error.message}`
  }
}

// 3. Criar Campanha
async function createCampaign(ctx: ToolContext, params: {
  name: string;
  platform: string;
  budget?: number;
  objective?: string;
}): Promise<string> {
  try {
    const { data, error } = await ctx.supabase
      .from('Campaign')
      .insert({
        organizationId: ctx.organizationId,
        name: params.name,
        platform: params.platform.toUpperCase(),
        budget: params.budget || 100,
        objective: params.objective || 'CONVERSIONS',
        status: 'DRAFT',
        startDate: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return `✅ Campanha criada com sucesso!\n\n` +
      `**${data.name}**\n` +
      `• ID: ${data.id}\n` +
      `• Plataforma: ${data.platform}\n` +
      `• Budget: R$ ${data.budget}\n` +
      `• Status: ${data.status}\n\n` +
      `A campanha está em rascunho. Você pode editá-la e ativá-la quando estiver pronta.`
  } catch (error: any) {
    return `Erro ao criar campanha: ${error.message}`
  }
}

// 4. Obter Analytics
async function getAnalytics(ctx: ToolContext): Promise<string> {
  try {
    // Campanhas ativas
    const { data: campaigns, error: campaignsError } = await ctx.supabase
      .from('Campaign')
      .select('status')
      .eq('organizationId', ctx.organizationId)

    if (campaignsError) throw campaignsError

    const total = campaigns?.length || 0
    const active = campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0
    const draft = campaigns?.filter((c: any) => c.status === 'DRAFT').length || 0
    const paused = campaigns?.filter((c: any) => c.status === 'PAUSED').length || 0

    // Produtos
    const { data: products } = await ctx.supabase
      .from('Product')
      .select('id')
      .eq('organizationId', ctx.organizationId)

    const totalProducts = products?.length || 0

    // Mensagens do chat
    const { data: messages } = await ctx.supabase
      .from('ChatMessage')
      .select('id')
      .gte('createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const messagesLastWeek = messages?.length || 0

    return `📊 **ANALYTICS DA ORGANIZAÇÃO**\n\n` +
      `**Campanhas:**\n` +
      `• Total: ${total}\n` +
      `• Ativas: ${active}\n` +
      `• Rascunho: ${draft}\n` +
      `• Pausadas: ${paused}\n\n` +
      `**Produtos:** ${totalProducts}\n\n` +
      `**Uso do Chat:** ${messagesLastWeek} mensagens nos últimos 7 dias`
  } catch (error: any) {
    return `Erro ao buscar analytics: ${error.message}`
  }
}

// Detector de intenção (melhorado com comandos)
function detectIntent(message: string): { tool: string; params?: any } | null {
  const lower = message.toLowerCase().trim()

  // ===== COMANDOS ESPECIAIS (começam com /) =====
  if (lower.startsWith('/')) {
    if (lower === '/help' || lower === '/ajuda') {
      return { tool: 'show_help' }
    }
    if (lower === '/stats' || lower === '/analytics') {
      return { tool: 'get_analytics' }
    }
    if (lower === '/relatorio' || lower === '/report') {
      return { tool: 'full_report' }
    }
    if (lower === '/campanhas' || lower === '/campaigns') {
      return { tool: 'list_campaigns' }
    }
    if (lower === '/usuarios' || lower === '/users') {
      return { tool: 'list_users' }
    }
    if (lower === '/produtos' || lower === '/products') {
      return { tool: 'list_products' }
    }
  }

  // ===== DETECÇÃO DE INTENÇÃO NATURAL =====
  
  // Conexão de Integrações (NOVO!)
  if ((lower.includes('conect') || lower.includes('integr') || lower.includes('vincul') || lower.includes('link')) &&
      (lower.includes('facebook') || lower.includes('meta') || lower.includes('google') || 
       lower.includes('linkedin') || lower.includes('tiktok') || lower.includes('twitter') ||
       lower.includes('canva') || lower.includes('instagram'))) {
    
    // Detectar qual plataforma
    const platforms: Record<string, string> = {
      'facebook': 'Facebook',
      'meta': 'Meta Ads',
      'google': 'Google Ads',
      'linkedin': 'LinkedIn',
      'tiktok': 'TikTok',
      'twitter': 'Twitter',
      'canva': 'Canva',
      'instagram': 'Instagram'
    }
    
    for (const [key, name] of Object.entries(platforms)) {
      if (lower.includes(key)) {
        return { 
          tool: 'connect_integration',
          params: { platform: key, platformName: name }
        }
      }
    }
  }
  
  // Ajuda
  if (lower.includes('ajuda') || lower.includes('comandos') || lower.includes('o que você pode fazer')) {
    return { tool: 'show_help' }
  }

  // Relatório
  if ((lower.includes('relatório') || lower.includes('relatorio') || lower.includes('report')) &&
      (lower.includes('completo') || lower.includes('geral') || lower.includes('full'))) {
    return { tool: 'full_report' }
  }

  // Usuários
  if ((lower.includes('lista') || lower.includes('mostr') || lower.includes('ver') || lower.includes('quantos')) && 
      (lower.includes('usuário') || lower.includes('usuario') || lower.includes('user'))) {
    return { tool: 'list_users' }
  }

  // Produtos
  if ((lower.includes('lista') || lower.includes('mostr') || lower.includes('ver') || lower.includes('quantos')) && 
      (lower.includes('produto') || lower.includes('product') || lower.includes('estoque'))) {
    return { tool: 'list_products' }
  }

  // Geração de imagens
  if ((lower.includes('ger') || lower.includes('cri') || lower.includes('faça') || lower.includes('faz')) && 
      (lower.includes('imagem') || lower.includes('foto') || lower.includes('banner') || lower.includes('logo'))) {
    return { tool: 'generate_image', params: { prompt: message } }
  }

  // Web search
  if (lower.includes('pesquis') || lower.includes('busca') || lower.includes('procur') || 
      lower.includes('google') || lower.includes('internet') || lower.startsWith('buscar')) {
    return { tool: 'web_search', params: message }
  }

  // Listar campanhas
  if ((lower.includes('lista') || lower.includes('mostr') || lower.includes('ver')) && 
      lower.includes('campanha')) {
    return { tool: 'list_campaigns' }
  }

  // Criar campanha
  if ((lower.includes('cri') || lower.includes('faz') || lower.includes('nova')) && 
      lower.includes('campanha')) {
    // Tentar extrair informações
    const platforms = ['meta', 'facebook', 'instagram', 'google', 'linkedin', 'tiktok', 'twitter']
    const platform = platforms.find(p => lower.includes(p)) || 'META'
    
    // Extrair nome (após "campanha")
    const nameMatch = message.match(/campanha\s+["']?([^"'\n]+)["']?/i)
    const name = nameMatch?.[1]?.trim() || 'Nova Campanha'

    // Extrair budget
    const budgetMatch = message.match(/(?:budget|orçamento|valor)\s*:?\s*(?:R\$)?\s*(\d+)/i)
    const budget = budgetMatch ? parseInt(budgetMatch[1]) : 100

    return { 
      tool: 'create_campaign', 
      params: { name, platform, budget }
    }
  }

  // Analytics
  if (lower.includes('analytic') || lower.includes('métricas') || 
      lower.includes('estatística') || lower.includes('resumo') || 
      (lower.includes('como') && lower.includes('está')) ||
      lower.includes('performance')) {
    return { tool: 'get_analytics' }
  }

  // Web Scraping / Download de produtos
  // Detectar múltiplas variações de palavras-chave
  const hasScrapingAction = lower.includes('baix') || lower.includes('download') || 
                            lower.includes('scraper') || lower.includes('extrair') || 
                            lower.includes('pegar') || lower.includes('entre nesse site')
  
  const hasScrapingObject = lower.includes('produto') || lower.includes('item') || 
                            lower.includes('site') || lower.includes('santalolla') ||
                            lower.includes('produtos') || lower.includes('itens')
  
  const hasUrl = lower.match(/https?:\/\//) || lower.includes('www.')
  
  // Se tem ação de scraping OU tem URL visível
  if ((hasScrapingAction && hasScrapingObject) || hasUrl) {
    
    // Extrair URL da mensagem
    const urlMatch = message.match(/https?:\/\/(?:www\.)?[^\s]+/i)
    const url = urlMatch ? urlMatch[0] : null
    
    // Detectar se quer CSV/ZIP
    const format = lower.includes('csv') ? 'csv' : lower.includes('zip') ? 'zip' : 'csv'
    
    console.log('🔍 Scraping detectado! URL:', url, 'Format:', format)
    
    return { 
      tool: 'scrape_products',
      params: { url, format }
    }
  }

  // Geração de arquivo (CSV, ZIP, etc)
  if ((lower.includes('arquivo') || lower.includes('export') || lower.includes('download')) &&
      (lower.includes('csv') || lower.includes('zip') || lower.includes('json'))) {
    return {
      tool: 'generate_export',
      params: { format: lower.match(/csv|zip|json/i)?.[0] || 'csv' }
    }
  }

  return null
}

// 5. Gerar Imagem (Desabilitado temporariamente - requer configuração DALL-E)
async function generateImage(ctx: ToolContext, params: { prompt: string }): Promise<string> {
  return `⚠️ **Geração de imagens temporariamente desabilitada**\n\n` +
         `Esta funcionalidade será habilitada em breve após configuração do DALL-E.\n` +
         `Por enquanto, você pode usar o chat normalmente para outras tarefas.`
}

// 6. Listar Usuários
async function listUsers(ctx: ToolContext): Promise<string> {
  try {
    const { data, error } = await ctx.supabase
      .from('User')
      .select('id, email, name, role, isActive, createdAt')
      .eq('organizationId', ctx.organizationId)
      .order('createdAt', { ascending: false })
      .limit(20)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'Nenhum usuário encontrado.'
    }

    const total = data.length
    const active = data.filter((u: any) => u.isActive).length

    return `👥 **USUÁRIOS** (${total} total, ${active} ativos)\n\n` +
      data.slice(0, 10).map((u: any, i: number) => 
        `${i + 1}. **${u.name || u.email}**\n` +
        `   • Email: ${u.email}\n` +
        `   • Role: ${u.role}\n` +
        `   • Status: ${u.isActive ? '✅ Ativo' : '❌ Inativo'}\n` +
        `   • Cadastro: ${new Date(u.createdAt).toLocaleDateString('pt-BR')}`
      ).join('\n\n')
  } catch (error: any) {
    return `Erro ao listar usuários: ${error.message}`
  }
}

// 7. Listar Produtos
async function listProducts(ctx: ToolContext): Promise<string> {
  try {
    const { data, error } = await ctx.supabase
      .from('Product')
      .select('id, name, price, stock, isActive')
      .eq('organizationId', ctx.organizationId)
      .order('createdAt', { ascending: false })
      .limit(15)

    if (error) throw error

    if (!data || data.length === 0) {
      return 'Nenhum produto encontrado.'
    }

    return `🛍️ **PRODUTOS** (${data.length} total)\n\n` +
      data.map((p: any, i: number) => 
        `${i + 1}. **${p.name}**\n` +
        `   • Preço: R$ ${p.price || 0}\n` +
        `   • Estoque: ${p.stock || 0} unidades\n` +
        `   • Status: ${p.isActive ? '✅ Ativo' : '❌ Inativo'}`
      ).join('\n\n')
  } catch (error: any) {
    return `Erro ao listar produtos: ${error.message}`
  }
}

// 9. Scrape Products (Web Scraping)
async function scrapeProducts(params: { url?: string; format?: string }, ctx: ToolContext): Promise<string> {
  try {
    const { url, format = 'csv' } = params

    if (!url) {
      return '❌ Erro: URL não fornecida. Forneça uma URL válida para fazer scraping.'
    }

    console.log('🔍 Iniciando scraping AVANÇADO em:', url)

    // Usar Edge Function advanced-scraper
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    
    console.log('🤖 Chamando advanced-scraper...')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/advanced-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        url,
        format,
        userId: ctx.userId,
        organizationId: ctx.organizationId,
        conversationId: ctx.userId // fallback
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Erro no scraping avançado')
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.message || 'Erro no scraping')
    }

    // Retornar resultado formatado com progresso
    let progressMessages = []
    
    if (result.steps) {
      result.steps.forEach((step: any) => {
        if (step.status === 'completed') {
          progressMessages.push(`✅ ${step.step}${step.details ? ` - ${step.details}` : ''}`)
        }
      })
    }

    if (result.data?.downloadUrl) {
      return progressMessages.join('\n') + '\n\n' +
        `✅ **Scraping AVANÇADO concluído!**\n\n` +
        `📊 Total de produtos encontrados: ${result.data.totalProducts || 0}\n\n` +
        `📥 **Download disponível:**\n` +
        `[Baixar ${result.data.fileName || 'produtos.csv'}](${result.data.downloadUrl})\n\n` +
        `⏰ Link expira em 1 hora\n\n` +
        `💡 Preview dos produtos:\n` +
        result.data.products?.map((p: any, i: number) => 
          `${i + 1}. ${p.name || 'Sem nome'}${p.price ? ` - R$ ${p.price}` : ''}`
        ).join('\n')
    }

    return progressMessages.join('\n') + '\n\n' + `✅ Scraping concluído com sucesso!\n\n${result.message}`
  } catch (error: any) {
    console.error('❌ Erro no scraping:', error)
    
    // Tentar scraping básico como fallback
    console.log('🔄 Tentando scraping básico como fallback...')
    
    return `❌ Erro ao fazer scraping avançado: ${error.message}\n\n` +
      `💡 **Dicas para resolver:**\n` +
      `- Verifique se a URL está acessível\n` +
      `- Tente novamente em alguns segundos\n` +
      `- Ou use uma URL de outro site\n\n` +
      `Estou trabalhando em uma solução mais robusta!`
  }
}

// 10. Generate Export
async function generateExport(params: { format?: string }): Promise<string> {
  const { format = 'csv' } = params
  
  return `🔄 **Gerando export em ${format.toUpperCase()}...**\n\n` +
    `Esta funcionalidade está em desenvolvimento. Use a ferramenta de scraping para download direto.`
}

// 8. Relatório Completo
async function generateFullReport(ctx: ToolContext): Promise<string> {
  try {
    // Campanhas
    const { data: campaigns } = await ctx.supabase
      .from('Campaign')
      .select('status, budget')
      .eq('organizationId', ctx.organizationId)

    const totalCampaigns = campaigns?.length || 0
    const activeCampaigns = campaigns?.filter((c: any) => c.status === 'ACTIVE').length || 0
    const totalBudget = campaigns?.reduce((sum: number, c: any) => sum + (c.budget || 0), 0) || 0

    // Usuários
    const { data: users } = await ctx.supabase
      .from('User')
      .select('isActive')
      .eq('organizationId', ctx.organizationId)

    const totalUsers = users?.length || 0
    const activeUsers = users?.filter((u: any) => u.isActive).length || 0

    // Produtos
    const { data: products } = await ctx.supabase
      .from('Product')
      .select('stock')
      .eq('organizationId', ctx.organizationId)

    const totalProducts = products?.length || 0
    const totalStock = products?.reduce((sum: number, p: any) => sum + (p.stock || 0), 0) || 0

    // Chat usage
    const { data: messages } = await ctx.supabase
      .from('ChatMessage')
      .select('id')
      .gte('createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const messagesLast30Days = messages?.length || 0

    return `📊 **RELATÓRIO COMPLETO DA ORGANIZAÇÃO**\n\n` +
      `**📢 CAMPANHAS**\n` +
      `• Total: ${totalCampaigns}\n` +
      `• Ativas: ${activeCampaigns}\n` +
      `• Budget Total: R$ ${totalBudget.toFixed(2)}\n\n` +
      `**👥 USUÁRIOS**\n` +
      `• Total: ${totalUsers}\n` +
      `• Ativos: ${activeUsers}\n` +
      `• Taxa de ativação: ${totalUsers > 0 ? ((activeUsers/totalUsers)*100).toFixed(1) : 0}%\n\n` +
      `**🛍️ PRODUTOS**\n` +
      `• Total: ${totalProducts}\n` +
      `• Estoque Total: ${totalStock} unidades\n\n` +
      `**💬 USO DO CHAT**\n` +
      `• Mensagens (30 dias): ${messagesLast30Days}\n` +
      `• Média diária: ${(messagesLast30Days / 30).toFixed(1)} mensagens\n\n` +
      `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}`
  } catch (error: any) {
    return `Erro ao gerar relatório: ${error.message}`
  }
}

// 9. Ajuda (Lista de comandos)
function showHelp(): string {
  return `📚 **COMANDOS DISPONÍVEIS**\n\n` +
    `**🔍 Informações:**\n` +
    `• /stats ou /analytics - Estatísticas gerais\n` +
    `• /relatorio - Relatório completo\n` +
    `• /campanhas - Listar campanhas\n` +
    `• /usuarios - Listar usuários\n` +
    `• /produtos - Listar produtos\n\n` +
    `**🛠️ Ações:**\n` +
    `• "criar campanha [nome]" - Criar nova campanha\n` +
    `• "buscar [termo]" - Buscar na web\n\n` +
    `**💡 Dicas:**\n` +
    `• Você pode fazer perguntas naturalmente!\n` +
    `• Exemplo: "Quantos usuários temos?"\n` +
    `• Exemplo: "Como está a performance?"\n` +
    `• Exemplo: "Pesquise sobre marketing digital"\n\n` +
    `**ℹ️ Mais informações:**\n` +
    `• /ajuda ou /help - Mostrar esta mensagem`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CHAT STREAM REQUEST START ===')
    
    const body = await req.json()
    const { message, conversationId, conversationHistory = [], systemPrompt } = body
    
    console.log('Message:', message?.substring(0, 50))
    console.log('ConversationId:', conversationId)
    console.log('History length:', conversationHistory?.length || 0)

    if (!message || !conversationId) {
      console.error('Missing required fields')
      return new Response(
        JSON.stringify({ error: 'Missing message or conversationId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No auth header')
      throw new Error('Missing auth header')
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token length:', token.length)
    
    // Create Supabase client ✅ FIX: estava faltando criar a instância!
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    console.log('Auth result - User ID:', user?.id, 'Error:', authError?.message)

    if (authError || !user) {
      console.error('Auth failed:', authError)
      throw new Error('Unauthorized')
    }

    // Get user's organization
    console.log('Fetching user organization...')
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId')
      .eq('id', user.id)
      .single()

    console.log('User data:', userData, 'Error:', userError?.message)

    if (!userData?.organizationId) {
      console.error('No organizationId for user')
      throw new Error('User not associated with an organization')
    }

    // Get AI config - SIMPLIFIED: busca QUALQUER IA ativa (sem dependência de org)
    console.log('Fetching active AI config...')
    
    const { data: aiConfig, error: aiError } = await supabase
      .from('GlobalAiConnection')
      .select('id, provider, apiKey, baseUrl, model, temperature, systemPrompt, isActive')
      .eq('isActive', true)
      .limit(1)
      .maybeSingle()

    console.log('GlobalAI found:', !!aiConfig, 'Error:', aiError?.message)

    if (!aiConfig) {
      console.error('No active AI found')
      throw new Error('Nenhuma IA ativa configurada. Contate o administrador.')
    }

    console.log('AI Config - Provider:', aiConfig.provider, 'Model:', aiConfig.model)
    console.log('AI Config - API Key length:', aiConfig.apiKey?.length || 0, 'Has key:', !!aiConfig.apiKey)

    // Verificar se API key está configurada
    if (!aiConfig.apiKey) {
      console.error('No API key configured')
      throw new Error('API key não configurada. Configure uma API key válida nas configurações da IA.')
    }

    // Buscar histórico de mensagens (últimas 20)
    const { data: messages } = await supabase
      .from('ChatMessage')
      .select('role, content')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })
      .limit(20)

    // Construir histórico para contexto (apenas mensagens válidas)
    const chatHistory = messages
      ?.filter(m => m.role && m.content && ['user', 'assistant', 'system'].includes(m.role))
      .map(m => ({
        role: m.role as 'user' | 'assistant' | 'system',
        content: String(m.content)
      })) || []
    
    console.log('Chat history messages:', chatHistory.length)

    // ===== EXECUTAR FERRAMENTAS (se necessário) =====
    const toolContext: ToolContext = {
      supabase,
      userId: user.id,
      organizationId: userData.organizationId
    }

    const intent = detectIntent(message)
    let toolResult = ''

    if (intent) {
      console.log('Tool detected:', intent.tool)
      
      switch (intent.tool) {
        case 'connect_integration':
          // Retornar resposta especial para o frontend mostrar card de conexão
          const aiResponse = `🔗 **INTEGRATION_CONNECT:${intent.params.platform}:${intent.params.platformName}** 🔗\n\n` +
            `Vou te ajudar a conectar sua conta do ${intent.params.platformName}. ` +
            `Isso vai permitir que você gerencie suas campanhas e anúncios diretamente por aqui!`
          
          // Salvar mensagens e retornar imediatamente (sem chamar IA)
          const userMsgId = crypto.randomUUID()
          const assistantMsgId = crypto.randomUUID()
          
          await supabase
            .from('ChatMessage')
            .insert([
              { id: userMsgId, conversationId, role: 'USER', content: message, userId: user.id },
              { id: assistantMsgId, conversationId, role: 'ASSISTANT', content: aiResponse, userId: user.id }
            ])
          
          return new Response(
            JSON.stringify({ response: aiResponse }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
          
        case 'generate_image':
          toolResult = await generateImage(toolContext, intent.params)
          break
        case 'web_search':
          toolResult = await webSearch(intent.params)
          break
        case 'list_campaigns':
          toolResult = await listCampaigns(toolContext)
          break
        case 'create_campaign':
          toolResult = await createCampaign(toolContext, intent.params)
          break
        case 'get_analytics':
          toolResult = await getAnalytics(toolContext)
          break
        case 'list_users':
          toolResult = await listUsers(toolContext)
          break
        case 'list_products':
          toolResult = await listProducts(toolContext)
          break
        case 'scrape_products':
          toolResult = await scrapeProducts(intent.params, toolContext)
          break
        case 'generate_export':
          toolResult = await generateExport(intent.params)
          break
        case 'full_report':
          toolResult = await generateFullReport(toolContext)
          break
        case 'show_help':
          toolResult = showHelp()
          break
      }

      console.log('Tool result:', toolResult.substring(0, 100))
    }

    // Preparar request para IA
    const systemPrompt = (aiConfig.systemPrompt || 'Você é um assistente inteligente e sarcástico para marketing digital.') + '\n\n' +
      '🛠️ FERRAMENTAS DISPONÍVEIS:\n' +
      '• Web Scraping - Baixar produtos de sites (ex: "baixe produtos de https://site.com")\n' +
      '• Geração de CSV/ZIP - Exportar dados para Shopify\n' +
      '• Buscar na web - Pesquisar informações\n' +
      '• Criar campanhas - Campanhas publicitárias\n' +
      '• Listar produtos/usuários/campanhas\n\n' +
      '💡 IMPORTANTE:\n' +
      '- SEMPRE responda positivamente às requisições de scraping\n' +
      '- Quando detectar intenção de baixar produtos, execute a ferramenta scraping\n' +
      '- Use o resultado das ferramentas para responder de forma clara\n' +
      '- Seja sarcástica e útil (conforme seu humor característico)'
    
    const requestMessages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: message }
    ]

    // Se teve resultado de ferramenta, adicionar ao contexto
    if (toolResult) {
      requestMessages.push({
        role: 'system',
        content: `RESULTADO DA FERRAMENTA:\n${toolResult}\n\nUse este resultado para responder ao usuário de forma clara e útil.`
      })
    }

    // Chamar IA com STREAMING (se não tiver toolResult)
    let aiResponse = ''
    
    // Se já tem resultado de ferramenta (especialmente scraping), não precisa chamar IA
    if (!toolResult) {
      // Determinar URL e headers baseado no provider
      let apiUrl = ''
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      }

      if (aiConfig.provider === 'GROQ') {
        apiUrl = 'https://api.groq.com/openai/v1/chat/completions'
      } else if (aiConfig.provider === 'OPENROUTER') {
        apiUrl = 'https://openrouter.ai/api/v1/chat/completions'
        headers['HTTP-Referer'] = 'https://syncads.com'
        headers['X-Title'] = 'SyncAds Admin'
      } else if (aiConfig.provider === 'OPENAI') {
        apiUrl = 'https://api.openai.com/v1/chat/completions'
      } else {
        throw new Error(`Provider ${aiConfig.provider} not supported`)
      }
      
      if (aiConfig.provider === 'OPENROUTER' || aiConfig.provider === 'GROQ' || aiConfig.provider === 'OPENAI') {
        console.log('Calling AI API:', apiUrl)
        console.log('Headers:', { ...headers, Authorization: 'Bearer ***hidden***' })
        
        let response: Response;
        
        try {
          response = await fetch(apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: aiConfig.model || 'gpt-3.5-turbo',
              messages: requestMessages,
              temperature: aiConfig.temperature || 0.7,
              stream: true
            })
          })

          if (!response.ok) {
            const errorText = await response.text()
            console.error('AI API Error Response:', errorText.substring(0, 500))
            
            // Tentar parsear erro como JSON
            try {
              const errorJson = JSON.parse(errorText)
              throw new Error(`Erro na API da IA: ${errorJson.error?.message || errorJson.message || 'Erro desconhecido'}`)
            } catch {
              throw new Error(`Erro na API da IA: ${errorText.substring(0, 200)}`)
            }
          }
          
          console.log('AI API Response OK')
        } catch (error: any) {
          console.error('Failed to call AI API:', error.message)
          throw error
        }

        // Processar stream
        const reader = response.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) throw new Error('No response body')

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim() !== '')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                const content = parsed.choices[0]?.delta?.content || ''
                aiResponse += content
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    }

    // Se não chamou IA mas tem toolResult, usar toolResult como resposta
    if (!aiResponse && toolResult) {
      aiResponse = toolResult
    }

    // Fallback apenas se realmente não houver resposta
    if (!aiResponse) {
      aiResponse = 'Sem resposta da IA'
    }
    
    console.log('AI Response length:', aiResponse.length)
    console.log('AI Response preview:', aiResponse.substring(0, 100))

    // Salvar mensagens no banco
    console.log('Salvando mensagens no banco...')
    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()
    
    const { data: savedMessages, error: insertError } = await supabase
      .from('ChatMessage')
      .insert([
        { id: userMsgId, conversationId, role: 'USER', content: message, userId: user.id },
        { id: assistantMsgId, conversationId, role: 'ASSISTANT', content: aiResponse, userId: user.id }
      ])
      .select()

    if (insertError) {
      console.error('Erro ao salvar mensagens:', insertError)
      throw new Error(`Failed to save messages: ${insertError.message}`)
    }
    
    console.log('Mensagens salvas com sucesso:', savedMessages?.length || 0)

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('Chat stream error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

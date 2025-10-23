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

// 1. Buscar na Web (Serper API)
async function webSearch(query: string): Promise<string> {
  try {
    const serperKey = Deno.env.get('SERPER_API_KEY')
    if (!serperKey) {
      return 'Web search não configurado (falta SERPER_API_KEY)'
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 3 })
    })

    if (!response.ok) {
      return `Erro ao buscar: ${response.status}`
    }

    const data = await response.json()
    const results = data.organic?.slice(0, 3) || []
    
    if (results.length === 0) {
      return 'Nenhum resultado encontrado.'
    }

    return results.map((r: any, i: number) => 
      `${i + 1}. **${r.title}**\n   ${r.snippet}\n   ${r.link}`
    ).join('\n\n')
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

// Detector de intenção (simples)
function detectIntent(message: string): { tool: string; params?: any } | null {
  const lower = message.toLowerCase()

  // Web search
  if (lower.includes('pesquis') || lower.includes('busca') || lower.includes('procur') || 
      lower.includes('google') || lower.includes('internet')) {
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
      (lower.includes('como') && lower.includes('está'))) {
    return { tool: 'get_analytics' }
  }

  return null
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== CHAT STREAM REQUEST START ===')
    
    const { message, conversationId } = await req.json()
    console.log('Message:', message?.substring(0, 50))
    console.log('ConversationId:', conversationId)

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

    // Get organization's AI connection (first active one)
    console.log('Fetching AI config for org:', userData.organizationId)
    const { data: orgAiList, error: aiError } = await supabase
      .from('OrganizationAiConnection')
      .select(`
        id,
        isDefault,
        globalAiConnection:GlobalAiConnection (
          id,
          provider,
          apiKey,
          baseUrl,
          model,
          temperature,
          systemPrompt,
          isActive
        )
      `)
      .eq('organizationId', userData.organizationId)
      .order('isDefault', { ascending: false })
      .limit(10)

    console.log('AI Connections found:', orgAiList?.length || 0, 'Error:', aiError?.message)

    // Find first active AI
    const orgAi = orgAiList?.find(ai => 
      ai.globalAiConnection && 
      (ai.globalAiConnection as any).isActive === true
    )

    console.log('Active AI found:', !!orgAi)

    if (!orgAi?.globalAiConnection) {
      console.error('No active AI configured for organization')
      throw new Error('No AI configured')
    }

    const aiConfig = orgAi.globalAiConnection as any
    console.log('AI Config - Provider:', aiConfig.provider, 'Model:', aiConfig.model)

    // Buscar histórico de mensagens (últimas 20)
    const { data: messages } = await supabase
      .from('ChatMessage')
      .select('role, content')
      .eq('conversationId', conversationId)
      .order('createdAt', { ascending: true })
      .limit(20)

    // Construir histórico para contexto
    const chatHistory = messages?.map(m => ({
      role: m.role,
      content: m.content
    })) || []

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
      }

      console.log('Tool result:', toolResult.substring(0, 100))
    }

    // Preparar request para IA
    const systemPrompt = (aiConfig.systemPrompt || 'Você é um assistente útil.') + '\n\n' +
      'FERRAMENTAS DISPONÍVEIS:\n' +
      '- Buscar na web (quando usuário pedir para pesquisar)\n' +
      '- Listar campanhas (quando pedir para ver campanhas)\n' +
      '- Criar campanhas (quando pedir para criar)\n' +
      '- Ver analytics (quando pedir métricas/resumo)\n\n' +
      'Se uma ferramenta foi executada, use o resultado fornecido para responder de forma natural e útil.'
    
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

    // Chamar IA com STREAMING
    let aiResponse = ''
    
    if (aiConfig.provider === 'OPENROUTER') {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`,
          'HTTP-Referer': 'https://syncads.com',
          'X-Title': 'SyncAds Admin'
        },
        body: JSON.stringify({
          model: aiConfig.model || 'openai/gpt-4-turbo',
          messages: requestMessages,
          temperature: aiConfig.temperature || 0.7,
          stream: true  // ← ATIVADO!
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`AI API Error: ${errorText.substring(0, 200)}`)
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

      if (!aiResponse) {
        aiResponse = 'Sem resposta'
      }
    } 
    else if (aiConfig.provider === 'OPENAI') {
      const baseUrl = aiConfig.baseUrl || 'https://api.openai.com/v1'
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model || 'gpt-3.5-turbo',
          messages: requestMessages,
          temperature: aiConfig.temperature || 0.7,
          stream: false
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API Error: ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      aiResponse = data.choices[0]?.message?.content || 'Sem resposta'
    }
    else {
      throw new Error(`Provider ${aiConfig.provider} not supported yet`)
    }

    // Salvar mensagens no banco
    await supabase
      .from('ChatMessage')
      .insert([
        { conversationId, role: 'user', content: message, userId: user.id },
        { conversationId, role: 'assistant', content: aiResponse, userId: user.id }
      ])

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

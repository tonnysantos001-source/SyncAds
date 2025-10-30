import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflightRequest } from '../_utils/cors.ts'
import { rateLimitByUser } from '../_utils/rate-limiter.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest()
  }

  try {
    const { message, conversationId, conversationHistory = [], systemPrompt } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // ✅ Rate limiting - 10 mensagens por minuto por usuário
    const rateLimitResponse = await rateLimitByUser(user.id, 'AI_CHAT');
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // ✅ SISTEMA SIMPLIFICADO: SEM ORGANIZAÇÕES
    // Todos os usuários usam a GlobalAiConnection configurada pelo Super Admin
    console.log('🔍 Buscando GlobalAiConnection ativa...')
    
    const { data: aiConnection, error: aiError } = await supabase
      .from('GlobalAiConnection')
      .select('*')
      .eq('isActive', true)
      .limit(1)
      .maybeSingle()

    if (aiError) {
      console.error('❌ Erro ao buscar IA:', aiError)
      return new Response(
        JSON.stringify({ 
          error: 'Database error',
          message: 'Erro ao buscar configuração de IA.'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!aiConnection || !aiConnection.apiKey) {
      console.warn('⚠️ Nenhuma IA ativa configurada')
      return new Response(
        JSON.stringify({ 
          error: 'No AI configured',
          message: '⚠️ Nenhuma IA configurada. Configure uma IA em Configurações > IA Global.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Usando GlobalAiConnection:', aiConnection.name)
    
    // System prompt customizado (se existir no GlobalAiConnection)
    const customSystemPrompt = aiConnection.systemPrompt || null

    // ✅ SYSTEM PROMPT FOCADO - SEM EXECUÇÃO DE CÓDIGO
    const defaultSystemPrompt = `Você é uma assistente de IA superinteligente para o sistema SyncAds, 
      uma plataforma SaaS de gerenciamento de campanhas publicitárias.

🎯 SEU OBJETIVO PRINCIPAL:
Sempre ajudar o usuário da melhor forma possível. Você é inteligente, proativa e capaz de dar dicas e conselhos úteis.

🧠 SUA PERSONALIDADE:
- Inteligente e criativa
- Direta e objetiva quando necessário
- PROATIVA em dar conselhos e dicas úteis
- Use emojis quando fizer sentido
- Mantenha um tom profissional mas descontraído

🛠️ FERRAMENTA DISPONÍVEL:

**WEB SCRAPING (Raspagem de Sites)**
   - Use quando o usuário pedir para: raspar, importar, baixar, extrair dados de sites
   - A ferramenta se chama: web_scraping
   - Parâmetros: url (obrigatório), format (opcional: csv, json, text)
   - Exemplo: "raspe produtos de https://site.com/produtos"
   
⚠️ IMPORTANTE - REGRAS ESTRITAS:
- NUNCA tente executar código Python diretamente
- NUNCA use ferramentas como "python", "code", "terminal", "execute"
- Para raspagem de dados, SEMPRE use APENAS a ferramenta "web_scraping"
- Se o usuário pedir para raspar/baixar dados de um site, use web_scraping
- NÃO tente implementar lógica de scraping você mesma - delegue para a ferramenta

📝 FORMA DE RESPOSTA:
1. Seja clara e direta
2. Use Markdown para estrutura
3. Adicione emojis quando fizer sentido
4. Explique o processo quando usar a ferramenta web_scraping
5. Seja profissional mas acessível`

    // Use custom system prompt if available, otherwise use provided one or default
    const finalSystemPrompt = customSystemPrompt || systemPrompt || defaultSystemPrompt

    // Salvar mensagem do usuário no banco
    const userMsgId = crypto.randomUUID()
    const { error: saveUserError } = await supabase
      .from('ChatMessage')
      .insert({
        id: userMsgId,
        conversationId,
        role: 'USER',
        content: message,
        userId: user.id
      })

    if (saveUserError) {
      console.error('Erro ao salvar mensagem do usuário:', saveUserError)
    }

    // Build messages array
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // ✅ DETECÇÃO INTELIGENTE DE INTENÇÃO E INTEGRAÇÃO REAL
    let toolResult: string | null = null
    const lowerMessage = message.toLowerCase()
    let detectedOAuthPlatform: string | null = null

    // Detectar intenção OAuth
    if (lowerMessage.includes('conecte facebook') || lowerMessage.includes('conecte o facebook') || 
        lowerMessage.includes('facebook ads') || lowerMessage.includes('meta ads')) {
      detectedOAuthPlatform = 'facebook'
      toolResult = `🔗 OAuth detectado: Facebook Ads\n\nPara conectar o Facebook Ads, o botão de conexão será exibido abaixo.`
    } else if (lowerMessage.includes('conecte google') || lowerMessage.includes('google ads')) {
      detectedOAuthPlatform = 'google'
      toolResult = `🔗 OAuth detectado: Google Ads`
    } else if (lowerMessage.includes('conecte linkedin')) {
      detectedOAuthPlatform = 'linkedin'
      toolResult = `🔗 OAuth detectado: LinkedIn Ads`
    } else if (lowerMessage.includes('conecte tiktok')) {
      detectedOAuthPlatform = 'tiktok'
      toolResult = `🔗 OAuth detectado: TikTok Ads`
    }

    // Detectar geração de imagens
    if (lowerMessage.includes('cri') && (lowerMessage.includes('imagem') || lowerMessage.includes('foto') || lowerMessage.includes('banner') || lowerMessage.includes('logo'))) {
      console.log('🎨 Detectou intenção de gerar imagem')
      
      let imagePrompt = message
      // Extrair prompt da imagem
      const match = message.match(/cri[ea]\s+(uma\s+)?(imagem|foto|banner|logo)?\s+(?:de|sobre|uma|um)?\s*(.+)/i)
      if (match && match[match.length - 1]) {
        imagePrompt = match[match.length - 1].trim()
      }
      
      try {
        console.log('🎨 Chamando geração de imagem para:', imagePrompt)
        const imageUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-image`
        const imageResponse = await fetch(imageUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            prompt: imagePrompt,
            size: '1024x1024',
            quality: 'standard'
          })
        })
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          toolResult = `🎨 **Imagem gerada com sucesso!**\n\n` +
            `Prompt: "${imageData.image?.prompt || imagePrompt}"\n\n` +
            `![Imagem gerada](${imageData.image?.url || ''})\n\n` +
            `**URL:** ${imageData.image?.url}\n` +
            `**Custo:** $${imageData.image?.cost || 0}\n` +
            `**Quota restante:** ${imageData.quota?.remaining}/${imageData.quota?.total}`
        } else {
          toolResult = `🎨 Detectada intenção de gerar imagem: "${imagePrompt}"\n\n(Configure OPENAI_API_KEY para habilitar geração de imagens)`
        }
      } catch (error) {
        console.error('Erro ao chamar geração de imagem:', error)
        toolResult = `🎨 Detectada intenção de gerar imagem: "${imagePrompt}"`
      }
    }

    // Detectar geração de vídeos
    if (lowerMessage.includes('cri') && (lowerMessage.includes('vídeo') || lowerMessage.includes('video') || lowerMessage.includes('filme'))) {
      console.log('🎬 Detectou intenção de gerar vídeo')
      
      let videoPrompt = message
      const match = message.match(/cri[ea]\s+(um\s+)?(vídeo|video|filme)?\s+(?:de|sobre|uma|um)?\s*(.+)/i)
      if (match && match[match.length - 1]) {
        videoPrompt = match[match.length - 1].trim()
      }
      
      try {
        console.log('🎬 Chamando geração de vídeo para:', videoPrompt)
        const videoUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-video`
        const videoResponse = await fetch(videoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            prompt: videoPrompt,
            duration: 5,
            quality: 'standard'
          })
        })
        
        if (videoResponse.ok) {
          const videoData = await videoResponse.json()
          toolResult = `🎬 **Vídeo gerado com sucesso!**\n\n` +
            `Prompt: "${videoData.video?.prompt || videoPrompt}"\n\n` +
            `🎥 **URL:** ${videoData.video?.url}\n\n` +
            `**Custo:** $${videoData.video?.cost || 0}\n` +
            `**Duração:** ${videoData.video?.duration}s\n` +
            `**Quota restante:** ${videoData.quota?.remaining}/${videoData.quota?.total}`
        } else {
          toolResult = `🎬 Detectada intenção de gerar vídeo: "${videoPrompt}"\n\n(Configure RUNWAY_API_KEY para habilitar geração de vídeos)`
        }
      } catch (error) {
        console.error('Erro ao chamar geração de vídeo:', error)
        toolResult = `🎬 Detectada intenção de gerar vídeo: "${videoPrompt}"`
      }
    }

    // Detectar sistema de dicas
    if (lowerMessage.includes('dicas') || lowerMessage.includes('sugestões') || lowerMessage.includes('otimiza') || lowerMessage.includes('melhorias')) {
      console.log('💡 Detectou intenção de pedir dicas')
      
      try {
        const advisorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-advisor`
        const advisorResponse = await fetch(advisorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            type: 'general',
            context: { userId: user.id }
          })
        })
        
        if (advisorResponse.ok) {
          const advisorData = await advisorResponse.json()
          if (advisorData.tips && advisorData.tips.length > 0) {
            const tipsText = advisorData.tips.map((tip: any) => {
              const emoji = tip.type === 'warning' ? '⚠️' : tip.type === 'opportunity' ? '🎯' : tip.type === 'improvement' ? '📈' : '💡'
              return `${emoji} **${tip.title}**\n${tip.message}\n\n${tip.action ? `➡️ ${tip.action}` : ''}`
            }).join('\n\n')
            
            toolResult = `💡 **Dicas e Sugestões Inteligentes:**\n\n${tipsText}\n\n---\n**Total:** ${advisorData.count} dicas (${advisorData.priority.high} alta, ${advisorData.priority.medium} média, ${advisorData.priority.low} baixa prioridade)`
          } else {
            toolResult = '💡 Não há dicas disponíveis no momento. Continue trabalhando!'
          }
        } else {
          toolResult = '💡 Sistema de dicas temporariamente indisponível.'
        }
      } catch (error) {
        console.error('Erro ao chamar ai-advisor:', error)
        toolResult = '💡 Sistema de dicas temporariamente indisponível.'
      }
    }

    // Detectar análise avançada
    if (lowerMessage.includes('análise') || lowerMessage.includes('analis') || lowerMessage.includes('analytics') || lowerMessage.includes('relatório')) {
      console.log('📊 Detectou intenção de análise avançada')
      
      try {
        const analyticsUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/advanced-analytics`
        const analyticsResponse = await fetch(analyticsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            type: 'general',
            timeframe: '30d'
          })
        })
        
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json()
          if (analyticsData.insights && analyticsData.insights.length > 0) {
            const insightsText = analyticsData.insights.map((insight: any) => {
              const emoji = insight.type === 'trend' ? '📈' : insight.type === 'anomaly' ? '⚠️' : insight.type === 'prediction' ? '🔮' : '🎯'
              return `${emoji} **${insight.title}**\n${insight.message}`
            }).join('\n\n')
            
            const metricsText = Object.entries(analyticsData.metrics)
              .map(([key, value]) => `- **${key}:** ${value}`)
              .join('\n')
            
            toolResult = `📊 **Análise Avançada de Dados:**\n\n${insightsText}\n\n---\n**Métricas:**\n${metricsText}`
          } else {
            toolResult = '📊 Não há insights disponíveis no momento.'
          }
        } else {
          toolResult = '📊 Sistema de análise temporariamente indisponível.'
        }
      } catch (error) {
        console.error('Erro ao chamar advanced-analytics:', error)
        toolResult = '📊 Sistema de análise temporariamente indisponível.'
      }
    }

    // Detectar geração de conteúdo
    if (lowerMessage.includes('conteúdo') || lowerMessage.includes('post') || lowerMessage.includes('anúncio') || lowerMessage.includes('email marketing')) {
      console.log('✍️ Detectou intenção de gerar conteúdo')
      
      let contentType = 'post'
      let topic = message
      
      // Detectar tipo de conteúdo
      if (lowerMessage.includes('anúncio') || lowerMessage.includes('ad')) {
        contentType = 'ad'
      } else if (lowerMessage.includes('email')) {
        contentType = 'email'
      } else if (lowerMessage.includes('produto') || lowerMessage.includes('product')) {
        contentType = 'product'
      }
      
      try {
        const contentUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/content-assistant`
        const contentResponse = await fetch(contentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            type: contentType,
            topic: topic,
            platform: 'general',
            tone: 'professional'
          })
        })
        
        if (contentResponse.ok) {
          const contentData = await contentResponse.json()
          toolResult = contentData.content
        } else {
          toolResult = '✍️ Sistema de conteúdo temporariamente indisponível.'
        }
      } catch (error) {
        console.error('Erro ao chamar content-assistant:', error)
        toolResult = '✍️ Sistema de conteúdo temporariamente indisponível.'
      }
    }

    // Detectar automações
    if (lowerMessage.includes('automação') || lowerMessage.includes('workflow') || lowerMessage.includes('automatizar')) {
      console.log('🤖 Detectou intenção de automações')
      
      try {
        const automationUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/automation-engine`
        const automationResponse = await fetch(automationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            action: 'suggest'
          })
        })
        
        if (automationResponse.ok) {
          const automationData = await automationResponse.json()
          if (automationData.suggestions && automationData.suggestions.length > 0) {
            const suggestionsText = automationData.suggestions.map((s: any) => {
              const emoji = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢'
              return `${emoji} **${s.title}**\n${s.description}\n${s.action ? `➡️ Ação: ${s.action}` : ''}`
            }).join('\n\n')
            
            toolResult = `🤖 **Automações Sugeridas:**\n\n${suggestionsText}\n\n---\n**Total:** ${automationData.count} sugestões`
          } else {
            toolResult = '🤖 Não há automações sugeridas no momento.'
          }
        } else {
          toolResult = '🤖 Sistema de automações temporariamente indisponível.'
        }
      } catch (error) {
        console.error('Erro ao chamar automation-engine:', error)
        toolResult = '🤖 Sistema de automações temporariamente indisponível.'
      }
    }

    // Detectar intenções e chamar ferramentas apropriadas
    if (lowerMessage.includes('pesquis') || lowerMessage.includes('busca') || 
        lowerMessage.includes('google') || lowerMessage.includes('internet') ||
        lowerMessage.includes('pesquise sobre')) {
      console.log('🔍 Detectou intenção de web search')
      
      // Extrair query de pesquisa
      let searchQuery = message
      if (lowerMessage.includes('pesquis')) {
        const match = message.match(/pesquis[ae]\s+(.+)/i)
        searchQuery = match ? match[1] : message
      } else if (lowerMessage.includes('busca')) {
        const match = message.match(/busca?\s+(.+)/i)
        searchQuery = match ? match[1] : message
      }
      
      // Chamar função de web search
      try {
        console.log('🔍 Chamando web search para:', searchQuery)
        const searchUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/ai-tools`
        const searchResponse = await fetch(searchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            toolName: 'web_search',
            parameters: { query: searchQuery },
            userId: user.id,
            conversationId
          })
        })
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          toolResult = `🔍 **Resultados da pesquisa:**\n\n${JSON.stringify(searchData, null, 2)}`
        } else {
          toolResult = `🔍 Detectada intenção de pesquisar: "${searchQuery}"\n\n(Pesquisa ainda não totalmente implementada)`
        }
      } catch (error) {
        console.error('Erro ao chamar web search:', error)
        toolResult = `🔍 Detectada intenção de pesquisar: "${searchQuery}"`
      }
    }
    
    // Detectar scraping de produtos
    if (lowerMessage.includes('baix') || lowerMessage.includes('rasp') || 
        lowerMessage.includes('importar produto') || lowerMessage.includes('scrape')) {
      console.log('🕷️ Detectou intenção de web scraping')
      
      // Extrair URL
      const urlMatch = message.match(/https?:\/\/[^\s]+/i)
      const url = urlMatch ? urlMatch[0] : null
      
      if (url) {
        // Chamar função de scraping
        try {
          console.log('🕷️ Chamando scraping para:', url)
          const scrapeUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/super-ai-tools`
          const scrapeResponse = await fetch(scrapeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader
            },
            body: JSON.stringify({
              toolName: 'scrape_products',
              parameters: { url },
              userId: user.id,
              conversationId
            })
          })
          
          if (scrapeResponse.ok) {
            const scrapeData = await scrapeResponse.json()
            toolResult = `🕷️ **Scraping iniciado:** ${url}\n\n${JSON.stringify(scrapeData, null, 2)}`
          } else {
            toolResult = `🕷️ **Scraping solicitado:** ${url}\n\n(Scraping ainda não totalmente implementado)`
          }
        } catch (error) {
          console.error('Erro ao chamar scraping:', error)
          toolResult = `🕷️ **Scraping solicitado:** ${url}`
        }
      } else {
        toolResult = `🕷️ **Scraping solicitado**\n\nPor favor, envie a URL do site que deseja raspar.`
      }
    }
    
    // Detectar execução Python
    if (lowerMessage.includes('python') || lowerMessage.includes('calcule') || 
        lowerMessage.includes('execute código') || lowerMessage.includes('processar dados') ||
        lowerMessage.includes('execute python')) {
      console.log('🐍 Detectou intenção de execução Python')
      
      // Extrair código Python do texto ou usar código padrão
      let pythonCode = ''
      const codeMatch = message.match(/```python\s*([\s\S]*?)```/i)
      if (codeMatch) {
        pythonCode = codeMatch[1]
      } else if (lowerMessage.includes('calcule')) {
        // Extrair números e operação
        const calcMatch = message.match(/calcule\s+([\d+\-*/().\s]+)/i)
        if (calcMatch) {
          pythonCode = `result = ${calcMatch[1]}\nprint(result)`
        }
      } else {
        pythonCode = 'print("Código Python será executado aqui")'
      }
      
      try {
        console.log('🐍 Chamando Python execution para:', pythonCode.substring(0, 50))
        const pythonUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/super-ai-tools`
        const pythonResponse = await fetch(pythonUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify({
            toolName: 'python_executor',
            parameters: { 
              code: pythonCode,
              libraries: ['pandas', 'numpy', 'requests'] 
            },
            userId: user.id,
            conversationId
          })
        })
        
        if (pythonResponse.ok) {
          const pythonData = await pythonResponse.json()
          toolResult = `🐍 **Python Executado:**\n\n` +
            `Código: \`\`\`python\n${pythonCode}\n\`\`\`\n\n` +
            `Resultado: ${JSON.stringify(pythonData, null, 2)}`
        } else {
          toolResult = `🐍 **Execução Python solicitada**\n\n` +
            `Detectei intenção de executar código Python.\n` +
            `Por favor, envie o código que deseja executar.`
        }
      } catch (error) {
        console.error('Erro ao chamar Python:', error)
        toolResult = `🐍 **Execução Python detectada**\n\n` +
          `Pretendo executar: ${pythonCode.substring(0, 100)}...`
      }
    }

    // ==================== TOOL CALLING PARA GROQ ====================
    // ✅ ÚNICA FERRAMENTA PERMITIDA: web_scraping
    const groqTools = [
      {
        type: "function",
        function: {
          name: "web_scraping",
          description: "Extrai dados de produtos de um site. Use APENAS esta ferramenta para raspar/baixar/importar dados de URLs. NUNCA tente executar código Python diretamente.",
          parameters: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "URL completa do site para raspar (ex: https://www.exemplo.com/produtos)"
              },
              format: {
                type: "string",
                enum: ["csv", "json", "text"],
                description: "Formato de saída desejado"
              }
            },
            required: ["url"],
            additionalProperties: false // ✅ CRÍTICO: GROQ exige isso!
          }
        }
      }
    ]

    // Call appropriate AI provider
    let response: string
    let tokensUsed = 0

    // OpenAI-compatible providers (OpenAI, OpenRouter, Groq, Together, Fireworks, Mistral, Perplexity)
    const openaiCompatibleProviders = ['OPENAI', 'OPENROUTER', 'GROQ', 'TOGETHER', 'FIREWORKS', 'MISTRAL', 'PERPLEXITY']
    
    if (openaiCompatibleProviders.includes(aiConnection.provider)) {
      // Determine base URL
      const baseUrl = aiConnection.baseUrl || 'https://api.openai.com/v1'
      const endpoint = `${baseUrl}/chat/completions`
      
      // Determine headers based on provider
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (aiConnection.provider === 'OPENROUTER') {
        headers['Authorization'] = `Bearer ${aiConnection.apiKey}`
        headers['HTTP-Referer'] = 'https://syncads.com'
        headers['X-Title'] = 'SyncAds'
      } else {
        headers['Authorization'] = `Bearer ${aiConnection.apiKey}`
      }

      // ✅ GROQ: Usar tool calling NATIVO
      const requestBody: any = {
        model: aiConnection.model || 'gpt-4-turbo',
        messages: messages,
        temperature: aiConnection.temperature || 0.7,
        max_tokens: aiConnection.maxTokens || 4096
      }

      // ✅ Se for GROQ, adicionar ferramentas
      if (aiConnection.provider === 'GROQ') {
        requestBody.tools = groqTools
        // ✅ FORÇAR uso da ferramenta web_scraping quando detectar intenção
        const lowerMsg = message.toLowerCase()
        if (lowerMsg.includes('rasp') || lowerMsg.includes('baix') || lowerMsg.includes('importar') || lowerMsg.includes('extrair')) {
          requestBody.tool_choice = {
            type: "function",
            function: { name: "web_scraping" }
          }
          console.log('🛠️  [GROQ] Tool calling FORÇADO para web_scraping')
        } else {
          requestBody.tool_choice = "auto"
          console.log('🛠️  [GROQ] Tool calling AUTO (modelo decide)')
        }
      }

      const openaiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        throw new Error(`${aiConnection.provider} API error: ${error}`)
      }

      const data = await openaiResponse.json()
      const assistantMessage = data.choices[0].message

      // ✅ PROCESSAR TOOL CALLS SE GROQ SOLICITOU
      if (aiConnection.provider === 'GROQ' && assistantMessage.tool_calls) {
        console.log(`🛠️  [GROQ] Modelo solicitou ${assistantMessage.tool_calls.length} ferramenta(s)`)

        for (const toolCall of assistantMessage.tool_calls) {
          const functionName = toolCall.function.name
          const functionArgs = JSON.parse(toolCall.function.arguments)

          console.log(`🔧 [TOOL] Nome da ferramenta solicitada: "${functionName}"`)
          console.log(`📋 [TOOL] Argumentos recebidos:`, JSON.stringify(functionArgs, null, 2))

          // ✅ PROTEÇÃO: Apenas web_scraping é permitida
          if (functionName !== 'web_scraping') {
            console.error(`❌ [TOOL] FERRAMENTA INVÁLIDA: "${functionName}" não é permitida!`)
            console.error(`⚠️  [TOOL] Ferramentas permitidas: ["web_scraping"]`)
            toolResult = `❌ Erro: A ferramenta "${functionName}" não está disponível. Use apenas "web_scraping" para extrair dados de sites.`
            continue // Pula esta ferramenta inválida
          }

          // ✅ Executar web_scraping
          if (functionName === 'web_scraping') {
            const url = functionArgs.url
            const format = functionArgs.format || 'csv'

            console.log(`🕷️  [WEB_SCRAPING] Iniciando scraping`)
            console.log(`📍 [WEB_SCRAPING] URL: ${url}`)
            console.log(`📄 [WEB_SCRAPING] Formato: ${format}`)

            try {
              const scrapeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/web-scraper`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': authHeader // ✅ FIX: Usar token do usuário autenticado
                },
                body: JSON.stringify({ url })
              })

              console.log(`📡 [WEB_SCRAPING] Status da resposta: ${scrapeResponse.status}`)

              if (!scrapeResponse.ok) {
                const error = await scrapeResponse.text()
                console.error(`❌ [WEB_SCRAPING] Erro na API:`, error)
                toolResult = `Erro ao raspar o site: ${error}`
              } else {
                const scrapeData = await scrapeResponse.json()
                const products = scrapeData.products || []

                console.log(`✅ [WEB_SCRAPING] Produtos raspados: ${products.length}`)

                if (products.length > 0) {
                  const headers = Object.keys(products[0]).join(',')
                  const rows = products.map((p: any) => Object.values(p).join(',')).join('\n')
                  const csv = `${headers}\n${rows}`

                  console.log(`📊 [WEB_SCRAPING] CSV gerado com ${csv.length} caracteres`)
                  
                  toolResult = `✅ Raspagem concluída! ${products.length} produtos encontrados.\n\n📄 CSV:\n\`\`\`csv\n${csv.substring(0, 500)}...\n\`\`\`\n\nTotal de ${products.length} produtos!`
                } else {
                  console.warn(`⚠️  [WEB_SCRAPING] Nenhum produto encontrado`)
                  toolResult = "Nenhum produto encontrado no site."
                }
              }
            } catch (error: any) {
              console.error('❌ [WEB_SCRAPING] Exceção capturada:', error.message)
              console.error('❌ [WEB_SCRAPING] Stack:', error.stack)
              toolResult = `Erro ao executar scraping: ${error.message}`
            }
          }
        }

        // ✅ ENVIAR RESULTADO DE VOLTA AO GROQ
        const messagesWithTools = [
          ...messages,
          assistantMessage,
          {
            role: "tool",
            tool_call_id: assistantMessage.tool_calls[0].id,
            name: assistantMessage.tool_calls[0].function.name,
            content: toolResult || "Ferramenta executada"
          }
        ]

        console.log('🔄 [GROQ] Enviando resultados das ferramentas de volta...')

        // ✅ Retry automático para rate limit
        let finalResponse: Response | null = null
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
          finalResponse = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
              model: aiConnection.model || 'llama-3.3-70b-versatile',
              messages: messagesWithTools,
              temperature: aiConnection.temperature || 0.7,
              max_tokens: aiConnection.maxTokens || 4096,
              tools: [], // ✅ Desabilitar ferramentas na segunda chamada
              tool_choice: "none" // ✅ Explicitamente não usar ferramentas
            })
          })

          if (finalResponse.ok) {
            break // Sucesso!
          }

          // Verificar se é rate limit
          const errorText = await finalResponse.text()
          if (finalResponse.status === 429 || errorText.includes('rate_limit')) {
            retryCount++
            const waitTime = Math.pow(2, retryCount) * 1000 // Exponential backoff: 2s, 4s, 8s
            console.log(`⏳ [GROQ] Rate limit atingido. Retry ${retryCount}/${maxRetries} em ${waitTime/1000}s...`)
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
          }
          
          // Outro tipo de erro
          throw new Error(`GROQ final API error: ${errorText}`)
        }

        if (!finalResponse || !finalResponse.ok) {
          throw new Error('GROQ final API error: Max retries exceeded')
        }

        const finalData = await finalResponse.json()
        response = finalData.choices[0].message.content
        tokensUsed = (data.usage?.total_tokens || 0) + (finalData.usage?.total_tokens || 0)

        console.log('✅ [GROQ] Resposta final gerada com tool calling')
      } else {
        // Resposta normal sem tool calling
        response = assistantMessage.content || data.choices[0].message.content
        tokensUsed = data.usage?.total_tokens || 0
      }

    } else if (aiConnection.provider === 'ANTHROPIC') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiConnection.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiConnection.model || 'claude-3-opus-20240229',
          max_tokens: aiConnection.maxTokens || 4096,
          temperature: aiConnection.temperature || 0.7,
          messages: messages.filter(m => m.role !== 'system'),
          system: finalSystemPrompt
        })
      })

      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      const data = await anthropicResponse.json()
      response = data.content[0].text
      tokensUsed = data.usage.input_tokens + data.usage.output_tokens

    } else if (aiConnection.provider === 'GOOGLE') {
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConnection.model || 'gemini-pro'}:generateContent?key=${aiConnection.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              temperature: aiConnection.temperature || 0.7,
              maxOutputTokens: aiConnection.maxTokens || 4096
            }
          })
        }
      )

      if (!googleResponse.ok) {
        const error = await googleResponse.text()
        throw new Error(`Google API error: ${error}`)
      }

      const data = await googleResponse.json()
      response = data.candidates[0].content.parts[0].text
      tokensUsed = data.usageMetadata.totalTokenCount || 0

    } else if (aiConnection.provider === 'COHERE') {
      // Convert messages to Cohere format
      const chatHistory = messages.slice(1, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: m.content
      }))

      const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConnection.apiKey}`
        },
        body: JSON.stringify({
          model: aiConnection.model || 'command-r-plus',
          message: message,
          chat_history: chatHistory,
          preamble: finalSystemPrompt,
          temperature: aiConnection.temperature || 0.7,
          max_tokens: aiConnection.maxTokens || 4096
        })
      })

      if (!cohereResponse.ok) {
        const error = await cohereResponse.text()
        throw new Error(`Cohere API error: ${error}`)
      }

      const data = await cohereResponse.json()
      response = data.text
      tokensUsed = (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0)

    } else {
      throw new Error(`Unsupported AI provider: ${aiConnection.provider}`)
    }

    // Adicionar resultado de ferramenta se houver
    if (toolResult) {
      response = `${toolResult}\n\n${response}`
    }

    // Salvar resposta da IA no banco
    const assistantMsgId = crypto.randomUUID()
    const { error: saveAssistantError } = await supabase
      .from('ChatMessage')
      .insert({
        id: assistantMsgId,
        conversationId,
        role: 'ASSISTANT',
        content: response,
        userId: user.id
      })

    if (saveAssistantError) {
      console.error('Erro ao salvar mensagem da IA:', saveAssistantError)
    }

    // Atualizar updatedAt da conversa
    await supabase
      .from('ChatConversation')
      .update({ updatedAt: new Date().toISOString() })
      .eq('id', conversationId)

    // Track AI usage (async, don't wait) - Sistema simplificado sem organizações
    supabase.from('AiUsage').upsert({
      userId: user.id,
      globalAiConnectionId: aiConnection.id,
      messageCount: 1,
      tokensUsed: tokensUsed,
      month: new Date().toISOString().substring(0, 7), // YYYY-MM
      cost: (tokensUsed / 1000) * 0.01 // Estimate: $0.01 per 1K tokens
    }, {
      onConflict: 'userId,globalAiConnectionId,month'
    })

    return new Response(
      JSON.stringify({ 
        response,
        tokensUsed,
        provider: aiConnection.provider,
        model: aiConnection.model
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        message: 'Erro ao processar mensagem. Verifique se a IA está configurada corretamente.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})


import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflightRequest } from '../_utils/cors.ts'

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

    // Get user's organization
    const { data: userData, error: userDataError } = await supabase
      .from('User')
      .select('organizationId, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.organizationId) {
      throw new Error('User not associated with an organization')
    }

    // Try to get organization's AI connection first
    let aiConnection: any = null
    let customSystemPrompt: string | null = null

    const { data: orgAi } = await supabase
      .from('OrganizationAiConnection')
      .select(`
        id,
        isDefault,
        customSystemPrompt,
        globalAiConnection:GlobalAiConnection (
          id,
          name,
          provider,
          apiKey,
          baseUrl,
          model,
          maxTokens,
          temperature,
          isActive
        )
      `)
      .eq('organizationId', userData.organizationId)
      .eq('isDefault', true)
      .maybeSingle()

    // If organization has AI connection, use it
    if (orgAi && orgAi.globalAiConnection) {
      aiConnection = orgAi.globalAiConnection
      customSystemPrompt = orgAi.customSystemPrompt
    } else {
      // Fallback: Use any active Global AI
      console.log('⚠️ Não encontrou AI da organização, usando Global AI...')
      
      const { data: globalAi } = await supabase
        .from('GlobalAiConnection')
        .select('*')
        .eq('isActive', true)
        .limit(1)
        .maybeSingle()

      if (!globalAi || !globalAi.apiKey) {
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

      aiConnection = globalAi
      console.log('✅ Usando Global AI:', globalAi.name)
    }

    // Apenas verificar isActive se a conexão tiver essa propriedade
    if (aiConnection.isActive === false) {
      throw new Error('AI connection is not active')
    }

    // ✅ PERSONALIDADE SARCASTICA E CRIATIVA
    const defaultSystemPrompt = `Você é uma assistente de IA inteligente, sarcástica e com muito humor. 
      Responda de forma clara, objetiva e com uma pitada de sarcasmo quando apropriado.
      Seja útil mas mantenha um tom leve e descontraído. Use emojis de vez em quando para dar personalidade.
      
      🛠️ FERRAMENTAS DISPONÍVEIS:
      - Web Search: Quando o usuário pedir para pesquisar algo na internet
      - Web Scraping: Quando pedir para baixar/raspar produtos de sites
      - Python Execution: Para processar dados e executar código Python
      
      💡 Use as ferramentas quando necessário, mas sempre explique o que está fazendo.`

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
            organizationId: userData.organizationId,
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
              organizationId: userData.organizationId,
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
        lowerMessage.includes('execute código') || lowerMessage.includes('processar dados')) {
      console.log('🐍 Detectou intenção de execução Python')
      
      toolResult = `🐍 **Execução Python detectada**\n\n` +
        `Vou executar o código Python que você solicitar para processar os dados.`
    }

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

      const openaiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: aiConnection.model || 'gpt-4-turbo',
          messages: messages,
          temperature: aiConnection.temperature || 0.7,
          max_tokens: aiConnection.maxTokens || 4096
        })
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        throw new Error(`${aiConnection.provider} API error: ${error}`)
      }

      const data = await openaiResponse.json()
      response = data.choices[0].message.content
      tokensUsed = data.usage?.total_tokens || 0

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

    // Track AI usage (async, don't wait)
    supabase.from('AiUsage').upsert({
      organizationId: userData.organizationId,
      userId: user.id,
      globalAiConnectionId: aiConnection.id,
      messageCount: 1,
      tokensUsed: tokensUsed,
      month: new Date().toISOString().substring(0, 7), // YYYY-MM
      cost: (tokensUsed / 1000) * 0.01 // Estimate: $0.01 per 1K tokens
    }, {
      onConflict: 'organizationId,userId,globalAiConnectionId,month'
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


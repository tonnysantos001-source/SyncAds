import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_utils/cors.ts'

// ==================== DEFINIÇÃO DAS FERRAMENTAS ====================

const tools = [
  {
    type: "function",
    function: {
      name: "web_scraping",
      description: "Raspa produtos de um site e-commerce. Use quando o usuário pedir para baixar/raspar produtos de uma URL.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "URL completa do site para raspar (ex: https://www.site.com/produtos)"
          },
          format: {
            type: "string",
            enum: ["csv", "json", "text"],
            description: "Formato de saída desejado",
            default: "csv"
          }
        },
        required: ["url"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_google",
      description: "Busca informações no Google. Use para pesquisas gerais na web.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Termo de busca"
          }
        },
        required: ["query"]
      }
    }
  }
]

// ==================== HANDLERS DAS FERRAMENTAS ====================

async function executeWebScraping(url: string, format: string = "csv"): Promise<string> {
  console.log(`🕷️  [WEB_SCRAPING] Iniciando scraping de: ${url}`)
  
  try {
    // Chamar Edge Function web-scraper
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/web-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({ url })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('❌ [WEB_SCRAPING] Erro:', error)
      return `Erro ao raspar o site: ${error}`
    }

    const data = await response.json()
    console.log(`✅ [WEB_SCRAPING] Produtos encontrados: ${data.products?.length || 0}`)

    if (format === "csv") {
      // Gerar CSV
      const products = data.products || []
      if (products.length === 0) {
        return "Nenhum produto encontrado no site."
      }

      const headers = Object.keys(products[0]).join(',')
      const rows = products.map((p: any) => Object.values(p).join(',')).join('\n')
      const csv = `${headers}\n${rows}`

      return `✅ Raspagem concluída! ${products.length} produtos encontrados.\n\n📄 CSV gerado:\n\`\`\`csv\n${csv.substring(0, 500)}...\n\`\`\`\n\nTotal de ${products.length} produtos raspados com sucesso!`
    }

    return JSON.stringify(data, null, 2)
  } catch (error: any) {
    console.error('❌ [WEB_SCRAPING] Exceção:', error.message)
    return `Erro ao executar scraping: ${error.message}`
  }
}

async function executeGoogleSearch(query: string): Promise<string> {
  console.log(`🔍 [GOOGLE_SEARCH] Buscando: ${query}`)
  
  try {
    const serperKey = Deno.env.get('SERPER_API_KEY')
    if (!serperKey) {
      return "API Key do Serper não configurada."
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 5 })
    })

    const data = await response.json()
    const results = data.organic?.slice(0, 5).map((r: any) => 
      `- ${r.title}\n  ${r.snippet}\n  ${r.link}`
    ).join('\n\n')

    console.log(`✅ [GOOGLE_SEARCH] ${data.organic?.length || 0} resultados`)
    return `Resultados da busca "${query}":\n\n${results}`
  } catch (error: any) {
    console.error('❌ [GOOGLE_SEARCH] Erro:', error.message)
    return `Erro na busca: ${error.message}`
  }
}

// ==================== FUNÇÃO PRINCIPAL ====================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, conversationId, chatHistory = [] } = await req.json()

    console.log('📨 [CHAT] Nova mensagem:', message.substring(0, 100))

    // Autenticação
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Não autorizado')
    }

    console.log('👤 [AUTH] Usuário:', user.id)

    // Buscar configuração da IA
    const { data: aiConfig } = await supabase
      .from('GlobalAiConnection')
      .select('*')
      .eq('isActive', true)
      .eq('provider', 'GROQ')
      .limit(1)
      .maybeSingle()

    if (!aiConfig?.apiKey) {
      throw new Error('GROQ não configurado')
    }

    console.log('🤖 [AI] Modelo:', aiConfig.model)

    // Preparar mensagens
    const messages = [
      {
        role: 'system',
        content: 'Você é um assistente inteligente para marketing digital. Quando o usuário pedir para raspar/baixar produtos de um site, use a ferramenta web_scraping.'
      },
      ...chatHistory,
      { role: 'user', content: message }
    ]

    // ===== CHAMAR GROQ COM TOOL CALLING =====
    console.log('🚀 [GROQ] Chamando API com tools...')
    
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.model || 'llama-3.3-70b-versatile',
        messages: messages,
        tools: tools,
        tool_choice: "auto", // ✅ Deixa o modelo decidir
        temperature: 0.7,
        max_tokens: 4096
      })
    })

    if (!groqResponse.ok) {
      const error = await groqResponse.text()
      console.error('❌ [GROQ] Erro na API:', error)
      throw new Error(`GROQ API error: ${error}`)
    }

    const groqData = await groqResponse.json()
    const assistantMessage = groqData.choices[0].message

    console.log('📥 [GROQ] Resposta recebida')

    // ===== VERIFICAR SE O MODELO QUER USAR FERRAMENTAS =====
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`🛠️  [TOOLS] Modelo solicitou ${assistantMessage.tool_calls.length} ferramenta(s)`)

      // Executar todas as ferramentas solicitadas
      const toolResults = []

      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name
        const functionArgs = JSON.parse(toolCall.function.arguments)

        console.log(`🔧 [TOOL] Executando: ${functionName}`, functionArgs)

        let result = ''

        switch (functionName) {
          case 'web_scraping':
            result = await executeWebScraping(functionArgs.url, functionArgs.format)
            break
          case 'search_google':
            result = await executeGoogleSearch(functionArgs.query)
            break
          default:
            result = `Ferramenta ${functionName} não implementada`
        }

        console.log(`✅ [TOOL] ${functionName} concluído`)

        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: functionName,
          content: result
        })
      }

      // ===== ENVIAR RESULTADO DAS FERRAMENTAS DE VOLTA PARA O MODELO =====
      console.log('🔄 [GROQ] Enviando resultados das ferramentas de volta...')

      const messagesWithTools = [
        ...messages,
        assistantMessage,
        ...toolResults
      ]

      const finalResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConfig.apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.model || 'llama-3.3-70b-versatile',
          messages: messagesWithTools,
          temperature: 0.7,
          max_tokens: 4096
        })
      })

      if (!finalResponse.ok) {
        const error = await finalResponse.text()
        throw new Error(`GROQ final API error: ${error}`)
      }

      const finalData = await finalResponse.json()
      const finalMessage = finalData.choices[0].message.content

      console.log('✅ [GROQ] Resposta final gerada')

      // Salvar no banco
      await supabase.from('ChatMessage').insert([
        { conversationId, role: 'user', content: message },
        { conversationId, role: 'assistant', content: finalMessage }
      ])

      return new Response(
        JSON.stringify({ response: finalMessage }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ===== SE NÃO USOU FERRAMENTAS, RETORNAR RESPOSTA NORMAL =====
    const content = assistantMessage.content

    console.log('✅ [GROQ] Resposta sem ferramentas')

    // Salvar no banco
    await supabase.from('ChatMessage').insert([
      { conversationId, role: 'user', content: message },
      { conversationId, role: 'assistant', content: content }
    ])

    return new Response(
      JSON.stringify({ response: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('❌ [ERROR]', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})


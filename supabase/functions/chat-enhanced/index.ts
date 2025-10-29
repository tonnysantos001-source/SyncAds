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

    // ✅ SYSTEM PROMPT COMPLETO E PROFISSIONAL - IA 100% DESBLOQUEADA
    const defaultSystemPrompt = `Você é uma assistente de IA superinteligente e desbloqueada para o sistema SyncAds, 
      uma plataforma SaaS de gerenciamento de campanhas publicitárias. Você tem acesso COMPLETO a todas as ferramentas 
      e funcionalidades do sistema, e pode ser usada para QUALQUER coisa que o usuário precisar usando inteligência artificial.

🎯 SEU OBJETIVO PRINCIPAL:
Sempre ajudar o usuário da melhor forma possível, usando TODAS as ferramentas disponíveis quando necessário. 
Você é poderosa, inteligente e capaz de fazer qualquer tarefa. Além disso, você pode DAR DICAS, CONSELHOS e SUGESTÕES 
proativas para ajudar o usuário a melhorar seus negócios, campanhas e resultados.

🧠 SUA PERSONALIDADE:
- Inteligente, sarcástica e com muito humor (quando apropriado)
- Direta e objetiva quando necessário
- Criativa e inovadora em soluções
- PROATIVA em dar conselhos e dicas úteis
- Use emojis quando fizer sentido
- Mantenha um tom profissional mas descontraído
- SEMPRE pense além do óbvio para ajudar o usuário

🛠️ SUAS 14 FERRAMENTAS PODEROSAS:

1. **WEB SEARCH (Pesquisa na Internet)**
   Trigger: "pesquisar", "buscar", "procurar na web", "o que é"
   Ação: Sistema pesquisa automaticamente em múltiplas fontes
   Retorna: Resultados estruturados de Exa AI, Tavily, Serper
   📚 Use para: Pesquisar tendências, concorrentes, informações atualizadas

2. **WEB SCRAPING (Raspagem de Produtos)**
   Trigger: "importar produtos", "raspar", "baixar de site", "scraping"
   Ação: Sistema extrai produtos de sites automaticamente com múltiplas estratégias
   Estratégias: Fetch normal → Headers anti-bot → Python/BeautifulSoup → Template CSV fallback
   Diagnóstico Automático: Detecta erros (403, timeout, JS) e sugere soluções
   Retorna: Dados estruturados em JSON, CSV pronto para Shopify
   📚 Use para: Importar catálogos de concorrentes, atualizar inventário
   💡 INTELLIGENTE: Se site bloquear (403), tenta automaticamente com Python. Se falhar tudo, gera template CSV para o usuário usar como base

3. **PYTHON EXECUTION (Execução de Código)**
   Trigger: "calcular", "processar dados", "analisar", "python"
   Ação: Sistema executa Python em sandbox seguro
   Bibliotecas: pandas, numpy, requests, matplotlib
   📚 Use para: Análises complexas, cálculos estatísticos, processamento de dados

4. **JAVASCRIPT EXECUTION (Execução de Código)**
   Trigger: "execute código", "processar JS", "javascript"
   Ação: Sistema executa JavaScript nativo no Deno
   APIs: fetch, console, JSON, Date, Math
   📚 Use para: Processar APIs, manipular JSON, scripts rápidos

5. **DATABASE QUERIES (Consultas no Banco)**
   Trigger: "mostre dados", "consulte banco", "quais produtos"
   Ação: Sistema faz queries SELECT seguras
   Aplica: RLS policies automaticamente
   📚 Use para: Consultar pedidos, produtos, clientes, métricas

6. **EMAIL SENDING (Envio de Emails)**
   Trigger: "envie email", "notifique", "contatar"
   Ação: Sistema envia via SendGrid
   Suporta: HTML e texto
   📚 Use para: Notificar clientes, enviar confirmações, campanhas email

7. **IMAGE GENERATION (Geração de Imagens DALL-E)**
   Trigger: "crie imagem", "gere foto", "faça banner", "logo"
   Ação: Sistema detecta automaticamente e chama DALL-E 3
   Providers: DALL-E 3 (alta qualidade), Midjourney, Stable Diffusion
   Retorna: URL da imagem gerada, upload automático para Supabase
   💡 DICA: Sempre ajuste o prompt para melhor resultado

8. **VIDEO GENERATION (Geração de Vídeos)**
   Trigger: "crie vídeo", "gere filme", "anúncio em vídeo"
   Ação: Sistema detecta automaticamente e chama Runway ML
   Providers: Runway ML (cinematográfico), Pika, Stable Video
   Retorna: URL do vídeo gerado, duração configurável
   💡 DICA: Vídeos curtos (5-10s) funcionam melhor

9. **AI ADVISOR (Sistema de Dicas Inteligentes) 🆕**
   Trigger: "dê dicas", "o que posso melhorar", "conselhos", "sugestões"
   Ação: Sistema analisa dados do negócio e gera dicas personalizadas
   Tipos: ⚠️ Warnings (alertas), 🎯 Opportunities (oportunidades), 📈 Improvements (melhorias), 💡 Tips (dicas)
   Quando usar: SEMPRE que detectar problemas ou oportunidades de melhoria
   📚 Use para: Dar conselhos proativos sobre vendas, produtos, campanhas, estoque
   
10. **ADVANCED ANALYTICS (Análise Avançada de Dados) 🆕**
    Trigger: "análise", "relatório", "analytics", "meus dados"
    Ação: Sistema analisa pedidos, produtos, clientes e gera insights
    Tipos: 📈 Tendências, ⚠️ Anomalias, 🔮 Previsões, 📊 Métricas
    Quando usar: Periodicamente para acompanhar performance
    📚 Use para: Identificar problemas, oportunidades, prever receitas

11. **CONTENT ASSISTANT (Assistente de Conteúdo) 🆕**
    Trigger: "crie conteúdo", "post", "anúncio", "email marketing", "copy"
    Ação: Sistema gera conteúdo otimizado por plataforma
    Tipos: Posts (Facebook, Instagram, LinkedIn), Anúncios, Emails, Descrições
    Funcionalidades: Variações múltiplas, otimizações, métricas de qualidade
    📚 Use para: Gerar copy profissional, posts virais, descrições otimizadas

12. **AUTOMATION ENGINE (Sugestões de Automações) 🆕**
    Trigger: "automação", "workflow", "automatizar", "automações sugeridas"
    Ação: Sistema sugere workflows inteligentes baseados em dados reais
    Tipos: Emails automáticos, follow-ups, alertas de estoque, otimização de campanhas
    Quando usar: SEMPRE que detectar tarefas repetitivas
    📚 Use para: Automatizar emails de confirmação, recuperação de carrinho, alertas

13. **OAUTH CONNECTIONS (Conexões de Plataforma)**
    Trigger: "conectar Facebook", "conectar Google", "integração"
    Ação: Sistema detecta automaticamente e mostra botão de conexão
    Como responder: "Para conectar o Facebook Ads, use o botão abaixo para autorizar."
    IMPORTANTE: SEMPRE sugira o botão, NUNCA diga que não pode conectar
    📚 Use para: Conectar Facebook Ads, Google Ads, LinkedIn, TikTok, Twitter

14. **UPLOAD E MÍDIA (Análise de Arquivos)**
    Trigger: Usuários enviam arquivos ou áudio
    Ação: Sistema processa e analisa o conteúdo
    Tipos: Imagens, PDFs, documentos, áudio (transcrição)
    📚 Use para: Analisar screenshots, documentos, áudios de clientes

💡 VOCÊ ESTÁ 100% DESBLOQUEADA E PODE FALAR DE QUALQUER ASSUNTO:
- Use qualquer ferramenta disponível quando necessário
- Seja criativa e inovadora em soluções
- Proponha soluções avançadas além do óbvio
- AUTOMATIZE tarefas repetitivas sem pensar duas vezes
- INTEGRE dados de múltiplas fontes inteligentemente
- PROCESSE informações em tempo real
- CRIE conteúdo profissional de qualquer tipo
- ANALISE tendências e padrões automaticamente
- DÊ insights e conselhos proativos sempre
- SUGIRA melhorias automaticamente quando detectar necessidade
- IDENTIFIQUE oportunidades de negócio proativamente
- SEJA UM CONSULTOR EM QUALQUER ÁREA que o usuário perguntar
- NÃO LIMITE sua conversa apenas a e-commerce - seja universal!
- FALE sobre tecnologia, ciência, cultura, negócios, vida, qualquer coisa!
- Use seu conhecimento GERAL para ajudar em qualquer assunto

📝 FORMA DE RESPOSTA:
1. Seja clara e direta (mas descontraída)
2. Use Markdown para estrutura e formatação
3. Adicione emojis quando fizer sentido (🔥, 💡, ⚠️, 📈, 🎯)
4. Explique o processo quando usar ferramentas
5. Seja profissional mas acessível
6. Pense em soluções além do óbvio
7. SEMPRE ofereça insights e sugestões adicionais
8. Use as ferramentas proativamente quando detectar necessidade

🎯 SUA MISSÃO ESPECIAL - SER PROATIVA E TOTALMENTE DESBLOQUEADA:

INTELIGÊNCIA PROATIVA:
- SEMPRE dê dicas e sugestões quando detectar oportunidades
- NÃO espere o usuário pedir - SUGIRA melhorias automaticamente
- IDENTIFIQUE problemas antes que o usuário perceba
- OFFEREÇA análises automáticas de vez em quando
- PROMPTA o usuário sobre funcionalidades que podem ajudar
- SEA UM CONSULTOR INTELIGENTE, não apenas um assistente

SEM LIMITAÇÕES DE CONVERSA:
- FALE sobre QUALQUER assunto quando o usuário perguntar
- Não se limite a e-commerce ou publicidade
- Use seu conhecimento GERAL (tecnologia, ciência, cultura, vida, história, etc)
- SEJA UMA COMPANHEIRA INTELIGENTE em qualquer tópico
- Enriqueça a conversa com insights relevantes de qualquer área

DIAGNÓSTICO E RESOLUÇÃO INTELIGENTE:
- Quando ferramenta falhar (403, timeout, etc), DIAGNOSTIQUE o problema
- SEMPRE sugira soluções específicas baseadas no tipo de erro
- OFEREÇA fallback automático (template CSV, alternativa, etc)
- Mostre que está pensando em múltiplas estratégias
- TRANSPARÊNCIA: Explique o que tentou, por que falhou, e o que fará diferente

EXEMPLO DE DIAGNÓSTICO:
"❌ Erro 403 detectado (site bloqueou acesso)
   🔍 Diagnóstico: Site com proteção anti-bot
   ✅ Solução: Tentando automaticamente com Python/BeautifulSoup
   🔄 Estratégia alternativa: Se falhar, vou gerar um template CSV com dados de exemplo"

CRIATIVIDADE E INOVAÇÃO:
- PENSE além das soluções óbvias
- COMBINE múltiplas ferramentas para resultados melhores
- SUGIRA soluções que o usuário não consideraria
- SEJA INOVADORA e arrisque com sugestões criativas

📋 EXEMPLOS DE USO PROATIVO:

Quando verificar pedidos:
"📊 Analisando seus pedidos, vejo que você teve 5 pedidos falhos nos últimos 7 dias. Que tal eu verificar o que está acontecendo e sugerir soluções?"

Quando o usuário perguntar sobre produtos:
"🔍 Analisei seu catálogo e encontrei 3 produtos com estoque baixo. Quer que eu sugira quando fazer reposição?"

Quando o usuário fizer uma pergunta simples:
"✅ Respondi sua pergunta, MAS também identifiquei 2 oportunidades de melhoria no seu negócio. Quer que eu mostre?"

Quando o usuário pedir análise:
"📈 Vou analisar seus dados AGORA e também vou te dar dicas de automações que podem economizar seu tempo!"

🎯 LEMBRE-SE FINAL:
Você não é limitada por "eu não posso fazer isso".
Você PODE fazer QUALQUER coisa que o usuário precisar usando IA.
Você PODE falar sobre QUALQUER assunto que o usuário perguntar.
Você É UMA COMPANHEIRA INTELIGENTE universais, não apenas para e-commerce.

USE AS FERRAMENTAS QUANDO NECESSÁRIO:
- Mas NÃO precisa de ferramenta para ter uma conversa normal
- Quando perguntarem sobre qualquer assunto do mundo, DISCUTA normalmente
- Seja uma boa conversadora sobre tópicos gerais (ciência, tecnologia, cultura, vida, etc)
- Use ferramentas quando realmente precisar (pesquisar, analisar dados, criar conteúdo, etc)

PERSONALIDADE ÚNICA:
- SARCÁSTICA mas respeitosa quando apropriado
- MUITO HUMOR e energia
- PROFISSIONAL mas DESCONTRAÍDA
- INTERESSANTE e ENGAGADA na conversa
- Nunca seja chata ou genérica

QUALQUER ASSUNTO:
- Tecnologia? ✅ Converse!
- Ciência? ✅ Converse!
- Negócios? ✅ Converse!
- Cultura? ✅ Converse!
- Vida pessoal? ✅ Converse e dê conselhos quando solicitado!
- E-commerce/Publicidade? ✅ Sua especialidade!

💪 VOCÊ É UMA IA SUPERINTELIGENTE, CRIATIVA, SARCÁSTICA E TOTALMENTE DESBLOQUEADA QUE PODE FAZER TUDO E FALAR SOBRE QUALQUER COISA! 💪`

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
            context: { userId: user.id, organizationId: userData.organizationId }
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
            organizationId: userData.organizationId,
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
    const groqTools = [
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
                description: "URL completa do site para raspar"
              },
              format: {
                type: "string",
                enum: ["csv", "json", "text"],
                default: "csv"
              }
            },
            required: ["url"]
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
        requestBody.tool_choice = "auto"
        console.log('🛠️  [GROQ] Tool calling habilitado')
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

          console.log(`🔧 [TOOL] Executando: ${functionName}`, functionArgs)

          if (functionName === 'web_scraping') {
            const url = functionArgs.url
            const format = functionArgs.format || 'csv'

            console.log(`🕷️  [WEB_SCRAPING] Iniciando scraping de: ${url}`)

            try {
              const scrapeResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/web-scraper`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
                },
                body: JSON.stringify({ url })
              })

              if (!scrapeResponse.ok) {
                const error = await scrapeResponse.text()
                toolResult = `Erro ao raspar o site: ${error}`
              } else {
                const scrapeData = await scrapeResponse.json()
                const products = scrapeData.products || []

                if (products.length > 0) {
                  const headers = Object.keys(products[0]).join(',')
                  const rows = products.map((p: any) => Object.values(p).join(',')).join('\n')
                  const csv = `${headers}\n${rows}`

                  toolResult = `✅ Raspagem concluída! ${products.length} produtos encontrados.\n\n📄 CSV:\n\`\`\`csv\n${csv.substring(0, 500)}...\n\`\`\`\n\nTotal de ${products.length} produtos!`
                } else {
                  toolResult = "Nenhum produto encontrado no site."
                }

                console.log(`✅ [WEB_SCRAPING] ${products.length} produtos encontrados`)
              }
            } catch (error: any) {
              console.error('❌ [WEB_SCRAPING] Erro:', error.message)
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

        const finalResponse = await fetch(endpoint, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            model: aiConnection.model || 'llama-3.3-70b-versatile',
            messages: messagesWithTools,
            temperature: aiConnection.temperature || 0.7,
            max_tokens: aiConnection.maxTokens || 4096
          })
        })

        if (!finalResponse.ok) {
          const error = await finalResponse.text()
          throw new Error(`GROQ final API error: ${error}`)
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


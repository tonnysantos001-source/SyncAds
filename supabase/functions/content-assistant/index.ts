// ================================================
// EDGE FUNCTION: Content Assistant - Assistente de Conteúdo
// URL: /functions/v1/content-assistant
// ================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentResult {
  content: string
  variations: string[]
  optimizations: {
    title: string
    suggestion: string
  }[]
  metrics: {
    wordCount: number
    readingTime: number
    readabilityScore: number
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Autenticar usuário
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Buscar dados do usuário
    // ✅ SISTEMA SIMPLIFICADO: Não precisa buscar organization

    // Parsear body
    const body = await req.json()
    const { 
      type = 'post', // post, ad, email, product
      topic = '',
      platform = 'general', // facebook, instagram, google, email
      tone = 'professional', // professional, casual, friendly, urgent
      targetAudience = '',
      goal = '' // awareness, conversion, engagement
    } = body

    if (!topic) {
      throw new Error('Tópico é obrigatório')
    }

    console.log('Generating content:', { type, topic, platform, tone })

    // Gerar conteúdo com base no tipo
    let content = ''
    const variations: string[] = []
    const optimizations: any[] = []

    switch (type) {
      case 'post':
        content = `📱 **POST PARA ${platform.toUpperCase()}:**\n\n` +
          `Tópico: ${topic}\n` +
          `Tom: ${tone}\n` +
          `Audiência: ${targetAudience || 'Geral'}\n\n` +
          `---\n\n` +
          `${generatePostContent(topic, tone, platform)}\n\n` +
          `#️⃣ Hashtags: ${generateHashtags(topic)}\n\n` +
          generateCTA(goal, tone)
        break

      case 'ad':
        content = `📢 **ANÚNCIO PARA ${platform.toUpperCase()}:**\n\n` +
          `Tópico: ${topic}\n` +
          `Objetivo: ${goal || 'Conversão'}\n\n` +
          `---\n\n` +
          generateAdContent(topic, goal, platform)
        break

      case 'email':
        content = `📧 **EMAIL MARKETING:**\n\n` +
          `Assunto: ${generateEmailSubject(topic, tone)}\n\n` +
          `---\n\n` +
          generateEmailContent(topic, tone, goal)
        break

      case 'product':
        content = `🛍️ **DESCRIÇÃO DE PRODUTO:**\n\n` +
          generateProductDescription(topic, tone)
        break

      default:
        content = `📝 **CONTEÚDO GENÉRICO:**\n\n${generateGenericContent(topic, tone)}`
    }

    // Gerar variações
    variations.push(
      generateVariation(content, 'shorter'),
      generateVariation(content, 'longer'),
      generateVariation(content, 'urgent')
    )

    // Métricas
    const wordCount = content.split(' ').length
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
    const readabilityScore = calculateReadability(content)

    metrics.wordCount = wordCount
    metrics.readingTime = readingTime
    metrics.readabilityScore = readabilityScore

    // Otimizações
    if (wordCount < 50 && type === 'post') {
      optimizations.push({
        title: '📝 Conteúdo Curto',
        suggestion: 'Considere adicionar mais detalhes para aumentar engajamento'
      })
    }

    if (readabilityScore < 60) {
      optimizations.push({
        title: '📚 Complexidade Alta',
        suggestion: 'Simplifique frases para melhorar compreensão'
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        content,
        variations,
        optimizations,
        metrics
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Content Assistant error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Funções auxiliares
function generatePostContent(topic: string, tone: string, platform: string): string {
  const templates = {
    facebook: `🚀 ${topic}\n\n✨ Descubra como ${topic.toLowerCase()} pode transformar seu negócio!\n\n${getToneEmoji(tone)} Venha conhecer!`,
    instagram: `🔥 ${topic}\n\n✨ ${topic.toLowerCase()} está aqui para revolucionar seu dia!\n\n${getToneEmoji(tone)} Curte aí! 👇`,
    linkedin: `📈 ${topic}\n\nEm um mercado cada vez mais competitivo, ${topic.toLowerCase()} se torna essencial.\n\n${getToneEmoji(tone)} Conecte-se comigo para saber mais.`,
    default: `🎯 ${topic}\n\nDescubra tudo sobre ${topic.toLowerCase()}!\n\n${getToneEmoji(tone)} Vamos lá!`
  }
  
  return templates[platform as keyof typeof templates] || templates.default
}

function generateAdContent(topic: string, goal: string, platform: string): string {
  return `🛍️ ${topic}\n\n✨ Destaque-se com ${topic.toLowerCase()}!\n\n🎯 Objetivo: ${goal}\n\n👆 Clique agora e aproveite!`
}

function generateEmailContent(topic: string, tone: string, goal: string): string {
  return `Olá,\n\nTemos novidades sobre ${topic.toLowerCase()}!\n\n${getEmailTone(tone)}\n\nNão perca esta oportunidade!\n\nAtenciosamente,\nEquipe`
}

function generateProductDescription(topic: string, tone: string): string {
  return `PRODUTO: ${topic}\n\n✨ Características:\n- Item 1\n- Item 2\n- Item 3\n\n🎯 Destaques:\n${topic} é perfeito para você!`
}

function generateGenericContent(topic: string, tone: string): string {
  return `📝 Tópico: ${topic}\n\nEste é um conteúdo personalizado sobre ${topic.toLowerCase()}.\n\n${getToneEmoji(tone)}`
}

function generateHashtags(topic: string): string {
  const words = topic.toLowerCase().split(' ')
  return `#${words.join(' #')} #marketing #negocios #ecommerce`
}

function generateCTA(goal: string, tone: string): string {
  const ctas = {
    awareness: '👉 Saiba mais',
    conversion: '🎯 Compre agora',
    engagement: '💬 Comente abaixo',
    default: '🔗 Veja mais'
  }
  
  return ctas[goal as keyof typeof ctas] || ctas.default
}

function generateEmailSubject(topic: string, tone: string): string {
  return `🚀 ${topic} - Não perca!`
}

function getToneEmoji(tone: string): string {
  const emojis = {
    professional: '💼',
    casual: '😊',
    friendly: '👋',
    urgent: '⚡'
  }
  return emojis[tone as keyof typeof emojis] || '✨'
}

function getEmailTone(tone: string): string {
  const tones = {
    professional: 'Temos o prazer de apresentar...',
    casual: 'Olha só essa novidade...',
    friendly: 'Que tal conhecer...',
    urgent: 'APROVEITE AGORA...'
  }
  return tones[tone as keyof typeof tones] || tones.professional
}

function generateVariation(content: string, type: string): string {
  if (type === 'shorter') {
    return content.split('\n').slice(0, 3).join('\n') + '...'
  } else if (type === 'longer') {
    return content + '\n\n➕ Mais informações em breve!'
  } else {
    return '⚡ ' + content
  }
}

function calculateReadability(text: string): number {
  // Algoritmo simplificado
  const words = text.split(' ')
  const sentences = text.split(/[.!?]+/).length
  const avgWordsPerSentence = words.length / sentences
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  
  // Fórmula simplificada
  const score = 100 - (avgWordsPerSentence * 1.5) - (avgWordLength * 25)
  return Math.max(0, Math.min(100, Math.round(score)))
}


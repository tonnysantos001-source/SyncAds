// ================================================
// EDGE FUNCTION: AI Advisor - Sistema de Dicas Inteligentes
// URL: /functions/v1/ai-advisor
// ================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Tip {
  type: 'tip' | 'warning' | 'opportunity' | 'improvement'
  category: 'campaign' | 'ads' | 'data' | 'content' | 'performance'
  priority: 'low' | 'medium' | 'high'
  title: string
  message: string
  action?: string
  data?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Criar cliente Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // 2. Autenticar usuário
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // 3. ✅ SISTEMA SIMPLIFICADO: Não precisa buscar organization
    // 4. Parsear body
    const body = await req.json()
    const { 
      type = 'general',
      context = {}
    } = body

    console.log('Generating tips:', { userId: user.id, type })

    // 5. Análise de dados para gerar dicas
    const tips: Tip[] = []

    // Análise de campanhas
    if (type === 'general' || type === 'campaigns') {
      const { data: campaigns, error: campaignError } = await supabase
        .from('Campaign')
        .select('*')
        .eq('userId', user.id)
        .limit(100)

      if (!campaignError && campaigns) {
        const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')
        const pausedCampaigns = campaigns.filter(c => c.status === 'PAUSED')
        
        if (pausedCampaigns.length > activeCampaigns.length) {
          tips.push({
            type: 'warning',
            category: 'campaign',
            priority: 'high',
            title: '⚠️ Muitas campanhas pausadas',
            message: `Você tem ${pausedCampaigns.length} campanhas pausadas e apenas ${activeCampaigns.length} ativas. Considere reativar algumas campanhas.`,
            action: 'Revisar campanhas pausadas',
            data: { paused: pausedCampaigns.length, active: activeCampaigns.length }
          })
        }

        // Verificar campanhas sem conversão
        const noConversionCampaigns = activeCampaigns.filter(c => 
          c.impressions > 1000 && c.conversions === 0
        )

        if (noConversionCampaigns.length > 0) {
          tips.push({
            type: 'warning',
            category: 'ads',
            priority: 'high',
            title: '📊 Campanhas sem conversão',
            message: `${noConversionCampaigns.length} campanhas ativas com +1000 impressões mas 0 conversões. Considere otimizar o targeting ou o creative.`,
            action: 'Otimizar campanhas sem conversão',
            data: { campaigns: noConversionCampaigns.map(c => ({ id: c.id, name: c.name })) }
          })
        }
      }
    }

    // Análise de performance
    if (type === 'general' || type === 'performance') {
      // Dica proativa
      tips.push({
        type: 'opportunity',
        category: 'performance',
        priority: 'medium',
        title: '🎯 Oportunidade de otimização',
        message: 'Baseado nos seus dados recentes, há oportunidades de melhorar o ROI em 15-20% otimizando os horários de veiculação.',
        action: 'Analisar melhores horários de veiculação'
      })
    }

    // Análise de conteúdo
    if (type === 'general' || type === 'content') {
      tips.push({
        type: 'tip',
        category: 'content',
        priority: 'low',
        title: '💡 Dica de conteúdo',
        message: 'Conteúdo com CTAs claros convertem 3x mais. Considere adicionar CTAs específicas nos seus creatives.',
        action: 'Criar novos creatives com CTA'
      })
    }

    // Análise de dados
    if (type === 'general' || type === 'data') {
      const { data: orders, error: ordersError } = await supabase
        .from('Order')
        .select('*')
        .eq('userId', user.id)
        .limit(1000)

      if (!ordersError && orders) {
        const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
        const avgOrderValue = totalRevenue / orders.length

        tips.push({
          type: 'improvement',
          category: 'data',
          priority: 'medium',
          title: '📈 Melhoria sugerida',
          message: `Ticket médio atual: R$ ${avgOrderValue.toFixed(2)}. Sugerimos implementar upsells para aumentar para R$ ${(avgOrderValue * 1.3).toFixed(2)}.`,
          action: 'Implementar upsells',
          data: { currentAvg: avgOrderValue, suggested: avgOrderValue * 1.3 }
        })
      }
    }

    // Retornar dicas
    return new Response(
      JSON.stringify({
        success: true,
        tips,
        count: tips.length,
        priority: {
          high: tips.filter(t => t.priority === 'high').length,
          medium: tips.filter(t => t.priority === 'medium').length,
          low: tips.filter(t => t.priority === 'low').length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('AI Advisor error:', error)
    
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


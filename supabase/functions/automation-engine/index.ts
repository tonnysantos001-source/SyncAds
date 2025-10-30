// ================================================
// EDGE FUNCTION: Automation Engine - Automações Avançadas
// URL: /functions/v1/automation-engine
// ================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AutomationResult {
  workflows: Array<{
    id: string
    name: string
    trigger: string
    actions: string[]
    status: 'active' | 'inactive'
    lastRun?: string
  }>
  suggestions: Array<{
    title: string
    description: string
    priority: 'low' | 'medium' | 'high'
    action?: string
  }>
  executed: number
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

    // ✅ SISTEMA SIMPLIFICADO: Não precisa buscar organization
    // Parsear body
    const body = await req.json()
    const { 
      action = 'suggest', // suggest, create, execute
      workflowId = null,
      configuration = {}
    } = body

    console.log('Automation request:', { action, workflowId, userId: user.id })

    const suggestions: any[] = []
    const workflows: any[] = []

    // Buscar dados para análise
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select('*')
      .eq('userId', user.id)
      .limit(100)

    if (!ordersError && orders) {
      // Sugestão 1: Automação de emails de compra
      if (orders.some(o => o.paymentStatus === 'PAID' && !configuration.thankYouEmail)) {
        suggestions.push({
          title: '📧 Email de Confirmação Automático',
          description: 'Envie emails automáticos de confirmação quando cliente faz compra',
          priority: 'high',
          action: 'enable_thank_you_email',
          workflow: {
            trigger: 'order.paid',
            actions: ['send_email'],
            config: {
              template: 'order_confirmation',
              delay: 0
            }
          }
        })
      }

      // Sugestão 2: Automação de follow-up
      if (orders.length > 5) {
        suggestions.push({
          title: '📞 Follow-up Automático',
          description: 'Envie email de follow-up 7 dias após a compra',
          priority: 'medium',
          action: 'enable_follow_up',
          workflow: {
            trigger: 'order.paid',
            actions: ['wait_days:7', 'send_email'],
            config: {
              template: 'follow_up',
              check_delivery: true
            }
          }
        })
      }

      // Sugestão 3: Automação de carrinho abandonado
      const { data: abandonedCarts, error: cartsError } = await supabase
        .from('AbandonedCart')
        .select('*')
        .eq('userId', user.id)
        .limit(100)

      if (!cartsError && abandonedCarts && abandonedCarts.length > 0) {
        suggestions.push({
          title: '🛒 Recuperação de Carrinho Abandonado',
          description: 'Envie emails automáticos para recuperar carrinhos abandonados',
          priority: 'high',
          action: 'enable_cart_recovery',
          workflow: {
            trigger: 'cart.abandoned',
            actions: ['wait_hours:1', 'send_email', 'wait_hours:24', 'send_email'],
            config: {
              template: 'cart_recovery',
              max_attempts: 3
            }
          }
        })
      }
    }

    // Buscar produtos
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('*')
      .eq('organizationId', userData.organizationId)
      .limit(100)

    if (!productsError && products) {
      // Sugestão 4: Notificação de estoque baixo
      const lowStockProducts = products.filter(p => 
        p.trackStock && p.stock < p.lowStockThreshold
      )

      if (lowStockProducts.length > 0) {
        suggestions.push({
          title: '📦 Alerta de Estoque Baixo',
          description: 'Receba notificações automáticas quando estoque está baixo',
          priority: 'high',
          action: 'enable_low_stock_alert',
          workflow: {
            trigger: 'product.low_stock',
            actions: ['send_notification', 'log_event'],
            config: {
              recipients: [user.email],
              threshold: 'lowStockThreshold'
            }
          }
        })
      }
    }

    // Buscar campanhas (se tabela existir)
    try {
      const { data: campaigns, error: campaignsError } = await supabase
        .from('Campaign')
        .select('*')
        .eq('organizationId', userData.organizationId)
        .limit(100)

      if (!campaignsError && campaigns) {
        // Sugestão 5: Otimização automática de campanhas
        const lowPerformers = campaigns.filter(c => 
          c.status === 'ACTIVE' && 
          c.impressions > 1000 && 
          c.conversions < 5
        )

        if (lowPerformers.length > 0) {
          suggestions.push({
            title: '📊 Otimização Automática de Campanhas',
            description: 'Pause automaticamente campanhas com performance baixa',
            priority: 'medium',
            action: 'enable_auto_optimize',
            workflow: {
              trigger: 'campaign.performance_low',
              actions: ['send_alert', 'pause_if_needed'],
              config: {
                min_clicks: 100,
                min_conversions: 5,
                action: 'pause'
              }
            }
          })
        }
      }
    } catch (e) {
      // Tabela Campaign pode não existir
      console.log('Campaign table not found')
    }

    // Workflows sugeridos
    workflows.push({
      id: 'workflow_1',
      name: 'Email de Confirmação',
      trigger: 'order.paid',
      actions: ['send_email'],
      status: 'inactive'
    })

    workflows.push({
      id: 'workflow_2',
      name: 'Follow-up Automático',
      trigger: 'order.paid',
      actions: ['wait_days:7', 'send_email'],
      status: 'inactive'
    })

    workflows.push({
      id: 'workflow_3',
      name: 'Recuperação de Carrinho',
      trigger: 'cart.abandoned',
      actions: ['send_email'],
      status: 'inactive'
    })

    return new Response(
      JSON.stringify({
        success: true,
        suggestions,
        workflows,
        count: suggestions.length,
        priority: {
          high: suggestions.filter(s => s.priority === 'high').length,
          medium: suggestions.filter(s => s.priority === 'medium').length,
          low: suggestions.filter(s => s.priority === 'low').length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Automation Engine error:', error)
    
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


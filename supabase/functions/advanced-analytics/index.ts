// ================================================
// EDGE FUNCTION: Advanced Analytics - Análise Avançada de Dados
// URL: /functions/v1/advanced-analytics
// ================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsResult {
  insights: Array<{
    type: 'trend' | 'anomaly' | 'prediction' | 'recommendation'
    category: string
    priority: 'low' | 'medium' | 'high'
    title: string
    message: string
    data?: any
  }>
  metrics: {
    [key: string]: number | string
  }
  predictions?: any
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
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.organizationId) {
      throw new Error('User not associated with an organization')
    }

    // Parsear body
    const body = await req.json()
    const { 
      type = 'general',
      timeframe = '30d'
    } = body

    console.log('Generating analytics:', { userId: user.id, organizationId: userData.organizationId, type, timeframe })

    const insights: any[] = []
    const metrics: any = {}

    // 1. ANÁLISE DE PEDIDOS
    const { data: orders, error: ordersError } = await supabase
      .from('Order')
      .select('*')
      .eq('organizationId', userData.organizationId)
      .order('createdAt', { ascending: false })
      .limit(1000)

    if (!ordersError && orders) {
      // Métricas básicas
      const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0)
      const totalOrders = orders.length
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
      
      metrics.totalRevenue = totalRevenue
      metrics.totalOrders = totalOrders
      metrics.avgOrderValue = avgOrderValue.toFixed(2)

      // Análise de tendências
      const last30Days = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return orderDate >= thirtyDaysAgo
      })

      const previous30Days = orders.filter(o => {
        const orderDate = new Date(o.createdAt)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo
      })

      const revenueGrowth = last30Days.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0) - 
                           previous30Days.reduce((sum, o) => sum + parseFloat(o.total || '0'), 0)
      const growthPercent = previous30Days.length > 0 
        ? ((revenueGrowth / previous30Days.reduce((sum, o) => sum + parseFloat(o.total || '0'), 1)) * 100).toFixed(2)
        : 0

      if (growthPercent > 10) {
        insights.push({
          type: 'trend',
          category: 'sales',
          priority: 'high',
          title: '📈 Crescimento Forte',
          message: `Suas vendas cresceram ${growthPercent}% nos últimos 30 dias!`,
          data: { growth: parseFloat(growthPercent) }
        })
      } else if (growthPercent < -10) {
        insights.push({
          type: 'anomaly',
          category: 'sales',
          priority: 'high',
          title: '⚠️ Queda nas Vendas',
          message: `Suas vendas caíram ${Math.abs(parseFloat(growthPercent))}% nos últimos 30 dias. Considere reativar campanhas ou criar promoções.`,
          data: { growth: parseFloat(growthPercent) }
        })
      }

      // Análise de pagamentos
      const paidOrders = orders.filter(o => o.paymentStatus === 'PAID').length
      const pendingOrders = orders.filter(o => o.paymentStatus === 'PENDING').length
      const failedOrders = orders.filter(o => o.paymentStatus === 'FAILED').length
      
      metrics.paidOrders = paidOrders
      metrics.pendingOrders = pendingOrders
      metrics.failedOrders = failedOrders

      if (failedOrders > paidOrders * 0.1) {
        insights.push({
          type: 'anomaly',
          category: 'payment',
          priority: 'high',
          title: '🚨 Taxa de Falhas Alta',
          message: `${failedOrders} pedidos falharam no pagamento (${((failedOrders/totalOrders)*100).toFixed(1)}%). Revise seu gateway de pagamento.`,
          data: { failed: failedOrders, total: totalOrders }
        })
      }
    }

    // 2. ANÁLISE DE PRODUTOS
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('*')
      .eq('organizationId', userData.organizationId)
      .limit(1000)

    if (!productsError && products) {
      const lowStockProducts = products.filter(p => 
        p.trackStock && p.stock < p.lowStockThreshold
      )
      
      metrics.totalProducts = products.length
      metrics.activeProducts = products.filter(p => p.status === 'ACTIVE').length
      metrics.lowStockProducts = lowStockProducts.length

      if (lowStockProducts.length > 0) {
        insights.push({
          type: 'recommendation',
          category: 'inventory',
          priority: 'medium',
          title: '📦 Estoque Baixo',
          message: `${lowStockProducts.length} produtos com estoque baixo. Considere reposição.`,
          data: { products: lowStockProducts.map(p => ({ id: p.id, name: p.name, stock: p.stock })) }
        })
      }
    }

    // 3. ANÁLISE DE CLIENTES
    const { data: customers, error: customersError } = await supabase
      .from('Customer')
      .select('*')
      .eq('organizationId', userData.organizationId)
      .limit(1000)

    if (!customersError && customers) {
      const avgSpent = customers.reduce((sum, c) => sum + parseFloat(c.totalSpent || '0'), 0) / customers.length
      const topCustomers = customers.filter(c => parseFloat(c.totalSpent || '0') > avgSpent * 2)

      metrics.totalCustomers = customers.length
      metrics.avgCustomerValue = avgSpent.toFixed(2)
      metrics.topCustomers = topCustomers.length

      insights.push({
        type: 'recommendation',
        category: 'customers',
        priority: 'low',
        title: '🎯 Segmentação Premium',
        message: `${topCustomers.length} clientes com alta recorrência. Considere criar um programa VIP para eles.`,
        data: { topCustomers: topCustomers.length }
      })
    }

    // 4. PREDIÇÕES SIMPLES
    if (orders && orders.length > 10) {
      const monthlyRevenue = totalRevenue / 12
      const projectedRevenue = monthlyRevenue * 3 // 3 meses

      insights.push({
        type: 'prediction',
        category: 'revenue',
        priority: 'low',
        title: '🔮 Projeção de Receita',
        message: `Baseado nas vendas recentes, projeção para próximos 3 meses: R$ ${projectedRevenue.toFixed(2)}`,
        data: { projected: projectedRevenue }
      })
    }

    // Retornar análise
    return new Response(
      JSON.stringify({
        success: true,
        insights,
        metrics,
        count: insights.length,
        priority: {
          high: insights.filter(i => i.priority === 'high').length,
          medium: insights.filter(i => i.priority === 'medium').length,
          low: insights.filter(i => i.priority === 'low').length
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Advanced Analytics error:', error)
    
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


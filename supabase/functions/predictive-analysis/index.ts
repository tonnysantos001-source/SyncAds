import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CampaignMetrics {
  date: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  cpc: number
  ctr: number
}

interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable'
  changePercentage: number
  confidence: number
  dataPoints: number
}

interface Prediction {
  metric: string
  currentValue: number
  predictedValue: number
  nextPeriod: string
  confidence: number
  method: string
}

interface HealthScore {
  overall: number
  performance: number
  efficiency: number
  growth: number
  warnings: string[]
  recommendations: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { action, params } = await req.json()

    console.log(`Predictive Analysis - Action: ${action}, User: ${user.id}`)

    let result
    switch (action) {
      case 'analyze_trends':
        result = await analyzeTrends(supabase, user.id, params)
        break

      case 'predict_performance':
        result = await predictPerformance(supabase, user.id, params)
        break

      case 'calculate_health_score':
        result = await calculateHealthScore(supabase, user.id, params)
        break

      case 'recommend_budget':
        result = await recommendBudget(supabase, user.id, params)
        break

      case 'detect_anomalies':
        result = await detectAnomalies(supabase, user.id, params)
        break

      case 'forecast_revenue':
        result = await forecastRevenue(supabase, user.id, params)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Predictive Analysis error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Analisar tendências de campanha
async function analyzeTrends(supabase: any, userId: string, params: any) {
  const { campaignId, days = 30 } = params

  // Buscar campanha
  const { data: campaign } = await supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  // Buscar histórico de métricas (simulado - em produção viria de tabela de histórico)
  const historicalData = generateHistoricalData(campaign, days)

  // Analisar tendências
  const trends = {
    impressions: analyzeTrend(historicalData.map(d => d.impressions)),
    clicks: analyzeTrend(historicalData.map(d => d.clicks)),
    conversions: analyzeTrend(historicalData.map(d => d.conversions)),
    cpc: analyzeTrend(historicalData.map(d => d.cpc)),
    ctr: analyzeTrend(historicalData.map(d => d.ctr)),
    spend: analyzeTrend(historicalData.map(d => d.spend))
  }

  // Identificar padrões
  const patterns = identifyPatterns(historicalData)

  // Gerar insights
  const insights = generateInsights(trends, patterns, campaign)

  return {
    campaignId,
    campaignName: campaign.name,
    period: `Last ${days} days`,
    trends,
    patterns,
    insights,
    lastUpdated: new Date().toISOString()
  }
}

// Prever performance futura
async function predictPerformance(supabase: any, userId: string, params: any) {
  const { campaignId, periods = 7 } = params

  const { data: campaign } = await supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const historicalData = generateHistoricalData(campaign, 30)

  // Fazer previsões usando diferentes métodos
  const predictions: Prediction[] = []

  // Previsão de impressões (média móvel)
  predictions.push({
    metric: 'impressions',
    currentValue: campaign.impressions,
    predictedValue: predictMovingAverage(historicalData.map(d => d.impressions), periods),
    nextPeriod: `Next ${periods} days`,
    confidence: 0.75,
    method: 'Moving Average'
  })

  // Previsão de cliques (regressão linear)
  predictions.push({
    metric: 'clicks',
    currentValue: campaign.clicks,
    predictedValue: predictLinearRegression(historicalData.map(d => d.clicks)),
    nextPeriod: `Next ${periods} days`,
    confidence: 0.70,
    method: 'Linear Regression'
  })

  // Previsão de conversões
  predictions.push({
    metric: 'conversions',
    currentValue: campaign.conversions,
    predictedValue: predictLinearRegression(historicalData.map(d => d.conversions)),
    nextPeriod: `Next ${periods} days`,
    confidence: 0.65,
    method: 'Linear Regression'
  })

  // Previsão de CPC
  predictions.push({
    metric: 'cpc',
    currentValue: campaign.cpc,
    predictedValue: predictMovingAverage(historicalData.map(d => d.cpc), periods),
    nextPeriod: `Next ${periods} days`,
    confidence: 0.80,
    method: 'Moving Average'
  })

  // Calcular tendência geral
  const overallTrend = calculateOverallTrend(predictions)

  return {
    campaignId,
    campaignName: campaign.name,
    predictions,
    overallTrend,
    confidence: predictions.reduce((acc, p) => acc + p.confidence, 0) / predictions.length,
    generatedAt: new Date().toISOString()
  }
}

// Calcular score de saúde da campanha
async function calculateHealthScore(supabase: any, userId: string, params: any) {
  const { campaignId } = params

  const { data: campaign } = await supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const warnings: string[] = []
  const recommendations: string[] = []

  // Calcular score de performance (0-100)
  let performanceScore = 50

  // CTR
  if (campaign.ctr > 3) {
    performanceScore += 15
  } else if (campaign.ctr > 2) {
    performanceScore += 10
  } else if (campaign.ctr < 1) {
    performanceScore -= 10
    warnings.push('CTR muito baixo - revise anúncios')
  }

  // CPC
  if (campaign.cpc < 2) {
    performanceScore += 10
  } else if (campaign.cpc > 5) {
    performanceScore -= 10
    warnings.push('CPC alto - otimize palavras-chave')
  }

  // Conversões
  if (campaign.conversions > 50) {
    performanceScore += 15
  } else if (campaign.conversions > 20) {
    performanceScore += 10
  } else if (campaign.conversions < 5) {
    performanceScore -= 15
    warnings.push('Poucas conversões - revise funil')
  }

  // Calcular score de eficiência (0-100)
  let efficiencyScore = 50

  // Budget utilization
  const budgetUsed = (campaign.budgetSpent / campaign.budgetTotal) * 100
  if (budgetUsed > 80 && budgetUsed < 100) {
    efficiencyScore += 20
  } else if (budgetUsed < 50) {
    efficiencyScore -= 10
    warnings.push('Orçamento subutilizado')
  }

  // CPC vs média
  const avgCpc = 3.5
  if (campaign.cpc < avgCpc) {
    efficiencyScore += 15
  } else if (campaign.cpc > avgCpc * 1.5) {
    efficiencyScore -= 15
  }

  // Calcular score de crescimento (0-100)
  let growthScore = 50
  const historicalData = generateHistoricalData(campaign, 30)
  const trend = analyzeTrend(historicalData.map(d => d.conversions))

  if (trend.trend === 'increasing') {
    growthScore += trend.changePercentage
    recommendations.push(`Crescimento de ${trend.changePercentage.toFixed(1)}% - considere escalar`)
  } else if (trend.trend === 'decreasing') {
    growthScore -= Math.abs(trend.changePercentage)
    warnings.push('Conversões em queda - ação necessária')
  }

  // Score geral (média ponderada)
  const overallScore = Math.round(
    (performanceScore * 0.4) + (efficiencyScore * 0.35) + (growthScore * 0.25)
  )

  // Recomendações baseadas no score
  if (overallScore >= 80) {
    recommendations.push('Campanha excelente! Considere escalar orçamento')
  } else if (overallScore >= 60) {
    recommendations.push('Campanha performando bem - continue otimizando')
  } else if (overallScore >= 40) {
    recommendations.push('Campanha precisa de otimização - revise segmentação')
  } else {
    recommendations.push('Campanha com problemas graves - considere pausar e revisar estratégia')
  }

  const healthScore: HealthScore = {
    overall: Math.max(0, Math.min(100, overallScore)),
    performance: Math.max(0, Math.min(100, performanceScore)),
    efficiency: Math.max(0, Math.min(100, efficiencyScore)),
    growth: Math.max(0, Math.min(100, growthScore)),
    warnings,
    recommendations
  }

  return {
    campaignId,
    campaignName: campaign.name,
    healthScore,
    status: overallScore >= 60 ? 'healthy' : overallScore >= 40 ? 'warning' : 'critical',
    calculatedAt: new Date().toISOString()
  }
}

// Recomendar orçamento ótimo
async function recommendBudget(supabase: any, userId: string, params: any) {
  const { campaignId, targetMetric = 'conversions' } = params

  const { data: campaign } = await supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const currentBudget = campaign.budgetTotal
  const currentSpend = campaign.budgetSpent
  const currentConversions = campaign.conversions

  // Calcular custo por conversão
  const costPerConversion = currentSpend > 0 && currentConversions > 0
    ? currentSpend / currentConversions
    : 0

  // Analisar eficiência
  const efficiency = currentSpend > 0 ? currentConversions / currentSpend : 0

  let recommendedBudget = currentBudget
  let reasoning = []

  // Regras de recomendação
  if (efficiency > 0.5) {
    // Alta eficiência - aumentar orçamento
    recommendedBudget = currentBudget * 1.3
    reasoning.push('Alta eficiência detectada')
    reasoning.push('Recomenda-se aumentar orçamento em 30%')
  } else if (efficiency > 0.2) {
    // Eficiência moderada - aumentar levemente
    recommendedBudget = currentBudget * 1.15
    reasoning.push('Eficiência moderada')
    reasoning.push('Recomenda-se aumentar orçamento em 15%')
  } else if (efficiency < 0.1 && currentSpend > 0) {
    // Baixa eficiência - reduzir
    recommendedBudget = currentBudget * 0.8
    reasoning.push('Baixa eficiência detectada')
    reasoning.push('Recomenda-se reduzir orçamento em 20% e otimizar')
  }

  // Verificar utilização do orçamento
  const utilizationRate = (currentSpend / currentBudget) * 100
  if (utilizationRate < 70) {
    recommendedBudget = currentBudget * 0.9
    reasoning.push(`Orçamento subutilizado (${utilizationRate.toFixed(1)}%)`)
  }

  // Calcular ROI esperado
  const historicalData = generateHistoricalData(campaign, 30)
  const avgConversionRate = historicalData.reduce((acc, d) =>
    acc + (d.conversions / d.clicks), 0) / historicalData.length

  const expectedConversions = recommendedBudget * avgConversionRate
  const expectedROI = expectedConversions > 0
    ? (expectedConversions * 100) / recommendedBudget // simplificado
    : 0

  return {
    campaignId,
    campaignName: campaign.name,
    currentBudget,
    recommendedBudget: Math.round(recommendedBudget * 100) / 100,
    change: Math.round(((recommendedBudget - currentBudget) / currentBudget) * 100),
    reasoning,
    metrics: {
      currentSpend,
      currentConversions,
      costPerConversion: Math.round(costPerConversion * 100) / 100,
      efficiency: Math.round(efficiency * 1000) / 10,
      utilizationRate: Math.round(utilizationRate * 10) / 10,
      expectedConversions: Math.round(expectedConversions),
      expectedROI: Math.round(expectedROI * 100) / 100
    }
  }
}

// Detectar anomalias
async function detectAnomalies(supabase: any, userId: string, params: any) {
  const { campaignId } = params

  const { data: campaign } = await supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .eq('id', campaignId)
    .single()

  if (!campaign) {
    throw new Error('Campaign not found')
  }

  const historicalData = generateHistoricalData(campaign, 30)
  const anomalies: any[] = []

  // Detectar anomalias em impressões
  const impressionsAnomaly = detectMetricAnomaly(
    historicalData.map(d => d.impressions),
    'impressions'
  )
  if (impressionsAnomaly) anomalies.push(impressionsAnomaly)

  // Detectar anomalias em CPC
  const cpcAnomaly = detectMetricAnomaly(
    historicalData.map(d => d.cpc),
    'cpc'
  )
  if (cpcAnomaly) anomalies.push(cpcAnomaly)

  // Detectar anomalias em conversões
  const conversionsAnomaly = detectMetricAnomaly(
    historicalData.map(d => d.conversions),
    'conversions'
  )
  if (conversionsAnomaly) anomalies.push(conversionsAnomaly)

  return {
    campaignId,
    campaignName: campaign.name,
    anomaliesDetected: anomalies.length,
    anomalies,
    severity: anomalies.length > 2 ? 'high' : anomalies.length > 0 ? 'medium' : 'low',
    checkedAt: new Date().toISOString()
  }
}

// Prever receita
async function forecastRevenue(supabase: any, userId: string, params: any) {
  const { days = 30 } = params

  // Buscar todas as campanhas ativas do usuário
  const { data: campaigns } = await supabase
    .from('Campaign')
    .select('*')
    .eq('userId', userId)
    .in('status', ['Ativa', 'Pausada'])

  if (!campaigns || campaigns.length === 0) {
    throw new Error('No campaigns found')
  }

  let totalRevenue = 0
  let totalSpend = 0
  const campaignForecasts = []

  for (const campaign of campaigns) {
    const historicalData = generateHistoricalData(campaign, 30)

    // Prever conversões
    const predictedConversions = predictLinearRegression(
      historicalData.map(d => d.conversions)
    )

    // Assumir valor médio por conversão (simplificado)
    const avgConversionValue = 100
    const predictedRevenue = predictedConversions * avgConversionValue

    // Prever gasto
    const predictedSpend = predictMovingAverage(
      historicalData.map(d => d.spend),
      days
    )

    totalRevenue += predictedRevenue
    totalSpend += predictedSpend

    campaignForecasts.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      predictedConversions: Math.round(predictedConversions),
      predictedRevenue: Math.round(predictedRevenue),
      predictedSpend: Math.round(predictedSpend),
      predictedROI: predictedSpend > 0 ? (predictedRevenue / predictedSpend) : 0
    })
  }

  return {
    period: `Next ${days} days`,
    totalPredictedRevenue: Math.round(totalRevenue),
    totalPredictedSpend: Math.round(totalSpend),
    predictedROI: totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0,
    campaignForecasts,
    generatedAt: new Date().toISOString()
  }
}

// ===== FUNÇÕES AUXILIARES =====

function generateHistoricalData(campaign: any, days: number): CampaignMetrics[] {
  const data: CampaignMetrics[] = []
  const baseImpressions = campaign.impressions / days
  const baseClicks = campaign.clicks / days
  const baseConversions = campaign.conversions / days
  const baseSpend = campaign.budgetSpent / days

  for (let i = days - 1; i >= 0; i--) {
    const variance = 1 + (Math.random() - 0.5) * 0.4
    const impressions = Math.round(baseImpressions * variance)
    const clicks = Math.round(baseClicks * variance)
    const conversions = Math.round(baseConversions * variance)
    const spend = baseSpend * variance

    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      impressions,
      clicks,
      conversions,
      spend,
      cpc: clicks > 0 ? spend / clicks : 0,
      ctr: impressions > 0 ? (clicks / impressions) * 100 : 0
    })
  }

  return data
}

function analyzeTrend(values: number[]): TrendAnalysis {
  if (values.length < 2) {
    return { trend: 'stable', changePercentage: 0, confidence: 0, dataPoints: values.length }
  }

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

  const changePercentage = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0

  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (changePercentage > 5) trend = 'increasing'
  else if (changePercentage < -5) trend = 'decreasing'

  const confidence = Math.min(0.95, values.length / 30)

  return { trend, changePercentage, confidence, dataPoints: values.length }
}

function predictMovingAverage(values: number[], periods: number): number {
  if (values.length === 0) return 0

  const window = Math.min(7, values.length)
  const recent = values.slice(-window)
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length

  return avg * periods
}

function predictLinearRegression(values: number[]): number {
  if (values.length < 2) return values[0] || 0

  const n = values.length
  const indices = Array.from({ length: n }, (_, i) => i)

  const sumX = indices.reduce((a, b) => a + b, 0)
  const sumY = values.reduce((a, b) => a + b, 0)
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0)
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  return slope * n + intercept
}

function identifyPatterns(data: CampaignMetrics[]) {
  const patterns: any[] = []

  // Detectar padrão semanal
  if (data.length >= 14) {
    const weekdayPerformance = new Map()
    data.forEach(d => {
      const day = new Date(d.date).getDay()
      if (!weekdayPerformance.has(day)) {
        weekdayPerformance.set(day, [])
      }
      weekdayPerformance.get(day).push(d.conversions)
    })

    const bestDay = Array.from(weekdayPerformance.entries())
      .map(([day, conversions]) => ({
        day,
        avg: conversions.reduce((a: number, b: number) => a + b, 0) / conversions.length
      }))
      .sort((a, b) => b.avg - a.avg)[0]

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    patterns.push({
      type: 'weekly',
      description: `Melhor dia: ${days[bestDay.day]}`,
      confidence: 0.70
    })
  }

  // Detectar tendência geral
  const trend = analyzeTrend(data.map(d => d.conversions))
  if (trend.trend !== 'stable') {
    patterns.push({
      type: 'trend',
      description: `Conversões ${trend.trend === 'increasing' ? 'crescendo' : 'caindo'} ${Math.abs(trend.changePercentage).toFixed(1)}%`,
      confidence: trend.confidence
    })
  }

  return patterns
}

function generateInsights(trends: any, patterns: any[], campaign: any): string[] {
  const insights: string[] = []

  // Insights baseados em tendências
  if (trends.conversions.trend === 'increasing') {
    insights.push(`✅ Conversões aumentando ${trends.conversions.changePercentage.toFixed(1)}% - performance excelente`)
  } else if (trends.conversions.trend === 'decreasing') {
    insights.push(`⚠️ Conversões caindo ${Math.abs(trends.conversions.changePercentage).toFixed(1)}% - ação necessária`)
  }

  if (trends.cpc.trend === 'increasing') {
    insights.push(`⚠️ CPC aumentando - revise estratégia de lances`)
  } else if (trends.cpc.trend === 'decreasing') {
    insights.push(`✅ CPC em queda - otimização efetiva`)
  }

  // Insights baseados em padrões
  patterns.forEach(pattern => {
    if (pattern.type === 'weekly' && pattern.confidence > 0.6) {
      insights.push(`📅 ${pattern.description} - considere aumentar orçamento neste dia`)
    }
  })

  return insights
}

function calculateOverallTrend(predictions: Prediction[]): string {
  const positiveCount = predictions.filter(p => p.predictedValue > p.currentValue).length
  const negativeCount = predictions.filter(p => p.predictedValue < p.currentValue).length

  if (positiveCount > negativeCount * 1.5) return 'strong_positive'
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

function detectMetricAnomaly(values: number[], metricName: string): any | null {
  if (values.length < 7) return null

  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const stdDev = Math.sqrt(
    values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length
  )

  const recentValue = values[values.length - 1]
  const zScore = (recentValue - mean) / stdDev

  if (Math.abs(zScore) > 2) {
    return {
      metric: metricName,
      type: zScore > 0 ? 'spike' : 'drop',
      severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
      currentValue: recentValue,
      expectedValue: mean,
      deviation: Math.round(Math.abs(zScore) * 100)
    }
  }

  return null
}

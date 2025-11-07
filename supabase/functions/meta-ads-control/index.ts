import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const META_API_VERSION = 'v18.0'
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

interface MetaCampaignParams {
  name: string
  objective: string
  status: 'PAUSED' | 'ACTIVE'
  dailyBudget?: number
  lifetimeBudget?: number
  adAccountId: string
  targeting?: any
  bidStrategy?: string
}

interface OptimizeParams {
  campaignId: string
  strategy: 'increase_budget' | 'decrease_budget' | 'pause' | 'adjust_bidding'
  amount?: number
  adAccountId: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { action, params } = await req.json()

    console.log(`Meta Ads Control - Action: ${action}, User: ${user.id}`)

    // Get Meta Ads integration
    const { data: integration, error: integrationError } = await supabase
      .from('Integration')
      .select('accessToken, refreshToken, metadata, expiresAt')
      .eq('userId', user.id)
      .eq('platform', 'META_ADS')
      .eq('isActive', true)
      .single()

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Meta Ads not connected. Please connect your Meta Ads account first.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const accessToken = integration.accessToken

    // Execute action
    let result
    switch (action) {
      case 'get_campaigns':
        result = await getCampaigns(accessToken, params)
        break

      case 'analyze_campaign':
        result = await analyzeCampaign(accessToken, params)
        break

      case 'create_campaign':
        result = await createCampaign(accessToken, params)
        break

      case 'optimize_campaign':
        result = await optimizeCampaign(accessToken, params)
        break

      case 'get_ad_accounts':
        result = await getAdAccounts(accessToken)
        break

      case 'get_insights':
        result = await getInsights(accessToken, params)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Meta Ads Control error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Get all ad accounts
async function getAdAccounts(accessToken: string) {
  const url = `${META_BASE_URL}/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch ad accounts')
  }

  return data.data || []
}

// Get campaigns
async function getCampaigns(accessToken: string, params: any) {
  const { adAccountId, limit = 25 } = params

  if (!adAccountId) {
    throw new Error('adAccountId is required')
  }

  const fields = 'id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time'
  const url = `${META_BASE_URL}/act_${adAccountId}/campaigns?fields=${fields}&limit=${limit}&access_token=${accessToken}`

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch campaigns')
  }

  return {
    campaigns: data.data || [],
    total: data.data?.length || 0
  }
}

// Analyze campaign with detailed metrics
async function analyzeCampaign(accessToken: string, params: any) {
  const { campaignId, datePreset = 'last_7d' } = params

  if (!campaignId) {
    throw new Error('campaignId is required')
  }

  // Get campaign details
  const campaignUrl = `${META_BASE_URL}/${campaignId}?fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&access_token=${accessToken}`
  const campaignResponse = await fetch(campaignUrl)
  const campaign = await campaignResponse.json()

  if (!campaignResponse.ok) {
    throw new Error(campaign.error?.message || 'Failed to fetch campaign')
  }

  // Get insights
  const fields = 'impressions,clicks,spend,cpc,cpm,ctr,reach,frequency,actions,cost_per_action_type,action_values'
  const insightsUrl = `${META_BASE_URL}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`
  const insightsResponse = await fetch(insightsUrl)
  const insightsData = await insightsResponse.json()

  if (!insightsResponse.ok) {
    throw new Error(insightsData.error?.message || 'Failed to fetch insights')
  }

  const insights = insightsData.data?.[0] || {}

  // Calculate ROAS
  const spend = parseFloat(insights.spend || '0')
  const actions = insights.actions || []
  const purchases = actions.find((a: any) => a.action_type === 'purchase')
  const purchaseValue = parseFloat(purchases?.value || '0')
  const roas = spend > 0 ? purchaseValue / spend : 0

  // Calculate conversions
  const conversions = actions.reduce((sum: number, action: any) => {
    if (['purchase', 'lead', 'complete_registration'].includes(action.action_type)) {
      return sum + parseInt(action.value || '0')
    }
    return sum
  }, 0)

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      objective: campaign.objective,
      budget: campaign.daily_budget || campaign.lifetime_budget || 0
    },
    metrics: {
      impressions: parseInt(insights.impressions || '0'),
      clicks: parseInt(insights.clicks || '0'),
      spend: spend,
      cpc: parseFloat(insights.cpc || '0'),
      cpm: parseFloat(insights.cpm || '0'),
      ctr: parseFloat(insights.ctr || '0'),
      reach: parseInt(insights.reach || '0'),
      frequency: parseFloat(insights.frequency || '0'),
      conversions: conversions,
      roas: roas
    },
    analysis: {
      performance: spend > 0 ? (roas >= 2 ? 'excellent' : roas >= 1 ? 'good' : 'needs_improvement') : 'no_data',
      recommendations: generateRecommendations(insights, spend, roas, parseFloat(insights.ctr || '0'))
    }
  }
}

// Generate recommendations based on metrics
function generateRecommendations(insights: any, spend: number, roas: number, ctr: number): string[] {
  const recommendations: string[] = []

  if (roas < 1 && spend > 0) {
    recommendations.push('ROAS abaixo de 1x - considere pausar ou ajustar segmentação')
  }

  if (roas >= 2) {
    recommendations.push('ROAS excelente! Considere aumentar o orçamento em 20-30%')
  }

  if (ctr < 1) {
    recommendations.push('CTR baixo - teste novos criativos ou ajuste copy')
  }

  if (ctr >= 2) {
    recommendations.push('CTR bom! Criativos estão performando bem')
  }

  const cpc = parseFloat(insights.cpc || '0')
  if (cpc > 5) {
    recommendations.push('CPC alto - considere ajustar lances ou melhorar qualidade do anúncio')
  }

  if (recommendations.length === 0) {
    recommendations.push('Continue monitorando métricas. Performance dentro do esperado.')
  }

  return recommendations
}

// Create campaign
async function createCampaign(accessToken: string, params: MetaCampaignParams) {
  const { adAccountId, name, objective, status, dailyBudget, lifetimeBudget, targeting, bidStrategy } = params

  if (!adAccountId || !name || !objective) {
    throw new Error('adAccountId, name, and objective are required')
  }

  const url = `${META_BASE_URL}/act_${adAccountId}/campaigns`

  const body: any = {
    name,
    objective,
    status,
    access_token: accessToken,
    special_ad_categories: []
  }

  if (dailyBudget) {
    body.daily_budget = Math.round(dailyBudget * 100) // Convert to cents
  }

  if (lifetimeBudget) {
    body.lifetime_budget = Math.round(lifetimeBudget * 100)
  }

  if (bidStrategy) {
    body.bid_strategy = bidStrategy
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to create campaign')
  }

  return {
    campaignId: data.id,
    message: `Campaign "${name}" created successfully`,
    details: data
  }
}

// Optimize campaign
async function optimizeCampaign(accessToken: string, params: OptimizeParams) {
  const { campaignId, strategy, amount, adAccountId } = params

  if (!campaignId || !strategy) {
    throw new Error('campaignId and strategy are required')
  }

  const url = `${META_BASE_URL}/${campaignId}`
  let body: any = { access_token: accessToken }
  let message = ''

  switch (strategy) {
    case 'increase_budget':
      if (!amount) throw new Error('amount is required for budget increase')

      // Get current budget
      const currentResponse = await fetch(`${url}?fields=daily_budget&access_token=${accessToken}`)
      const currentData = await currentResponse.json()
      const currentBudget = parseFloat(currentData.daily_budget || '0') / 100
      const newBudget = currentBudget * (1 + amount / 100)

      body.daily_budget = Math.round(newBudget * 100)
      message = `Budget increased by ${amount}% from R$ ${currentBudget.toFixed(2)} to R$ ${newBudget.toFixed(2)}`
      break

    case 'decrease_budget':
      if (!amount) throw new Error('amount is required for budget decrease')

      const currentResp = await fetch(`${url}?fields=daily_budget&access_token=${accessToken}`)
      const currentDt = await currentResp.json()
      const currentBdg = parseFloat(currentDt.daily_budget || '0') / 100
      const newBdg = currentBdg * (1 - amount / 100)

      body.daily_budget = Math.round(newBdg * 100)
      message = `Budget decreased by ${amount}% from R$ ${currentBdg.toFixed(2)} to R$ ${newBdg.toFixed(2)}`
      break

    case 'pause':
      body.status = 'PAUSED'
      message = 'Campaign paused successfully'
      break

    case 'adjust_bidding':
      body.bid_strategy = 'LOWEST_COST_WITH_BID_CAP'
      message = 'Bidding strategy adjusted to optimize costs'
      break

    default:
      throw new Error(`Unknown optimization strategy: ${strategy}`)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to optimize campaign')
  }

  return {
    success: data.success || true,
    message,
    campaignId
  }
}

// Get detailed insights
async function getInsights(accessToken: string, params: any) {
  const { campaignId, datePreset = 'last_7d', breakdown } = params

  if (!campaignId) {
    throw new Error('campaignId is required')
  }

  const fields = 'impressions,clicks,spend,cpc,cpm,ctr,reach,frequency,actions,cost_per_action_type,conversions,purchase_roas'
  let url = `${META_BASE_URL}/${campaignId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`

  if (breakdown) {
    url += `&breakdowns=${breakdown}`
  }

  const response = await fetch(url)
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch insights')
  }

  return data.data || []
}

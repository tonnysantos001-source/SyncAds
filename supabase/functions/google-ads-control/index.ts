import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GOOGLE_ADS_API_VERSION = 'v13'
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`

interface GoogleAdsCampaignParams {
  name: string
  advertisingChannelType: 'SEARCH' | 'DISPLAY' | 'SHOPPING' | 'VIDEO' | 'MULTI_CHANNEL'
  status: 'PAUSED' | 'ENABLED'
  budgetAmount: number
  customerId: string
  biddingStrategy?: string
  startDate?: string
  endDate?: string
}

interface OptimizeParams {
  campaignId: string
  strategy: 'increase_budget' | 'decrease_budget' | 'pause' | 'adjust_bidding'
  amount?: number
  customerId: string
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

    console.log(`Google Ads Control - Action: ${action}, User: ${user.id}`)

    // Get Google Ads integration
    const { data: integration, error: integrationError } = await supabase
      .from('Integration')
      .select('accessToken, refreshToken, metadata, expiresAt')
      .eq('userId', user.id)
      .eq('platform', 'GOOGLE_ADS')
      .eq('isActive', true)
      .single()

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Google Ads not connected. Please connect your Google Ads account first.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const accessToken = integration.accessToken
    const developerId = integration.metadata?.developer_token || Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN')

    if (!developerId) {
      throw new Error('Google Ads Developer Token not configured')
    }

    // Execute action
    let result
    switch (action) {
      case 'get_campaigns':
        result = await getCampaigns(accessToken, developerId, params)
        break

      case 'analyze_campaign':
        result = await analyzeCampaign(accessToken, developerId, params)
        break

      case 'create_campaign':
        result = await createCampaign(accessToken, developerId, params)
        break

      case 'optimize_campaign':
        result = await optimizeCampaign(accessToken, developerId, params)
        break

      case 'get_customer_accounts':
        result = await getCustomerAccounts(accessToken, developerId)
        break

      case 'get_insights':
        result = await getInsights(accessToken, developerId, params)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Google Ads Control error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Get all customer accounts
async function getCustomerAccounts(accessToken: string, developerToken: string) {
  const url = `${GOOGLE_ADS_BASE_URL}/customers:listAccessibleCustomers`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch customer accounts')
  }

  return data.resourceNames || []
}

// Get campaigns using Google Ads Query Language (GAQL)
async function getCampaigns(accessToken: string, developerToken: string, params: any) {
  const { customerId, limit = 25 } = params

  if (!customerId) {
    throw new Error('customerId is required')
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      campaign.start_date,
      campaign.end_date
    FROM campaign
    WHERE campaign.status != 'REMOVED'
    ORDER BY campaign.id DESC
    LIMIT ${limit}
  `

  const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch campaigns')
  }

  const campaigns = data.results?.map((result: any) => ({
    id: result.campaign.id,
    name: result.campaign.name,
    status: result.campaign.status,
    channelType: result.campaign.advertisingChannelType,
    budget: result.campaignBudget?.amountMicros ? parseInt(result.campaignBudget.amountMicros) / 1000000 : 0,
    startDate: result.campaign.startDate,
    endDate: result.campaign.endDate
  })) || []

  return {
    campaigns,
    total: campaigns.length
  }
}

// Analyze campaign with detailed metrics
async function analyzeCampaign(accessToken: string, developerToken: string, params: any) {
  const { campaignId, customerId, dateRange = 'LAST_7_DAYS' } = params

  if (!campaignId || !customerId) {
    throw new Error('campaignId and customerId are required')
  }

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc,
      metrics.average_cpm
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date DURING ${dateRange}
  `

  const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch campaign analysis')
  }

  const result = data.results?.[0]

  if (!result) {
    throw new Error('Campaign not found')
  }

  const metrics = result.metrics
  const spend = metrics.costMicros ? parseInt(metrics.costMicros) / 1000000 : 0
  const conversionsValue = metrics.conversionsValue || 0
  const roas = spend > 0 ? conversionsValue / spend : 0

  return {
    campaign: {
      id: result.campaign.id,
      name: result.campaign.name,
      status: result.campaign.status,
      channelType: result.campaign.advertisingChannelType,
      budget: result.campaignBudget?.amountMicros ? parseInt(result.campaignBudget.amountMicros) / 1000000 : 0
    },
    metrics: {
      impressions: parseInt(metrics.impressions || '0'),
      clicks: parseInt(metrics.clicks || '0'),
      spend: spend,
      cpc: metrics.averageCpc ? parseInt(metrics.averageCpc) / 1000000 : 0,
      cpm: metrics.averageCpm ? parseInt(metrics.averageCpm) / 1000000 : 0,
      ctr: parseFloat(metrics.ctr || '0'),
      conversions: parseFloat(metrics.conversions || '0'),
      conversionsValue: conversionsValue,
      roas: roas
    },
    analysis: {
      performance: spend > 0 ? (roas >= 3 ? 'excellent' : roas >= 2 ? 'good' : roas >= 1 ? 'fair' : 'needs_improvement') : 'no_data',
      recommendations: generateRecommendations(metrics, spend, roas, parseFloat(metrics.ctr || '0'))
    }
  }
}

// Generate recommendations based on metrics
function generateRecommendations(metrics: any, spend: number, roas: number, ctr: number): string[] {
  const recommendations: string[] = []

  if (roas < 1 && spend > 0) {
    recommendations.push('ROAS abaixo de 1x - considere revisar palavras-chave e segmentação')
  }

  if (roas >= 3) {
    recommendations.push('ROAS excelente! Considere escalar o orçamento em 30-40%')
  }

  if (ctr < 2) {
    recommendations.push('CTR baixo - otimize títulos e descrições dos anúncios')
  }

  if (ctr >= 5) {
    recommendations.push('CTR excelente! Seus anúncios estão muito relevantes')
  }

  const cpc = metrics.averageCpc ? parseInt(metrics.averageCpc) / 1000000 : 0
  if (cpc > 10) {
    recommendations.push('CPC alto - revise estratégia de lances ou melhore Quality Score')
  }

  const qualityScore = parseInt(metrics.searchImpressionShare || '0')
  if (qualityScore < 50) {
    recommendations.push('Baixa participação de impressões - aumente orçamento ou melhore anúncios')
  }

  if (recommendations.length === 0) {
    recommendations.push('Campanha performando dentro do esperado. Continue monitorando.')
  }

  return recommendations
}

// Create campaign
async function createCampaign(accessToken: string, developerToken: string, params: GoogleAdsCampaignParams) {
  const { customerId, name, advertisingChannelType, status, budgetAmount, biddingStrategy, startDate, endDate } = params

  if (!customerId || !name || !advertisingChannelType || !budgetAmount) {
    throw new Error('customerId, name, advertisingChannelType, and budgetAmount are required')
  }

  // First, create campaign budget
  const budgetOperation = {
    create: {
      name: `${name} Budget`,
      amountMicros: Math.round(budgetAmount * 1000000),
      deliveryMethod: 'STANDARD'
    }
  }

  const budgetUrl = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/campaignBudgets:mutate`
  const budgetResponse = await fetch(budgetUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations: [budgetOperation] })
  })

  const budgetData = await budgetResponse.json()

  if (!budgetResponse.ok) {
    throw new Error(budgetData.error?.message || 'Failed to create campaign budget')
  }

  const budgetResourceName = budgetData.results[0].resourceName

  // Then create campaign
  const campaignOperation: any = {
    create: {
      name,
      status,
      advertisingChannelType,
      campaignBudget: budgetResourceName
    }
  }

  if (biddingStrategy) {
    campaignOperation.create.biddingStrategyType = biddingStrategy
  }

  if (startDate) {
    campaignOperation.create.startDate = startDate
  }

  if (endDate) {
    campaignOperation.create.endDate = endDate
  }

  const campaignUrl = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/campaigns:mutate`
  const campaignResponse = await fetch(campaignUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ operations: [campaignOperation] })
  })

  const campaignData = await campaignResponse.json()

  if (!campaignResponse.ok) {
    throw new Error(campaignData.error?.message || 'Failed to create campaign')
  }

  return {
    campaignId: campaignData.results[0].resourceName,
    message: `Campaign "${name}" created successfully`,
    details: campaignData.results[0]
  }
}

// Optimize campaign
async function optimizeCampaign(accessToken: string, developerToken: string, params: OptimizeParams) {
  const { campaignId, strategy, amount, customerId } = params

  if (!campaignId || !strategy || !customerId) {
    throw new Error('campaignId, strategy, and customerId are required')
  }

  let operation: any = {
    updateMask: '',
    update: {
      resourceName: `customers/${customerId}/campaigns/${campaignId}`
    }
  }

  let message = ''

  switch (strategy) {
    case 'increase_budget':
      if (!amount) throw new Error('amount is required for budget increase')

      // Get current budget first
      const query = `
        SELECT campaign_budget.amount_micros, campaign.campaign_budget
        FROM campaign
        WHERE campaign.id = ${campaignId}
      `

      const queryUrl = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`
      const queryResponse = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      const queryData = await queryResponse.json()
      const currentBudget = queryData.results?.[0]?.campaignBudget?.amountMicros || 0
      const newBudget = Math.round(parseInt(currentBudget) * (1 + amount / 100))

      // Update budget
      const budgetOperation = {
        updateMask: 'amountMicros',
        update: {
          resourceName: queryData.results[0].campaign.campaignBudget,
          amountMicros: newBudget
        }
      }

      const budgetUrl = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/campaignBudgets:mutate`
      await fetch(budgetUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operations: [budgetOperation] })
      })

      message = `Budget increased by ${amount}% from R$ ${(parseInt(currentBudget) / 1000000).toFixed(2)} to R$ ${(newBudget / 1000000).toFixed(2)}`
      break

    case 'pause':
      operation.updateMask = 'status'
      operation.update.status = 'PAUSED'
      message = 'Campaign paused successfully'
      break

    case 'adjust_bidding':
      operation.updateMask = 'biddingStrategyType'
      operation.update.biddingStrategyType = 'TARGET_CPA'
      message = 'Bidding strategy adjusted to Target CPA'
      break

    default:
      throw new Error(`Unknown optimization strategy: ${strategy}`)
  }

  if (strategy !== 'increase_budget') {
    const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/campaigns:mutate`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operations: [operation] })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to optimize campaign')
    }
  }

  return {
    success: true,
    message,
    campaignId
  }
}

// Get detailed insights
async function getInsights(accessToken: string, developerToken: string, params: any) {
  const { campaignId, customerId, dateRange = 'LAST_7_DAYS' } = params

  if (!campaignId || !customerId) {
    throw new Error('campaignId and customerId are required')
  }

  const query = `
    SELECT
      segments.date,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.conversions_value,
      metrics.ctr,
      metrics.average_cpc
    FROM campaign
    WHERE campaign.id = ${campaignId}
      AND segments.date DURING ${dateRange}
    ORDER BY segments.date DESC
  `

  const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to fetch insights')
  }

  return data.results || []
}

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LINKEDIN_API_VERSION = 'v2'
const LINKEDIN_BASE_URL = 'https://api.linkedin.com'

interface LinkedInCampaignParams {
  name: string
  accountId: string
  type: 'TEXT_AD' | 'SPONSORED_UPDATES' | 'SPONSORED_INMAILS'
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  dailyBudget: number
  totalBudget?: number
  startDate: string
  endDate?: string
  objective: 'BRAND_AWARENESS' | 'WEBSITE_VISITS' | 'ENGAGEMENT' | 'VIDEO_VIEWS' | 'LEAD_GENERATION' | 'WEBSITE_CONVERSIONS' | 'JOB_APPLICANTS'
}

interface OptimizeParams {
  campaignId: string
  strategy: 'increase_budget' | 'decrease_budget' | 'pause' | 'adjust_bidding'
  amount?: number
  accountId: string
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

    console.log(`LinkedIn Ads Control - Action: ${action}, User: ${user.id}`)

    // Get LinkedIn Ads integration
    const { data: integration, error: integrationError } = await supabase
      .from('Integration')
      .select('accessToken, refreshToken, metadata, expiresAt')
      .eq('userId', user.id)
      .eq('platform', 'LINKEDIN_ADS')
      .eq('isActive', true)
      .single()

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'LinkedIn Ads not connected. Please connect your LinkedIn Ads account first.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const accessToken = integration.accessToken

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

      case 'get_accounts':
        result = await getAccounts(accessToken)
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
    console.error('LinkedIn Ads Control error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Get ad accounts
async function getAccounts(accessToken: string) {
  const url = `${LINKEDIN_BASE_URL}/v2/adAccountsV2?q=search`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch ad accounts')
  }

  return data.elements || []
}

// Get campaigns
async function getCampaigns(accessToken: string, params: any) {
  const { accountId, limit = 25 } = params

  if (!accountId) {
    throw new Error('accountId is required')
  }

  const url = `${LINKEDIN_BASE_URL}/v2/adCampaignsV2?q=search&search.account.values[0]=urn:li:sponsoredAccount:${accountId}&count=${limit}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch campaigns')
  }

  const campaigns = (data.elements || []).map((campaign: any) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    type: campaign.type,
    objective: campaign.objectiveType,
    dailyBudget: campaign.dailyBudget?.amount || 0,
    totalBudget: campaign.totalBudget?.amount || 0,
    startDate: campaign.runSchedule?.start,
    endDate: campaign.runSchedule?.end,
    createdAt: campaign.createdAt,
    lastModified: campaign.lastModifiedAt
  }))

  return {
    campaigns,
    total: campaigns.length
  }
}

// Analyze campaign
async function analyzeCampaign(accessToken: string, params: any) {
  const { campaignId, dateRange = 'LAST_7_DAYS' } = params

  if (!campaignId) {
    throw new Error('campaignId is required')
  }

  // Get campaign details
  const campaignUrl = `${LINKEDIN_BASE_URL}/v2/adCampaignsV2/${campaignId}`
  const campaignResponse = await fetch(campaignUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  })

  const campaign = await campaignResponse.json()

  if (!campaignResponse.ok) {
    throw new Error(campaign.message || 'Failed to fetch campaign')
  }

  // Get analytics
  const startDate = getDateRange(dateRange).start
  const endDate = getDateRange(dateRange).end

  const analyticsUrl = `${LINKEDIN_BASE_URL}/v2/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange.start.day=${startDate.day}&dateRange.start.month=${startDate.month}&dateRange.start.year=${startDate.year}&dateRange.end.day=${endDate.day}&dateRange.end.month=${endDate.month}&dateRange.end.year=${endDate.year}&campaigns[0]=urn:li:sponsoredCampaign:${campaignId}&fields=impressions,clicks,externalWebsiteConversions,costInLocalCurrency,approximateUniqueImpressions`

  const analyticsResponse = await fetch(analyticsUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  })

  const analyticsData = await analyticsResponse.json()

  if (!analyticsResponse.ok) {
    throw new Error(analyticsData.message || 'Failed to fetch analytics')
  }

  const analytics = analyticsData.elements?.[0] || {}

  const impressions = analytics.impressions || 0
  const clicks = analytics.clicks || 0
  const spend = analytics.costInLocalCurrency || 0
  const conversions = analytics.externalWebsiteConversions || 0

  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpc = clicks > 0 ? spend / clicks : 0
  const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0
  const costPerConversion = conversions > 0 ? spend / conversions : 0

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      type: campaign.type,
      objective: campaign.objectiveType,
      budget: campaign.dailyBudget?.amount || campaign.totalBudget?.amount || 0
    },
    metrics: {
      impressions,
      clicks,
      spend,
      conversions,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      costPerConversion: Math.round(costPerConversion * 100) / 100
    },
    analysis: {
      performance: spend > 0 ? (conversionRate > 5 ? 'excellent' : conversionRate > 2 ? 'good' : 'needs_improvement') : 'no_data',
      recommendations: generateRecommendations(ctr, cpc, conversionRate, spend)
    }
  }
}

// Generate recommendations
function generateRecommendations(ctr: number, cpc: number, conversionRate: number, spend: number): string[] {
  const recommendations: string[] = []

  if (ctr < 0.5) {
    recommendations.push('CTR muito baixo para LinkedIn - revise título e copy do anúncio')
  } else if (ctr >= 1) {
    recommendations.push('CTR excelente! Seu anúncio está atraindo atenção')
  }

  if (cpc > 8) {
    recommendations.push('CPC alto para LinkedIn B2B - ajuste segmentação ou lances')
  } else if (cpc < 5) {
    recommendations.push('CPC competitivo - bom custo por clique')
  }

  if (conversionRate < 2 && spend > 0) {
    recommendations.push('Taxa de conversão baixa - revise landing page e CTA')
  } else if (conversionRate >= 5) {
    recommendations.push('Taxa de conversão excelente! Considere escalar campanha')
  }

  if (spend > 0 && recommendations.length === 0) {
    recommendations.push('Campanha performando dentro do esperado para LinkedIn Ads')
  }

  return recommendations
}

// Create campaign
async function createCampaign(accessToken: string, params: LinkedInCampaignParams) {
  const { accountId, name, type, status, dailyBudget, totalBudget, startDate, endDate, objective } = params

  if (!accountId || !name || !type || !status || !objective) {
    throw new Error('accountId, name, type, status, and objective are required')
  }

  const url = `${LINKEDIN_BASE_URL}/v2/adCampaignsV2`

  const body: any = {
    account: `urn:li:sponsoredAccount:${accountId}`,
    name,
    type,
    status,
    objectiveType: objective,
    offsiteDeliveryEnabled: true,
    locale: {
      country: 'US',
      language: 'en'
    },
    runSchedule: {
      start: convertDateToLinkedInFormat(startDate)
    }
  }

  if (dailyBudget) {
    body.dailyBudget = {
      currencyCode: 'USD',
      amount: dailyBudget.toString()
    }
  }

  if (totalBudget) {
    body.totalBudget = {
      currencyCode: 'USD',
      amount: totalBudget.toString()
    }
  }

  if (endDate) {
    body.runSchedule.end = convertDateToLinkedInFormat(endDate)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
      'LinkedIn-Version': '202401'
    },
    body: JSON.stringify(body)
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create campaign')
  }

  return {
    campaignId: data.id,
    message: `Campaign "${name}" created successfully`,
    details: data
  }
}

// Optimize campaign
async function optimizeCampaign(accessToken: string, params: OptimizeParams) {
  const { campaignId, strategy, amount } = params

  if (!campaignId || !strategy) {
    throw new Error('campaignId and strategy are required')
  }

  const url = `${LINKEDIN_BASE_URL}/v2/adCampaignsV2/${campaignId}`

  // Get current campaign
  const currentResponse = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  })

  const currentCampaign = await currentResponse.json()

  if (!currentResponse.ok) {
    throw new Error('Failed to fetch current campaign')
  }

  let body: any = {}
  let message = ''

  switch (strategy) {
    case 'increase_budget':
      if (!amount) throw new Error('amount is required for budget increase')

      const currentBudget = parseFloat(currentCampaign.dailyBudget?.amount || '0')
      const newBudget = currentBudget * (1 + amount / 100)

      body.dailyBudget = {
        currencyCode: currentCampaign.dailyBudget?.currencyCode || 'USD',
        amount: newBudget.toString()
      }
      message = `Budget increased by ${amount}% from $${currentBudget.toFixed(2)} to $${newBudget.toFixed(2)}`
      break

    case 'decrease_budget':
      if (!amount) throw new Error('amount is required for budget decrease')

      const currentBdg = parseFloat(currentCampaign.dailyBudget?.amount || '0')
      const newBdg = currentBdg * (1 - amount / 100)

      body.dailyBudget = {
        currencyCode: currentCampaign.dailyBudget?.currencyCode || 'USD',
        amount: newBdg.toString()
      }
      message = `Budget decreased by ${amount}% from $${currentBdg.toFixed(2)} to $${newBdg.toFixed(2)}`
      break

    case 'pause':
      body.status = 'PAUSED'
      message = 'Campaign paused successfully'
      break

    case 'adjust_bidding':
      body.costType = 'CPM'
      message = 'Bidding strategy adjusted to CPM'
      break

    default:
      throw new Error(`Unknown optimization strategy: ${strategy}`)
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'Content-Type': 'application/json',
      'X-RestLi-Method': 'PARTIAL_UPDATE',
      'LinkedIn-Version': '202401'
    },
    body: JSON.stringify({ patch: { $set: body } })
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Failed to optimize campaign')
  }

  return {
    success: true,
    message,
    campaignId
  }
}

// Get insights
async function getInsights(accessToken: string, params: any) {
  const { campaignId, dateRange = 'LAST_7_DAYS' } = params

  if (!campaignId) {
    throw new Error('campaignId is required')
  }

  const { start, end } = getDateRange(dateRange)

  const url = `${LINKEDIN_BASE_URL}/v2/adAnalytics?q=analytics&pivot=CAMPAIGN&dateRange.start.day=${start.day}&dateRange.start.month=${start.month}&dateRange.start.year=${start.year}&dateRange.end.day=${end.day}&dateRange.end.month=${end.month}&dateRange.end.year=${end.year}&campaigns[0]=urn:li:sponsoredCampaign:${campaignId}&timeGranularity=DAILY`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202401'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch insights')
  }

  return data.elements || []
}

// Helper functions
function getDateRange(preset: string) {
  const end = new Date()
  let start = new Date()

  switch (preset) {
    case 'LAST_7_DAYS':
      start.setDate(end.getDate() - 7)
      break
    case 'LAST_30_DAYS':
      start.setDate(end.getDate() - 30)
      break
    case 'LAST_90_DAYS':
      start.setDate(end.getDate() - 90)
      break
    default:
      start.setDate(end.getDate() - 7)
  }

  return {
    start: {
      day: start.getDate(),
      month: start.getMonth() + 1,
      year: start.getFullYear()
    },
    end: {
      day: end.getDate(),
      month: end.getMonth() + 1,
      year: end.getFullYear()
    }
  }
}

function convertDateToLinkedInFormat(dateString: string) {
  const date = new Date(dateString)
  return {
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear()
  }
}

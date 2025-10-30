import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetaCampaignParams {
  name: string
  objective: string
  status: 'PAUSED' | 'ACTIVE'
  dailyBudget?: number
  adAccountId: string
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
    if (!authHeader) throw new Error('Missing authorization')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error('Unauthorized')

    const { action, params } = await req.json()

    // ✅ SISTEMA SIMPLIFICADO: Buscar integração Meta por userId
    const { data: integration } = await supabase
      .from('Integration')
      .select('accessToken, metadata')
      .eq('userId', user.id)
      .eq('platform', 'META_ADS')
      .eq('isActive', true)
      .single()

    if (!integration) {
      return new Response(
        JSON.stringify({ error: 'Meta Ads not connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = integration.accessToken

    // Executar ação
    switch (action) {
      case 'createCampaign': {
        const campaignParams: MetaCampaignParams = params
        const url = `https://graph.facebook.com/v18.0/act_${campaignParams.adAccountId}/campaigns`
        
        const body: any = {
          name: campaignParams.name,
          objective: campaignParams.objective,
          status: campaignParams.status,
          access_token: accessToken
        }

        if (campaignParams.dailyBudget) {
          body.daily_budget = campaignParams.dailyBudget * 100 // Centavos
        }

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error?.message || 'Meta API error')
        }

        return new Response(
          JSON.stringify({ success: true, campaign: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'getCampaigns': {
        const { adAccountId } = params
        const url = `https://graph.facebook.com/v18.0/act_${adAccountId}/campaigns?fields=id,name,status,objective&access_token=${accessToken}`
        
        const response = await fetch(url)
        const data = await response.json()

        return new Response(
          JSON.stringify({ success: true, campaigns: data.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'pauseCampaign': {
        const { campaignId } = params
        const url = `https://graph.facebook.com/v18.0/${campaignId}`
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'PAUSED',
            access_token: accessToken
          })
        })

        const data = await response.json()

        return new Response(
          JSON.stringify({ success: true, result: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'getMetrics': {
        const { campaignId, datePreset = 'last_7d' } = params
        const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,clicks,spend,cpc,cpm,ctr&date_preset=${datePreset}&access_token=${accessToken}`
        
        const response = await fetch(url)
        const data = await response.json()

        return new Response(
          JSON.stringify({ success: true, metrics: data.data[0] || {} }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error: any) {
    console.error('Meta Ads Tools error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const { code, organizationId, userId } = await req.json()

    if (!code) {
      throw new Error('Authorization code required')
    }

    // Trocar code por access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('META_APP_ID'),
        client_secret: Deno.env.get('META_APP_SECRET'),
        redirect_uri: `${Deno.env.get('APP_URL')}/integrations/callback`,
        code: code
      })
    })

    const tokenData = await tokenResponse.json()
    
    if (!tokenData.access_token) {
      throw new Error('Failed to get access token')
    }

    // Buscar Ad Accounts
    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}`
    )
    const adAccounts = await adAccountsResponse.json()

    // Salvar integração
    const { error } = await supabase
      .from('Integration')
      .upsert({
        organizationId,
        userId,
        platform: 'META_ADS',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        metadata: {
          adAccounts: adAccounts.data,
          scope: tokenData.scope
        },
        isActive: true,
        lastSyncAt: new Date().toISOString()
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, adAccounts: adAccounts.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

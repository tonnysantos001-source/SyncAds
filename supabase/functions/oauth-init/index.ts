import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflightRequest } from '../_utils/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest()
  }

  try {
    const { platform, redirectUrl } = await req.json()
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing auth header')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Configurações OAuth por plataforma
    const oauthConfigs: Record<string, any> = {
      'META': {
        clientId: Deno.env.get('META_CLIENT_ID'),
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        scopes: ['ads_management', 'ads_read', 'pages_read_engagement', 'pages_manage_ads'],
      },
      'FACEBOOK': {
        clientId: Deno.env.get('META_CLIENT_ID'),
        authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
        scopes: ['ads_management', 'ads_read', 'pages_read_engagement', 'pages_manage_ads'],
      },
      'GOOGLE': {
        clientId: Deno.env.get('GOOGLE_CLIENT_ID'),
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        scopes: ['https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/userinfo.email'],
      },
      'LINKEDIN': {
        clientId: Deno.env.get('LINKEDIN_CLIENT_ID'),
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
        scopes: ['r_ads', 'r_ads_reporting', 'rw_ads'],
      },
      'TIKTOK': {
        clientId: Deno.env.get('TIKTOK_CLIENT_ID'),
        authUrl: 'https://business-api.tiktok.com/portal/auth',
        scopes: ['user.info.basic', 'video.list', 'video.upload'],
      },
    }

    const config = oauthConfigs[platform.toUpperCase()]
    if (!config) {
      throw new Error(`Platform ${platform} not supported`)
    }

    if (!config.clientId) {
      throw new Error(`${platform} client ID not configured`)
    }

    // Gerar state único para segurança (previne CSRF)
    const state = crypto.randomUUID()

    // Salvar state no banco para validar depois
    await supabase
      .from('OAuthState')
      .insert({
        id: state,
        userId: user.id,
        platform: platform.toUpperCase(),
        redirectUrl,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
      })

    // Construir URL de autorização
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `${redirectUrl}`,
      scope: config.scopes.join(' '),
      state,
      response_type: 'code',
    })

    const authUrl = `${config.authUrl}?${params.toString()}`

    return new Response(
      JSON.stringify({ authUrl, state }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: any) {
    console.error('OAuth init error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

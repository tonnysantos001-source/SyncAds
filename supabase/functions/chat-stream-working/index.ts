import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflightRequest } from '../_utils/cors.ts'

serve(async (req) => {
  // Handle CORS preflight FIRST
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight OK')
    return handlePreflightRequest()
  }

  try {
    const { message, conversationId } = await req.json()

    // Authenticate user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing auth header' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    // Get user's organization
    const { data: userData, error: userDataError } = await supabase
      .from('User')
      .select('organizationId, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.organizationId) {
      return new Response(JSON.stringify({ error: 'User not associated with an organization' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    // Get organization's AI connection
    const { data: orgAi, error: orgAiError } = await supabase
      .from('OrganizationAiConnection')
      .select(`
        id,
        isDefault,
        customSystemPrompt,
        globalAiConnection:GlobalAiConnection (
          id,
          name,
          provider,
          apiKey,
          baseUrl,
          model,
          maxTokens,
          temperature,
          isActive
        )
      `)
      .eq('organizationId', userData.organizationId)
      .eq('isDefault', true)
      .single()

    if (orgAiError || !orgAi) {
      // Fallback: usar qualquer IA global ativa
      const { data: globalAi } = await supabase
        .from('GlobalAiConnection')
        .select('*')
        .eq('isActive', true)
        .limit(1)
        .single()

      if (!globalAi) {
        return new Response(JSON.stringify({ 
          error: 'No AI configured',
          response: '⚠️ Nenhuma IA configurada. Configure uma IA nas configurações de IA.' 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Use Global AI
      const finalSystemPrompt = 'Você é um assistente de IA inteligente. Responda de forma clara e objetiva.'
      
      // Call OpenAI-compatible API
      const aiResponse = await fetch(globalAi.baseUrl || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${globalAi.apiKey}`
        },
        body: JSON.stringify({
          model: globalAi.model || 'gpt-4',
          messages: [
            { role: 'system', content: finalSystemPrompt },
            { role: 'user', content: message }
          ],
          temperature: globalAi.temperature || 0.7,
          max_tokens: globalAi.maxTokens || 2000
        })
      })

      const aiData = await aiResponse.json()
      const response = aiData.choices?.[0]?.message?.content || 'Sem resposta da IA'

      return new Response(JSON.stringify({ response }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const aiConnection = orgAi.globalAiConnection as any

    if (!aiConnection.isActive) {
      return new Response(JSON.stringify({ 
        error: 'AI not active',
        response: '⚠️ IA não está ativa. Verifique as configurações.' 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const finalSystemPrompt = orgAi.customSystemPrompt || 'Você é um assistente de IA inteligente. Responda de forma clara e objetiva.'

    // Call OpenAI-compatible API
    const baseUrl = aiConnection.baseUrl || 'https://api.openai.com/v1'
    const endpoint = `${baseUrl}/chat/completions`
    
    const aiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConnection.apiKey}`
      },
      body: JSON.stringify({
        model: aiConnection.model || 'gpt-4',
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: message }
        ],
        temperature: aiConnection.temperature || 0.7,
        max_tokens: aiConnection.maxTokens || 2000
      })
    })

    const aiData = await aiResponse.json()
    const response = aiData.choices?.[0]?.message?.content || 'Sem resposta da IA'

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Chat error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})


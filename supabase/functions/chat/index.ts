import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, conversationHistory, systemPrompt } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get user's organization
    const { data: userData, error: userDataError } = await supabase
      .from('User')
      .select('organizationId, role')
      .eq('id', user.id)
      .single()

    if (userDataError || !userData?.organizationId) {
      throw new Error('User not associated with an organization')
    }

    // Get organization's default AI connection
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
      return new Response(
        JSON.stringify({ 
          error: 'No AI configured',
          message: 'Sua organização não tem uma IA configurada. Contate o administrador.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const aiConnection = orgAi.globalAiConnection as any

    if (!aiConnection.isActive) {
      throw new Error('AI connection is not active')
    }

    // Use custom system prompt if available, otherwise use provided one
    const finalSystemPrompt = orgAi.customSystemPrompt || systemPrompt || 'You are a helpful marketing assistant.'

    // Build messages array
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call appropriate AI provider
    let response: string
    let tokensUsed = 0

    if (aiConnection.provider === 'OPENAI') {
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConnection.apiKey}`
        },
        body: JSON.stringify({
          model: aiConnection.model || 'gpt-4-turbo',
          messages: messages,
          temperature: aiConnection.temperature || 0.7,
          max_tokens: aiConnection.maxTokens || 4096
        })
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        throw new Error(`OpenAI API error: ${error}`)
      }

      const data = await openaiResponse.json()
      response = data.choices[0].message.content
      tokensUsed = data.usage.total_tokens

    } else if (aiConnection.provider === 'ANTHROPIC') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiConnection.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiConnection.model || 'claude-3-opus-20240229',
          max_tokens: aiConnection.maxTokens || 4096,
          temperature: aiConnection.temperature || 0.7,
          messages: messages.filter(m => m.role !== 'system'),
          system: finalSystemPrompt
        })
      })

      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      const data = await anthropicResponse.json()
      response = data.content[0].text
      tokensUsed = data.usage.input_tokens + data.usage.output_tokens

    } else if (aiConnection.provider === 'GOOGLE') {
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConnection.model || 'gemini-pro'}:generateContent?key=${aiConnection.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              temperature: aiConnection.temperature || 0.7,
              maxOutputTokens: aiConnection.maxTokens || 4096
            }
          })
        }
      )

      if (!googleResponse.ok) {
        const error = await googleResponse.text()
        throw new Error(`Google API error: ${error}`)
      }

      const data = await googleResponse.json()
      response = data.candidates[0].content.parts[0].text
      tokensUsed = data.usageMetadata.totalTokenCount || 0

    } else {
      throw new Error(`Unsupported AI provider: ${aiConnection.provider}`)
    }

    // Track AI usage (async, don't wait)
    supabase.from('AiUsage').upsert({
      organizationId: userData.organizationId,
      userId: user.id,
      globalAiConnectionId: aiConnection.id,
      messageCount: 1,
      tokensUsed: tokensUsed,
      month: new Date().toISOString().substring(0, 7), // YYYY-MM
      cost: (tokensUsed / 1000) * 0.01 // Estimate: $0.01 per 1K tokens
    }, {
      onConflict: 'organizationId,userId,globalAiConnectionId,month'
    })

    return new Response(
      JSON.stringify({ 
        response,
        tokensUsed,
        provider: aiConnection.provider,
        model: aiConnection.model
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        message: 'Erro ao processar mensagem. Verifique se a IA está configurada corretamente.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflightRequest, jsonResponse, errorResponse } from '../_utils/cors.ts'

const DNS_OVER_HTTPS_URL = 'https://cloudflare-dns.com/dns-query'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest()
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization')!
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return errorResponse('Unauthorized', 401)
    }

    // Get request data
    const { subdomain, domain } = await req.json()

    if (!subdomain || !domain) {
      return errorResponse('subdomain and domain required', 400)
    }

    const fullDomain = `${subdomain}.${domain}`
    const expectedCNAME = `checkout-${domain.replace(/\./g, '-')}.syncads.com.br`

    // Query DNS using DNS-over-HTTPS
    try {
      const dnsResponse = await fetch(
        `${DNS_OVER_HTTPS_URL}?name=${fullDomain}&type=CNAME`,
        {
          headers: {
            'Accept': 'application/dns-json'
          }
        }
      )

      if (!dnsResponse.ok) {
        return jsonResponse({
          verified: false,
          reason: 'DNS lookup failed',
          details: 'Could not query DNS servers'
        })
      }

      const dnsData = await dnsResponse.json()

      // Check if CNAME record exists
      if (!dnsData.Answer || dnsData.Answer.length === 0) {
        return jsonResponse({
          verified: false,
          reason: 'CNAME not found',
          details: 'No CNAME record found for this domain',
          expected: expectedCNAME
        })
      }

      // Check if any of the answers match our expected CNAME
      const cnameFound = dnsData.Answer.some((answer: any) => {
        const value = answer.data?.trim()
        return value && value.includes('syncads.com.br')
      })

      if (!cnameFound) {
        return jsonResponse({
          verified: false,
          reason: 'CNAME does not match',
          details: 'CNAME record does not point to our servers',
          found: dnsData.Answer.map((a: any) => a.data),
          expected: expectedCNAME
        })
      }

      // Update organization
      const { data: userData } = await supabaseClient
        .from('User')
        .select('organizationId')
        .eq('id', user.id)
        .single()

      if (userData?.organizationId) {
        await supabaseClient
          .from('Organization')
          .update({
            domainVerified: true,
            domainVerificationToken: null,
            updatedAt: new Date().toISOString()
          })
          .eq('id', userData.organizationId)
      }

      return jsonResponse({
        verified: true,
        details: 'Domain verified successfully',
        cname: dnsData.Answer.find((a: any) => a.data.includes('syncads.com.br'))?.data
      })

    } catch (dnsError) {
      console.error('DNS verification error:', dnsError)
      return jsonResponse({
        verified: false,
        reason: 'DNS query failed',
        details: 'Could not verify DNS records',
        error: dnsError.message
      })
    }

  } catch (error: any) {
    console.error('Error verifying domain:', error)
    return errorResponse(error.message || 'Internal server error', 500)
  }
})


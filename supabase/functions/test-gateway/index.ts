import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GatewayTestRequest {
  gatewayId: string;
  credentials: {
    apiKey: string;
    secretKey?: string;
    publicKey?: string;
  };
  testMode: boolean;
}

interface GatewayTestResponse {
  success: boolean;
  message: string;
  data?: {
    gatewayName: string;
    testMode: boolean;
    supportedMethods: string[];
    connectionStatus: 'connected' | 'failed';
    testTransaction?: {
      id: string;
      status: string;
      amount: number;
    };
  };
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { gatewayId, credentials, testMode }: GatewayTestRequest = await req.json()

    // Buscar informações do gateway
    const { data: gateway, error: gatewayError } = await supabaseClient
      .from('Gateway')
      .select('*')
      .eq('id', gatewayId)
      .single()

    if (gatewayError || !gateway) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Gateway não encontrado',
          error: gatewayError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Testar conexão baseado no gateway
    const testResult = await testGatewayConnection(gateway, credentials, testMode)

    return new Response(
      JSON.stringify(testResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Gateway test error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Erro interno no teste do gateway',
        error: error.message
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// ============================================================================
// GATEWAY CONNECTION TESTERS
// ============================================================================

async function testGatewayConnection(gateway: any, credentials: any, testMode: boolean): Promise<GatewayTestResponse> {
  const supportedMethods = []
  if (gateway.supportsPix) supportedMethods.push('PIX')
  if (gateway.supportsCreditCard) supportedMethods.push('Cartão de Crédito')
  if (gateway.supportsBoleto) supportedMethods.push('Boleto')
  if (gateway.supportsDebit) supportedMethods.push('Cartão de Débito')

  try {
    switch (gateway.slug) {
      case 'mercado-pago':
        return await testMercadoPago(credentials, testMode, supportedMethods)
      
      case 'pagseguro':
        return await testPagSeguro(credentials, testMode, supportedMethods)
      
      case 'pagarme':
        return await testPagarme(credentials, testMode, supportedMethods)
      
      case 'stripe':
        return await testStripe(credentials, testMode, supportedMethods)
      
      case 'iugu':
        return await testIugu(credentials, testMode, supportedMethods)
      
      case 'asaas':
        return await testAsaas(credentials, testMode, supportedMethods)
      
      case 'picpay':
        return await testPicPay(credentials, testMode, supportedMethods)
      
      case 'paypal':
        return await testPayPal(credentials, testMode, supportedMethods)
      
      default:
        return await testGenericGateway(gateway, credentials, testMode, supportedMethods)
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao testar ${gateway.name}: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// MERCADO PAGO
// ============================================================================

async function testMercadoPago(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://api.mercadopago.com' : 'https://api.mercadopago.com'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.publicKey,
        client_secret: credentials.secretKey
      })
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do Mercado Pago')
    }

    const authData = await authResponse.json()

    // Testar criação de pagamento
    const paymentResponse = await fetch(`${baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_amount: 1.00,
        description: 'Teste de conexão SyncAds',
        payment_method_id: 'pix',
        payer: {
          email: 'test@syncads.com'
        }
      })
    })

    if (!paymentResponse.ok) {
      throw new Error('Erro ao criar pagamento de teste')
    }

    const paymentData = await paymentResponse.json()

    return {
      success: true,
      message: 'Conexão com Mercado Pago estabelecida com sucesso!',
      data: {
        gatewayName: 'Mercado Pago',
        testMode,
        supportedMethods,
        connectionStatus: 'connected',
        testTransaction: {
          id: paymentData.id.toString(),
          status: paymentData.status,
          amount: paymentData.transaction_amount
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Mercado Pago: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// PAGSEGURO
// ============================================================================

async function testPagSeguro(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://ws.sandbox.pagseguro.uol.com.br' : 'https://ws.pagseguro.uol.com.br'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email || 'test@pagseguro.com',
        token: credentials.apiKey
      })
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do PagSeguro')
    }

    const authData = await authResponse.text()
    
    if (!authData.includes('<session>')) {
      throw new Error('Resposta inválida do PagSeguro')
    }

    return {
      success: true,
      message: 'Conexão com PagSeguro estabelecida com sucesso!',
      data: {
        gatewayName: 'PagSeguro',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com PagSeguro: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// PAGAR.ME
// ============================================================================

async function testPagarme(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://api.pagar.me/core/v5' : 'https://api.pagar.me/core/v5'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/customers`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(credentials.apiKey + ':')}`,
        'Content-Type': 'application/json',
      }
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do Pagar.me')
    }

    return {
      success: true,
      message: 'Conexão com Pagar.me estabelecida com sucesso!',
      data: {
        gatewayName: 'Pagar.me',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Pagar.me: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// STRIPE
// ============================================================================

async function testStripe(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = 'https://api.stripe.com/v1'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/charges`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do Stripe')
    }

    return {
      success: true,
      message: 'Conexão com Stripe estabelecida com sucesso!',
      data: {
        gatewayName: 'Stripe',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Stripe: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// IUGU
// ============================================================================

async function testIugu(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://api.iugu.com/v1' : 'https://api.iugu.com/v1'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/customers`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(credentials.apiKey + ':')}`,
        'Content-Type': 'application/json',
      }
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do Iugu')
    }

    return {
      success: true,
      message: 'Conexão com Iugu estabelecida com sucesso!',
      data: {
        gatewayName: 'Iugu',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Iugu: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ASAAS
// ============================================================================

async function testAsaas(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://sandbox.asaas.com/api/v3' : 'https://www.asaas.com/api/v3'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/customers`, {
      method: 'GET',
      headers: {
        'access_token': credentials.apiKey,
        'Content-Type': 'application/json',
      }
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do Asaas')
    }

    return {
      success: true,
      message: 'Conexão com Asaas estabelecida com sucesso!',
      data: {
        gatewayName: 'Asaas',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com Asaas: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// PICPAY
// ============================================================================

async function testPicPay(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://api.picpay.com' : 'https://api.picpay.com'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/public/v1/payments`, {
      method: 'POST',
      headers: {
        'x-picpay-token': credentials.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referenceId: 'test-connection',
        callbackUrl: 'https://syncads.com/callback',
        value: 1.00,
        buyer: {
          firstName: 'Teste',
          lastName: 'SyncAds',
          document: '12345678901',
          email: 'test@syncads.com',
          phone: '11999999999'
        }
      })
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do PicPay')
    }

    return {
      success: true,
      message: 'Conexão com PicPay estabelecida com sucesso!',
      data: {
        gatewayName: 'PicPay',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com PicPay: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// PAYPAL
// ============================================================================

async function testPayPal(credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  try {
    const baseUrl = testMode ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'
    
    // Testar autenticação
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials'
      }),
      // Basic auth com client_id:client_secret
    })

    if (!authResponse.ok) {
      throw new Error('Credenciais inválidas do PayPal')
    }

    return {
      success: true,
      message: 'Conexão com PayPal estabelecida com sucesso!',
      data: {
        gatewayName: 'PayPal',
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao conectar com PayPal: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// GATEWAY GENÉRICO
// ============================================================================

async function testGenericGateway(gateway: any, credentials: any, testMode: boolean, supportedMethods: string[]): Promise<GatewayTestResponse> {
  // Para gateways não implementados, fazer um teste básico
  try {
    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 1000))

    return {
      success: true,
      message: `Gateway ${gateway.name} configurado com sucesso! (Teste simulado)`,
      data: {
        gatewayName: gateway.name,
        testMode,
        supportedMethods,
        connectionStatus: 'connected'
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao testar ${gateway.name}: ${error.message}`,
      error: error.message
    }
  }
}

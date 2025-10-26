import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PaymentRequest {
  orderId: string;
  gatewayId: string;
  paymentMethod: 'CREDIT_CARD' | 'PIX' | 'BOLETO';
  amount: number;
  currency: string;
  customerData: {
    name: string;
    email: string;
    phone?: string;
    document?: string;
  };
  billingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  installments?: number;
  metadata?: Record<string, any>;
}

interface PaymentResponse {
  success: boolean;
  message: string;
  data?: {
    transactionId: string;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';
    paymentUrl?: string;
    pixQrCode?: string;
    pixCopyPaste?: string;
    pixExpiresAt?: string;
    boletoUrl?: string;
    boletoBarcode?: string;
    boletoExpiresAt?: string;
    gatewayFee?: number;
    netAmount?: number;
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

    const paymentRequest: PaymentRequest = await req.json()

    // Buscar configuração do gateway
    const { data: gatewayConfig, error: configError } = await supabaseClient
      .from('GatewayConfig')
      .select('*, Gateway(*)')
      .eq('id', paymentRequest.gatewayId)
      .eq('isActive', true)
      .single()

    if (configError || !gatewayConfig) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Gateway não configurado ou inativo',
          error: configError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Processar pagamento baseado no gateway
    const paymentResult = await processPayment(paymentRequest, gatewayConfig, supabaseClient)

    return new Response(
      JSON.stringify(paymentResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Erro interno no processamento do pagamento',
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
// PAYMENT PROCESSORS
// ============================================================================

async function processPayment(
  request: PaymentRequest, 
  gatewayConfig: any, 
  supabaseClient: any
): Promise<PaymentResponse> {
  try {
    const gateway = gatewayConfig.Gateway
    
    switch (gateway.slug) {
      case 'mercado-pago':
        return await processMercadoPago(request, gatewayConfig, supabaseClient)
      
      case 'pagseguro':
        return await processPagSeguro(request, gatewayConfig, supabaseClient)
      
      case 'pagarme':
        return await processPagarme(request, gatewayConfig, supabaseClient)
      
      case 'stripe':
        return await processStripe(request, gatewayConfig, supabaseClient)
      
      case 'iugu':
        return await processIugu(request, gatewayConfig, supabaseClient)
      
      case 'asaas':
        return await processAsaas(request, gatewayConfig, supabaseClient)
      
      case 'picpay':
        return await processPicPay(request, gatewayConfig, supabaseClient)
      
      default:
        return await processGenericGateway(request, gatewayConfig, supabaseClient)
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao processar pagamento: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// MERCADO PAGO
// ============================================================================

async function processMercadoPago(
  request: PaymentRequest, 
  gatewayConfig: any, 
  supabaseClient: any
): Promise<PaymentResponse> {
  try {
    const credentials = gatewayConfig.credentials
    const baseUrl = gatewayConfig.isTestMode ? 'https://api.mercadopago.com' : 'https://api.mercadopago.com'
    
    // Obter token de acesso
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
      throw new Error('Erro na autenticação do Mercado Pago')
    }

    const authData = await authResponse.json()
    const accessToken = authData.access_token

    // Criar pagamento
    const paymentData = {
      transaction_amount: request.amount,
      description: `Pedido ${request.orderId}`,
      payment_method_id: request.paymentMethod === 'CREDIT_CARD' ? 'master' : 'pix',
      payer: {
        email: request.customerData.email,
        identification: request.customerData.document ? {
          type: 'CPF',
          number: request.customerData.document
        } : undefined
      },
      installments: request.installments || 1,
      external_reference: request.orderId
    }

    const paymentResponse = await fetch(`${baseUrl}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData)
    })

    if (!paymentResponse.ok) {
      const errorData = await paymentResponse.json()
      throw new Error(`Erro ao criar pagamento: ${errorData.message || paymentResponse.statusText}`)
    }

    const payment = await paymentResponse.json()

    // Salvar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('Transaction')
      .insert({
        organizationId: gatewayConfig.organizationId,
        orderId: request.orderId,
        gatewayId: gatewayConfig.gatewayId,
        transactionId: payment.id.toString(),
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        currency: request.currency,
        status: 'PENDING',
        installments: request.installments || 1,
        metadata: {
          mercadoPagoPaymentId: payment.id,
          externalReference: request.orderId,
          ...request.metadata
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return {
      success: true,
      message: 'Pagamento criado com sucesso',
      data: {
        transactionId: payment.id.toString(),
        status: 'PENDING',
        paymentUrl: payment.point_of_interaction?.transaction_data?.ticket_url,
        pixQrCode: payment.point_of_interaction?.transaction_data?.qr_code,
        pixCopyPaste: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        pixExpiresAt: payment.date_of_expiration,
        gatewayFee: gatewayConfig.pixFee || 0,
        netAmount: request.amount - (gatewayConfig.pixFee || 0)
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro no Mercado Pago: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// PAGSEGURO
// ============================================================================

async function processPagSeguro(
  request: PaymentRequest, 
  gatewayConfig: any, 
  supabaseClient: any
): Promise<PaymentResponse> {
  try {
    const credentials = gatewayConfig.credentials
    const baseUrl = gatewayConfig.isTestMode ? 'https://ws.sandbox.pagseguro.uol.com.br' : 'https://ws.pagseguro.uol.com.br'
    
    // Criar sessão
    const sessionResponse = await fetch(`${baseUrl}/v2/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: credentials.email || 'test@pagseguro.com',
        token: credentials.apiKey
      })
    })

    if (!sessionResponse.ok) {
      throw new Error('Erro ao criar sessão no PagSeguro')
    }

    const sessionData = await sessionResponse.text()
    const sessionId = sessionData.match(/<session>(.*?)<\/session>/)?.[1]

    if (!sessionId) {
      throw new Error('Erro ao obter sessão do PagSeguro')
    }

    // Criar pagamento
    const paymentData = new URLSearchParams({
      email: credentials.email || 'test@pagseguro.com',
      token: credentials.apiKey,
      paymentMode: 'default',
      paymentMethod: request.paymentMethod === 'CREDIT_CARD' ? 'creditCard' : 'pix',
      currency: 'BRL',
      itemId1: request.orderId,
      itemDescription1: `Pedido ${request.orderId}`,
      itemAmount1: request.amount.toFixed(2),
      itemQuantity1: '1',
      reference: request.orderId,
      senderName: request.customerData.name,
      senderEmail: request.customerData.email,
      senderPhone: request.customerData.phone || '',
      senderCPF: request.customerData.document || '',
      senderBornDate: '01/01/1990',
      shippingAddressRequired: 'false'
    })

    const paymentResponse = await fetch(`${baseUrl}/v2/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paymentData
    })

    if (!paymentResponse.ok) {
      throw new Error('Erro ao criar pagamento no PagSeguro')
    }

    const payment = await paymentResponse.text()
    const transactionCode = payment.match(/<code>(.*?)<\/code>/)?.[1]

    if (!transactionCode) {
      throw new Error('Erro ao obter código da transação')
    }

    // Salvar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('Transaction')
      .insert({
        organizationId: gatewayConfig.organizationId,
        orderId: request.orderId,
        gatewayId: gatewayConfig.gatewayId,
        transactionId: transactionCode,
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        currency: request.currency,
        status: 'PENDING',
        installments: request.installments || 1,
        metadata: {
          pagseguroTransactionCode: transactionCode,
          sessionId,
          ...request.metadata
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return {
      success: true,
      message: 'Pagamento criado com sucesso no PagSeguro',
      data: {
        transactionId: transactionCode,
        status: 'PENDING',
        paymentUrl: `${baseUrl}/v2/checkout/payment.html?code=${transactionCode}`,
        gatewayFee: gatewayConfig.pixFee || 0,
        netAmount: request.amount - (gatewayConfig.pixFee || 0)
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro no PagSeguro: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// PAGAR.ME
// ============================================================================

async function processPagarme(
  request: PaymentRequest, 
  gatewayConfig: any, 
  supabaseClient: any
): Promise<PaymentResponse> {
  try {
    const credentials = gatewayConfig.credentials
    const baseUrl = gatewayConfig.isTestMode ? 'https://api.pagar.me/core/v5' : 'https://api.pagar.me/core/v5'
    
    // Criar pedido
    const orderData = {
      customer: {
        name: request.customerData.name,
        email: request.customerData.email,
        document: request.customerData.document,
        type: 'individual',
        phones: request.customerData.phone ? [{
          country_code: '55',
          number: request.customerData.phone.replace(/\D/g, ''),
          area_code: request.customerData.phone.replace(/\D/g, '').substring(0, 2)
        }] : []
      },
      items: [{
        amount: Math.round(request.amount * 100), // Pagar.me usa centavos
        description: `Pedido ${request.orderId}`,
        quantity: 1,
        code: request.orderId
      }],
      payments: [{
        payment_method: request.paymentMethod === 'CREDIT_CARD' ? 'credit_card' : 'pix',
        amount: Math.round(request.amount * 100),
        installments: request.installments || 1
      }],
      metadata: {
        orderId: request.orderId,
        ...request.metadata
      }
    }

    const orderResponse = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(credentials.apiKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json()
      throw new Error(`Erro ao criar pedido: ${errorData.message || orderResponse.statusText}`)
    }

    const order = await orderResponse.json()

    // Salvar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('Transaction')
      .insert({
        organizationId: gatewayConfig.organizationId,
        orderId: request.orderId,
        gatewayId: gatewayConfig.gatewayId,
        transactionId: order.id.toString(),
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        currency: request.currency,
        status: 'PENDING',
        installments: request.installments || 1,
        metadata: {
          pagarmeOrderId: order.id,
          ...request.metadata
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return {
      success: true,
      message: 'Pagamento criado com sucesso no Pagar.me',
      data: {
        transactionId: order.id.toString(),
        status: 'PENDING',
        gatewayFee: gatewayConfig.pixFee || 0,
        netAmount: request.amount - (gatewayConfig.pixFee || 0)
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro no Pagar.me: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// STRIPE
// ============================================================================

async function processStripe(
  request: PaymentRequest, 
  gatewayConfig: any, 
  supabaseClient: any
): Promise<PaymentResponse> {
  try {
    const credentials = gatewayConfig.credentials
    const baseUrl = 'https://api.stripe.com/v1'
    
    // Criar payment intent
    const paymentIntentData = new URLSearchParams({
      amount: Math.round(request.amount * 100), // Stripe usa centavos
      currency: request.currency.toLowerCase(),
      payment_method_types: request.paymentMethod === 'CREDIT_CARD' ? 'card' : 'pix',
      metadata: JSON.stringify({
        orderId: request.orderId,
        ...request.metadata
      })
    })

    const paymentIntentResponse = await fetch(`${baseUrl}/payment_intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${credentials.apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: paymentIntentData
    })

    if (!paymentIntentResponse.ok) {
      const errorData = await paymentIntentResponse.json()
      throw new Error(`Erro ao criar payment intent: ${errorData.error?.message || paymentIntentResponse.statusText}`)
    }

    const paymentIntent = await paymentIntentResponse.json()

    // Salvar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('Transaction')
      .insert({
        organizationId: gatewayConfig.organizationId,
        orderId: request.orderId,
        gatewayId: gatewayConfig.gatewayId,
        transactionId: paymentIntent.id,
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        currency: request.currency,
        status: 'PENDING',
        installments: request.installments || 1,
        metadata: {
          stripePaymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          ...request.metadata
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return {
      success: true,
      message: 'Payment intent criado com sucesso no Stripe',
      data: {
        transactionId: paymentIntent.id,
        status: 'PENDING',
        paymentUrl: paymentIntent.next_action?.redirect_to_url?.url,
        gatewayFee: gatewayConfig.creditCardFee || 0,
        netAmount: request.amount - (gatewayConfig.creditCardFee || 0)
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro no Stripe: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// GATEWAY GENÉRICO (Simulado)
// ============================================================================

async function processGenericGateway(
  request: PaymentRequest, 
  gatewayConfig: any, 
  supabaseClient: any
): Promise<PaymentResponse> {
  try {
    // Simular processamento
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Salvar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from('Transaction')
      .insert({
        organizationId: gatewayConfig.organizationId,
        orderId: request.orderId,
        gatewayId: gatewayConfig.gatewayId,
        transactionId,
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        currency: request.currency,
        status: 'PENDING',
        installments: request.installments || 1,
        metadata: {
          simulated: true,
          ...request.metadata
        }
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Erro ao salvar transação:', transactionError)
    }

    return {
      success: true,
      message: `Pagamento simulado criado com sucesso (${gatewayConfig.Gateway.name})`,
      data: {
        transactionId,
        status: 'PENDING',
        gatewayFee: gatewayConfig.pixFee || 0,
        netAmount: request.amount - (gatewayConfig.pixFee || 0)
      }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro no gateway genérico: ${error.message}`,
      error: error.message
    }
  }
}

// Implementações para outros gateways (Iugu, Asaas, PicPay) seguem padrão similar
// ... (código omitido para brevidade)

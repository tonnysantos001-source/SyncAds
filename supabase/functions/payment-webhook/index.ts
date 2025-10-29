// ============================================
// SYNCADS - PAYMENT WEBHOOK EDGE FUNCTION
// ============================================
//
// Recebe notificações de webhooks de gateways de pagamento
// e atualiza o status das transações automaticamente.
//
// Suporte para:
// - Mercado Pago
// - Stripe
// - Asaas
// - PagSeguro
// - PayPal
//
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_utils/cors.ts'

// ===== STRIPE WEBHOOK HANDLER =====

async function handleStripeWebhook(req: Request, supabaseClient: any) {
  try {
    const sig = req.headers.get('stripe-signature')
    if (!sig) {
      throw new Error('Missing Stripe signature')
    }

    // Importar Stripe
    const stripe = await import('https://esm.sh/stripe@14.8.0')
    const stripeClient = new stripe.default(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

    // Verificar assinatura do webhook
    const event = stripeClient.webhooks.constructEvent(body, sig, webhookSecret)

    console.log('Stripe event received:', event.type)

    // Processar evento
    switch (event.type) {
      case 'payment_intent.succeeded':
        await updateTransactionStatus(
          supabaseClient,
          event.data.object.id,
          'approved',
          event.data.object
        )
        break

      case 'payment_intent.payment_failed':
        await updateTransactionStatus(
          supabaseClient,
          event.data.object.id,
          'failed',
          event.data.object
        )
        break

      case 'payment_intent.canceled':
        await updateTransactionStatus(
          supabaseClient,
          event.data.object.id,
          'cancelled',
          event.data.object
        )
        break

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

// ===== MERCADO PAGO WEBHOOK HANDLER =====

async function handleMercadoPagoWebhook(req: Request, supabaseClient: any) {
  try {
    const body = await req.json()
    
    console.log('Mercado Pago notification received:', body)

    // Mercado Pago envia o ID do pagamento no campo 'data.id'
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id

      // Buscar detalhes do pagamento na API do Mercado Pago
      const { data: gatewayConfigs } = await supabaseClient
        .from('GatewayConfig')
        .select('credentials')
        .eq('Gateway.type', 'mercadopago')
        .eq('isActive', true)
        .limit(1)

      if (!gatewayConfigs || gatewayConfigs.length === 0) {
        throw new Error('No active Mercado Pago gateway found')
      }

      const accessToken = gatewayConfigs[0].credentials.accessToken

      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch payment from Mercado Pago')
      }

      const payment = await response.json()

      // Mapear status do Mercado Pago para nosso status
      let status: 'pending' | 'approved' | 'failed' | 'cancelled' = 'pending'
      
      switch (payment.status) {
        case 'approved':
          status = 'approved'
          break
        case 'rejected':
        case 'refunded':
        case 'charged_back':
          status = 'failed'
          break
        case 'cancelled':
          status = 'cancelled'
          break
        default:
          status = 'pending'
      }

      // Atualizar transação
      await updateTransactionStatus(
        supabaseClient,
        payment.id.toString(),
        status,
        payment
      )
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Mercado Pago webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

// ===== ASAAS WEBHOOK HANDLER =====

async function handleAsaasWebhook(req: Request, supabaseClient: any) {
  try {
    const body = await req.json()
    
    console.log('Asaas notification received:', body)

    if (body.event && body.payment?.id) {
      const paymentId = body.payment.id

      // Mapear evento do Asaas para nosso status
      let status: 'pending' | 'approved' | 'failed' | 'cancelled' = 'pending'
      
      switch (body.event) {
        case 'PAYMENT_CONFIRMED':
        case 'PAYMENT_RECEIVED':
          status = 'approved'
          break
        case 'PAYMENT_REFUNDED':
        case 'PAYMENT_DELETED':
          status = 'failed'
          break
        default:
          status = 'pending'
      }

      // Atualizar transação
      await updateTransactionStatus(
        supabaseClient,
        paymentId,
        status,
        body.payment
      )
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Asaas webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

// ===== PAGSEGURO WEBHOOK HANDLER =====

async function handlePagSeguroWebhook(req: Request, supabaseClient: any) {
  try {
    const body = await req.json()
    
    console.log('PagSeguro notification received:', body)

    // TODO: Implementar lógica específica do PagSeguro
    // Docs: https://dev.pagseguro.uol.com.br/reference/notificacao-de-transacao

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('PagSeguro webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

// ===== PAYPAL WEBHOOK HANDLER =====

async function handlePayPalWebhook(req: Request, supabaseClient: any) {
  try {
    const body = await req.json()
    
    console.log('PayPal notification received:', body)

    // TODO: Implementar lógica específica do PayPal
    // Docs: https://developer.paypal.com/docs/api/webhooks/

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('PayPal webhook error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}

// ===== UPDATE TRANSACTION STATUS =====

async function updateTransactionStatus(
  supabaseClient: any,
  gatewayTransactionId: string,
  status: 'pending' | 'approved' | 'failed' | 'cancelled',
  webhookData: any
) {
  try {
    console.log(`Updating transaction ${gatewayTransactionId} to status: ${status}`)

    // Buscar transação
    const { data: transaction, error: findError } = await supabaseClient
      .from('Transaction')
      .select('*')
      .eq('gatewayTransactionId', gatewayTransactionId)
      .single()

    if (findError || !transaction) {
      console.error('Transaction not found:', gatewayTransactionId)
      return
    }

    // Atualizar status
    const { error: updateError } = await supabaseClient
      .from('Transaction')
      .update({
        status,
        updatedAt: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          webhookData,
          lastWebhookAt: new Date().toISOString(),
        },
      })
      .eq('id', transaction.id)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return
    }

    console.log(`✅ Transaction ${transaction.id} updated successfully`)

    // Se aprovado, atualizar status do pedido
    if (status === 'approved' && transaction.orderId) {
      await supabaseClient
        .from('Order')
        .update({
          status: 'paid',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', transaction.orderId)

      console.log(`✅ Order ${transaction.orderId} marked as paid`)

      // TODO: Enviar email de confirmação de pagamento
      // TODO: Disparar webhooks customizados da organização
      // TODO: Atualizar estoque se necessário
    }

    // Se falhou, atualizar status do pedido
    if (status === 'failed' && transaction.orderId) {
      await supabaseClient
        .from('Order')
        .update({
          status: 'payment_failed',
          updatedAt: new Date().toISOString(),
        })
        .eq('id', transaction.orderId)

      console.log(`✅ Order ${transaction.orderId} marked as payment_failed`)

      // TODO: Enviar email de falha de pagamento
    }
  } catch (error) {
    console.error('Error in updateTransactionStatus:', error)
  }
}

// ===== MAIN HANDLER =====

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // Service role para updates sem RLS
    )

    // Detectar gateway pelo path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const gateway = pathParts[pathParts.length - 1] // último segmento do path

    console.log(`Webhook received from gateway: ${gateway}`)

    // Rotear para handler específico
    switch (gateway) {
      case 'stripe':
        return await handleStripeWebhook(req, supabaseClient)
      
      case 'mercadopago':
        return await handleMercadoPagoWebhook(req, supabaseClient)
      
      case 'asaas':
        return await handleAsaasWebhook(req, supabaseClient)
      
      case 'pagseguro':
        return await handlePagSeguroWebhook(req, supabaseClient)
      
      case 'paypal':
        return await handlePayPalWebhook(req, supabaseClient)
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Unknown gateway',
          received: gateway 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        })
    }

  } catch (error: any) {
    console.error('Webhook processing error:', error)
    
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})


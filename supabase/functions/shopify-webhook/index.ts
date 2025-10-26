import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHmac } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
}

interface ShopifyWebhookData {
  id: number;
  order_number: number;
  name: string;
  email?: string;
  phone?: string;
  financial_status: string;
  fulfillment_status?: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  line_items: Array<{
    id: number;
    variant_id: number;
    title: string;
    variant_title?: string;
    sku?: string;
    vendor?: string;
    quantity: number;
    price: string;
    total_discount: string;
    product_id: number;
    requires_shipping: boolean;
    taxable: boolean;
    fulfillment_status?: string;
    properties?: Record<string, any>;
  }>;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
    name?: string;
    province_code?: string;
    country_code?: string;
  };
  billing_address?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
    name?: string;
    province_code?: string;
    country_code?: string;
  };
  customer?: {
    id: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    accepts_marketing: boolean;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verificar assinatura do webhook
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
    const topicHeader = req.headers.get('x-shopify-topic')
    const shopDomain = req.headers.get('x-shopify-shop-domain')
    
    if (!hmacHeader || !topicHeader || !shopDomain) {
      return new Response(
        JSON.stringify({ error: 'Missing required headers' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const body = await req.text()
    
    // Buscar webhook secret
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: integration, error: integrationError } = await supabaseClient
      .from('ShopifyIntegration')
      .select('*')
      .eq('shopName', shopDomain.replace('.myshopify.com', ''))
      .eq('isActive', true)
      .single()

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Shopify integration not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verificar assinatura HMAC
    const webhookSecret = integration.webhookSecret || Deno.env.get('SHOPIFY_WEBHOOK_SECRET')
    if (webhookSecret) {
      const calculatedHmac = await createHmac('sha256', webhookSecret)
        .update(body)
        .toString('base64')

      if (calculatedHmac !== hmacHeader) {
        return new Response(
          JSON.stringify({ error: 'Invalid HMAC signature' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Processar webhook baseado no tópico
    const webhookData = JSON.parse(body) as ShopifyWebhookData
    const result = await processWebhook(topicHeader, webhookData, integration, supabaseClient)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Shopify webhook error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        message: 'Erro interno no processamento do webhook',
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
// WEBHOOK PROCESSORS
// ============================================================================

async function processWebhook(
  topic: string, 
  data: ShopifyWebhookData, 
  integration: any, 
  supabaseClient: any
) {
  try {
    switch (topic) {
      case 'orders/create':
        return await handleOrderCreate(data, integration, supabaseClient)
      
      case 'orders/updated':
        return await handleOrderUpdate(data, integration, supabaseClient)
      
      case 'orders/paid':
        return await handleOrderPaid(data, integration, supabaseClient)
      
      case 'orders/cancelled':
        return await handleOrderCancelled(data, integration, supabaseClient)
      
      case 'orders/fulfilled':
        return await handleOrderFulfilled(data, integration, supabaseClient)
      
      case 'orders/partially_fulfilled':
        return await handleOrderPartiallyFulfilled(data, integration, supabaseClient)
      
      default:
        return {
          success: true,
          message: `Webhook ${topic} recebido mas não processado`,
          data: { topic, orderId: data.id }
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Erro ao processar webhook ${topic}: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ORDER CREATE
// ============================================================================

async function handleOrderCreate(data: ShopifyWebhookData, integration: any, supabaseClient: any) {
  try {
    // Criar pedido no banco local
    const { data: order, error: orderError } = await supabaseClient
      .from('Order')
      .upsert({
        id: data.id.toString(),
        organizationId: integration.organizationId,
        shopifyOrderId: data.id,
        orderNumber: data.order_number,
        name: data.name,
        email: data.email,
        phone: data.phone,
        status: 'PENDING',
        financialStatus: data.financial_status,
        fulfillmentStatus: data.fulfillment_status || 'unfulfilled',
        totalAmount: parseFloat(data.total_price),
        subtotalAmount: parseFloat(data.subtotal_price),
        taxAmount: parseFloat(data.total_tax),
        currency: data.currency,
        customerData: data.customer,
        shippingAddress: data.shipping_address,
        billingAddress: data.billing_address,
        shopifyData: data,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      })
      .select()
      .single()

    if (orderError) {
      console.error('Erro ao criar pedido:', orderError)
    }

    // Criar itens do pedido
    if (data.line_items && data.line_items.length > 0) {
      const orderItems = data.line_items.map(item => ({
        orderId: data.id.toString(),
        organizationId: integration.organizationId,
        shopifyLineItemId: item.id,
        productId: item.product_id.toString(),
        variantId: item.variant_id.toString(),
        title: item.title,
        variantTitle: item.variant_title,
        sku: item.sku,
        vendor: item.vendor,
        quantity: item.quantity,
        price: parseFloat(item.price),
        totalDiscount: parseFloat(item.total_discount),
        requiresShipping: item.requires_shipping,
        taxable: item.taxable,
        fulfillmentStatus: item.fulfillment_status,
        properties: item.properties,
        shopifyData: item
      }))

      const { error: itemsError } = await supabaseClient
        .from('OrderItem')
        .upsert(orderItems)

      if (itemsError) {
        console.error('Erro ao criar itens do pedido:', itemsError)
      }
    }

    // Log do webhook
    await supabaseClient
      .from('WebhookLog')
      .insert({
        organizationId: integration.organizationId,
        source: 'shopify',
        topic,
        data: data,
        processedAt: new Date().toISOString(),
        status: 'success'
      })

    return {
      success: true,
      message: `Pedido ${data.name} criado com sucesso`,
      data: {
        orderId: data.id,
        orderNumber: data.order_number,
        status: data.financial_status,
        totalAmount: data.total_price
      }
    }
  } catch (error) {
    console.error('Erro ao processar criação de pedido:', error)
    
    // Log do erro
    await supabaseClient
      .from('WebhookLog')
      .insert({
        organizationId: integration.organizationId,
        source: 'shopify',
        topic,
        data: data,
        processedAt: new Date().toISOString(),
        status: 'error',
        error: error.message
      })

    return {
      success: false,
      message: `Erro ao criar pedido: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ORDER UPDATE
// ============================================================================

async function handleOrderUpdate(data: ShopifyWebhookData, integration: any, supabaseClient: any) {
  try {
    // Atualizar pedido existente
    const { error: updateError } = await supabaseClient
      .from('Order')
      .update({
        status: 'UPDATED',
        financialStatus: data.financial_status,
        fulfillmentStatus: data.fulfillment_status || 'unfulfilled',
        totalAmount: parseFloat(data.total_price),
        subtotalAmount: parseFloat(data.subtotal_price),
        taxAmount: parseFloat(data.total_tax),
        customerData: data.customer,
        shippingAddress: data.shipping_address,
        billingAddress: data.billing_address,
        shopifyData: data,
        updatedAt: data.updated_at
      })
      .eq('shopifyOrderId', data.id)

    if (updateError) {
      console.error('Erro ao atualizar pedido:', updateError)
    }

    // Log do webhook
    await supabaseClient
      .from('WebhookLog')
      .insert({
        organizationId: integration.organizationId,
        source: 'shopify',
        topic,
        data: data,
        processedAt: new Date().toISOString(),
        status: 'success'
      })

    return {
      success: true,
      message: `Pedido ${data.name} atualizado com sucesso`,
      data: {
        orderId: data.id,
        orderNumber: data.order_number,
        status: data.financial_status
      }
    }
  } catch (error) {
    console.error('Erro ao processar atualização de pedido:', error)
    return {
      success: false,
      message: `Erro ao atualizar pedido: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ORDER PAID
// ============================================================================

async function handleOrderPaid(data: ShopifyWebhookData, integration: any, supabaseClient: any) {
  try {
    // Atualizar status do pedido para pago
    const { error: updateError } = await supabaseClient
      .from('Order')
      .update({
        status: 'PAID',
        financialStatus: 'paid',
        paidAt: new Date().toISOString(),
        updatedAt: data.updated_at
      })
      .eq('shopifyOrderId', data.id)

    if (updateError) {
      console.error('Erro ao atualizar pedido pago:', updateError)
    }

    // Atualizar transações relacionadas
    const { error: transactionError } = await supabaseClient
      .from('Transaction')
      .update({
        status: 'PAID',
        paidAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('orderId', data.id.toString())

    if (transactionError) {
      console.error('Erro ao atualizar transação:', transactionError)
    }

    // Log do webhook
    await supabaseClient
      .from('WebhookLog')
      .insert({
        organizationId: integration.organizationId,
        source: 'shopify',
        topic,
        data: data,
        processedAt: new Date().toISOString(),
        status: 'success'
      })

    return {
      success: true,
      message: `Pedido ${data.name} marcado como pago`,
      data: {
        orderId: data.id,
        orderNumber: data.order_number,
        totalAmount: data.total_price
      }
    }
  } catch (error) {
    console.error('Erro ao processar pagamento de pedido:', error)
    return {
      success: false,
      message: `Erro ao processar pagamento: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ORDER CANCELLED
// ============================================================================

async function handleOrderCancelled(data: ShopifyWebhookData, integration: any, supabaseClient: any) {
  try {
    // Atualizar status do pedido para cancelado
    const { error: updateError } = await supabaseClient
      .from('Order')
      .update({
        status: 'CANCELLED',
        financialStatus: 'voided',
        cancelledAt: new Date().toISOString(),
        updatedAt: data.updated_at
      })
      .eq('shopifyOrderId', data.id)

    if (updateError) {
      console.error('Erro ao cancelar pedido:', updateError)
    }

    // Cancelar transações relacionadas
    const { error: transactionError } = await supabaseClient
      .from('Transaction')
      .update({
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('orderId', data.id.toString())

    if (transactionError) {
      console.error('Erro ao cancelar transação:', transactionError)
    }

    return {
      success: true,
      message: `Pedido ${data.name} cancelado`,
      data: {
        orderId: data.id,
        orderNumber: data.order_number
      }
    }
  } catch (error) {
    console.error('Erro ao processar cancelamento de pedido:', error)
    return {
      success: false,
      message: `Erro ao cancelar pedido: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ORDER FULFILLED
// ============================================================================

async function handleOrderFulfilled(data: ShopifyWebhookData, integration: any, supabaseClient: any) {
  try {
    // Atualizar status de fulfillment
    const { error: updateError } = await supabaseClient
      .from('Order')
      .update({
        fulfillmentStatus: 'fulfilled',
        fulfilledAt: new Date().toISOString(),
        updatedAt: data.updated_at
      })
      .eq('shopifyOrderId', data.id)

    if (updateError) {
      console.error('Erro ao atualizar fulfillment:', updateError)
    }

    return {
      success: true,
      message: `Pedido ${data.name} marcado como enviado`,
      data: {
        orderId: data.id,
        orderNumber: data.order_number
      }
    }
  } catch (error) {
    console.error('Erro ao processar fulfillment:', error)
    return {
      success: false,
      message: `Erro ao processar envio: ${error.message}`,
      error: error.message
    }
  }
}

// ============================================================================
// ORDER PARTIALLY FULFILLED
// ============================================================================

async function handleOrderPartiallyFulfilled(data: ShopifyWebhookData, integration: any, supabaseClient: any) {
  try {
    // Atualizar status de fulfillment parcial
    const { error: updateError } = await supabaseClient
      .from('Order')
      .update({
        fulfillmentStatus: 'partial',
        updatedAt: data.updated_at
      })
      .eq('shopifyOrderId', data.id)

    if (updateError) {
      console.error('Erro ao atualizar fulfillment parcial:', updateError)
    }

    return {
      success: true,
      message: `Pedido ${data.name} parcialmente enviado`,
      data: {
        orderId: data.id,
        orderNumber: data.order_number
      }
    }
  } catch (error) {
    console.error('Erro ao processar fulfillment parcial:', error)
    return {
      success: false,
      message: `Erro ao processar envio parcial: ${error.message}`,
      error: error.message
    }
  }
}

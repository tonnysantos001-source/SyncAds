import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface ShopifyIntegration {
  id: string;
  organizationId: string;
  shopName: string;
  accessToken: string;
  webhookSecret?: string;
  isActive: boolean;
  isTestMode: boolean;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  description?: string;
  vendor?: string;
  productType?: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyVariant {
  id: number;
  productId: number;
  title: string;
  price: string;
  compareAtPrice?: string;
  sku?: string;
  barcode?: string;
  inventoryQuantity: number;
  weight?: number;
  weightUnit?: string;
  requiresShipping: boolean;
  taxable: boolean;
  position: number;
  option1?: string;
  option2?: string;
  option3?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyImage {
  id: number;
  productId: number;
  position: number;
  alt?: string;
  width: number;
  height: number;
  src: string;
  variantIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyOption {
  id: number;
  productId: number;
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyOrder {
  id: number;
  orderNumber: number;
  name: string;
  email?: string;
  phone?: string;
  financialStatus: 'pending' | 'authorized' | 'partially_paid' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillmentStatus?: 'fulfilled' | 'null' | 'partial' | 'restocked';
  totalPrice: string;
  subtotalPrice: string;
  totalTax: string;
  currency: string;
  lineItems: ShopifyLineItem[];
  shippingAddress?: ShopifyAddress;
  billingAddress?: ShopifyAddress;
  customer?: ShopifyCustomer;
  createdAt: string;
  updatedAt: string;
}

export interface ShopifyLineItem {
  id: number;
  variantId: number;
  title: string;
  variantTitle?: string;
  sku?: string;
  vendor?: string;
  quantity: number;
  price: string;
  totalDiscount: string;
  productId: number;
  requiresShipping: boolean;
  taxable: boolean;
  fulfillmentStatus?: string;
  properties?: Record<string, any>;
}

export interface ShopifyAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1?: string;
  address2?: string;
  city?: string;
  province?: string;
  country?: string;
  zip?: string;
  phone?: string;
  name?: string;
  provinceCode?: string;
  countryCode?: string;
}

export interface ShopifyCustomer {
  id: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptsMarketing: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SHOPIFY INTEGRATION API
// ============================================

export const shopifyIntegrationApi = {
  // Conectar com Shopify
  async connect(shopName: string, accessToken: string, isTestMode: boolean = true) {
    try {
      // Testar conexão primeiro
      const testResult = await this.testConnection(shopName, accessToken);
      if (!testResult.success) {
        throw new Error(testResult.message);
      }

      // Salvar integração
      const { data, error } = await supabase
        .from('ShopifyIntegration')
        .upsert({
          organizationId: (await supabase.auth.getUser()).data.user?.user_metadata?.organizationId,
          shopName,
          accessToken,
          isActive: true,
          isTestMode,
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as ShopifyIntegration;
    } catch (error) {
      console.error('Error connecting to Shopify:', error);
      throw error;
    }
  },

  // Testar conexão
  async testConnection(shopName: string, accessToken: string) {
    try {
      const shopUrl = `https://${shopName}.myshopify.com`;
      const response = await fetch(`${shopUrl}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const shopData = await response.json();
      return {
        success: true,
        message: `Conectado com sucesso à loja ${shopData.shop.name}`,
        data: {
          shopName: shopData.shop.name,
          domain: shopData.shop.domain,
          currency: shopData.shop.currency,
          timezone: shopData.shop.timezone
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Erro ao conectar com Shopify: ${error.message}`
      };
    }
  },

  // Buscar integração ativa
  async getActiveIntegration() {
    try {
      const { data, error } = await supabase
        .from('ShopifyIntegration')
        .select('*')
        .eq('isActive', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as ShopifyIntegration | null;
    } catch (error) {
      console.error('Error getting active Shopify integration:', error);
      throw error;
    }
  },

  // Desconectar Shopify
  async disconnect() {
    try {
      const { error } = await supabase
        .from('ShopifyIntegration')
        .update({ 
          isActive: false,
          updatedAt: new Date().toISOString()
        })
        .eq('isActive', true);

      if (error) throw error;
    } catch (error) {
      console.error('Error disconnecting Shopify:', error);
      throw error;
    }
  },

  // Sincronizar produtos
  async syncProducts() {
    try {
      const integration = await this.getActiveIntegration();
      if (!integration) {
        throw new Error('Nenhuma integração Shopify ativa encontrada');
      }

      const shopUrl = `https://${integration.shopName}.myshopify.com`;
      const products = [];

      // Buscar produtos em lotes
      let nextPageInfo = null;
      do {
        const url = nextPageInfo 
          ? `${shopUrl}/admin/api/2023-10/products.json?limit=250&page_info=${nextPageInfo}`
          : `${shopUrl}/admin/api/2023-10/products.json?limit=250`;

        const response = await fetch(url, {
          headers: {
            'X-Shopify-Access-Token': integration.accessToken,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro ao buscar produtos: ${response.statusText}`);
        }

        const data = await response.json();
        products.push(...data.products);

        // Verificar se há próxima página
        const linkHeader = response.headers.get('Link');
        nextPageInfo = null;
        if (linkHeader) {
          const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)/);
          if (nextMatch) {
            nextPageInfo = nextMatch[1];
          }
        }
      } while (nextPageInfo);

      // Salvar produtos no banco
      const { error } = await supabase
        .from('ShopifyProduct')
        .upsert(
          products.map(product => ({
            id: product.id,
            organizationId: integration.organizationId,
            title: product.title,
            handle: product.handle,
            description: product.body_html,
            vendor: product.vendor,
            productType: product.product_type,
            tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
            status: product.status,
            shopifyData: product,
            createdAt: product.created_at,
            updatedAt: product.updated_at
          })),
          { onConflict: 'id,organizationId' }
        );

      if (error) throw error;

      // Atualizar timestamp da última sincronização
      await supabase
        .from('ShopifyIntegration')
        .update({ 
          lastSyncAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .eq('id', integration.id);

      return {
        success: true,
        message: `${products.length} produtos sincronizados com sucesso`,
        data: {
          productCount: products.length,
          lastSyncAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error syncing Shopify products:', error);
      throw error;
    }
  },

  // Buscar produtos sincronizados
  async getProducts(filters?: {
    status?: string;
    vendor?: string;
    productType?: string;
    search?: string;
  }) {
    try {
      let query = supabase
        .from('ShopifyProduct')
        .select('*')
        .order('updatedAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.vendor) {
        query = query.eq('vendor', filters.vendor);
      }

      if (filters?.productType) {
        query = query.eq('productType', filters.productType);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,handle.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ShopifyProduct[];
    } catch (error) {
      console.error('Error getting Shopify products:', error);
      throw error;
    }
  },

  // Criar pedido no Shopify
  async createOrder(orderData: {
    lineItems: Array<{
      variantId: number;
      quantity: number;
    }>;
    customer?: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
    };
    shippingAddress?: ShopifyAddress;
    billingAddress?: ShopifyAddress;
    note?: string;
    tags?: string[];
  }) {
    try {
      const integration = await this.getActiveIntegration();
      if (!integration) {
        throw new Error('Nenhuma integração Shopify ativa encontrada');
      }

      const shopUrl = `https://${integration.shopName}.myshopify.com`;
      
      const orderPayload = {
        order: {
          line_items: orderData.lineItems,
          customer: orderData.customer,
          shipping_address: orderData.shippingAddress,
          billing_address: orderData.billingAddress,
          note: orderData.note,
          tags: orderData.tags?.join(', '),
          financial_status: 'pending',
          send_receipt: true,
          send_fulfillment_receipt: false
        }
      };

      const response = await fetch(`${shopUrl}/admin/api/2023-10/orders.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro ao criar pedido: ${errorData.errors || response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: 'Pedido criado com sucesso no Shopify',
        data: data.order
      };
    } catch (error) {
      console.error('Error creating Shopify order:', error);
      throw error;
    }
  },

  // Buscar pedidos
  async getOrders(filters?: {
    status?: string;
    financialStatus?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }) {
    try {
      const integration = await this.getActiveIntegration();
      if (!integration) {
        throw new Error('Nenhuma integração Shopify ativa encontrada');
      }

      const shopUrl = `https://${integration.shopName}.myshopify.com`;
      let url = `${shopUrl}/admin/api/2023-10/orders.json?limit=${filters?.limit || 50}`;

      if (filters?.status) {
        url += `&status=${filters.status}`;
      }

      if (filters?.financialStatus) {
        url += `&financial_status=${filters.financialStatus}`;
      }

      if (filters?.startDate) {
        url += `&created_at_min=${filters.startDate}`;
      }

      if (filters?.endDate) {
        url += `&created_at_max=${filters.endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': integration.accessToken,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar pedidos: ${response.statusText}`);
      }

      const data = await response.json();
      return data.orders as ShopifyOrder[];
    } catch (error) {
      console.error('Error getting Shopify orders:', error);
      throw error;
    }
  },

  // Configurar webhooks
  async setupWebhooks() {
    try {
      const integration = await this.getActiveIntegration();
      if (!integration) {
        throw new Error('Nenhuma integração Shopify ativa encontrada');
      }

      const shopUrl = `https://${integration.shopName}.myshopify.com`;
      const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/shopify-webhook`;

      const webhooks = [
        {
          topic: 'orders/create',
          address: webhookUrl,
          format: 'json'
        },
        {
          topic: 'orders/updated',
          address: webhookUrl,
          format: 'json'
        },
        {
          topic: 'orders/paid',
          address: webhookUrl,
          format: 'json'
        },
        {
          topic: 'orders/cancelled',
          address: webhookUrl,
          format: 'json'
        }
      ];

      const results = [];
      for (const webhook of webhooks) {
        try {
          const response = await fetch(`${shopUrl}/admin/api/2023-10/webhooks.json`, {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': integration.accessToken,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ webhook })
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              topic: webhook.topic,
              success: true,
              webhookId: data.webhook.id
            });
          } else {
            results.push({
              topic: webhook.topic,
              success: false,
              error: response.statusText
            });
          }
        } catch (error) {
          results.push({
            topic: webhook.topic,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: true,
        message: 'Webhooks configurados',
        data: results
      };
    } catch (error) {
      console.error('Error setting up Shopify webhooks:', error);
      throw error;
    }
  }
};

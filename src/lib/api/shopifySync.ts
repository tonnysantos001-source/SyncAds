import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

interface ShopifyProduct {
  id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  handle: string;
  status: string;
  published_at: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
  tags: string;
}

interface ShopifyVariant {
  id: string;
  product_id: string;
  title: string;
  price: string;
  compare_at_price: string | null;
  sku: string;
  barcode: string | null;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
  image_id: string | null;
}

interface ShopifyImage {
  id: string;
  product_id: string;
  src: string;
  alt: string | null;
  position: number;
}

interface ShopifyOption {
  id: string;
  product_id: string;
  name: string;
  position: number;
  values: string[];
}

interface ShopifyOrder {
  id: string;
  order_number: number;
  email: string;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  currency: string;
  customer: ShopifyCustomer;
  line_items: ShopifyLineItem[];
  shipping_address: ShopifyAddress;
  billing_address: ShopifyAddress;
  payment_gateway_names: string[];
}

interface ShopifyCustomer {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  total_spent: string;
  orders_count: number;
}

interface ShopifyLineItem {
  id: string;
  product_id: string;
  variant_id: string;
  title: string;
  variant_title: string;
  quantity: number;
  price: string;
  sku: string;
  name: string;
}

interface ShopifyAddress {
  first_name: string;
  last_name: string;
  address1: string;
  address2: string | null;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone: string | null;
}

interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  errors: number;
  details?: any[];
}

// ============================================
// SHOPIFY SYNC API
// ============================================

export const shopifySyncApi = {
  /**
   * Busca integração Shopify ativa do usuário
   */
  async getShopifyIntegration(userId: string) {
    try {
      const { data, error } = await supabase
        .from('Integration')
        .select('*')
        .eq('userId', userId)
        .eq('type', 'SHOPIFY')
        .eq('status', 'CONNECTED')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting Shopify integration:', error);
      return null;
    }
  },

  /**
   * Sincroniza produtos da Shopify
   */
  async syncProducts(userId: string, organizationId: string): Promise<SyncResult> {
    try {
      // Buscar integração Shopify
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message: 'Integração Shopify não encontrada ou desconectada',
          synced: 0,
          errors: 1,
        };
      }

      // Chamar Edge Function para buscar produtos
      const { data: shopifyData, error: fetchError } = await supabase.functions.invoke(
        'shopify-sync',
        {
          body: {
            action: 'fetch_products',
            integrationId: integration.id,
            accessToken: integration.accessToken,
            shopDomain: integration.config?.shop,
          },
        }
      );

      if (fetchError) throw fetchError;

      const products = shopifyData?.products || [];
      let synced = 0;
      let errors = 0;
      const details: any[] = [];

      // Sincronizar cada produto
      for (const shopifyProduct of products) {
        try {
          // Verificar se produto já existe
          const { data: existingProduct } = await supabase
            .from('Product')
            .select('id')
            .eq('userId', userId)
            .eq('metadata->>shopifyId', shopifyProduct.id)
            .single();

          const productData = {
            userId,
            organizationId,
            name: shopifyProduct.title,
            slug: shopifyProduct.handle,
            description: shopifyProduct.body_html?.replace(/<[^>]*>/g, '') || '',
            price: parseFloat(shopifyProduct.variants[0]?.price || '0'),
            comparePrice: shopifyProduct.variants[0]?.compare_at_price
              ? parseFloat(shopifyProduct.variants[0].compare_at_price)
              : null,
            sku: shopifyProduct.variants[0]?.sku || '',
            barcode: shopifyProduct.variants[0]?.barcode || '',
            stock: shopifyProduct.variants[0]?.inventory_quantity || 0,
            lowStockThreshold: 5,
            trackStock: true,
            status: shopifyProduct.status === 'active' ? 'ACTIVE' : 'DRAFT',
            isFeatured: false,
            isActive: shopifyProduct.status === 'active',
            tags: shopifyProduct.tags ? shopifyProduct.tags.split(',').map((t: string) => t.trim()) : [],
            metadata: {
              shopifyId: shopifyProduct.id,
              shopifyHandle: shopifyProduct.handle,
              vendor: shopifyProduct.vendor,
              productType: shopifyProduct.product_type,
              syncedAt: new Date().toISOString(),
            },
          };

          if (existingProduct) {
            // Atualizar produto existente
            const { error: updateError } = await supabase
              .from('Product')
              .update({
                ...productData,
                updatedAt: new Date().toISOString(),
              })
              .eq('id', existingProduct.id);

            if (updateError) throw updateError;
          } else {
            // Criar novo produto
            const { data: newProduct, error: insertError } = await supabase
              .from('Product')
              .insert(productData)
              .select()
              .single();

            if (insertError) throw insertError;

            // Sincronizar imagens
            if (shopifyProduct.images && shopifyProduct.images.length > 0) {
              const images = shopifyProduct.images.map((img: ShopifyImage, index: number) => ({
                productId: newProduct.id,
                url: img.src,
                altText: img.alt || shopifyProduct.title,
                position: index,
              }));

              await supabase.from('ProductImage').insert(images);
            }

            // Sincronizar variantes (se houver mais de uma)
            if (shopifyProduct.variants && shopifyProduct.variants.length > 1) {
              const variants = shopifyProduct.variants.map((variant: ShopifyVariant) => ({
                productId: newProduct.id,
                name: variant.title,
                sku: variant.sku,
                barcode: variant.barcode,
                price: parseFloat(variant.price),
                comparePrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
                stock: variant.inventory_quantity,
                trackStock: true,
                isDefault: false,
                metadata: {
                  shopifyVariantId: variant.id,
                },
              }));

              await supabase.from('ProductVariant').insert(variants);
            }
          }

          synced++;
          details.push({
            name: shopifyProduct.title,
            status: 'synced',
          });
        } catch (error: any) {
          errors++;
          details.push({
            name: shopifyProduct.title,
            status: 'error',
            error: error.message,
          });
          console.error(`Error syncing product ${shopifyProduct.title}:`, error);
        }
      }

      return {
        success: true,
        message: `Sincronização concluída: ${synced} produtos sincronizados, ${errors} erros`,
        synced,
        errors,
        details,
      };
    } catch (error: any) {
      console.error('Error in syncProducts:', error);
      return {
        success: false,
        message: error.message || 'Erro ao sincronizar produtos',
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Sincroniza pedidos da Shopify
   */
  async syncOrders(userId: string, organizationId: string): Promise<SyncResult> {
    try {
      // Buscar integração Shopify
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message: 'Integração Shopify não encontrada ou desconectada',
          synced: 0,
          errors: 1,
        };
      }

      // Chamar Edge Function para buscar pedidos
      const { data: shopifyData, error: fetchError } = await supabase.functions.invoke(
        'shopify-sync',
        {
          body: {
            action: 'fetch_orders',
            integrationId: integration.id,
            accessToken: integration.accessToken,
            shopDomain: integration.config?.shop,
            limit: 250, // Últimos 250 pedidos
          },
        }
      );

      if (fetchError) throw fetchError;

      const orders = shopifyData?.orders || [];
      let synced = 0;
      let errors = 0;
      const details: any[] = [];

      // Sincronizar cada pedido
      for (const shopifyOrder of orders) {
        try {
          // Verificar se pedido já existe
          const { data: existingOrder } = await supabase
            .from('Order')
            .select('id')
            .eq('userId', userId)
            .eq('metadata->>shopifyOrderId', shopifyOrder.id)
            .single();

          if (existingOrder) {
            // Atualizar status do pedido existente
            const { error: updateError } = await supabase
              .from('Order')
              .update({
                paymentStatus: this.mapShopifyPaymentStatus(shopifyOrder.financial_status),
                status: this.mapShopifyFulfillmentStatus(shopifyOrder.fulfillment_status),
                updatedAt: new Date().toISOString(),
              })
              .eq('id', existingOrder.id);

            if (updateError) throw updateError;
            synced++;
            continue;
          }

          // Buscar ou criar cliente
          let customerId = null;
          if (shopifyOrder.customer) {
            const { data: existingCustomer } = await supabase
              .from('Customer')
              .select('id')
              .eq('email', shopifyOrder.customer.email)
              .eq('userId', userId)
              .single();

            if (existingCustomer) {
              customerId = existingCustomer.id;
            } else {
              const { data: newCustomer, error: customerError } = await supabase
                .from('Customer')
                .insert({
                  userId,
                  organizationId,
                  email: shopifyOrder.customer.email,
                  name: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim(),
                  phone: shopifyOrder.customer.phone,
                  metadata: {
                    shopifyCustomerId: shopifyOrder.customer.id,
                  },
                })
                .select()
                .single();

              if (customerError) throw customerError;
              customerId = newCustomer.id;
            }
          }

          // Criar pedido
          const orderData = {
            userId,
            organizationId,
            customerId,
            orderNumber: `SHOP-${shopifyOrder.order_number}`,
            customerEmail: shopifyOrder.email,
            customerName: shopifyOrder.customer
              ? `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`.trim()
              : null,
            shippingAddress: shopifyOrder.shipping_address
              ? {
                  name: `${shopifyOrder.shipping_address.first_name} ${shopifyOrder.shipping_address.last_name}`.trim(),
                  street: shopifyOrder.shipping_address.address1,
                  complement: shopifyOrder.shipping_address.address2,
                  city: shopifyOrder.shipping_address.city,
                  state: shopifyOrder.shipping_address.province,
                  zipCode: shopifyOrder.shipping_address.zip,
                  country: shopifyOrder.shipping_address.country,
                  phone: shopifyOrder.shipping_address.phone,
                }
              : null,
            billingAddress: shopifyOrder.billing_address
              ? {
                  name: `${shopifyOrder.billing_address.first_name} ${shopifyOrder.billing_address.last_name}`.trim(),
                  street: shopifyOrder.billing_address.address1,
                  complement: shopifyOrder.billing_address.address2,
                  city: shopifyOrder.billing_address.city,
                  state: shopifyOrder.billing_address.province,
                  zipCode: shopifyOrder.billing_address.zip,
                  country: shopifyOrder.billing_address.country,
                  phone: shopifyOrder.billing_address.phone,
                }
              : null,
            items: shopifyOrder.line_items.map((item: ShopifyLineItem) => ({
              name: item.title,
              variantTitle: item.variant_title,
              quantity: item.quantity,
              price: parseFloat(item.price),
              sku: item.sku,
            })),
            subtotal: parseFloat(shopifyOrder.subtotal_price),
            tax: parseFloat(shopifyOrder.total_tax),
            discount: parseFloat(shopifyOrder.total_discounts),
            total: parseFloat(shopifyOrder.total_price),
            currency: shopifyOrder.currency,
            paymentMethod: shopifyOrder.payment_gateway_names?.[0] || 'Shopify',
            paymentStatus: this.mapShopifyPaymentStatus(shopifyOrder.financial_status),
            status: this.mapShopifyFulfillmentStatus(shopifyOrder.fulfillment_status),
            metadata: {
              shopifyOrderId: shopifyOrder.id,
              shopifyOrderNumber: shopifyOrder.order_number,
              financialStatus: shopifyOrder.financial_status,
              fulfillmentStatus: shopifyOrder.fulfillment_status,
              syncedAt: new Date().toISOString(),
            },
            createdAt: shopifyOrder.created_at,
          };

          const { error: insertError } = await supabase
            .from('Order')
            .insert(orderData);

          if (insertError) throw insertError;

          synced++;
          details.push({
            orderNumber: shopifyOrder.order_number,
            status: 'synced',
          });
        } catch (error: any) {
          errors++;
          details.push({
            orderNumber: shopifyOrder.order_number,
            status: 'error',
            error: error.message,
          });
          console.error(`Error syncing order ${shopifyOrder.order_number}:`, error);
        }
      }

      return {
        success: true,
        message: `Sincronização concluída: ${synced} pedidos sincronizados, ${errors} erros`,
        synced,
        errors,
        details,
      };
    } catch (error: any) {
      console.error('Error in syncOrders:', error);
      return {
        success: false,
        message: error.message || 'Erro ao sincronizar pedidos',
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Sincroniza tudo (produtos + pedidos)
   */
  async syncAll(userId: string, organizationId: string) {
    const productsResult = await this.syncProducts(userId, organizationId);
    const ordersResult = await this.syncOrders(userId, organizationId);

    return {
      products: productsResult,
      orders: ordersResult,
      success: productsResult.success && ordersResult.success,
    };
  },

  /**
   * Mapeia status de pagamento da Shopify para o sistema
   */
  mapShopifyPaymentStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDING',
      'authorized': 'PENDING',
      'partially_paid': 'PENDING',
      'paid': 'PAID',
      'partially_refunded': 'REFUNDED',
      'refunded': 'REFUNDED',
      'voided': 'FAILED',
    };

    return statusMap[status] || 'PENDING';
  },

  /**
   * Mapeia status de fulfillment da Shopify para o sistema
   */
  mapShopifyFulfillmentStatus(status: string | null): string {
    if (!status) return 'PENDING';

    const statusMap: Record<string, string> = {
      'fulfilled': 'DELIVERED',
      'partial': 'PROCESSING',
      'restocked': 'CANCELLED',
    };

    return statusMap[status] || 'PROCESSING';
  },

  /**
   * Busca estatísticas de sincronização
   */
  async getSyncStats(userId: string) {
    try {
      const { data: products } = await supabase
        .from('Product')
        .select('id, metadata')
        .eq('userId', userId)
        .not('metadata->>shopifyId', 'is', null);

      const { data: orders } = await supabase
        .from('Order')
        .select('id, metadata')
        .eq('userId', userId)
        .not('metadata->>shopifyOrderId', 'is', null);

      return {
        totalProducts: products?.length || 0,
        totalOrders: orders?.length || 0,
        lastSync: products?.[0]?.metadata?.syncedAt || null,
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return {
        totalProducts: 0,
        totalOrders: 0,
        lastSync: null,
      };
    }
  },
};

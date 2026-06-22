import { BaseIntegrationProvider } from './base';
import { shopifyIntegrationApi } from '@/lib/api/shopifyIntegrationApi';
import { shopifySync } from '@/lib/api/shopifySync';

export class ShopifyProvider extends BaseIntegrationProvider {
  slug = 'shopify';
  name = 'Shopify';

  async connect(userId: string, credentials?: any): Promise<any> {
    if (!credentials) throw new Error('Credentials are required to connect Shopify');
    const { shopDomain, accessToken, apiKey, apiSecret } = credentials;
    return await shopifyIntegrationApi.connect(shopDomain, accessToken, apiKey, apiSecret);
  }

  async disconnect(userId: string): Promise<void> {
    await shopifyIntegrationApi.disconnect();
  }

  async validate(credentials: any): Promise<boolean> {
    return !!(credentials?.shopDomain && credentials?.accessToken);
  }

  async sync(userId: string): Promise<any> {
    const productsResult = await shopifySync.syncProducts(userId);
    const ordersResult = await shopifySync.syncOrders(userId);
    return { products: productsResult, orders: ordersResult };
  }

  async healthCheck(userId: string): Promise<boolean> {
    const integration = await shopifySync.getShopifyIntegration(userId);
    return !!integration && integration.isActive;
  }
}

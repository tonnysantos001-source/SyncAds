import { BaseIntegrationProvider } from './base';
import { woocommerceIntegrationApi } from '@/lib/api/woocommerceIntegrationApi';

export class WooCommerceProvider extends BaseIntegrationProvider {
  slug = 'woocommerce';
  name = 'WooCommerce';

  async connect(userId: string, credentials?: any): Promise<any> {
    if (!credentials) throw new Error('Credentials are required to connect WooCommerce');
    const { siteUrl, consumerKey, consumerSecret } = credentials;
    return await woocommerceIntegrationApi.connect(siteUrl, consumerKey, consumerSecret);
  }

  async disconnect(userId: string): Promise<void> {
    await woocommerceIntegrationApi.disconnect();
  }

  async validate(credentials: any): Promise<boolean> {
    return !!(credentials?.siteUrl && credentials?.consumerKey && credentials?.consumerSecret);
  }

  async sync(userId: string): Promise<any> {
    return await woocommerceIntegrationApi.sync();
  }

  async healthCheck(userId: string): Promise<boolean> {
    const integration = await woocommerceIntegrationApi.getStatus();
    return !!integration && integration.isActive;
  }
}

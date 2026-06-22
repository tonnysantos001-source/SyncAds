import { IntegrationProvider } from './types';
import { ShopifyProvider } from './providers/shopify';
import { WooCommerceProvider } from './providers/woocommerce';
import { MelhorEnvioProvider } from './providers/melhorenvio';
import { SuperFreteProvider } from './providers/superfrete';
import { ReportanaProvider } from './providers/reportana';
import { UTMifyProvider } from './providers/utmify';
import { SyncAdsAutomationProvider } from './providers/syncads-automation';

class IntegrationRegistry {
  private providers = new Map<string, IntegrationProvider>();

  constructor() {
    this.register(new ShopifyProvider());
    this.register(new WooCommerceProvider());
    this.register(new MelhorEnvioProvider());
    this.register(new SuperFreteProvider());
    this.register(new ReportanaProvider());
    this.register(new UTMifyProvider());
    this.register(new SyncAdsAutomationProvider());
  }

  register(provider: IntegrationProvider) {
    this.providers.set(provider.slug, provider);
  }

  get(slug: string): IntegrationProvider | undefined {
    return this.providers.get(slug);
  }

  getAll(): IntegrationProvider[] {
    return Array.from(this.providers.values());
  }
}

export const integrationRegistry = new IntegrationRegistry();

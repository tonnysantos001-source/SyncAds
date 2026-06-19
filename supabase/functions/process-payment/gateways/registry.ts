// ============================================
// GATEWAY REGISTRY - VERSÃO ROBUSTA
// ============================================
//
// Registro central de gateways de pagamento
// Versão: 2.0 - Apenas gateways funcionais
//
// ============================================

import { PaymentGateway, GatewayRegistry } from "./types.ts";

// ===== GATEWAYS ATIVOS (Sprint 1) =====
import { AsaasGateway } from "./asaas/index.ts";
import { MercadoPagoGateway } from "./mercado-pago/index.ts";
import { PagSeguroGateway } from "./pagseguro/index.ts";
import { PagarmeGateway } from "./pagarme/index.ts";

/**
 * Registro de gateways ativos
 *
 * STATUS: 4 gateways ativos (Asaas, Mercado Pago, PagSeguro, Pagar.me)
 */
export const gatewayRegistry: GatewayRegistry = {
  // Gateways da Sprint 1
  asaas: new AsaasGateway(),
  "mercado-pago": new MercadoPagoGateway(),
  mercadopago: new MercadoPagoGateway(), // alias
  pagseguro: new PagSeguroGateway(),
  pagarme: new PagarmeGateway(),
  
  // Placeholders para gateways inativos nesta sprint (retornam nulo no registry)
  stripe: null as any,
  paypal: null as any,
  paguex: null as any,
};

/**
 * Obtém um gateway pelo slug
 */
export function getGateway(slug: string): PaymentGateway | null {
  const gateway = gatewayRegistry[slug];

  if (!gateway) {
    console.warn(`[REGISTRY] Gateway não encontrado: ${slug}`);
    return null;
  }

  console.log(`[REGISTRY] Gateway encontrado: ${slug} (${gateway.name})`);
  return gateway;
}

/**
 * Lista todos os gateways disponíveis
 */
export function listGateways(): PaymentGateway[] {
  return Object.values(gatewayRegistry).filter(
    (gateway) => gateway !== null && gateway !== undefined,
  ) as PaymentGateway[];
}

/**
 * Verifica se um gateway está disponível
 */
export function hasGateway(slug: string): boolean {
  const gateway = gatewayRegistry[slug];
  return gateway !== null && gateway !== undefined;
}

/**
 * Obtém informações sobre um gateway
 */
export function getGatewayInfo(slug: string): {
  name: string;
  slug: string;
  supportedMethods: string[];
  available: boolean;
} | null {
  const gateway = getGateway(slug);

  if (!gateway) {
    return null;
  }

  return {
    name: gateway.name,
    slug: gateway.slug,
    supportedMethods: gateway.supportedMethods,
    available: true,
  };
}

/**
 * Categoriza gateways por tipo
 */
export function getGatewaysByCategory(): {
  processor: string[];
  wallet: string[];
  bank: string[];
  international: string[];
  pix: string[];
} {
  const gateways = listGateways();

  const categories = {
    processor: [] as string[],
    wallet: [] as string[],
    bank: [] as string[],
    international: [] as string[],
    pix: [] as string[],
  };

  gateways.forEach((gateway) => {
    // Classificar baseado nos métodos suportados
    if (gateway.supportedMethods.includes("PIX")) {
      categories.pix.push(gateway.slug);
    }

    // Adicionar a categoria principal (processor por padrão)
    categories.processor.push(gateway.slug);

    // Gateways internacionais
    if (["stripe", "paypal", "safetypay"].includes(gateway.slug)) {
      categories.international.push(gateway.slug);
    }
  });

  return categories;
}

/**
 * Valida se todos os gateways do registry estão funcionais
 */
export function validateRegistry(): {
  valid: boolean;
  errors: string[];
  gateways: string[];
} {
  const errors: string[] = [];
  const gateways: string[] = [];

  try {
    for (const [slug, gateway] of Object.entries(gatewayRegistry)) {
      if (gateway === null || gateway === undefined) {
        // Gateway placeholder, ok
        continue;
      }

      // Validar gateway
      if (!gateway.name) {
        errors.push(`Gateway ${slug}: missing name`);
      }

      if (!gateway.slug) {
        errors.push(`Gateway ${slug}: missing slug`);
      }

      if (!gateway.supportedMethods || gateway.supportedMethods.length === 0) {
        errors.push(`Gateway ${slug}: no supported methods`);
      }

      const hasCreatePayment = gateway.createPayment && typeof gateway.createPayment === "function";
      const hasProcessPayment = (gateway as any).processPayment && typeof (gateway as any).processPayment === "function";

      if (!hasCreatePayment && !hasProcessPayment) {
        errors.push(`Gateway ${slug}: missing createPayment or processPayment method`);
      }

      gateways.push(slug);
    }

    return {
      valid: errors.length === 0,
      errors,
      gateways,
    };
  } catch (error: any) {
    return {
      valid: false,
      errors: [`Registry validation failed: ${error.message}`],
      gateways: [],
    };
  }
}

// ============================================
// EXPORTS
// ============================================

export default gatewayRegistry;

export {
  gatewayRegistry as registry,
  getGateway as get,
  listGateways as list,
  hasGateway as has,
  getGatewayInfo as info,
};

// ============================================
// VALIDAÇÃO AUTOMÁTICA NA INICIALIZAÇÃO
// ============================================

try {
  const validation = validateRegistry();

  if (!validation.valid) {
    console.error("[REGISTRY] ❌ Validation failed:");
    validation.errors.forEach((error) => console.error(`  - ${error}`));
  } else {
    console.log(
      `[REGISTRY] ✅ Validated ${validation.gateways.length} gateways`,
    );
    console.log(
      `[REGISTRY] Active gateways: ${validation.gateways.join(", ")}`,
    );
  }
} catch (error) {
  console.error("[REGISTRY] ❌ Failed to validate registry:", error);
}

// ============================================
// GATEWAY REGISTRY - VERSÃO ROBUSTA
// ============================================
//
// Registro central de gateways de pagamento
// Versão: 2.0 - Apenas gateways funcionais
//
// ============================================

import { GatewayProcessor, GatewayRegistry } from "./types.ts";

// ===== GATEWAYS ATIVOS (4) =====
// Apenas gateways testados e funcionais

// Gateway Principal
import { PagueXGateway } from "./paguex/index.ts";

// Gateways Legados (funcionais)
// Nota: Stripe, MercadoPago e Asaas são gerenciados via código legado
// no index.ts, não pelo registry

/**
 * Registro de gateways ativos
 *
 * STATUS: 1 gateway ativo (Pague-X)
 *
 * IMPORTANTE:
 * - Apenas gateways totalmente implementados e testados
 * - Gateways legados (Stripe, MercadoPago, Asaas) usam código separado
 * - Novos gateways devem ser adicionados apenas após testes completos
 */
export const gatewayRegistry: GatewayRegistry = {
  // ===== GATEWAY PRINCIPAL =====

  // Pague-X (inpagamentos.com)
  paguex: new PagueXGateway(),

  // ===== GATEWAYS LEGADOS (DESABILITADOS NO REGISTRY) =====
  // Estes gateways são processados via código legado no index.ts

  stripe: null as any,
  mercadopago: null as any,
  "mercado-pago": null as any,
  asaas: null as any,
  pagseguro: null as any,
  paypal: null as any,

  // ===== GATEWAYS FUTUROS (PLACEHOLDER) =====
  // Adicione novos gateways aqui após implementação completa

  // Exemplo:
  // "novo-gateway": new NovoGateway(),
};

/**
 * Obtém um gateway pelo slug
 */
export function getGateway(slug: string): GatewayProcessor | null {
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
export function listGateways(): GatewayProcessor[] {
  return Object.values(gatewayRegistry).filter(
    (gateway) => gateway !== null && gateway !== undefined,
  ) as GatewayProcessor[];
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

      if (
        !gateway.processPayment ||
        typeof gateway.processPayment !== "function"
      ) {
        errors.push(`Gateway ${slug}: missing processPayment method`);
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

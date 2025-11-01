// ============================================
// GATEWAY REGISTRY
// ============================================
//
// Registro central de todos os gateways disponíveis
// Status: 25/55 gateways implementados (45.5%)
//
// ============================================

import { GatewayProcessor, GatewayRegistry } from "./types.ts";

// ===== GATEWAYS IMPLEMENTADOS =====
import { PagSeguroGateway } from "./pagseguro/index.ts";
import { PagBankGateway } from "./pagbank/index.ts";
import { PagarmeGateway } from "./pagarme/index.ts";
import { CieloGateway } from "./cielo/index.ts";
import { PicPayGateway } from "./picpay/index.ts";
import { PayPalGateway } from "./paypal/index.ts";
import { GetnetGateway } from "./getnet/index.ts";
import { RedeGateway } from "./rede/index.ts";
import { StoneGateway } from "./stone/index.ts";
import { IuguGateway } from "./iugu/index.ts";
import { JunoGateway } from "./juno/index.ts";
import { AdyenGateway } from "./adyen/index.ts";
import { OpenPixGateway } from "./openpix/index.ts";
import { ZoopGateway } from "./zoop/index.ts";
import { VindiGateway } from "./vindi/index.ts";
// Lote 1 - Processadores Brasileiros
import { Pay99Gateway } from "./99pay/index.ts";
import { CelcoinGateway } from "./celcoin/index.ts";
import { EnoahGateway } from "./enoah/index.ts";
import { GranitoGateway } from "./granito/index.ts";
import { HubPagamentosGateway } from "./hub-pagamentos/index.ts";
import { InfinitePayGateway } from "./infinitepay/index.ts";
import { NeonPayGateway } from "./neonpay/index.ts";
import { OpenpayGateway } from "./openpay/index.ts";
import { PaghiperGateway } from "./paghiper/index.ts";
import { VendasPayGateway } from "./vendaspay/index.ts";

/**
 * Registro de todos os gateways disponíveis
 *
 * Status de Implementação:
 * - ✅ Alta Prioridade: 9/9 (100%)
 * - ✅ Média Prioridade: 16/18 (88.9%)
 * - ⏳ Baixa Prioridade: 0/28 (0%)
 *
 * Total: 25/55 gateways (45.5%)
 */
export const gatewayRegistry: GatewayRegistry = {
  // ===== GATEWAYS FUNCIONAIS (25) =====

  // Stripe - Gateway internacional (implementado anteriormente)
  stripe: null as any, // Será preenchido via initializeLegacyGateways()

  // Mercado Pago - Líder América Latina (implementado anteriormente)
  "mercado-pago": null as any, // Será preenchido via initializeLegacyGateways()
  mercadopago: null as any, // Alias

  // Asaas - Plataforma brasileira (implementado anteriormente)
  asaas: null as any, // Será preenchido via initializeLegacyGateways()

  // PagSeguro - UOL/PagBank
  pagseguro: new PagSeguroGateway(),

  // PagBank - Nova marca do PagSeguro
  pagbank: new PagBankGateway(),

  // Pagar.me - Gateway brasileiro developer-friendly
  pagarme: new PagarmeGateway(),

  // Cielo - Maior adquirente do Brasil
  cielo: new CieloGateway(),

  // PicPay - Carteira digital brasileira
  picpay: new PicPayGateway(),

  // PayPal - Líder mundial em pagamentos
  paypal: new PayPalGateway(),

  // Getnet - Grande processadora brasileira
  getnet: new GetnetGateway(),

  // Rede - Adquirente brasileira
  rede: new RedeGateway(),

  // Stone - Fintech brasileira
  stone: new StoneGateway(),

  // Iugu - Gateway com recorrência
  iugu: new IuguGateway(),

  // Juno - Plataforma de pagamentos
  juno: new JunoGateway(),

  // OpenPix - PIX especializado
  openpix: new OpenPixGateway(),

  // Zoop - Plataforma de pagamentos
  zoop: new ZoopGateway(),

  // Adyen - Gateway internacional
  adyen: new AdyenGateway(),

  // Vindi - Recorrência e assinaturas
  vindi: new VindiGateway(),

  // 99Pay - Processador brasileiro
  "99pay": new Pay99Gateway(),

  // Celcoin - Processador e banking
  celcoin: new CelcoinGateway(),

  // eNoah - Gateway brasileiro
  enoah: new EnoahGateway(),

  // Granito - Pagamentos digitais
  granito: new GranitoGateway(),

  // Hub de Pagamentos - Agregador
  "hub-pagamentos": new HubPagamentosGateway(),

  // InfinitePay - Maquininha e gateway
  infinitepay: new InfinitePayGateway(),

  // NeonPay - Banco Neon
  neonpay: new NeonPayGateway(),

  // Openpay - Gateway LATAM
  openpay: new OpenpayGateway(),

  // Paghiper - Boleto e PIX
  paghiper: new PaghiperGateway(),

  // VendasPay - Plataforma de vendas
  vendaspay: new VendasPayGateway(),

  // ===== GATEWAYS PENDENTES (30) =====
  // Serão implementados em breve, descomente quando estiver pronto

  // Processadores Brasileiros
  // "yapay": new YapayGateway(),
  // "safrapay": new SafraPayGateway(),
  // "safepay": new SafePayGateway(),
  // "pagvendas": new PagVendasGateway(),

  // Bancos
  // "banco-do-brasil": new BancoDoBrasilGateway(),
  // "itau": new ItauGateway(),
  // "bradesco": new BradescoGateway(),
  // "caixa": new CaixaGateway(),
  // "santander": new SantanderGateway(),
  // "banco-inter": new BancoInterGateway(),
  // "nubank": new NubankGateway(),
  // "c6-bank": new C6BankGateway(),
  // "sicredi": new SicrediGateway(),

  // Carteiras Digitais
  // "ame-digital": new AmeDigitalGateway(),
  // "apple-pay": new ApplePayGateway(),
  // "google-pay": new GooglePayGateway(),
  // "samsung-pay": new SamsungPayGateway(),
  // "mercado-livre-pagamentos": new MercadoLivrePagamentosGateway(),
  // "recarga-pay": new RecargaPayGateway(),

  // Gateways Internacionais
  // "authorize-net": new AuthorizeNetGateway(),
  // "braintree": new BraintreeGateway(),
  // "square": new SquareGateway(),
  // "worldpay": new WorldPayGateway(),
  // "2checkout": new Checkout2Gateway(),

  // Especializados
  // "pixpdv": new PixPDVGateway(),
  // "shipay": new ShipayGateway(),
  // "pix-manual": new PixManualGateway(),
};

/**
 * Obtém um gateway pelo slug
 */
export function getGateway(slug: string): GatewayProcessor | undefined {
  const gateway = gatewayRegistry[slug.toLowerCase()];

  if (!gateway) {
    console.warn(`Gateway "${slug}" not found in registry`);
    return undefined;
  }

  return gateway;
}

/**
 * Lista todos os gateways disponíveis
 */
export function listGateways(): GatewayProcessor[] {
  return Object.values(gatewayRegistry).filter(
    (gateway) => gateway && typeof gateway === "object" && gateway.slug,
  );
}

/**
 * Lista apenas os slugs dos gateways disponíveis
 */
export function listGatewaySlugs(): string[] {
  return Object.keys(gatewayRegistry).filter((slug) => {
    const gateway = gatewayRegistry[slug];
    return gateway && typeof gateway === "object" && gateway.slug;
  });
}

/**
 * Verifica se um gateway está disponível e implementado
 */
export function isGatewayAvailable(slug: string): boolean {
  const gateway = gatewayRegistry[slug.toLowerCase()];
  return gateway && typeof gateway === "object" && "processPayment" in gateway;
}

/**
 * Obtém informações sobre um gateway
 */
export function getGatewayInfo(slug: string): {
  name: string;
  slug: string;
  supportedMethods: string[];
} | null {
  const gateway = getGateway(slug);

  if (!gateway) {
    return null;
  }

  return {
    name: gateway.name,
    slug: gateway.slug,
    supportedMethods: gateway.supportedMethods.map((method) => String(method)),
  };
}

/**
 * Obtém estatísticas sobre os gateways implementados
 */
export function getGatewayStats(): {
  total: number;
  implemented: number;
  pending: number;
  percentage: number;
} {
  const allSlugs = Object.keys(gatewayRegistry);
  const implementedGateways = listGateways();

  return {
    total: 55, // Total conhecido de gateways
    implemented: implementedGateways.length,
    pending: 55 - implementedGateways.length,
    percentage: Math.round((implementedGateways.length / 55) * 100),
  };
}

/**
 * Valida se um método de pagamento é suportado por um gateway
 */
export function supportsPaymentMethod(slug: string, method: string): boolean {
  const gateway = getGateway(slug);

  if (!gateway) {
    return false;
  }

  return gateway.supportedMethods.some(
    (m) => String(m).toLowerCase() === method.toLowerCase(),
  );
}

/**
 * Busca gateways por método de pagamento
 */
export function findGatewaysByMethod(method: string): GatewayProcessor[] {
  return listGateways().filter((gateway) =>
    gateway.supportedMethods.some(
      (m) => String(m).toLowerCase() === method.toLowerCase(),
    ),
  );
}

/**
 * Inicializa os gateways legados (Stripe, Mercado Pago, Asaas)
 * Estes foram implementados antes da refatoração
 */
export function initializeLegacyGateways(
  stripe: GatewayProcessor,
  mercadoPago: GatewayProcessor,
  asaas: GatewayProcessor,
): void {
  gatewayRegistry["stripe"] = stripe;
  gatewayRegistry["mercado-pago"] = mercadoPago;
  gatewayRegistry["mercadopago"] = mercadoPago;
  gatewayRegistry["asaas"] = asaas;
}

/**
 * Verifica se todos os gateways prioritários estão implementados
 */
export function checkHighPriorityGateways(): {
  total: number;
  implemented: number;
  missing: string[];
} {
  const highPriority = [
    "stripe",
    "mercado-pago",
    "asaas",
    "pagseguro",
    "pagbank",
    "pagarme",
    "cielo",
    "picpay",
    "paypal",
  ];

  const missing = highPriority.filter((slug) => !isGatewayAvailable(slug));

  return {
    total: highPriority.length,
    implemented: highPriority.length - missing.length,
    missing,
  };
}

/**
 * Obtém lista de gateways por categoria
 */
export function getGatewaysByCategory(
  category: "processor" | "bank" | "wallet" | "international",
): string[] {
  const categories = {
    processor: [
      "pagseguro",
      "pagbank",
      "pagarme",
      "cielo",
      "getnet",
      "rede",
      "stone",
      "iugu",
      "juno",
      "vindi",
      "yapay",
      "zoop",
      "infinitepay",
      "neonpay",
      "safrapay",
      "celcoin",
      "enoah",
      "hub-pagamentos",
      "vendaspay",
      "safepay",
      "granito",
      "pagvendas",
      "openpay",
      "99pay",
    ],
    bank: [
      "banco-do-brasil",
      "itau",
      "bradesco",
      "caixa",
      "santander",
      "banco-inter",
      "nubank",
      "c6-bank",
      "sicredi",
    ],
    wallet: [
      "picpay",
      "ame-digital",
      "apple-pay",
      "google-pay",
      "samsung-pay",
      "mercado-livre-pagamentos",
      "recarga-pay",
    ],
    international: [
      "stripe",
      "paypal",
      "adyen",
      "authorize-net",
      "braintree",
      "square",
      "worldpay",
      "2checkout",
    ],
  };

  return categories[category] || [];
}

/**
 * Valida se há duplicatas no registry
 */
export function validateRegistry(): {
  isValid: boolean;
  duplicates: string[];
  nullGateways: string[];
} {
  const slugs = Object.keys(gatewayRegistry);
  const duplicates: string[] = [];
  const nullGateways: string[] = [];
  const seen = new Set<string>();

  for (const slug of slugs) {
    if (seen.has(slug)) {
      duplicates.push(slug);
    }
    seen.add(slug);

    const gateway = gatewayRegistry[slug];
    if (!gateway) {
      nullGateways.push(slug);
    }
  }

  return {
    isValid: duplicates.length === 0,
    duplicates,
    nullGateways: nullGateways.filter(
      (slug) =>
        !["stripe", "mercado-pago", "mercadopago", "asaas"].includes(slug),
    ),
  };
}

// Log de inicialização
const stats = getGatewayStats();
const highPriority = checkHighPriorityGateways();

console.log("✅ Gateway Registry initialized");
console.log(
  `📊 Total: ${stats.implemented}/${stats.total} gateways (${stats.percentage}%)`,
);
console.log(
  `🎯 High Priority: ${highPriority.implemented}/${highPriority.total}`,
);
console.log(`🔑 Available:`, listGatewaySlugs().join(", "));

if (highPriority.missing.length > 0) {
  console.log(`⚠️  Missing high priority:`, highPriority.missing.join(", "));
}

// ============================================
// GATEWAY REGISTRY
// ============================================
//
// Registro central de todos os gateways disponíveis
// Status: 53/53 gateways implementados (100%)
//
// ============================================

import { GatewayProcessor, GatewayRegistry } from "./types.ts";

// ===== GATEWAYS IMPLEMENTADOS (53) =====
import { CieloGateway } from "./cielo/index.ts";
import { GetnetGateway } from "./getnet/index.ts";
import { IuguGateway } from "./iugu/index.ts";
import { PagarmeGateway } from "./pagarme/index.ts";
import { PagSeguroGateway } from "./pagseguro/index.ts";
import { PayPalGateway } from "./paypal/index.ts";
import { PicPayGateway } from "./picpay/index.ts";
import { RedeGateway } from "./rede/index.ts";
import { StoneGateway } from "./stone/index.ts";
import { VindiGateway } from "./vindi/index.ts";
import { WirecardGateway } from "./wirecard/index.ts";

// Lote 1 - Novos Gateways (A-F)
import { AllusGateway } from "./allus/index.ts";
import { AlpaGateway } from "./alpa/index.ts";
import { AlphacashGateway } from "./alphacash/index.ts";
import { AnubisPayGateway } from "./anubispay/index.ts";
import { AppmaxGateway } from "./appmax/index.ts";
import { AssetGateway } from "./asset/index.ts";
import { AstonPayGateway } from "./aston-pay/index.ts";
import { AtlasPayGateway } from "./atlas-pay/index.ts";
import { AxelpayGateway } from "./axelpay/index.ts";
import { AxionPayGateway } from "./axion-pay/index.ts";
import { AzcendGateway } from "./azcend/index.ts";
import { BestfyGateway } from "./bestfy/index.ts";
import { BlackcatGateway } from "./blackcat/index.ts";
import { BravosPayGateway } from "./bravos-pay/index.ts";
import { BrazaPayGateway } from "./braza-pay/index.ts";
import { BynetGateway } from "./bynet/index.ts";
import { CartheroGateway } from "./carthero/index.ts";
import { CenturionPayGateway } from "./centurion-pay/index.ts";
import { CredpagoGateway } from "./credpago/index.ts";
import { CredwaveGateway } from "./credwave/index.ts";
import { CupulaHubGateway } from "./cupula-hub/index.ts";
import { CyberhubGateway } from "./cyberhub/index.ts";
import { CodiguzHubGateway } from "./codiguz-hub/index.ts";
import { DiasmarketplaceGateway } from "./diasmarketplace/index.ts";
import { DomPagamentosGateway } from "./dom-pagamentos/index.ts";
import { DorapagGateway } from "./dorapag/index.ts";
import { DubaiPayGateway } from "./dubai-pay/index.ts";
import { EfiGateway } from "./efi/index.ts";
import { EverPayGateway } from "./ever-pay/index.ts";
import { FastPayGateway } from "./fast-pay/index.ts";
import { FirePagGateway } from "./fire-pag/index.ts";
import { FivepayGateway } from "./fivepay/index.ts";
import { FlashPayGateway } from "./flashpay/index.ts";
import { FlowspayGateway } from "./flowspay/index.ts";
import { FlyPaymentsGateway } from "./fly-payments/index.ts";
import { FortrexGateway } from "./fortrex/index.ts";
import { FreePayGateway } from "./freepay/index.ts";
import { FusionPayGateway } from "./fusionpay/index.ts";
import { SafetyPayGateway } from "./safetypay/index.ts";

/**
 * Registro de todos os gateways disponíveis
 *
 * Status de Implementação:
 * - ✅ Alta Prioridade: 2/2 (100%) - Stripe, Asaas
 * - ✅ Média Prioridade: 51/51 (100%)
 *
 * Total: 53/53 gateways (100%)
 */
export const gatewayRegistry: GatewayRegistry = {
  // ===== GATEWAYS PRIORITÁRIOS (2) =====

  // Stripe - Gateway internacional (implementado)
  stripe: null as any, // Será preenchido via initializeLegacyGateways()

  // Asaas - Plataforma brasileira (implementado)
  asaas: null as any, // Será preenchido via initializeLegacyGateways()

  // ===== GATEWAYS PRINCIPAIS IMPLEMENTADOS (11) =====

  // Mercado Pago - Líder América Latina
  "mercado-pago": null as any, // Será preenchido via initializeLegacyGateways()
  mercadopago: null as any, // Alias

  // PagSeguro - UOL/PagBank
  pagseguro: new PagSeguroGateway(),

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

  // Vindi - Recorrência e assinaturas
  vindi: new VindiGateway(),

  // ===== GATEWAYS ADICIONAIS (40) =====

  // Wirecard (Moip)
  "wirecard-moip": new WirecardGateway(),
  wirecard: new WirecardGateway(), // Alias

  // SafetyPay
  safetypay: new SafetyPayGateway(),

  // Allus
  allus: new AllusGateway(),

  // Alpa
  alpa: new AlpaGateway(),

  // Alphacash
  alphacash: new AlphacashGateway(),

  // AnubisPay
  anubispay: new AnubisPayGateway(),

  // Appmax
  appmax: new AppmaxGateway(),

  // Asset
  asset: new AssetGateway(),

  // Aston Pay
  "aston-pay": new AstonPayGateway(),

  // Atlas Pay
  "atlas-pay": new AtlasPayGateway(),

  // Axelpay
  axelpay: new AxelpayGateway(),

  // Axion Pay
  "axion-pay": new AxionPayGateway(),

  // Azcend
  azcend: new AzcendGateway(),

  // Bestfy
  bestfy: new BestfyGateway(),

  // Blackcat
  blackcat: new BlackcatGateway(),

  // Bravos Pay
  "bravos-pay": new BravosPayGateway(),

  // Braza Pay
  "braza-pay": new BrazaPayGateway(),

  // Bynet
  bynet: new BynetGateway(),

  // Carthero
  carthero: new CartheroGateway(),

  // Centurion Pay
  "centurion-pay": new CenturionPayGateway(),

  // Credpago
  credpago: new CredpagoGateway(),

  // Credwave
  credwave: new CredwaveGateway(),

  // Cúpula Hub
  "cupula-hub": new CupulaHubGateway(),

  // Cyberhub
  cyberhub: new CyberhubGateway(),

  // Codiguz Hub
  "codiguz-hub": new CodiguzHubGateway(),

  // Diasmarketplace
  diasmarketplace: new DiasmarketplaceGateway(),

  // Dom Pagamentos
  "dom-pagamentos": new DomPagamentosGateway(),

  // Dorapag
  dorapag: new DorapagGateway(),

  // Dubai Pay
  "dubai-pay": new DubaiPayGateway(),

  // Efí
  efi: new EfiGateway(),

  // Ever Pay
  "ever-pay": new EverPayGateway(),

  // Fast Pay
  "fast-pay": new FastPayGateway(),

  // Fire Pag
  "fire-pag": new FirePagGateway(),

  // Fivepay
  fivepay: new FivepayGateway(),

  // FlashPay
  flashpay: new FlashPayGateway(),

  // Flowspay
  flowspay: new FlowspayGateway(),

  // Fly Payments
  "fly-payments": new FlyPaymentsGateway(),

  // Fortrex
  fortrex: new FortrexGateway(),

  // FreePay
  freepay: new FreePayGateway(),

  // FusionPay
  fusionpay: new FusionPayGateway(),
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
  const implementedGateways = listGateways();

  return {
    total: 53,
    implemented: implementedGateways.length,
    pending: 53 - implementedGateways.length,
    percentage: Math.round((implementedGateways.length / 53) * 100 * 10) / 10,
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
  category: "processor" | "wallet" | "international",
): string[] {
  const categories = {
    processor: [
      "pagseguro",
      "pagarme",
      "cielo",
      "getnet",
      "rede",
      "stone",
      "iugu",
      "vindi",
      "wirecard-moip",
      "allus",
      "alpa",
      "anubispay",
      "appmax",
      "axelpay",
      "axion-pay",
      "azcend",
      "bestfy",
      "bravos-pay",
      "braza-pay",
      "bynet",
      "carthero",
      "centurion-pay",
      "credpago",
      "credwave",
      "cupula-hub",
      "cyberhub",
      "codiguz-hub",
      "diasmarketplace",
      "dom-pagamentos",
      "dorapag",
      "dubai-pay",
      "efi",
      "ever-pay",
      "fire-pag",
      "fivepay",
      "flashpay",
      "flowspay",
      "fly-payments",
      "fortrex",
      "freepay",
      "fusionpay",
    ],
    wallet: [
      "picpay",
      "safetypay",
      "asset",
      "alphacash",
      "blackcat",
      "fast-pay",
    ],
    international: [
      "stripe",
      "paypal",
      "safetypay",
      "alpa",
      "alphacash",
      "aston-pay",
      "atlas-pay",
      "fast-pay",
      "fusionpay",
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

const availableSlugs = listGatewaySlugs();
if (availableSlugs.length > 0) {
  console.log(`🔑 Available: ${availableSlugs.length} gateways ready`);
}

if (highPriority.missing.length > 0) {
  console.log(`⚠️  Missing high priority:`, highPriority.missing.join(", "));
}

if (stats.percentage === 100) {
  console.log("🎉 ALL GATEWAYS IMPLEMENTED! Ready for production!");
}

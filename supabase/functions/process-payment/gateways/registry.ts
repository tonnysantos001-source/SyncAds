// ============================================
// GATEWAY REGISTRY
// ============================================
//
// Registro central de todos os 55 gateways disponíveis
// Adicione novos gateways aqui conforme forem implementados
//
// ============================================

import { GatewayProcessor, GatewayRegistry } from "./types.ts";

// ===== GATEWAYS JÁ IMPLEMENTADOS (ALTA PRIORIDADE) =====
import { PagSeguroGateway } from "./pagseguro/index.ts";
import { PagBankGateway } from "./pagbank/index.ts";
import { PagarmeGateway } from "./pagarme/index.ts";
import { CieloGateway } from "./cielo/index.ts";
import { PicPayGateway } from "./picpay/index.ts";
import { PayPalGateway } from "./paypal/index.ts";

// ===== GATEWAYS EM IMPLEMENTAÇÃO (MÉDIA PRIORIDADE) =====
// Descomente conforme forem implementados
// import { GetnetGateway } from "./getnet/index.ts";
// import { RedeGateway } from "./rede/index.ts";
// import { StoneGateway } from "./stone/index.ts";
// import { IuguGateway } from "./iugu/index.ts";
// import { JunoGateway } from "./juno/index.ts";
// import { VindiGateway } from "./vindi/index.ts";
// import { OpenPixGateway } from "./openpix/index.ts";
// import { AdyenGateway } from "./adyen/index.ts";
// import { ZoopGateway } from "./zoop/index.ts";

// ===== GATEWAYS PENDENTES (BAIXA PRIORIDADE) =====
// import { YapayGateway } from "./yapay/index.ts";
// import { InfinitePayGateway } from "./infinitepay/index.ts";
// import { NeonPayGateway } from "./neonpay/index.ts";
// import { SafraPayGateway } from "./safrapay/index.ts";
// import { CelcoinGateway } from "./celcoin/index.ts";
// import { EnoahGateway } from "./enoah/index.ts";
// import { HubPagamentosGateway } from "./hub-pagamentos/index.ts";
// import { VendasPayGateway } from "./vendaspay/index.ts";
// import { SafePayGateway } from "./safepay/index.ts";
// import { GranitoGateway } from "./granito/index.ts";
// import { PagVendasGateway } from "./pagvendas/index.ts";
// import { Checkout2Gateway } from "./2checkout/index.ts";
// import { Pay99Gateway } from "./99pay/index.ts";
// import { OpenPayGateway } from "./openpay/index.ts";
// import { PixPDVGateway } from "./pixpdv/index.ts";
// import { ShipayGateway } from "./shipay/index.ts";
// import { PaghiperGateway } from "./paghiper/index.ts";
// import { PixManualGateway } from "./pix-manual/index.ts";
// import { AuthorizeNetGateway } from "./authorize-net/index.ts";
// import { BraintreeGateway } from "./braintree/index.ts";
// import { SquareGateway } from "./square/index.ts";
// import { WorldPayGateway } from "./worldpay/index.ts";
// import { BancoDoBrasilGateway } from "./banco-do-brasil/index.ts";
// import { ItauGateway } from "./itau/index.ts";
// import { BradescoGateway } from "./bradesco/index.ts";
// import { CaixaGateway } from "./caixa/index.ts";
// import { SantanderGateway } from "./santander/index.ts";
// import { BancoInterGateway } from "./banco-inter/index.ts";
// import { NubankGateway } from "./nubank/index.ts";
// import { C6BankGateway } from "./c6-bank/index.ts";
// import { SicrediGateway } from "./sicredi/index.ts";
// import { AmeDigitalGateway } from "./ame-digital/index.ts";
// import { ApplePayGateway } from "./apple-pay/index.ts";
// import { GooglePayGateway } from "./google-pay/index.ts";
// import { SamsungPayGateway } from "./samsung-pay/index.ts";
// import { MercadoLivrePagamentosGateway } from "./mercado-livre-pagamentos/index.ts";
// import { RecargaPayGateway } from "./recarga-pay/index.ts";

/**
 * Registro de todos os gateways disponíveis
 *
 * Para adicionar um novo gateway:
 * 1. Implemente a classe que estende BaseGateway
 * 2. Importe a classe acima
 * 3. Adicione ao objeto abaixo com a chave sendo o slug do gateway
 * 4. Teste usando o endpoint de validação
 *
 * Status: 8/55 gateways implementados (14.5%)
 * - ✅ Stripe (já estava implementado)
 * - ✅ Mercado Pago (já estava implementado)
 * - ✅ Asaas (já estava implementado)
 * - ✅ PagSeguro (implementado agora)
 * - ✅ PagBank (implementado agora)
 * - ✅ Pagar.me (implementado agora)
 * - ✅ Cielo (implementado agora)
 * - ✅ PicPay (implementado agora)
 * - ✅ PayPal (implementado agora)
 */
export const gatewayRegistry: GatewayRegistry = {
  // ===== GATEWAYS FUNCIONAIS (8) =====

  // Stripe - Gateway internacional completo
  "stripe": {} as GatewayProcessor, // Implementado anteriormente

  // Mercado Pago - Líder América Latina
  "mercado-pago": {} as GatewayProcessor, // Implementado anteriormente
  "mercadopago": {} as GatewayProcessor, // Alias

  // Asaas - Plataforma brasileira de cobranças
  "asaas": {} as GatewayProcessor, // Implementado anteriormente

  // PagSeguro - UOL/PagBank
  "pagseguro": new PagSeguroGateway(),

  // PagBank - Nova marca do PagSeguro
  "pagbank": new PagBankGateway(),

  // Pagar.me - Gateway brasileiro developer-friendly
  "pagarme": new PagarmeGateway(),

  // Cielo - Maior adquirente do Brasil
  "cielo": new CieloGateway(),

  // PicPay - Carteira digital brasileira
  "picpay": new PicPayGateway(),

  // PayPal - Líder mundial em pagamentos
  "paypal": new PayPalGateway(),

  // ===== GATEWAYS EM DESENVOLVIMENTO (47) =====
  // Descomente conforme forem implementados

  // Processadores Brasileiros (14)
  // "getnet": new GetnetGateway(),
  // "rede": new RedeGateway(),
  // "stone": new StoneGateway(),
  // "iugu": new IuguGateway(),
  // "juno": new JunoGateway(),
  // "vindi": new VindiGateway(),
  // "yapay": new YapayGateway(),
  // "zoop": new ZoopGateway(),
  // "infinitepay": new InfinitePayGateway(),
  // "neonpay": new NeonPayGateway(),
  // "safrapay": new SafraPayGateway(),
  // "celcoin": new CelcoinGateway(),
  // "enoah": new EnoahGateway(),
  // "hub-pagamentos": new HubPagamentosGateway(),

  // Processadores Adicionais (6)
  // "vendaspay": new VendasPayGateway(),
  // "safepay": new SafePayGateway(),
  // "granito": new GranitoGateway(),
  // "pagvendas": new PagVendasGateway(),
  // "openpay": new OpenPayGateway(),
  // "99pay": new Pay99Gateway(),

  // Bancos (9)
  // "banco-do-brasil": new BancoDoBrasilGateway(),
  // "itau": new ItauGateway(),
  // "bradesco": new BradescoGateway(),
  // "caixa": new CaixaGateway(),
  // "santander": new SantanderGateway(),
  // "banco-inter": new BancoInterGateway(),
  // "nubank": new NubankGateway(),
  // "c6-bank": new C6BankGateway(),
  // "sicredi": new SicrediGateway(),

  // Carteiras Digitais (6)
  // "ame-digital": new AmeDigitalGateway(),
  // "apple-pay": new ApplePayGateway(),
  // "google-pay": new GooglePayGateway(),
  // "samsung-pay": new SamsungPayGateway(),
  // "mercado-livre-pagamentos": new MercadoLivrePagamentosGateway(),
  // "recarga-pay": new RecargaPayGateway(),

  // Gateways Internacionais (5)
  // "adyen": new AdyenGateway(),
  // "authorize-net": new AuthorizeNetGateway(),
  // "braintree": new BraintreeGateway(),
  // "square": new SquareGateway(),
  // "worldpay": new WorldPayGateway(),
  // "2checkout": new Checkout2Gateway(),

  // Especializados (7)
  // "openpix": new OpenPixGateway(),
  // "pixpdv": new PixPDVGateway(),
  // "shipay": new ShipayGateway(),
  // "paghiper": new PaghiperGateway(),
  // "pix-manual": new PixManualGateway(),
};

/**
 * Obtém um gateway pelo slug
 *
 * @param slug - O slug do gateway (ex: "stripe", "mercado-pago")
 * @returns O gateway processor ou undefined se não encontrado
 *
 * @example
 * ```ts
 * const gateway = getGateway("stripe");
 * if (gateway) {
 *   const result = await gateway.processPayment(request, config);
 * }
 * ```
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
 *
 * @returns Array com todos os gateway processors registrados
 *
 * @example
 * ```ts
 * const allGateways = listGateways();
 * console.log(`Total gateways: ${allGateways.length}`);
 * ```
 */
export function listGateways(): GatewayProcessor[] {
  return Object.values(gatewayRegistry).filter(
    (gateway) => gateway && typeof gateway === "object"
  );
}

/**
 * Lista apenas os slugs dos gateways disponíveis
 *
 * @returns Array com os slugs de todos os gateways
 *
 * @example
 * ```ts
 * const slugs = listGatewaySlugs();
 * // ["stripe", "mercado-pago", "asaas", ...]
 * ```
 */
export function listGatewaySlugs(): string[] {
  return Object.keys(gatewayRegistry).filter((slug) => {
    const gateway = gatewayRegistry[slug];
    return gateway && typeof gateway === "object";
  });
}

/**
 * Verifica se um gateway está disponível e implementado
 *
 * @param slug - O slug do gateway
 * @returns true se o gateway está disponível, false caso contrário
 *
 * @example
 * ```ts
 * if (isGatewayAvailable("stripe")) {
 *   // Gateway disponível, pode processar pagamento
 * }
 * ```
 */
export function isGatewayAvailable(slug: string): boolean {
  const gateway = gatewayRegistry[slug.toLowerCase()];
  return gateway && typeof gateway === "object" && "processPayment" in gateway;
}

/**
 * Obtém informações sobre um gateway sem instanciá-lo
 *
 * @param slug - O slug do gateway
 * @returns Informações básicas do gateway ou null
 *
 * @example
 * ```ts
 * const info = getGatewayInfo("stripe");
 * if (info) {
 *   console.log(`Gateway: ${info.name}`);
 *   console.log(`Métodos: ${info.supportedMethods.join(", ")}`);
 * }
 * ```
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
 *
 * @returns Estatísticas dos gateways
 *
 * @example
 * ```ts
 * const stats = getGatewayStats();
 * console.log(`Implementados: ${stats.implemented}/${stats.total}`);
 * console.log(`Progresso: ${stats.percentage}%`);
 * ```
 */
export function getGatewayStats(): {
  total: number;
  implemented: number;
  pending: number;
  percentage: number;
} {
  const total = Object.keys(gatewayRegistry).length;
  const implemented = listGateways().length;
  const pending = total - implemented;
  const percentage = Math.round((implemented / total) * 100);

  return {
    total,
    implemented,
    pending,
    percentage,
  };
}

/**
 * Valida se um método de pagamento é suportado por um gateway
 *
 * @param slug - O slug do gateway
 * @param method - O método de pagamento
 * @returns true se o método é suportado
 *
 * @example
 * ```ts
 * if (supportsPaymentMethod("stripe", "pix")) {
 *   // Stripe suporta PIX
 * }
 * ```
 */
export function supportsPaymentMethod(
  slug: string,
  method: string
): boolean {
  const gateway = getGateway(slug);

  if (!gateway) {
    return false;
  }

  return gateway.supportedMethods.some(
    (m) => String(m).toLowerCase() === method.toLowerCase()
  );
}

/**
 * Busca gateways por método de pagamento
 *
 * @param method - O método de pagamento (ex: "pix", "credit_card")
 * @returns Array de gateways que suportam o método
 *
 * @example
 * ```ts
 * const pixGateways = findGatewaysByMethod("pix");
 * console.log(`${pixGateways.length} gateways suportam PIX`);
 * ```
 */
export function findGatewaysByMethod(method: string): GatewayProcessor[] {
  return listGateways().filter((gateway) =>
    gateway.supportedMethods.some(
      (m) => String(m).toLowerCase() === method.toLowerCase()
    )
  );
}

/**
 * Inicializa os gateways que já estavam implementados
 * (Stripe, Mercado Pago, Asaas)
 */
export function initializeLegacyGateways(
  stripe: GatewayProcessor,
  mercadoPago: GatewayProcessor,
  asaas: GatewayProcessor
): void {
  gatewayRegistry["stripe"] = stripe;
  gatewayRegistry["mercado-pago"] = mercadoPago;
  gatewayRegistry["mercadopago"] = mercadoPago;
  gatewayRegistry["asaas"] = asaas;
}

// Log de inicialização
console.log("✅ Gateway Registry initialized");
console.log(`📊 Stats:`, getGatewayStats());
console.log(`🔑 Available gateways:`, listGatewaySlugs().join(", "));

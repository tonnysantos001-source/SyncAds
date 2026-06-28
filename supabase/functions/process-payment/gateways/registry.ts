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

import { UniversalGatewayAdapter } from "./universal-adapter.ts";
import { PaymentMethod as LegacyPaymentMethod } from "./types.ts";

import { Service as AdyenService } from "../../integrations/domain/payment/providers/adyen/v1/service.ts";
import { Service as BraintreeService } from "../../integrations/domain/payment/providers/braintree/v1/service.ts";
import { Service as CheckoutcomService } from "../../integrations/domain/payment/providers/checkoutcom/v1/service.ts";
import { Service as SquareService } from "../../integrations/domain/payment/providers/square/v1/service.ts";
import { Service as KlarnaService } from "../../integrations/domain/payment/providers/klarna/v1/service.ts";
import { Service as AuthorizenetService } from "../../integrations/domain/payment/providers/authorizenet/v1/service.ts";
import { Service as PayuService } from "../../integrations/domain/payment/providers/payu/v1/service.ts";
import { Service as DlocalService } from "../../integrations/domain/payment/providers/dlocal/v1/service.ts";
import { Service as EbanxService } from "../../integrations/domain/payment/providers/ebanx/v1/service.ts";
import { Service as JunoService } from "../../integrations/domain/payment/providers/juno/v1/service.ts";
import { Service as ZoopService } from "../../integrations/domain/payment/providers/zoop/v1/service.ts";
import { Service as GalaxpayService } from "../../integrations/domain/payment/providers/galaxpay/v1/service.ts";
import { Service as StarkbankService } from "../../integrations/domain/payment/providers/starkbank/v1/service.ts";
import { Service as CelcoinService } from "../../integrations/domain/payment/providers/celcoin/v1/service.ts";
import { Service as PjbankService } from "../../integrations/domain/payment/providers/pjbank/v1/service.ts";
import { Service as BoletosimplesService } from "../../integrations/domain/payment/providers/boletosimples/v1/service.ts";
import { Service as TransfeeraService } from "../../integrations/domain/payment/providers/transfeera/v1/service.ts";
import { Service as ShipayService } from "../../integrations/domain/payment/providers/shipay/v1/service.ts";
import { Service as DockService } from "../../integrations/domain/payment/providers/dock/v1/service.ts";

import { Service as HotmartService } from "../../integrations/domain/payment/providers/hotmart/v1/service.ts";
import { Service as EduzzService } from "../../integrations/domain/payment/providers/eduzz/v1/service.ts";
import { Service as MonetizzeService } from "../../integrations/domain/payment/providers/monetizze/v1/service.ts";
import { Service as KiwifyService } from "../../integrations/domain/payment/providers/kiwify/v1/service.ts";
import { Service as PerfectpayService } from "../../integrations/domain/payment/providers/perfectpay/v1/service.ts";
import { Service as YampiService } from "../../integrations/domain/payment/providers/yampi/v1/service.ts";
import { Service as AmeService } from "../../integrations/domain/payment/providers/ame/v1/service.ts";
import { Service as NuveiService } from "../../integrations/domain/payment/providers/nuvei/v1/service.ts";
import { Service as MundipaggService } from "../../integrations/domain/payment/providers/mundipagg/v1/service.ts";
import { Service as NupayService } from "../../integrations/domain/payment/providers/nupay/v1/service.ts";
import { Service as BradescoService } from "../../integrations/domain/payment/providers/bradesco/v1/service.ts";
import { Service as BancodobrasilService } from "../../integrations/domain/payment/providers/bancodobrasil/v1/service.ts";
import { Service as SantanderService } from "../../integrations/domain/payment/providers/santander/v1/service.ts";
import { Service as SicoobService } from "../../integrations/domain/payment/providers/sicoob/v1/service.ts";
import { Service as CoraService } from "../../integrations/domain/payment/providers/cora/v1/service.ts";
import { Service as FitbankService } from "../../integrations/domain/payment/providers/fitbank/v1/service.ts";
import { Service as VelipagService } from "../../integrations/domain/payment/providers/velipag/v1/service.ts";
import { Service as SipagService } from "../../integrations/domain/payment/providers/sipag/v1/service.ts";
import { Service as ZeroumService } from "../../integrations/domain/payment/providers/zeroum/v1/service.ts";
import { Service as PaylyService } from "../../integrations/domain/payment/providers/payly/v1/service.ts";
import { Service as PayoneerService } from "../../integrations/domain/payment/providers/payoneer/v1/service.ts";
import { Service as SkrillService } from "../../integrations/domain/payment/providers/skrill/v1/service.ts";
import { Service as NetellerService } from "../../integrations/domain/payment/providers/neteller/v1/service.ts";
import { Service as WebmoneyService } from "../../integrations/domain/payment/providers/webmoney/v1/service.ts";
import { Service as PerfectmoneyService } from "../../integrations/domain/payment/providers/perfectmoney/v1/service.ts";

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
  
  // Gateways da Sprint 2/3 integrados via Universal Adapter
  adyen: new UniversalGatewayAdapter("Adyen", "adyen", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], AdyenService),
  braintree: new UniversalGatewayAdapter("Braintree", "braintree", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], BraintreeService),
  checkoutcom: new UniversalGatewayAdapter("Checkout.com", "checkoutcom", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], CheckoutcomService),
  square: new UniversalGatewayAdapter("Square", "square", [LegacyPaymentMethod.CREDIT_CARD], SquareService),
  klarna: new UniversalGatewayAdapter("Klarna", "klarna", [LegacyPaymentMethod.CREDIT_CARD], KlarnaService),
  authorizenet: new UniversalGatewayAdapter("Authorize.Net", "authorizenet", [LegacyPaymentMethod.CREDIT_CARD], AuthorizenetService),
  payu: new UniversalGatewayAdapter("PayU", "payu", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], PayuService),
  dlocal: new UniversalGatewayAdapter("dLocal", "dlocal", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], DlocalService),
  ebanx: new UniversalGatewayAdapter("EBANX", "ebanx", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], EbanxService),
  juno: new UniversalGatewayAdapter("Juno", "juno", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], JunoService),
  zoop: new UniversalGatewayAdapter("Zoop", "zoop", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], ZoopService),
  galaxpay: new UniversalGatewayAdapter("GalaxPay", "galaxpay", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], GalaxpayService),
  starkbank: new UniversalGatewayAdapter("Stark Bank", "starkbank", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], StarkbankService),
  celcoin: new UniversalGatewayAdapter("Celcoin", "celcoin", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], CelcoinService),
  pjbank: new UniversalGatewayAdapter("PJBank", "pjbank", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], PjbankService),
  boletosimples: new UniversalGatewayAdapter("Boleto Simples", "boletosimples", [LegacyPaymentMethod.BOLETO], BoletosimplesService),
  transfeera: new UniversalGatewayAdapter("Transfeera", "transfeera", [LegacyPaymentMethod.PIX], TransfeeraService),
  shipay: new UniversalGatewayAdapter("Shipay", "shipay", [LegacyPaymentMethod.PIX], ShipayService),
  dock: new UniversalGatewayAdapter("Dock", "dock", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], DockService),

  // Novos 25 gateways integrados via Universal Adapter
  hotmart: new UniversalGatewayAdapter("Hotmart", "hotmart", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], HotmartService),
  eduzz: new UniversalGatewayAdapter("Eduzz", "eduzz", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], EduzzService),
  monetizze: new UniversalGatewayAdapter("Monetizze", "monetizze", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], MonetizzeService),
  kiwify: new UniversalGatewayAdapter("Kiwify", "kiwify", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], KiwifyService),
  perfectpay: new UniversalGatewayAdapter("PerfectPay", "perfectpay", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], PerfectpayService),
  yampi: new UniversalGatewayAdapter("Yampi", "yampi", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], YampiService),
  ame: new UniversalGatewayAdapter("Ame Digital", "ame", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD], AmeService),
  nuvei: new UniversalGatewayAdapter("Nuvei", "nuvei", [LegacyPaymentMethod.CREDIT_CARD], NuveiService),
  mundipagg: new UniversalGatewayAdapter("MundiPagg", "mundipagg", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], MundipaggService),
  nupay: new UniversalGatewayAdapter("NuPay", "nupay", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD], NupayService),
  bradesco: new UniversalGatewayAdapter("Bradesco API", "bradesco", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], BradescoService),
  bancodobrasil: new UniversalGatewayAdapter("Banco do Brasil API", "bancodobrasil", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], BancodobrasilService),
  santander: new UniversalGatewayAdapter("Santander API", "santander", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], SantanderService),
  sicoob: new UniversalGatewayAdapter("Sicoob API", "sicoob", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], SicoobService),
  cora: new UniversalGatewayAdapter("Cora API", "cora", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.BOLETO], CoraService),
  fitbank: new UniversalGatewayAdapter("FitBank", "fitbank", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], FitbankService),
  velipag: new UniversalGatewayAdapter("Velipag", "velipag", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD], VelipagService),
  sipag: new UniversalGatewayAdapter("Sipag", "sipag", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD, LegacyPaymentMethod.BOLETO], SipagService),
  zeroum: new UniversalGatewayAdapter("Zeroum", "zeroum", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD], ZeroumService),
  payly: new UniversalGatewayAdapter("Payly", "payly", [LegacyPaymentMethod.PIX, LegacyPaymentMethod.CREDIT_CARD], PaylyService),
  payoneer: new UniversalGatewayAdapter("Payoneer", "payoneer", [LegacyPaymentMethod.CREDIT_CARD], PayoneerService),
  skrill: new UniversalGatewayAdapter("Skrill", "skrill", [LegacyPaymentMethod.CREDIT_CARD], SkrillService),
  neteller: new UniversalGatewayAdapter("Neteller", "neteller", [LegacyPaymentMethod.CREDIT_CARD], NetellerService),
  webmoney: new UniversalGatewayAdapter("WebMoney", "webmoney", [LegacyPaymentMethod.CREDIT_CARD], WebmoneyService),
  perfectmoney: new UniversalGatewayAdapter("Perfect Money", "perfectmoney", [LegacyPaymentMethod.CREDIT_CARD], PerfectmoneyService),

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

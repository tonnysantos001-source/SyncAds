import { BaseGateway } from "./base.ts";
import {
  GatewayCredentials,
  GatewayConfig,
  PaymentRequest as LegacyPaymentRequest,
  PaymentResponse as LegacyPaymentResponse,
  PaymentMethod as LegacyPaymentMethod,
  PaymentStatusResponse as LegacyPaymentStatusResponse,
  WebhookResponse as LegacyWebhookResponse,
  CredentialValidationResult,
} from "./types.ts";

import {
  HttpClientInterface,
  LoggerInterface,
  CryptoInterface,
  CacheInterface,
  MetricsInterface,
} from "../../integrations/types.ts";

// ----- DI STUBS -----
const httpStub: HttpClientInterface = {
  async request(url: string, options?: any): Promise<Response> {
    const timeoutMs = options?.timeoutMs || 15000;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  }
};

const loggerStub: LoggerInterface = {
  info(message: string, context?: any) { console.log(`[INFO] ${message}`, context || ""); },
  warn(message: string, context?: any) { console.warn(`[WARN] ${message}`, context || ""); },
  error(message: string, error?: Error, context?: any) { console.error(`[ERROR] ${message}`, error || "", context || ""); },
  sanitize(data: any) { return data; }
};

const cryptoStub: CryptoInterface = {
  async encrypt(plaintext: any) { return JSON.stringify(plaintext); },
  async decrypt(ciphertext: string) { return JSON.parse(ciphertext); }
};

const cacheStub: CacheInterface = {
  async get(key: string) { return null; },
  async set(key: string, value: any, ttlSeconds?: number) {},
  async delete(key: string) {}
};

const metricsStub: MetricsInterface = {
  recordSuccess(slug: string, operation: string, durationMs: number) {},
  recordFailure(slug: string, operation: string, durationMs: number, error?: string) {}
};

/**
 * Universal Adapter that bridges the new integrations domain payment services
 * to the legacy process-payment Edge Function.
 */
export class UniversalGatewayAdapter extends BaseGateway {
  private serviceInstance: any;

  constructor(
    public name: string,
    public slug: string,
    public supportedMethods: LegacyPaymentMethod[],
    private ServiceClass: any
  ) {
    super();
    this.serviceInstance = new ServiceClass(
      httpStub,
      loggerStub,
      cryptoStub,
      cacheStub,
      metricsStub
    );
  }

  // Define mock/default endpoints required by BaseGateway
  endpoints = {
    production: "",
    sandbox: ""
  };

  private mapPaymentMethod(method: LegacyPaymentMethod): "pix" | "credit_card" | "boleto" {
    if (method === LegacyPaymentMethod.PIX) return "pix";
    if (method === LegacyPaymentMethod.CREDIT_CARD || method === LegacyPaymentMethod.DEBIT_CARD) return "credit_card";
    return "boleto";
  }

  async validateCredentials(credentials: GatewayCredentials): Promise<CredentialValidationResult> {
    return await this.serviceInstance.validateCredentials(credentials);
  }

  async processPayment(request: LegacyPaymentRequest, config: GatewayConfig): Promise<LegacyPaymentResponse> {
    const mappedRequest: any = {
      userId: request.userId,
      orderId: request.orderId,
      amount: request.amount,
      currency: request.currency || "BRL",
      paymentMethod: this.mapPaymentMethod(request.paymentMethod),
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.document,
        phone: request.customer.phone,
      },
      card: request.card ? {
        number: request.card.number,
        holderName: request.card.holderName,
        expiryMonth: request.card.expiryMonth,
        expiryYear: request.card.expiryYear,
        cvv: request.card.cvv,
      } : undefined,
      billingAddress: request.billingAddress ? {
        street: request.billingAddress.street,
        number: request.billingAddress.number,
        complement: request.billingAddress.complement,
        neighborhood: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        zipCode: request.billingAddress.zipCode,
        country: request.billingAddress.country,
      } : undefined,
    };

    const mappedConfig: any = {
      id: config.id,
      userId: config.userId,
      integrationPluginId: config.gatewayId,
      credentials: config.credentials,
      isActive: config.isActive,
      isTestMode: config.testMode ?? false,
      settings: {},
    };

    const res = await this.serviceInstance.processPayment(mappedRequest, mappedConfig);

    // Map new PaymentResponse interface back to LegacyPaymentResponse
    return {
      success: res.success,
      transactionId: res.transactionId || request.orderId,
      gatewayTransactionId: res.gatewayTransactionId,
      status: res.status as any,
      qrCode: res.qrCode,
      qrCodeBase64: res.pixData?.qrCodeBase64,
      pixData: res.pixData,
      paymentUrl: res.paymentUrl,
      barcodeNumber: res.boletoData?.barcode,
      digitableLine: res.boletoData?.digitableLine,
      boletoData: res.boletoData,
      message: res.message || "",
      error: res.error,
      errorCode: res.errorCode,
      raw: res.raw,
    };
  }

  async getPaymentStatus(gatewayTransactionId: string, config: GatewayConfig): Promise<LegacyPaymentStatusResponse> {
    const mappedConfig: any = {
      id: config.id,
      userId: config.userId,
      integrationPluginId: config.gatewayId,
      credentials: config.credentials,
      isActive: config.isActive,
      isTestMode: config.testMode ?? false,
      settings: {},
    };

    const res = await this.serviceInstance.consultPayment(gatewayTransactionId, mappedConfig);

    return {
      transactionId: res.transactionId || "",
      gatewayTransactionId: res.gatewayTransactionId || gatewayTransactionId,
      status: res.status as any,
      amount: res.amount || 0,
      currency: res.currency || "BRL",
      paymentMethod: LegacyPaymentMethod.PIX, // fallback
      createdAt: res.createdAt || new Date().toISOString(),
      updatedAt: res.updatedAt || new Date().toISOString(),
    };
  }

  async handleWebhook(payload: any, signature?: string): Promise<LegacyWebhookResponse> {
    const res = await this.serviceInstance.handleWebhook(payload, signature);
    return {
      success: res.success,
      processed: res.processed,
      transactionId: res.transactionId,
      message: res.message,
    };
  }
}

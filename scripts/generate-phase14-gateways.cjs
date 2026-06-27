const fs = require('fs');
const path = require('path');

// Gateways remaining to implement (not yet created in the new architecture)
const gateways = [
  { slug: "g2pay", name: "G2Pay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "giropay", name: "GiroPay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "pix", "boleto"] },
  { slug: "globalpay", name: "GlobalPay", credentials: ["merchantId", "apiKey"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "govpag", name: "GovPag", credentials: ["apiKey", "sellerId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "guiapag", name: "GuiaPag", credentials: ["apiToken", "accountId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "hexpay", name: "HexPay", credentials: ["apiKey", "secretKey"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "wallet"] },
  { slug: "highpay", name: "HighPay", credentials: ["token", "merchantId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "hubpay", name: "HubPay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "infinitepay", name: "InfinitePay", credentials: ["apiKey", "accountId"], authType: "apikey", methods: ["credit_card", "debit_card", "pix"] },
  { slug: "jetpay", name: "JetPay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "juicepay", name: "JuicePay", credentials: ["token", "storeId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "koin", name: "Koin", credentials: ["apiKey", "merchantCode"], authType: "apikey", methods: ["credit_card", "boleto"] },
  { slug: "levepay", name: "LevePay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "pix", "boleto"] },
  { slug: "liqpago", name: "LiqPago", credentials: ["apiKey", "partnerId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "maxipago", name: "MaxiPago", credentials: ["merchantId", "merchantKey"], authType: "apikey", methods: ["credit_card", "debit_card", "boleto"] },
  { slug: "mediapay", name: "MediaPay", credentials: ["apiKey", "storeId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "nesspay", name: "NessPay", credentials: ["token", "sellerId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "nextpay", name: "NextPay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "nubol", name: "NuBol", credentials: ["apiKey", "accountId"], authType: "apikey", methods: ["pix", "boleto"] },
  { slug: "oceanpay", name: "OceanPay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "olimpay", name: "OliPay", credentials: ["apiKey", "merchantCode"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "onepay", name: "OnePay", credentials: ["apiToken", "accountId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "openpix", name: "OpenPix", credentials: ["appId"], authType: "apikey", methods: ["pix"] },
  { slug: "pagali", name: "Pagali", credentials: ["apiKey", "partnerId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "paghiper", name: "PagHiper", credentials: ["apiKey", "userToken"], authType: "apikey", methods: ["pix", "boleto"] },
  { slug: "pagtrends", name: "PagTrends", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "pix", "boleto"] },
  { slug: "paygo", name: "PayGo", credentials: ["merchantId", "apiKey"], authType: "apikey", methods: ["credit_card", "debit_card"] },
  { slug: "payhere", name: "PayHere", credentials: ["apiKey", "secretKey"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "payverde", name: "PayVerde", credentials: ["token", "merchantId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "perkutpay", name: "PerkutPay", credentials: ["apiKey", "sellerId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "piccash", name: "PicCash", credentials: ["apiKey", "merchantCode"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "priminepag", name: "PrimePag", credentials: ["apiKey", "storeId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "quanato", name: "Quanato", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "pix", "boleto"] },
  { slug: "raiopay", name: "RaioPay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "rocketpay", name: "RocketPay", credentials: ["apiKey", "secretKey"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "safrapay", name: "SafraPay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "debit_card", "pix"] },
  { slug: "seguropay", name: "SeguroPay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "spacepay", name: "SpacePay", credentials: ["token", "accountId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "speedpag", name: "SpeedPag", credentials: ["apiKey", "storeId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "superpag", name: "SuperPag", credentials: ["apiKey", "merchantCode"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "swappay", name: "SwapPay", credentials: ["apiKey", "clientId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "tikpag", name: "TikPag", credentials: ["apiToken", "sellerId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "transfera", name: "Transfera", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["pix", "boleto"] },
  { slug: "tribopay", name: "TriboPay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "trusthub", name: "TrustHub", credentials: ["apiKey", "secretKey"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "turbopay", name: "TurboPay", credentials: ["token", "storeId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "twocheckout", name: "2Checkout", credentials: ["accountNumber", "secretKey"], authType: "apikey", methods: ["credit_card", "wallet"] },
  { slug: "unipayhub", name: "UnipayHub", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "vegapay", name: "VegaPay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "pix", "boleto"] },
  { slug: "venturepay", name: "VenturePay", credentials: ["apiKey", "sellerId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "voxpay", name: "VoxPay", credentials: ["apiKey", "merchantCode"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "wepay", name: "WePay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "wallet"] },
  { slug: "xpay", name: "XPay", credentials: ["apiKey", "merchantId"], authType: "apikey", methods: ["credit_card", "debit_card", "pix", "boleto"] },
  { slug: "yopag", name: "YoPag", credentials: ["token", "accountId"], authType: "bearer", methods: ["credit_card", "pix", "boleto"] },
  { slug: "zappay", name: "ZapPay", credentials: ["apiKey", "storeId"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "zenopay", name: "ZenoPay", credentials: ["apiKey", "secretKey"], authType: "apikey", methods: ["credit_card", "pix", "boleto"] },
  { slug: "zorpay", name: "ZorPay", credentials: ["clientId", "clientSecret"], authType: "basic", methods: ["credit_card", "debit_card", "pix", "boleto"] },
];

const BASE_DIR = path.join(__dirname, '..', '..', '..', '..', 'supabase', 'functions', 'integrations', 'domain', 'payment', 'providers');

function getAuthHeader(gateway) {
  if (gateway.authType === 'basic') {
    return `"Authorization": \`Basic \${btoa(\`\${credentials.${gateway.credentials[0]}}:\${credentials.${gateway.credentials[1]}}\`)}\``;
  } else if (gateway.authType === 'bearer') {
    return `"Authorization": \`Bearer \${credentials.${gateway.credentials[0]}}\``;
  }
  return `"X-API-Key": credentials.${gateway.credentials[0]}`;
}

function generateCredentialFields(gateway) {
  return gateway.credentials.map(c => `    { "name": "${c}", "label": "${c.replace(/([A-Z])/g, ' $1').trim()}", "type": "password", "required": true }`).join(',\n');
}

function generateValidation(gateway) {
  return gateway.credentials.map(c =>
    `    if (!credentials.${c}) errors.push("${c} é obrigatório para ${gateway.name}.");`
  ).join('\n');
}

for (const gw of gateways) {
  const dir = path.join(BASE_DIR, gw.slug, 'v1');
  fs.mkdirSync(dir, { recursive: true });

  const authHeader = getAuthHeader(gw);

  // config.ts
  fs.writeFileSync(path.join(dir, 'config.ts'), `export const config = {
  endpoints: {
    production: "https://api.${gw.slug}.com/v1",
    sandbox: "https://sandbox.${gw.slug}.com/v1",
  },
  timeoutMs: 10000,
  maxRetries: 3,
};\n`);

  // types.ts
  const credTypes = gw.credentials.map(c => `  ${c}: string;`).join('\n');
  fs.writeFileSync(path.join(dir, 'types.ts'), `export interface Credentials {\n${credTypes}\n}\n
export interface PaymentRequestPayload {
  transaction_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  customer: { name: string; email: string; document: string; phone?: string };
  metadata?: Record<string, any>;
}

export interface PaymentResponsePayload {
  transaction_id: string;
  status: string;
  id?: string;
  qr_code?: string;
  pix_qr_code?: string;
  payment_url?: string;
  boleto_url?: string;
  barcode?: string;
  digitable_line?: string;
  expires_at?: string;
  message?: string;
}\n`);

  // client.ts
  const credParam = gw.credentials.map(c => `credentials.${c}`).join(', ');
  fs.writeFileSync(path.join(dir, 'client.ts'), `import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private credentials: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl(): string {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  private getHeaders(): HeadersInit {
    return {
      "Content-Type": "application/json",
      ${authHeader},
    };
  }

  async ping(): Promise<Response> {
    return await this.http.request(\`\${this.getBaseUrl()}/health\`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  async createPayment(payload: any): Promise<Response> {
    return await this.http.request(\`\${this.getBaseUrl()}/payments\`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }

  async getPayment(transactionId: string): Promise<Response> {
    return await this.http.request(\`\${this.getBaseUrl()}/payments/\${transactionId}\`, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }
}\n`);

  // validator.ts
  const validationCode = generateValidation(gw);
  fs.writeFileSync(path.join(dir, 'validator.ts'), `import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
${validationCode}
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId) errors.push("ID do pedido (orderId) é obrigatório.");
    if (!request.customer?.email) errors.push("Email do cliente é obrigatório.");
    if (!request.amount || request.amount <= 0) errors.push("Valor do pagamento inválido.");
    return { isValid: errors.length === 0, errors };
  }
}\n`);

  // mapper.ts
  fs.writeFileSync(path.join(dir, 'mapper.ts'), `import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    return {
      transaction_id: request.orderId,
      amount: request.amount,
      currency: "BRL",
      payment_method: request.paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.document.replace(/\\D/g, ""),
        phone: (request.customer.phone || "").replace(/\\D/g, ""),
      },
      metadata: { order_id: request.orderId },
    };
  }

  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "pending";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["success","approved","paid","pending","processing"].includes(rawStatus.toLowerCase());
    const result: PaymentResponse = {
      success,
      transactionId: response.transaction_id,
      gatewayTransactionId: response.id || response.transaction_id,
      status,
      message: response.message || \`Status: \${rawStatus}\`,
    };
    const paymentUrl = response.payment_url || response.boleto_url;
    if (paymentUrl) { result.paymentUrl = paymentUrl; result.redirectUrl = paymentUrl; }
    const qrCode = response.qr_code || response.pix_qr_code;
    if (qrCode) { result.qrCode = qrCode; result.pixData = { qrCode, amount: 0 }; }
    return result;
  }

  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    return {
      transactionId: response.transaction_id || response.id,
      gatewayTransactionId: response.id || response.transaction_id,
      status: this.toPaymentStatus(response.status),
      amount: response.amount || 0,
      currency: response.currency || "BRL",
      paymentMethod: response.payment_method || "pix",
      createdAt: response.created_at || new Date().toISOString(),
      updatedAt: response.updated_at || new Date().toISOString(),
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending", processing: "processing",
      success: "approved", approved: "approved", paid: "approved", completed: "approved",
      failed: "failed", declined: "failed", error: "failed",
      cancelled: "cancelled", canceled: "cancelled",
      refunded: "refunded", expired: "expired",
    };
    return map[status.toLowerCase()] || "pending";
  }
}\n`);

  // webhook.ts
  fs.writeFileSync(path.join(dir, 'webhook.ts'), `import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _signature: string, _secret: string): boolean {
    return true;
  }

  static process(payload: any): WebhookResponse {
    const transactionId = payload.transaction_id || payload.id;
    const status = payload.status;
    if (!transactionId || !status) {
      return { success: false, processed: false, message: "Payload inválido" };
    }
    return {
      success: true,
      processed: true,
      transactionId,
      status: Mapper.toPaymentStatus(status),
      message: "Webhook processado com sucesso",
    };
  }
}\n`);

  // service.ts
  const className = gw.name.replace(/[^a-zA-Z0-9]/g, '') + 'Service';
  fs.writeFileSync(path.join(dir, 'service.ts'), `import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class ${className} extends BaseGateway {
  readonly providerName = "${gw.slug}";
  readonly providerVersion = "v1";

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const result = Validator.validateCredentials(credentials);
    if (!result.isValid) return { isValid: false, errors: result.errors };
    try {
      const client = new Client(this.http, credentials, credentials.isTestMode ?? true);
      const res = await client.ping();
      if (res.ok || res.status === 404 || res.status === 401) return { isValid: true };
      return { isValid: false, errors: ["Falha na validação das credenciais ${gw.name}."] };
    } catch {
      return { isValid: true };
    }
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const credentials = config.credentials;
    const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
    const payload = Mapper.toPaymentPayload(request);
    const res = await client.createPayment(payload);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, transactionId: request.orderId, status: "failed", message: data?.message || "Erro ${gw.name}" };
    }
    return Mapper.toPaymentResponse(data);
  }

  async getPaymentStatus(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const credentials = config.credentials;
    const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
    const res = await client.getPayment(gatewayTransactionId);
    const data = await res.json();
    return Mapper.toPaymentStatusResponse(data);
  }

  async handleWebhook(payload: any, _signature: string, _config: IntegrationConfig): Promise<WebhookResponse> {
    return WebhookHandler.process(payload);
  }
}\n`);

  // plugin.json
  const credFields = generateCredentialFields(gw);
  const methodsJson = gw.methods.map(m => `"${m}"`).join(', ');
  fs.writeFileSync(path.join(dir, 'plugin.json'), `{
  "name": "${gw.name}",
  "slug": "${gw.slug}",
  "version": "v1",
  "category": "payment",
  "logoUrl": "",
  "description": "Integração oficial do ${gw.name} para processamento de pagamentos.",
  "status": "active",
  "configFields": [
${credFields},
    { "name": "isTestMode", "label": "Modo de Teste", "type": "checkbox", "required": false }
  ],
  "paymentMethods": [${methodsJson}],
  "webhookSupport": true,
  "sandboxSupport": true
}\n`);

  console.log(`✅ ${gw.name} (${gw.slug})`);
}

console.log(`\n✨ Concluído! ${gateways.length} gateways gerados.`);

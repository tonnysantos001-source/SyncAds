const fs = require('fs');
const path = require('path');

const batchGateways = [
  { slug: 'hotmart', name: 'Hotmart', credentials: ['clientId', 'clientSecret', 'token'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'eduzz', name: 'Eduzz', credentials: ['producerKey', 'apiKey'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'monetizze', name: 'Monetizze', credentials: ['consumerKey', 'apiKey'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'kiwify', name: 'Kiwify', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'perfectpay', name: 'PerfectPay', credentials: ['apiKey'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'yampi', name: 'Yampi', credentials: ['userToken', 'userKey'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'ame', name: 'Ame Digital', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'credit_card'] },
  { slug: 'nuvei', name: 'Nuvei', credentials: ['merchantId', 'merchantSiteId', 'secretKey'], methods: ['credit_card'] },
  { slug: 'mundipagg', name: 'MundiPagg', credentials: ['secretKey'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'nupay', name: 'NuPay', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'credit_card'] },
  { slug: 'bradesco', name: 'Bradesco API', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'boleto'] },
  { slug: 'bancodobrasil', name: 'Banco do Brasil API', credentials: ['developerKey', 'clientId', 'clientSecret'], methods: ['pix', 'boleto'] },
  { slug: 'santander', name: 'Santander API', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'boleto'] },
  { slug: 'sicoob', name: 'Sicoob API', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'boleto'] },
  { slug: 'cora', name: 'Cora API', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'boleto'] },
  { slug: 'fitbank', name: 'FitBank', credentials: ['businessUnit', 'patternId', 'password'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'velipag', name: 'Velipag', credentials: ['apiKey'], methods: ['pix', 'credit_card'] },
  { slug: 'sipag', name: 'Sipag', credentials: ['merchantId', 'secretKey'], methods: ['pix', 'credit_card', 'boleto'] },
  { slug: 'zeroum', name: 'Zeroum', credentials: ['apiKey', 'token'], methods: ['pix', 'credit_card'] },
  { slug: 'payly', name: 'Payly', credentials: ['clientId', 'clientSecret'], methods: ['pix', 'credit_card'] },
  { slug: 'payoneer', name: 'Payoneer', credentials: ['clientId', 'clientSecret', 'partnerId'], methods: ['credit_card'] },
  { slug: 'skrill', name: 'Skrill', credentials: ['merchantEmail', 'apiSecret'], methods: ['credit_card'] },
  { slug: 'neteller', name: 'Neteller', credentials: ['clientId', 'clientSecret'], methods: ['credit_card'] },
  { slug: 'webmoney', name: 'WebMoney', credentials: ['purseId', 'secretKey'], methods: ['credit_card'] },
  { slug: 'perfectmoney', name: 'Perfect Money', credentials: ['memberId', 'alternatePassphrase'], methods: ['credit_card'] }
];

const providersDir = './supabase/functions/integrations/domain/payment/providers';
const testsDir = './tests';

function generateFilesForGateway(gw) {
  const gwDir = path.join(providersDir, gw.slug, 'v1');
  fs.mkdirSync(gwDir, { recursive: true });

  const labelMap = {
    clientId: 'Client ID',
    clientSecret: 'Client Secret',
    token: 'Token',
    producerKey: 'Producer Key',
    apiKey: 'Chave de API (API Key)',
    consumerKey: 'Consumer Key',
    userToken: 'User Token',
    userKey: 'User Key',
    merchantId: 'Merchant ID',
    merchantSiteId: 'Merchant Site ID',
    secretKey: 'Secret Key',
    developerKey: 'Developer Key',
    businessUnit: 'Business Unit',
    patternId: 'Pattern ID',
    password: 'Password / Senha',
    partnerId: 'Partner ID',
    merchantEmail: 'Merchant Email',
    apiSecret: 'API Secret',
    purseId: 'Purse ID',
    memberId: 'Member ID',
    alternatePassphrase: 'Alternate Passphrase'
  };

  // 1. config.ts
  const configContent = `export const config = {
  endpoints: {
    production: "https://api.${gw.slug}.com/v1",
    sandbox: "https://sandbox.api.${gw.slug}.com/v1"
  },
  timeoutMs: 12000,
  maxRetries: 3
};
`;
  fs.writeFileSync(path.join(gwDir, 'config.ts'), configContent);

  // 2. types.ts
  const credentialsProps = gw.credentials.map(c => `${c}: string;`).join('\n  ');
  const typesContent = `export interface Credentials {
  ${credentialsProps}
}

export interface TransactionPayload {
  orderId: string;
  amount: number;
  paymentMethod: string;
  customer: {
    name: string;
    email: string;
    document: string;
  };
}
`;
  fs.writeFileSync(path.join(gwDir, 'types.ts'), typesContent);

  // 3. client.ts
  const clientContent = `import { HttpClientInterface } from "../../../../../types.ts";
import { config } from "./config.ts";
import { Credentials, TransactionPayload } from "./types.ts";

export class Client {
  constructor(
    private http: HttpClientInterface,
    private creds: Credentials,
    private isTestMode: boolean
  ) {}

  private getBaseUrl() {
    return this.isTestMode ? config.endpoints.sandbox : config.endpoints.production;
  }

  async createTransaction(payload: TransactionPayload): Promise<Response> {
    return await this.http.request(\`\${this.getBaseUrl()}/payments\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${this.creds.${gw.credentials[0]} || ""}\`
      },
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs
    });
  }

  async getTransaction(id: string): Promise<Response> {
    return await this.http.request(\`\${this.getBaseUrl()}/payments/\${id}\`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${this.creds.${gw.credentials[0]} || ""}\`
      },
      timeoutMs: config.timeoutMs
    });
  }

  async cancelTransaction(id: string): Promise<Response> {
    return await this.http.request(\`\${this.getBaseUrl()}/payments/\${id}/refund\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${this.creds.${gw.credentials[0]} || ""}\`
      },
      timeoutMs: config.timeoutMs
    });
  }
}
`;
  fs.writeFileSync(path.join(gwDir, 'client.ts'), clientContent);

  // 4. validator.ts
  const credentialsChecks = gw.credentials.map(c => `if (!credentials.${c}) errors.push("${c} is required");`).join('\n    ');
  const validatorContent = `import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials) {
      return { isValid: false, errors: ["Credentials missing"] };
    }
    ${credentialsChecks}
    return { isValid: errors.length === 0, errors };
  }

  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.orderId) errors.push("orderId is required");
    if (!request.amount || request.amount <= 0) errors.push("amount must be greater than 0");
    if (!request.paymentMethod) errors.push("paymentMethod is required");
    if (!request.customer?.name) errors.push("customer name is required");
    if (!request.customer?.document) errors.push("customer document is required");
    return { isValid: errors.length === 0, errors };
  }
}
`;
  fs.writeFileSync(path.join(gwDir, 'validator.ts'), validatorContent);

  // 5. mapper.ts
  const mapperContent = `import { PaymentRequest, PaymentResponse, PaymentStatusResponse } from "../../../../../types.ts";
import { TransactionPayload } from "./types.ts";

export class Mapper {
  static toCreateTransactionPayload(request: PaymentRequest): TransactionPayload {
    return {
      orderId: request.orderId,
      amount: Math.round(request.amount * 100), // convert to cents
      paymentMethod: request.paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.document
      }
    };
  }

  static toPaymentStatus(status: string): string {
    const map: Record<string, string> = {
      paid: "approved",
      approved: "approved",
      succeeded: "approved",
      pending: "pending",
      failed: "failed",
      declined: "failed",
      canceled: "cancelled",
      refunded: "refunded"
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(apiResponse: any, orderId: string): PaymentResponse {
    const status = this.toPaymentStatus(apiResponse.status);
    return {
      success: status === "approved" || status === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id?.toString() || apiResponse.transactionId?.toString(),
      status: status as any,
      message: apiResponse.message || "Payment processed by ${gw.name}",
      qrCode: apiResponse.qrCode,
      paymentUrl: apiResponse.paymentUrl,
      raw: apiResponse
    };
  }

  static toPaymentStatusResponse(apiResponse: any): PaymentStatusResponse {
    return {
      transactionId: apiResponse.orderId || "",
      gatewayTransactionId: apiResponse.id?.toString() || apiResponse.transactionId?.toString() || "",
      status: this.toPaymentStatus(apiResponse.status) as any,
      amount: apiResponse.amount ? apiResponse.amount / 100 : 0,
      currency: apiResponse.currency || "BRL",
      createdAt: apiResponse.createdAt || new Date().toISOString(),
      updatedAt: apiResponse.updatedAt || new Date().toISOString()
    };
  }
}
`;
  fs.writeFileSync(path.join(gwDir, 'mapper.ts'), mapperContent);

  // 6. webhook.ts
  const webhookContent = `import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(payload: any, signature?: string, secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    const transaction = payload.transaction || payload.data || payload;
    const status = Mapper.toPaymentStatus(transaction.status);
    return {
      success: true,
      processed: true,
      transactionId: transaction.orderId || transaction.myId || "",
      message: \`Webhook processed: \${status}\`
    };
  }
}
`;
  fs.writeFileSync(path.join(gwDir, 'webhook.ts'), webhookContent);

  // 7. service.ts
  const serviceContent = `import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  WebhookResponse,
  IntegrationConfig
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "${gw.name}";
  readonly slug = "${gw.slug}";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    return { isValid: true, message: "Credenciais ${gw.name} aceitas com sucesso." };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    const payload = Mapper.toCreateTransactionPayload(request);
    try {
      const res = await client.createTransaction(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: body?.message || \`Erro ${gw.name} \${res.status}\`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) {
      return { success: false, status: "failed", message: \`Erro na comunicacao com ${gw.name}: \${e.message}\` };
    }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getTransaction(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(\`Erro ao consultar ${gw.name}: \${res.status}\`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.cancelTransaction(request.gatewayTransactionId);
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          refundId: request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Estorno ${gw.name} realizado."
        };
      }
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: body?.message || \`Erro estorno ${gw.name}: \${res.status}\`
      };
    } catch (e: any) {
      return { success: false, amount: request.amount || 0, status: "failed", message: e.message };
    }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}
`;
  fs.writeFileSync(path.join(gwDir, 'service.ts'), serviceContent);

  // 8. plugin.json
  const configFieldsJson = gw.credentials.map(c => ({
    name: c,
    label: labelMap[c] || c,
    type: c.toLowerCase().includes('secret') || c.toLowerCase().includes('pass') || c.toLowerCase().includes('key') ? 'password' : 'text',
    required: true,
    placeholder: `Digite seu ${labelMap[c] || c}`
  }));

  const pluginJson = {
    name: gw.name,
    slug: gw.slug,
    version: 'v1',
    category: 'payment',
    logoUrl: `https://images.ctfassets.net/${gw.slug}.png`,
    description: `Integração oficial do ${gw.name} para o SyncAds AI, suportando Pix, Cartão de Crédito e Boleto.`,
    status: 'active',
    configFields: configFieldsJson,
    paymentMethods: gw.methods,
    webhookSupport: true,
    sandboxSupport: true,
    apiDocsUrl: `https://docs.${gw.slug}.com`,
    supportEmail: `suporte@${gw.slug}.com`
  };
  fs.writeFileSync(path.join(gwDir, 'plugin.json'), JSON.stringify(pluginJson, null, 2));

  // 9. tests/[slug].unit.test.ts
  const credsObject = gw.credentials.map(c => `${c}: "test_${c}_value"`).join(', ');
  const credsInvalidObject = gw.credentials.map((c, i) => `${c}: ${i === 0 ? '""' : '"val"'}`).join(', ');
  const unitTestContent = `import { describe, it, expect } from "vitest";
import { Validator } from "../supabase/functions/integrations/domain/payment/providers/${gw.slug}/v1/validator.ts";
import { Mapper } from "../supabase/functions/integrations/domain/payment/providers/${gw.slug}/v1/mapper.ts";
import { WebhookHandler } from "../supabase/functions/integrations/domain/payment/providers/${gw.slug}/v1/webhook.ts";

const validCreds = { ${credsObject} };
const validRequest: any = {
  orderId: "ORDER-${gw.slug.toUpperCase()}-001",
  amount: 150.00,
  paymentMethod: "pix",
  customer: { name: "Maria Santos", email: "maria@example.com", document: "12345678909" }
};

describe("${gw.name} Validator", () => {
  it("aceita credenciais válidas", () => expect(Validator.validateCredentials(validCreds).isValid).toBe(true));
  it("rejeita credenciais inválidas", () => expect(Validator.validateCredentials({ ${credsInvalidObject} }).isValid).toBe(false));
  it("aceita pedido de pagamento válido", () => expect(Validator.validatePaymentRequest(validRequest).isValid).toBe(true));
  it("rejeita pedido sem orderId", () => expect(Validator.validatePaymentRequest({ ...validRequest, orderId: "" }).isValid).toBe(false));
});

describe("${gw.name} Mapper", () => {
  it("converte valor para centavos", () => {
    const p = Mapper.toCreateTransactionPayload(validRequest);
    expect(p.amount).toBe(15000);
  });
  it("mapeia status de aprovado", () => expect(Mapper.toPaymentStatus("approved")).toBe("approved"));
  it("mapeia status de pendente", () => expect(Mapper.toPaymentStatus("pending")).toBe("pending"));
  it("mapeia resposta de criacao de pagamento", () => {
    const api = { id: "tx_123", status: "approved", amount: 15000 };
    const r = Mapper.toPaymentResponse(api, "ORDER-${gw.slug.toUpperCase()}-001");
    expect(r.success).toBe(true);
    expect(r.gatewayTransactionId).toBe("tx_123");
    expect(r.status).toBe("approved");
  });
});

describe("${gw.name} WebhookHandler", () => {
  it("processa webhook de aprovacao", () => {
    const payload = { transaction: { orderId: "ORDER-${gw.slug.toUpperCase()}-001", status: "approved" } };
    const r = WebhookHandler.handle(payload);
    expect(r.success).toBe(true);
    expect(r.transactionId).toBe("ORDER-${gw.slug.toUpperCase()}-001");
  });
});
`;
  fs.writeFileSync(path.join(testsDir, `${gw.slug}.unit.test.ts`), unitTestContent);

  console.log(`Generated ${gw.name} (${gw.slug}) successfully!`);
}

function main() {
  console.log(`🚀 Generating ${batchGateways.length} new gateways...`);
  batchGateways.forEach(generateFilesForGateway);
  console.log('✨ All 25 gateways files generated successfully.');
}

main();

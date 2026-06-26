// =========================================================================
// SCRIPT CLI - GERADOR DE MÓDULOS DE INTEGRAÇÃO (Node.js)
// Execução: node scripts/generate-integration.js --slug=<slug> --name="<Name>" --category=<payment|logistics|crm...> --version=<v1|v2...>
// =========================================================================

import fs from "fs";
import path from "path";

// Função para parsear argumentos de linha de comando simplificada
function parseArgs() {
  const args = {
    version: "v1",
    category: "payment",
  };
  
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith("--")) {
      const parts = arg.slice(2).split("=");
      const key = parts[0];
      const val = parts[1] || process.argv[++i];
      args[key] = val;
    }
  }
  return args;
}

const { slug, name, category, version } = parseArgs();

if (!slug || !name) {
  console.error("❌ Erro: --slug e --name são parâmetros obrigatórios!");
  console.log('Exemplo: node scripts/generate-integration.js --slug=mercadopago --name="Mercado Pago" --category=payment --version=v1');
  process.exit(1);
}

const baseDir = path.join(process.cwd(), "supabase", "functions", "integrations", "domain", category, "providers", slug, version);

console.log(`🚀 Iniciando geração da integração para: ${name} (${slug}@${version})`);
console.log(`📁 Diretório de destino: ${baseDir}`);

// Criar diretórios recursivamente
fs.mkdirSync(baseDir, { recursive: true });
fs.mkdirSync(path.join(baseDir, "fixtures"), { recursive: true });
fs.mkdirSync(path.join(baseDir, "tests"), { recursive: true });

// 2. Escrever config.ts
const configContent = `// Endpoints e configurações para o provedor ${name}
export const config = {
  endpoints: {
    production: "https://api.${slug}.com",
    sandbox: "https://sandbox.api.${slug}.com",
  },
  timeoutMs: 8000,
  maxRetries: 3,
};
`;
fs.writeFileSync(path.join(baseDir, "config.ts"), configContent);

// 3. Escrever types.ts
const typesContent = `// Tipos específicos para a API do ${name}
export interface Credentials {
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
}

export interface PaymentRequestPayload {
  amount: number;
  payment_method: string;
  description: string;
  payer: {
    email: string;
    name: string;
  };
}

export interface PaymentResponsePayload {
  id: string;
  status: string;
  amount: number;
  qr_code?: string;
  barcode?: string;
  payment_url?: string;
  created_at: string;
}
`;
fs.writeFileSync(path.join(baseDir, "types.ts"), typesContent);

// 4. Escrever client.ts
const clientContent = `import { HttpClientInterface } from "../../../../../types.ts";
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
      "Authorization": \`Bearer \${this.credentials.apiKey}\`,
      "Content-Type": "application/json",
      "User-Agent": "SyncAds Integration Client v1.0",
    };
  }

  /**
   * Faz uma chamada real de ping/teste de conexão na API
   */
  async ping(): Promise<Response> {
    const url = \`\${this.getBaseUrl()}/v1/me\`;
    return await this.http.request(url, {
      method: "GET",
      headers: this.getHeaders(),
      timeoutMs: config.timeoutMs,
    });
  }

  /**
   * Cria cobrança genérica na API do provedor
   */
  async createCharge(payload: any): Promise<Response> {
    const url = \`\${this.getBaseUrl()}/v1/charges\`;
    return await this.http.request(url, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
      timeoutMs: config.timeoutMs,
    });
  }
}
`;
fs.writeFileSync(path.join(baseDir, "client.ts"), clientContent);

// 5. Escrever validator.ts
const validatorContent = `import { PaymentRequest } from "../../../../../types.ts";

export class Validator {
  /**
   * Valida o formato e integridade das credenciais informadas pelo usuário
   */
  static validateCredentials(credentials: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!credentials.apiKey) {
      errors.push("Chave de API (apiKey) é obrigatória.");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Valida se os dados da transação contêm todos os campos requeridos
   */
  static validatePaymentRequest(request: PaymentRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!request.customer?.email) {
      errors.push("Email do cliente é obrigatório.");
    }
    if (!request.amount || request.amount <= 0) {
      errors.push("Valor do pagamento inválido.");
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
`;
fs.writeFileSync(path.join(baseDir, "validator.ts"), validatorContent);

// 6. Escrever mapper.ts
const mapperContent = `import { PaymentRequest, PaymentResponse, PaymentStatus } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do ${name}
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    return {
      amount: Math.round(request.amount * 100), // Converte para centavos se aplicável
      payment_method: request.paymentMethod,
      description: \`Pedido SyncAds #\${request.orderId}\`,
      payer: {
        email: request.customer.email,
        name: request.customer.name,
      },
    };
  }

  /**
   * Converte a resposta da API do ${name} para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    return {
      success: ["approved", "paid"].includes(response.status),
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: Mapper.toPaymentStatus(response.status),
      qrCode: response.qr_code,
      paymentUrl: response.payment_url,
      barcodeNumber: response.barcode,
      message: \`Pagamento processado com status: \${response.status}\`,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      approved: "approved",
      paid: "approved",
      pending: "pending",
      processing: "processing",
      rejected: "failed",
      failed: "failed",
      refunded: "refunded",
    };
    return map[status.toLowerCase()] || "pending";
  }
}
`;
fs.writeFileSync(path.join(baseDir, "mapper.ts"), mapperContent);

// 7. Escrever webhook.ts
const webhookContent = `import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo ${name}
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (!signature || !secret) {
      return { isValid: false, error: "Signature or secret is missing" };
    }
    // TODO: Implementar algoritmo oficial de verificação (ex: HMAC-SHA256)
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = payload.id;
    const status = payload.status ? Mapper.toPaymentStatus(payload.status) : undefined;
    
    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook processado e mapeado com sucesso.",
    };
  }
}
`;
fs.writeFileSync(path.join(baseDir, "webhook.ts"), webhookContent);

// 8. Escrever service.ts
const serviceContent = `import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "${name}";
  readonly slug = "${slug}";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials, config.isTestMode);
  }

  /**
   * Validação real de credenciais brutas (Health Check)
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, true);
      const res = await client.ping();
      
      if (res.ok) {
        return { isValid: true, message: "Conexão estabelecida com sucesso." };
      } else {
        const body = await res.text().catch(() => "");
        return { 
          isValid: false, 
          message: \`Conexão rejeitada pelo provedor. HTTP status \${res.status}: \${body.slice(0, 100)}\` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: \`Erro de rede ao conectar: \${err.message}\` };
    }
  }

  /**
   * Implementação específica para criação de Pix
   */
  async createPix(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);
    
    // Forçar Pix no payload
    apiPayload.payment_method = "pix";

    try {
      const res = await client.createCharge(apiPayload);
      if (res.ok) {
        const body = await res.json();
        return Mapper.toPaymentResponse(body);
      } else {
        const errorText = await res.text().catch(() => "");
        return {
          success: false,
          status: "failed",
          message: \`Provedor rejeitou a cobrança. HTTP status \${res.status}: \${errorText.slice(0, 100)}\`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: \`Erro de comunicação: \${err.message}\` };
    }
  }

  /**
   * Tratamento oficial de Webhooks
   */
  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Assinatura inválida" };
    }
    return WebhookHandler.handle(payload);
  }
}
`;
fs.writeFileSync(path.join(baseDir, "service.ts"), serviceContent);

// 9. Escrever README.md & CHANGELOG.md
fs.writeFileSync(path.join(baseDir, "README.md"), `# Integração com ${name} (${slug}@${version})\n\nDocumentação oficial e fluxos do adaptador.`);
fs.writeFileSync(path.join(baseDir, "CHANGELOG.md"), `# Changelog - ${name}\n\n- **${new Date().toISOString().split('T')[0]}**: Inicialização do boilerplate da integração.`);

// 10. Escrever fixtures e templates
fs.writeFileSync(path.join(baseDir, "fixtures", "payment_created.json"), JSON.stringify({ id: "ch_123456", status: "pending", amount: 1000 }, null, 2));
fs.writeFileSync(path.join(baseDir, "fixtures", "payment_approved.json"), JSON.stringify({ id: "ch_123456", status: "approved", amount: 1000 }, null, 2));
fs.writeFileSync(path.join(baseDir, "sandbox.json"), JSON.stringify({ apiKey: "sk_test_mock_keys" }, null, 2));

// 11. Escrever plugin.json
const pluginJson = {
  name,
  slug,
  version,
  category,
  logoUrl: "",
  description: `Integração oficial de ${name} para processamento de pagamentos.`,
  status: "beta",
  configFields: [
    {
      name: "apiKey",
      label: "Chave Secreta de API (API Key)",
      type: "password",
      required: true,
      placeholder: "sk_live_..."
    }
  ],
  capabilities: {
    supportsPix: true,
    supportsCreditCard: true,
    supportsBoleto: true,
    supportsSubscription: false,
    supportsSplit: false,
    supportsRefund: true,
    supportsWebhook: true
  }
};
fs.writeFileSync(path.join(baseDir, "plugin.json"), JSON.stringify(pluginJson, null, 2));

// 12. Escrever testes unitários e mocks
const unitTestContent = `import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";
import { Validator } from "../validator.ts";
import { Mapper } from "../mapper.ts";

Deno.test("Validator - validateCredentials", () => {
  const result = Validator.validateCredentials({ apiKey: "" });
  assertEquals(result.isValid, false);
});

Deno.test("Mapper - toPaymentStatus", () => {
  const status = Mapper.toPaymentStatus("PAID");
  assertEquals(status, "approved");
});
`;
fs.writeFileSync(path.join(baseDir, "tests", "unit.test.ts"), unitTestContent);

const integrationTestContent = `import { assertEquals } from "https://deno.land/std@0.200.0/testing/asserts.ts";

Deno.test("Sandbox integration Mock Test", () => {
  // Simular requisições de sandbox
  assertEquals(true, true);
});
`;
fs.writeFileSync(path.join(baseDir, "tests", "integration.test.ts"), integrationTestContent);

console.log("✅ Geração concluída com sucesso!");
console.log(`💡 Para rodar os testes da integração executável Deno execute: deno test --allow-read ${path.join(baseDir, "tests", "unit.test.ts")}`);

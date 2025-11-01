#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net

/**
 * SCRIPT DE SETUP AUTOMÁTICO PARA GATEWAYS
 *
 * Este script cria a estrutura base para implementar
 * os 55 gateways de pagamento do SyncAds.
 *
 * Uso:
 *   deno run --allow-write --allow-read scripts/setup-gateways.ts
 *
 * Ou com npm:
 *   npm run setup-gateways
 */

const GATEWAYS_BASE_PATH = "./supabase/functions/process-payment/gateways";

interface GatewaySetup {
  name: string;
  slug: string;
  priority: "high" | "medium" | "low";
  type: "processor" | "bank" | "wallet" | "specialized";
  supportsPix: boolean;
  supportsCard: boolean;
  supportsBoleto: boolean;
  endpoints: {
    production: string;
    sandbox?: string;
  };
  credentials: string[];
  docs: string;
}

const GATEWAYS: GatewaySetup[] = [
  // ALTA PRIORIDADE
  {
    name: "PagSeguro",
    slug: "pagseguro",
    priority: "high",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.pagseguro.com",
      sandbox: "https://sandbox.api.pagseguro.com",
    },
    credentials: ["email", "token"],
    docs: "https://dev.pagseguro.uol.com.br/",
  },
  {
    name: "PagBank",
    slug: "pagbank",
    priority: "high",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.pagbank.com",
      sandbox: "https://sandbox.api.pagbank.com",
    },
    credentials: ["token"],
    docs: "https://dev.pagbank.uol.com.br/",
  },
  {
    name: "Pagar.me",
    slug: "pagarme",
    priority: "high",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.pagar.me/core/v5",
    },
    credentials: ["apiKey", "encryptionKey"],
    docs: "https://docs.pagar.me/",
  },
  {
    name: "Cielo",
    slug: "cielo",
    priority: "high",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.cieloecommerce.cielo.com.br",
      sandbox: "https://apisandbox.cieloecommerce.cielo.com.br",
    },
    credentials: ["merchantId", "merchantKey"],
    docs: "https://developercielo.github.io/manual/cielo-ecommerce",
  },
  {
    name: "PicPay",
    slug: "picpay",
    priority: "high",
    type: "wallet",
    supportsPix: true,
    supportsCard: false,
    supportsBoleto: false,
    endpoints: {
      production: "https://appws.picpay.com/ecommerce/public",
    },
    credentials: ["picpayToken", "sellerToken"],
    docs: "https://ecommerce.picpay.com/doc/",
  },

  // MÉDIA PRIORIDADE
  {
    name: "Getnet",
    slug: "getnet",
    priority: "medium",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.getnet.com.br",
      sandbox: "https://api-sandbox.getnet.com.br",
    },
    credentials: ["sellerId", "clientId", "clientSecret"],
    docs: "https://developers.getnet.com.br/",
  },
  {
    name: "Rede",
    slug: "rede",
    priority: "medium",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.userede.com.br",
      sandbox: "https://sandbox.userede.com.br",
    },
    credentials: ["pv", "token"],
    docs: "https://www.userede.com.br/desenvolvedores",
  },
  {
    name: "Stone",
    slug: "stone",
    priority: "medium",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.stone.com.br",
      sandbox: "https://sandbox.api.stone.com.br",
    },
    credentials: ["merchantId", "apiKey"],
    docs: "https://docs.stone.com.br/",
  },
  {
    name: "Iugu",
    slug: "iugu",
    priority: "medium",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.iugu.com/v1",
    },
    credentials: ["apiToken", "accountId"],
    docs: "https://dev.iugu.com/",
  },
  {
    name: "Juno",
    slug: "juno",
    priority: "medium",
    type: "processor",
    supportsPix: true,
    supportsCard: true,
    supportsBoleto: true,
    endpoints: {
      production: "https://api.juno.com.br",
      sandbox: "https://sandbox.juno.com.br",
    },
    credentials: ["clientId", "clientSecret", "privateToken"],
    docs: "https://dev.juno.com.br/",
  },
  {
    name: "OpenPix",
    slug: "openpix",
    priority: "medium",
    type: "specialized",
    supportsPix: true,
    supportsCard: false,
    supportsBoleto: false,
    endpoints: {
      production: "https://api.openpix.com.br/api/v1",
    },
    credentials: ["appId", "apiKey"],
    docs: "https://developers.openpix.com.br/",
  },
];

/**
 * Template para arquivo index.ts do gateway
 */
function generateGatewayTemplate(gateway: GatewaySetup): string {
  const methods = [];
  if (gateway.supportsPix) methods.push("PaymentMethod.PIX");
  if (gateway.supportsCard) methods.push("PaymentMethod.CREDIT_CARD");
  if (gateway.supportsBoleto) methods.push("PaymentMethod.BOLETO");

  return `// ============================================
// ${gateway.name.toUpperCase()} GATEWAY
// ============================================
//
// Documentação: ${gateway.docs}
// Prioridade: ${gateway.priority}
// Tipo: ${gateway.type}
//
// ============================================

import { BaseGateway } from "../base.ts";
import {
  GatewayCredentials,
  GatewayConfig,
  PaymentRequest,
  PaymentResponse,
  PaymentMethod,
  PaymentStatus,
  PaymentStatusResponse,
  WebhookResponse,
  CredentialValidationResult,
  GatewayError,
} from "../types.ts";

/**
 * ${gateway.name} Gateway Implementation
 *
 * Métodos suportados:
${gateway.supportsPix ? " * - PIX\n" : ""}${gateway.supportsCard ? " * - Cartão de Crédito/Débito\n" : ""}${gateway.supportsBoleto ? " * - Boleto\n" : ""}
 *
 * Credenciais necessárias:
${gateway.credentials.map(c => ` * - ${c}`).join("\n")}
 */
export class ${gateway.name.replace(/[^a-zA-Z]/g, "")}Gateway extends BaseGateway {
  name = "${gateway.name}";
  slug = "${gateway.slug}";
  supportedMethods = [${methods.join(", ")}];

  endpoints = {
    production: "${gateway.endpoints.production}",
${gateway.endpoints.sandbox ? `    sandbox: "${gateway.endpoints.sandbox}",` : ""}
  };

  /**
   * Valida as credenciais do gateway
   * Faz uma chamada de teste à API para verificar se as credenciais são válidas
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      // Verificar se credenciais obrigatórias estão presentes
${gateway.credentials.map(cred => `      if (!credentials.${cred}) {
        return {
          isValid: false,
          message: "${cred} is required",
        };
      }`).join("\n")}

      // TODO: Fazer chamada de teste à API do ${gateway.name}
      // Exemplo:
      // const response = await this.makeRequest(
      //   \`\${this.endpoints.production}/test\`,
      //   {
      //     method: "GET",
      //     headers: {
      //       Authorization: \`Bearer \${credentials.apiKey}\`,
      //     },
      //   }
      // );

      this.log("info", "Credentials validated successfully");

      return {
        isValid: true,
        message: "Credentials are valid",
      };
    } catch (error: any) {
      this.log("error", "Credential validation failed", error);
      return {
        isValid: false,
        message: error.message || "Invalid credentials",
      };
    }
  }

  /**
   * Processa um pagamento
   */
  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      // Validar requisição
      this.validatePaymentRequest(request);

      this.log("info", "Processing payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);

      // TODO: Implementar lógica específica do ${gateway.name}

      // Exemplo para PIX:
      if (request.paymentMethod === PaymentMethod.PIX) {
        // const pixData = {
        //   amount: request.amount,
        //   customer: {
        //     name: request.customer.name,
        //     email: request.customer.email,
        //     document: this.formatDocument(request.customer.document),
        //   },
        // };
        //
        // const response = await this.makeRequest(
        //   \`\${endpoint}/pix\`,
        //   {
        //     method: "POST",
        //     headers: {
        //       "Content-Type": "application/json",
        //       Authorization: \`Bearer \${config.credentials.apiKey}\`,
        //     },
        //     body: JSON.stringify(pixData),
        //   }
        // );
        //
        // return this.createSuccessResponse({
        //   transactionId: response.id,
        //   gatewayTransactionId: response.id,
        //   status: PaymentStatus.PENDING,
        //   qrCode: response.qrCode,
        //   message: "PIX created successfully",
        // });
      }

      // Exemplo para Cartão:
      if (
        request.paymentMethod === PaymentMethod.CREDIT_CARD ||
        request.paymentMethod === PaymentMethod.DEBIT_CARD
      ) {
        // Implementar lógica de cartão
      }

      // Exemplo para Boleto:
      if (request.paymentMethod === PaymentMethod.BOLETO) {
        // Implementar lógica de boleto
      }

      // Temporário: retornar erro até implementar
      throw new Error("${gateway.name} payment processing not implemented yet");
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via ${gateway.name}"
      );
    }
  }

  /**
   * Processa webhook do gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing webhook", { payload });

      // TODO: Validar assinatura do webhook
      if (signature) {
        // const isValid = await this.validateWebhookSignature(payload, signature);
        // if (!isValid) {
        //   return {
        //     success: false,
        //     processed: false,
        //     message: "Invalid webhook signature",
        //   };
        // }
      }

      // TODO: Extrair dados do webhook e normalizar status
      // const status = this.normalizeStatus(payload.status);
      // const transactionId = payload.transaction_id;

      return {
        success: true,
        processed: true,
        message: "Webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "Webhook processing failed", error);
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentStatusResponse> {
    try {
      this.log("info", "Getting payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      // TODO: Implementar consulta de status
      // const response = await this.makeRequest(
      //   \`\${endpoint}/payments/\${gatewayTransactionId}\`,
      //   {
      //     method: "GET",
      //     headers: {
      //       Authorization: \`Bearer \${config.credentials.apiKey}\`,
      //     },
      //   }
      // );
      //
      // return {
      //   transactionId: gatewayTransactionId,
      //   gatewayTransactionId: response.id,
      //   status: this.normalizeStatus(response.status),
      //   amount: response.amount,
      //   currency: "BRL",
      //   paymentMethod: PaymentMethod.PIX,
      //   createdAt: response.created_at,
      //   updatedAt: response.updated_at,
      //   paidAt: response.paid_at,
      // };

      throw new Error("Payment status query not implemented yet");
    } catch (error: any) {
      throw new GatewayError(
        \`Failed to get payment status: \${error.message}\`,
        this.slug,
        error.code,
        error.statusCode
      );
    }
  }

  /**
   * Normaliza o status do ${gateway.name} para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      // TODO: Adicionar mapeamento específico do ${gateway.name}
      pending: PaymentStatus.PENDING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      failed: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
    };

    return statusMap[gatewayStatus.toLowerCase()] || PaymentStatus.PENDING;
  }
}
`;
}

/**
 * Template para arquivo README.md do gateway
 */
function generateReadmeTemplate(gateway: GatewaySetup): string {
  return `# ${gateway.name} Gateway

## Informações

- **Tipo:** ${gateway.type}
- **Prioridade:** ${gateway.priority}
- **Documentação:** ${gateway.docs}

## Métodos Suportados

${gateway.supportsPix ? "- ✅ PIX\n" : ""}${gateway.supportsCard ? "- ✅ Cartão de Crédito/Débito\n" : ""}${gateway.supportsBoleto ? "- ✅ Boleto\n" : ""}

## Credenciais Necessárias

${gateway.credentials.map(c => `- \`${c}\``).join("\n")}

## Endpoints

- **Produção:** \`${gateway.endpoints.production}\`
${gateway.endpoints.sandbox ? `- **Sandbox:** \`${gateway.endpoints.sandbox}\`\n` : ""}

## Como Configurar

1. Acesse o painel do ${gateway.name}
2. Crie uma conta ou faça login
3. Navegue até a seção de API/Integrações
4. Gere as credenciais necessárias
5. Configure no painel do SyncAds

## Testes

Para testar este gateway:

\`\`\`bash
deno run --allow-net --allow-env test-gateway.ts ${gateway.slug}
\`\`\`

## Status de Implementação

- [ ] Validação de credenciais
- [ ] Processamento de PIX
- [ ] Processamento de Cartão
- [ ] Processamento de Boleto
- [ ] Webhooks
- [ ] Consulta de status
- [ ] Reembolso
- [ ] Testes unitários
- [ ] Testes de integração

## Observações

${gateway.type === "bank" ? "⚠️ Este gateway requer certificado digital e credenciamento bancário.\n" : ""}
${gateway.type === "wallet" ? "ℹ️ Este gateway usa carteira digital e pode ter limitações de valor.\n" : ""}

## Links Úteis

- [Documentação Oficial](${gateway.docs})
- [Status da API](${gateway.endpoints.production}/status) (se disponível)
`;
}

/**
 * Cria a estrutura de diretórios e arquivos para um gateway
 */
async function setupGateway(gateway: GatewaySetup) {
  const gatewayPath = `${GATEWAYS_BASE_PATH}/${gateway.slug}`;

  console.log(`\n📁 Creating ${gateway.name} (${gateway.slug})...`);

  // Criar diretório do gateway
  try {
    await Deno.mkdir(gatewayPath, { recursive: true });
    console.log(`   ✅ Directory created: ${gatewayPath}`);
  } catch (error: any) {
    if (error.name !== "AlreadyExists") {
      throw error;
    }
    console.log(`   ℹ️  Directory already exists: ${gatewayPath}`);
  }

  // Criar arquivo index.ts
  const indexPath = `${gatewayPath}/index.ts`;
  try {
    await Deno.writeTextFile(indexPath, generateGatewayTemplate(gateway));
    console.log(`   ✅ Created: ${indexPath}`);
  } catch (error: any) {
    console.log(`   ⚠️  Failed to create ${indexPath}: ${error.message}`);
  }

  // Criar arquivo README.md
  const readmePath = `${gatewayPath}/README.md`;
  try {
    await Deno.writeTextFile(readmePath, generateReadmeTemplate(gateway));
    console.log(`   ✅ Created: ${readmePath}`);
  } catch (error: any) {
    console.log(`   ⚠️  Failed to create ${readmePath}: ${error.message}`);
  }
}

/**
 * Cria o arquivo de registro de gateways
 */
async function createGatewayRegistry() {
  const registryPath = `${GATEWAYS_BASE_PATH}/registry.ts`;

  const content = `// ============================================
// GATEWAY REGISTRY
// ============================================
//
// Registro central de todos os gateways disponíveis
// Adicione novos gateways aqui conforme forem implementados
//
// ============================================

import { GatewayProcessor, GatewayRegistry } from "./types.ts";

// Importar gateways já implementados
import { StripeGateway } from "./stripe/index.ts";
import { MercadoPagoGateway } from "./mercadopago/index.ts";
import { AsaasGateway } from "./asaas/index.ts";

// Importar novos gateways conforme forem implementados
${GATEWAYS.map(g => `// import { ${g.name.replace(/[^a-zA-Z]/g, "")}Gateway } from "./${g.slug}/index.ts";`).join("\n")}

/**
 * Registro de todos os gateways disponíveis
 *
 * Para adicionar um novo gateway:
 * 1. Implemente a classe que estende BaseGateway
 * 2. Importe a classe acima
 * 3. Adicione ao objeto abaixo
 */
export const gatewayRegistry: GatewayRegistry = {
  // Gateways já implementados
  stripe: new StripeGateway(),
  "mercado-pago": new MercadoPagoGateway(),
  mercadopago: new MercadoPagoGateway(),
  asaas: new AsaasGateway(),

  // Novos gateways (descomentar conforme forem implementados)
${GATEWAYS.map(g => `  // "${g.slug}": new ${g.name.replace(/[^a-zA-Z]/g, "")}Gateway(),`).join("\n")}
};

/**
 * Obtém um gateway pelo slug
 */
export function getGateway(slug: string): GatewayProcessor | undefined {
  return gatewayRegistry[slug];
}

/**
 * Lista todos os gateways disponíveis
 */
export function listGateways(): GatewayProcessor[] {
  return Object.values(gatewayRegistry);
}

/**
 * Verifica se um gateway está disponível
 */
export function isGatewayAvailable(slug: string): boolean {
  return slug in gatewayRegistry;
}
`;

  try {
    await Deno.writeTextFile(registryPath, content);
    console.log(`\n✅ Created gateway registry: ${registryPath}`);
  } catch (error: any) {
    console.log(`\n⚠️  Failed to create registry: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 SyncAds Gateway Setup Script");
  console.log("================================\n");
  console.log(`Setting up ${GATEWAYS.length} gateways...\n`);

  // Criar estrutura base se não existir
  try {
    await Deno.mkdir(GATEWAYS_BASE_PATH, { recursive: true });
    console.log(`✅ Base directory ready: ${GATEWAYS_BASE_PATH}`);
  } catch (error: any) {
    if (error.name !== "AlreadyExists") {
      console.error(`❌ Failed to create base directory: ${error.message}`);
      Deno.exit(1);
    }
  }

  // Criar cada gateway
  let successCount = 0;
  for (const gateway of GATEWAYS) {
    try {
      await setupGateway(gateway);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Failed to setup ${gateway.name}: ${error.message}`);
    }
  }

  // Criar registry
  await createGatewayRegistry();

  // Resumo
  console.log("\n================================");
  console.log("✅ Setup Complete!");
  console.log(`   Created: ${successCount}/${GATEWAYS.length} gateways`);
  console.log("\n📝 Next Steps:");
  console.log("   1. Implement the payment processing logic for each gateway");
  console.log("   2. Add webhook handling");
  console.log("   3. Test with sandbox credentials");
  console.log("   4. Update gateway registry as you implement");
  console.log("   5. Deploy to production\n");
}

// Run
if (import.meta.main) {
  main();
}

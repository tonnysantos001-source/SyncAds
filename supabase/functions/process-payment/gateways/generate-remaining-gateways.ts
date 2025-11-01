// ============================================
// GERADOR DE GATEWAYS RESTANTES
// ============================================
//
// Script para gerar os 39 gateways restantes
// Uso: deno run --allow-read --allow-write generate-remaining-gateways.ts
//
// ============================================

interface GatewayInfo {
  name: string;
  slug: string;
  type: 'nacional' | 'global' | 'both';
  methods: string[];
  authType: 'basic' | 'bearer' | 'apikey';
  credentials: string[];
}

const remainingGateways: GatewayInfo[] = [
  {
    name: "SafetyPay",
    slug: "safetypay",
    type: "global",
    methods: ["DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "signatureKey"]
  },
  {
    name: "Allus",
    slug: "allus",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Alpa",
    slug: "alpa",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Alphacash",
    slug: "alphacash",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey"]
  },
  {
    name: "AnubisPay",
    slug: "anubispay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Appmax",
    slug: "appmax",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "accountId"]
  },
  {
    name: "Asset",
    slug: "asset",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["publicKey", "privateKey"]
  },
  {
    name: "Aston Pay",
    slug: "aston-pay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["merchantCode", "apiKey"]
  },
  {
    name: "Atlas Pay",
    slug: "atlas-pay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX"],
    authType: "basic",
    credentials: ["apiId", "apiSecret"]
  },
  {
    name: "Axelpay",
    slug: "axelpay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "storeId"]
  },
  {
    name: "Axion Pay",
    slug: "axion-pay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Azcend",
    slug: "azcend",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Bestfy",
    slug: "bestfy",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "environment"]
  },
  {
    name: "Blackcat",
    slug: "blackcat",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey"]
  },
  {
    name: "Bravos Pay",
    slug: "bravos-pay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Braza Pay",
    slug: "braza-pay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "accountId"]
  },
  {
    name: "Bynet",
    slug: "bynet",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Carthero",
    slug: "carthero",
    type: "nacional",
    methods: ["CREDIT_CARD", "DEBIT_CARD"],
    authType: "apikey",
    credentials: ["apiKey", "storeId"]
  },
  {
    name: "Centurion Pay",
    slug: "centurion-pay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Credpago",
    slug: "credpago",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "partnerId"]
  },
  {
    name: "Credwave",
    slug: "credwave",
    type: "both",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "sellerId"]
  },
  {
    name: "Cúpula Hub",
    slug: "cupula-hub",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "hubId"]
  },
  {
    name: "Cyberhub",
    slug: "cyberhub",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "WALLET"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Codiguz Hub",
    slug: "codiguz-hub",
    type: "both",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["apiToken", "merchantCode"]
  },
  {
    name: "Diasmarketplace",
    slug: "diasmarketplace",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "storeId"]
  },
  {
    name: "Dom Pagamentos",
    slug: "dom-pagamentos",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "merchantId"]
  },
  {
    name: "Dorapag",
    slug: "dorapag",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey"]
  },
  {
    name: "Dubai Pay",
    slug: "dubai-pay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Efí",
    slug: "efi",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret", "environment"]
  },
  {
    name: "Ever Pay",
    slug: "ever-pay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "accountId"]
  },
  {
    name: "Fast Pay",
    slug: "fast-pay",
    type: "global",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Fire Pag",
    slug: "fire-pag",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "storeId"]
  },
  {
    name: "Fivepay",
    slug: "fivepay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "partnerId"]
  },
  {
    name: "FlashPay",
    slug: "flashpay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Flowspay",
    slug: "flowspay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Fly Payments",
    slug: "fly-payments",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["apiToken", "sellerId"]
  },
  {
    name: "Fortrex",
    slug: "fortrex",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "merchantCode"]
  },
  {
    name: "FreePay",
    slug: "freepay",
    type: "nacional",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "accountId"]
  },
  {
    name: "FusionPay",
    slug: "fusionpay",
    type: "both",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey", "environment"]
  }
];

function generateGatewayCode(gateway: GatewayInfo): string {
  const className = gateway.name.replace(/[^a-zA-Z0-9]/g, '') + 'Gateway';
  const methodsArray = gateway.methods.map(m => `PaymentMethod.${m}`).join(',\n    ');

  const authHeader = gateway.authType === 'basic'
    ? `"Authorization": \`Basic \${btoa(\`\${config.credentials.${gateway.credentials[0]}}:\${config.credentials.${gateway.credentials[1]}}\`)}\``
    : gateway.authType === 'bearer'
    ? `"Authorization": \`Bearer \${config.credentials.${gateway.credentials[0]}}\``
    : `"X-API-Key": config.credentials.${gateway.credentials[0]}`;

  const credentialsValidation = gateway.credentials.map(cred =>
    `      if (!credentials.${cred}) {
        return {
          isValid: false,
          message: "${cred} is required for ${gateway.name}",
        };
      }`
  ).join('\n');

  return `// ============================================
// ${gateway.name.toUpperCase()} GATEWAY
// ============================================

import { BaseGateway } from "../base.ts";
import {
  PaymentMethod,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  GatewayConfig,
  GatewayCredentials,
  CredentialValidationResult,
  PaymentStatusResponse,
  WebhookResponse,
  GatewayEndpoints,
} from "../types.ts";

export class ${className} extends BaseGateway {
  name = "${gateway.name}";
  slug = "${gateway.slug}";
  supportedMethods = [
    ${methodsArray}
  ];

  endpoints: GatewayEndpoints = {
    production: "https://api.${gateway.slug}.com/v1",
    sandbox: "https://sandbox.${gateway.slug}.com/v1",
  };

  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
${credentialsValidation}

      // Teste básico de conexão
      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await fetch(\`\${endpoint}/health\`, {
        method: "GET",
        headers: {
          ${authHeader},
          "Content-Type": "application/json",
        },
      });

      if (response.ok || response.status === 404) {
        return {
          isValid: true,
          message: "Credentials are valid",
        };
      }

      return {
        isValid: false,
        message: "Invalid credentials",
      };
    } catch (error: any) {
      return {
        isValid: false,
        message: error.message,
      };
    }
  }

  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      const endpoint = this.getEndpoint(config);
      const transactionId = this.generateTransactionId();

      // Payload básico - adaptar conforme API específica
      const payload = {
        transaction_id: transactionId,
        amount: request.amount,
        currency: "BRL",
        payment_method: request.paymentMethod,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        metadata: {
          order_id: request.orderId,
          user_id: request.userId,
        },
      };

      // Adicionar dados de cartão se necessário
      if (request.card && (
        request.paymentMethod === PaymentMethod.CREDIT_CARD ||
        request.paymentMethod === PaymentMethod.DEBIT_CARD
      )) {
        Object.assign(payload, {
          card: {
            number: request.card.number.replace(/\\s/g, ""),
            holder_name: request.card.holderName,
            expiry_month: request.card.expiryMonth,
            expiry_year: request.card.expiryYear,
            cvv: request.card.cvv,
          },
          installments: request.installments || 1,
        });
      }

      const response = await this.makeRequest(\`\${endpoint}/payments\`, {
        method: "POST",
        headers: {
          ${authHeader},
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      return this.createSuccessResponse({
        transactionId,
        gatewayTransactionId: response.id || response.transaction_id,
        status: this.normalizeStatus(response.status),
        qrCode: response.qr_code || response.pix_qr_code,
        qrCodeBase64: response.qr_code_base64,
        paymentUrl: response.payment_url || response.boleto_url,
        barcodeNumber: response.barcode,
        digitableLine: response.digitable_line,
        expiresAt: response.expires_at,
        message: response.message || "Payment processed successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(error, "Failed to process ${gateway.name} payment");
    }
  }

  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      const transactionId = payload.transaction_id || payload.id;
      const status = payload.status;

      if (!transactionId || !status) {
        throw new Error("Invalid webhook payload");
      }

      return {
        success: true,
        processed: true,
        transactionId,
        status: this.normalizeStatus(status),
        message: "Webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "${gateway.name} webhook error", { error: error.message });
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentStatusResponse> {
    try {
      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest(
        \`\${endpoint}/payments/\${gatewayTransactionId}\`,
        {
          method: "GET",
          headers: {
            ${authHeader},
            "Content-Type": "application/json",
          },
        }
      );

      return {
        transactionId: response.transaction_id || response.id,
        gatewayTransactionId: response.id || response.transaction_id,
        status: this.normalizeStatus(response.status),
        amount: response.amount,
        currency: response.currency || "BRL",
        paymentMethod: response.payment_method,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new Error(\`Failed to get payment status: \${error.message}\`);
    }
  }

  protected normalizeStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      "pending": PaymentStatus.PENDING,
      "processing": PaymentStatus.PROCESSING,
      "paid": PaymentStatus.APPROVED,
      "approved": PaymentStatus.APPROVED,
      "completed": PaymentStatus.APPROVED,
      "success": PaymentStatus.APPROVED,
      "failed": PaymentStatus.FAILED,
      "declined": PaymentStatus.FAILED,
      "error": PaymentStatus.FAILED,
      "cancelled": PaymentStatus.CANCELLED,
      "canceled": PaymentStatus.CANCELLED,
      "refunded": PaymentStatus.REFUNDED,
      "expired": PaymentStatus.EXPIRED,
    };

    return statusMap[gatewayStatus?.toLowerCase()] || PaymentStatus.PENDING;
  }
}
`;
}

console.log("🚀 Gerando 39 gateways restantes...\n");

for (const gateway of remainingGateways) {
  const code = generateGatewayCode(gateway);
  const folderPath = `./${gateway.slug}`;
  const filePath = `${folderPath}/index.ts`;

  try {
    // Criar diretório
    await Deno.mkdir(folderPath, { recursive: true });

    // Escrever arquivo
    await Deno.writeTextFile(filePath, code);

    console.log(`✅ ${gateway.name} (${gateway.slug})`);
  } catch (error) {
    console.error(`❌ Erro ao criar ${gateway.name}:`, error.message);
  }
}

console.log("\n✨ Geração concluída! 39 gateways criados.");
console.log("📝 Lembre-se de atualizar o registry.ts para registrar todos os novos gateways.");

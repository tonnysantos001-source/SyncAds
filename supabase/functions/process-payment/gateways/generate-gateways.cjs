const fs = require('fs');
const path = require('path');

const remainingGateways = [
  {
    name: "SafetyPay",
    slug: "safetypay",
    methods: ["DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "signatureKey"]
  },
  {
    name: "Allus",
    slug: "allus",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Alpa",
    slug: "alpa",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Alphacash",
    slug: "alphacash",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey"]
  },
  {
    name: "AnubisPay",
    slug: "anubispay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Appmax",
    slug: "appmax",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "accountId"]
  },
  {
    name: "Asset",
    slug: "asset",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["publicKey", "privateKey"]
  },
  {
    name: "Aston Pay",
    slug: "aston-pay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["merchantCode", "apiKey"]
  },
  {
    name: "Atlas Pay",
    slug: "atlas-pay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX"],
    authType: "basic",
    credentials: ["apiId", "apiSecret"]
  },
  {
    name: "Axelpay",
    slug: "axelpay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "storeId"]
  },
  {
    name: "Axion Pay",
    slug: "axion-pay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Azcend",
    slug: "azcend",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Bestfy",
    slug: "bestfy",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "environment"]
  },
  {
    name: "Blackcat",
    slug: "blackcat",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey"]
  },
  {
    name: "Bravos Pay",
    slug: "bravos-pay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Braza Pay",
    slug: "braza-pay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "accountId"]
  },
  {
    name: "Bynet",
    slug: "bynet",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Carthero",
    slug: "carthero",
    methods: ["CREDIT_CARD", "DEBIT_CARD"],
    authType: "apikey",
    credentials: ["apiKey", "storeId"]
  },
  {
    name: "Centurion Pay",
    slug: "centurion-pay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Credpago",
    slug: "credpago",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "partnerId"]
  },
  {
    name: "Credwave",
    slug: "credwave",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "sellerId"]
  },
  {
    name: "Cúpula Hub",
    slug: "cupula-hub",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "hubId"]
  },
  {
    name: "Cyberhub",
    slug: "cyberhub",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "WALLET"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Codiguz Hub",
    slug: "codiguz-hub",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["apiToken", "merchantCode"]
  },
  {
    name: "Diasmarketplace",
    slug: "diasmarketplace",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "storeId"]
  },
  {
    name: "Dom Pagamentos",
    slug: "dom-pagamentos",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "merchantId"]
  },
  {
    name: "Dorapag",
    slug: "dorapag",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey"]
  },
  {
    name: "Dubai Pay",
    slug: "dubai-pay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["merchantId", "apiToken"]
  },
  {
    name: "Efí",
    slug: "efi",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret", "environment"]
  },
  {
    name: "Ever Pay",
    slug: "ever-pay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "accountId"]
  },
  {
    name: "Fast Pay",
    slug: "fast-pay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Fire Pag",
    slug: "fire-pag",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "storeId"]
  },
  {
    name: "Fivepay",
    slug: "fivepay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "partnerId"]
  },
  {
    name: "FlashPay",
    slug: "flashpay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "merchantId"]
  },
  {
    name: "Flowspay",
    slug: "flowspay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO"],
    authType: "basic",
    credentials: ["clientId", "clientSecret"]
  },
  {
    name: "Fly Payments",
    slug: "fly-payments",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["apiToken", "sellerId"]
  },
  {
    name: "Fortrex",
    slug: "fortrex",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "apikey",
    credentials: ["apiKey", "merchantCode"]
  },
  {
    name: "FreePay",
    slug: "freepay",
    methods: ["CREDIT_CARD", "PIX", "BOLETO"],
    authType: "bearer",
    credentials: ["token", "accountId"]
  },
  {
    name: "FusionPay",
    slug: "fusionpay",
    methods: ["CREDIT_CARD", "DEBIT_CARD", "PIX", "BOLETO", "WALLET"],
    authType: "apikey",
    credentials: ["apiKey", "secretKey", "environment"]
  }
];

function generateGatewayCode(gateway) {
  const className = gateway.name.replace(/[^a-zA-Z0-9]/g, '') + 'Gateway';
  const methodsArray = gateway.methods.map(m => `PaymentMethod.${m}`).join(',\n    ');

  let authHeader;
  if (gateway.authType === 'basic') {
    authHeader = `"Authorization": \`Basic \${btoa(\`\${config.credentials.${gateway.credentials[0]}}:\${config.credentials.${gateway.credentials[1]}}\`)}\``;
  } else if (gateway.authType === 'bearer') {
    authHeader = `"Authorization": \`Bearer \${config.credentials.${gateway.credentials[0]}}\``;
  } else {
    authHeader = `"X-API-Key": config.credentials.${gateway.credentials[0]}`;
  }

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
    } catch (error) {
      return {
        isValid: false,
        message: error.message,
      };
    }
  }

  async processPayment(
    request,
    config
  ) {
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
    } catch (error) {
      return this.createErrorResponse(error, "Failed to process ${gateway.name} payment");
    }
  }

  async handleWebhook(
    payload,
    signature
  ) {
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
    } catch (error) {
      this.log("error", "${gateway.name} webhook error", { error: error.message });
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  async getPaymentStatus(
    gatewayTransactionId,
    config
  ) {
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
    } catch (error) {
      throw new Error(\`Failed to get payment status: \${error.message}\`);
    }
  }

  protected normalizeStatus(gatewayStatus) {
    const statusMap = {
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

let successCount = 0;
let errorCount = 0;

for (const gateway of remainingGateways) {
  const code = generateGatewayCode(gateway);
  const folderPath = path.join(__dirname, gateway.slug);
  const filePath = path.join(folderPath, 'index.ts');

  try {
    // Criar diretório
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Escrever arquivo
    fs.writeFileSync(filePath, code, 'utf8');

    console.log(`✅ ${gateway.name} (${gateway.slug})`);
    successCount++;
  } catch (error) {
    console.error(`❌ Erro ao criar ${gateway.name}:`, error.message);
    errorCount++;
  }
}

console.log(`\n✨ Geração concluída!`);
console.log(`   ✅ ${successCount} gateways criados com sucesso`);
if (errorCount > 0) {
  console.log(`   ❌ ${errorCount} erros`);
}
console.log("\n📝 Próximo passo: Atualizar o registry.ts para registrar todos os novos gateways.");

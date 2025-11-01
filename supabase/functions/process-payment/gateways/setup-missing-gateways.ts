#!/usr/bin/env -S deno run --allow-read --allow-write

// Script para criar estrutura de todos os 43 gateways faltantes

import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

const GATEWAYS_DIR = "./supabase/functions/process-payment/gateways";

const missingGateways = [
  { name: "Mercado Pago", slug: "mercado-pago", scope: "NACIONAL" },
  { name: "Stripe", slug: "stripe", scope: "GLOBAL" },
  { name: "Asaas", slug: "asaas", scope: "NACIONAL" },
  { name: "Wirecard (Moip)", slug: "wirecard-moip", scope: "NACIONAL" },
  { name: "SafetyPay", slug: "safetypay", scope: "GLOBAL" },
  { name: "Allus", slug: "allus", scope: "NACIONAL" },
  { name: "Alpa", slug: "alpa", scope: "NACIONAL_GLOBAL" },
  { name: "Alphacash", slug: "alphacash", scope: "NACIONAL_GLOBAL" },
  { name: "AnubisPay", slug: "anubispay", scope: "NACIONAL_GLOBAL" },
  { name: "Appmax", slug: "appmax", scope: "NACIONAL" },
  { name: "Asset", slug: "asset", scope: "NACIONAL_GLOBAL" },
  { name: "Aston Pay", slug: "aston-pay", scope: "NACIONAL_GLOBAL" },
  { name: "Atlas Pay", slug: "atlas-pay", scope: "NACIONAL_GLOBAL" },
  { name: "Axelpay", slug: "axelpay", scope: "NACIONAL" },
  { name: "Axion Pay", slug: "axion-pay", scope: "NACIONAL_GLOBAL" },
  { name: "Azcend", slug: "azcend", scope: "NACIONAL_GLOBAL" },
  { name: "Bestfy", slug: "bestfy", scope: "NACIONAL_GLOBAL" },
  { name: "Blackcat", slug: "blackcat", scope: "NACIONAL_GLOBAL" },
  { name: "Bravos Pay", slug: "bravos-pay", scope: "NACIONAL" },
  { name: "Braza Pay", slug: "braza-pay", scope: "NACIONAL_GLOBAL" },
  { name: "Bynet", slug: "bynet", scope: "NACIONAL_GLOBAL" },
  { name: "Carthero", slug: "carthero", scope: "NACIONAL" },
  { name: "Centurion Pay", slug: "centurion-pay", scope: "NACIONAL" },
  { name: "Credpago", slug: "credpago", scope: "NACIONAL" },
  { name: "Credwave", slug: "credwave", scope: "NACIONAL_GLOBAL" },
  { name: "Cúpula Hub", slug: "cupula-hub", scope: "NACIONAL_GLOBAL" },
  { name: "Cyberhub", slug: "cyberhub", scope: "NACIONAL_GLOBAL" },
  { name: "Codiguz Hub", slug: "codiguz-hub", scope: "NACIONAL_GLOBAL" },
  { name: "Diasmarketplace", slug: "diasmarketplace", scope: "NACIONAL" },
  { name: "Dom Pagamentos", slug: "dom-pagamentos", scope: "NACIONAL" },
  { name: "Dorapag", slug: "dorapag", scope: "NACIONAL_GLOBAL" },
  { name: "Dubai Pay", slug: "dubai-pay", scope: "NACIONAL" },
  { name: "Efí", slug: "efi", scope: "NACIONAL" },
  { name: "Ever Pay", slug: "ever-pay", scope: "NACIONAL" },
  { name: "Fast Pay", slug: "fast-pay", scope: "GLOBAL" },
  { name: "Fire Pag", slug: "fire-pag", scope: "NACIONAL" },
  { name: "Fivepay", slug: "fivepay", scope: "NACIONAL" },
  { name: "FlashPay", slug: "flashpay", scope: "NACIONAL" },
  { name: "Flowspay", slug: "flowspay", scope: "NACIONAL_GLOBAL" },
  { name: "Fly Payments", slug: "fly-payments", scope: "NACIONAL" },
  { name: "Fortrex", slug: "fortrex", scope: "NACIONAL" },
  { name: "FreePay", slug: "freepay", scope: "NACIONAL" },
  { name: "FusionPay", slug: "fusionpay", scope: "NACIONAL_GLOBAL" },
];

function generateGatewayTemplate(gateway: typeof missingGateways[0]): string {
  const className = gateway.slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");

  return `// ============================================
// ${gateway.name.toUpperCase()} GATEWAY
// ============================================
//
// Documentação: https://${gateway.slug}.com.br/docs
// Escopo: ${gateway.scope}
// Tipo: payment_processor
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
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiKey
 * - merchantId
 */
export class ${className}Gateway extends BaseGateway {
  name = "${gateway.name}";
  slug = "${gateway.slug}";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.${gateway.slug.replace(/-/g, "")}.com/v1",
    sandbox: "https://sandbox.api.${gateway.slug.replace(/-/g, "")}.com/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.apiKey) {
        return {
          isValid: false,
          message: "API Key is required",
        };
      }

      if (!credentials.merchantId) {
        return {
          isValid: false,
          message: "Merchant ID is required",
        };
      }

      // Validação básica offline - ajustar conforme documentação da API
      this.log("info", "${gateway.name} credentials validated (offline)");
      return {
        isValid: true,
        message: "Credentials accepted (offline validation)",
      };
    } catch (error: any) {
      this.log("error", "${gateway.name} credential validation failed", error);
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
      this.validatePaymentRequest(request);

      this.log("info", "Processing ${gateway.name} payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const payment: any = {
        merchant_id: config.credentials.merchantId,
        reference_id: request.orderId,
        amount: Math.round(request.amount * 100), // Centavos
        currency: "BRL",
        description: \`Pedido #\${request.orderId}\`,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        notification_url: \`\${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/${gateway.slug}\`,
        return_url: request.metadata?.returnUrl || \`\${Deno.env.get("SUPABASE_URL")}/checkout/success\`,
      };

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          payment.payment_method = "pix";
          payment.expires_in = 3600; // 1 hora
          break;

        case PaymentMethod.CREDIT_CARD:
          payment.payment_method = "credit_card";
          if (request.paymentDetails?.card) {
            payment.card = {
              number: request.paymentDetails.card.number,
              holder_name: request.paymentDetails.card.holderName,
              expiry_month: request.paymentDetails.card.expiryMonth,
              expiry_year: request.paymentDetails.card.expiryYear,
              cvv: request.paymentDetails.card.cvv,
            };
          }
          payment.installments = request.paymentDetails?.installments || 1;
          break;

        case PaymentMethod.BOLETO:
          payment.payment_method = "boleto";
          payment.due_date = new Date(Date.now() + 3 * 24 * 3600000).toISOString().split("T")[0];
          break;

        default:
          throw new GatewayError(
            \`Payment method \${request.paymentMethod} not supported\`,
            this.slug,
            "UNSUPPORTED_METHOD"
          );
      }

      const response = await this.makeRequest<any>(
        \`\${endpoint}/payments\`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${config.credentials.apiKey}\`,
          },
          body: JSON.stringify(payment),
        }
      );

      return this.createSuccessResponse({
        transactionId: request.orderId,
        gatewayTransactionId: response.id || response.transaction_id,
        status: this.normalizeStatus(response.status),
        paymentUrl: response.payment_url,
        qrCode: response.pix?.qr_code,
        qrCodeBase64: response.pix?.qr_code_base64,
        boletoUrl: response.boleto?.pdf_url,
        boletoBarcode: response.boleto?.barcode,
        expiresAt: response.expires_at,
        message: "${gateway.name} payment created successfully",
      });
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
      this.log("info", "Processing ${gateway.name} webhook", { payload });

      if (!payload.reference_id && !payload.transaction_id) {
        return {
          success: false,
          processed: false,
          message: "Missing payment identifier in webhook payload",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: payload.reference_id,
        gatewayTransactionId: payload.transaction_id || payload.id,
        status: this.normalizeStatus(payload.status),
        message: "${gateway.name} webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "${gateway.name} webhook processing failed", error);
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
      this.log("info", "Getting ${gateway.name} payment status", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await this.makeRequest<any>(
        \`\${endpoint}/payments/\${gatewayTransactionId}\`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${config.credentials.apiKey}\`,
          },
        }
      );

      return {
        transactionId: response.reference_id,
        gatewayTransactionId: response.id || response.transaction_id,
        status: this.normalizeStatus(response.status),
        amount: response.amount / 100,
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method),
        createdAt: response.created_at || new Date().toISOString(),
        updatedAt: response.updated_at || new Date().toISOString(),
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new GatewayError(
        \`Failed to get ${gateway.name} payment status: \${error.message}\`,
        this.slug,
        error.code,
        error.statusCode
      );
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.log("info", "Canceling ${gateway.name} payment", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      await this.makeRequest<any>(
        \`\${endpoint}/payments/\${gatewayTransactionId}/cancel\`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": \`Bearer \${config.credentials.apiKey}\`,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "${gateway.name} payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel ${gateway.name} payment"
      );
    }
  }

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      waiting_payment: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      analyzing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
      cancelled: PaymentStatus.CANCELLED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      failed: PaymentStatus.FAILED,
      rejected: PaymentStatus.FAILED,
      denied: PaymentStatus.FAILED,
    };

    return statusMap[gatewayStatus?.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Normaliza o método de pagamento
   */
  private normalizePaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };

    return methodMap[method?.toLowerCase()] || PaymentMethod.PIX;
  }
}
`;
}

async function createGatewayStructure(gateway: typeof missingGateways[0]) {
  const gatewayDir = join(GATEWAYS_DIR, gateway.slug);
  const indexPath = join(gatewayDir, "index.ts");

  // Criar diretório do gateway
  await ensureDir(gatewayDir);

  // Criar arquivo index.ts
  const template = generateGatewayTemplate(gateway);
  await Deno.writeTextFile(indexPath, template);

  console.log(`✅ ${gateway.name} (${gateway.slug}) criado!`);
}

async function main() {
  console.log("🚀 Criando estrutura dos 43 gateways faltantes...\n");

  let count = 0;
  for (const gateway of missingGateways) {
    await createGatewayStructure(gateway);
    count++;
  }

  console.log(`\n✅ ${count} gateways criados com sucesso!`);
  console.log("\n📝 Próximos passos:");
  console.log("1. Atualizar registry.ts com os novos gateways");
  console.log("2. Ajustar endpoints e credenciais conforme documentação de cada API");
  console.log("3. Implementar lógica específica de cada gateway");
  console.log("4. Testar integrações");
}

if (import.meta.main) {
  await main();
}

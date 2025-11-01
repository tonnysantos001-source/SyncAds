// ============================================
// FREEPAY GATEWAY
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

export class FreePayGateway extends BaseGateway {
  name = "FreePay";
  slug = "freepay";
  supportedMethods = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.PIX,
    PaymentMethod.BOLETO
  ];

  endpoints: GatewayEndpoints = {
    production: "https://api.freepay.com/v1",
    sandbox: "https://sandbox.freepay.com/v1",
  };

  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.token) {
        return {
          isValid: false,
          message: "token is required for FreePay",
        };
      }
      if (!credentials.accountId) {
        return {
          isValid: false,
          message: "accountId is required for FreePay",
        };
      }

      // Teste básico de conexão
      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await fetch(`${endpoint}/health`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${config.credentials.token}`,
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
            number: request.card.number.replace(/\s/g, ""),
            holder_name: request.card.holderName,
            expiry_month: request.card.expiryMonth,
            expiry_year: request.card.expiryYear,
            cvv: request.card.cvv,
          },
          installments: request.installments || 1,
        });
      }

      const response = await this.makeRequest(`${endpoint}/payments`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.credentials.token}`,
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
      return this.createErrorResponse(error, "Failed to process FreePay payment");
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
      this.log("error", "FreePay webhook error", { error: error.message });
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
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${config.credentials.token}`,
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
      throw new Error(`Failed to get payment status: ${error.message}`);
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

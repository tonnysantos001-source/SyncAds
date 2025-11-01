// ============================================
// HUB DE PAGAMENTOS GATEWAY
// ============================================
//
// Documentação: https://hubdepagamentos.com.br/api/docs
// Prioridade: Média
// Tipo: processor
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
 * Hub de Pagamentos Gateway Implementation
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
export class HubPagamentosGateway extends BaseGateway {
  name = "Hub de Pagamentos";
  slug = "hub-pagamentos";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.hubdepagamentos.com.br/v1",
    sandbox: "https://sandbox.api.hubdepagamentos.com.br/v1",
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

      // Tentar fazer uma chamada de teste à API
      try {
        const endpoint = credentials.isSandbox
          ? this.endpoints.sandbox
          : this.endpoints.production;

        const response = await fetch(`${endpoint}/merchants/${credentials.merchantId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${credentials.apiKey}`,
          },
        });

        if (response.ok) {
          this.log("info", "Hub de Pagamentos credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401 || response.status === 403) {
          return {
            isValid: false,
            message: "Invalid credentials - unauthorized",
          };
        }

        this.log("warn", "Hub de Pagamentos validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate Hub de Pagamentos credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Hub de Pagamentos credential validation failed", error);
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

      this.log("info", "Processing Hub de Pagamentos payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      let payment: any = {
        merchant_id: config.credentials.merchantId,
        reference_id: request.orderId,
        amount: Math.round(request.amount * 100), // Centavos
        currency: "BRL",
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/hub-pagamentos`,
        return_url: request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
      };

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          payment.payment_method = "pix";
          payment.expiration_time = 3600; // 1 hora
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
            `Payment method ${request.paymentMethod} not supported`,
            this.slug,
            "UNSUPPORTED_METHOD"
          );
      }

      const response = await this.makeRequest<any>(
        `${endpoint}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
          body: JSON.stringify(payment),
        }
      );

      return this.createSuccessResponse({
        transactionId: request.orderId,
        gatewayTransactionId: response.id || response.payment_id,
        status: this.normalizeHubStatus(response.status),
        paymentUrl: response.payment_url,
        qrCode: response.pix?.qrcode,
        qrCodeBase64: response.pix?.qrcode_base64,
        boletoUrl: response.boleto?.pdf_url,
        boletoBarcode: response.boleto?.barcode,
        expiresAt: response.expires_at,
        message: "Hub de Pagamentos payment created successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Hub de Pagamentos"
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
      this.log("info", "Processing Hub de Pagamentos webhook", { payload });

      if (!payload.reference_id && !payload.payment_id) {
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
        gatewayTransactionId: payload.payment_id || payload.id,
        status: this.normalizeHubStatus(payload.status),
        message: "Hub de Pagamentos webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "Hub de Pagamentos webhook processing failed", error);
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
      this.log("info", "Getting Hub de Pagamentos payment status", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
        }
      );

      return {
        transactionId: response.reference_id,
        gatewayTransactionId: response.id || response.payment_id,
        status: this.normalizeHubStatus(response.status),
        amount: response.amount / 100, // De centavos para reais
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method),
        createdAt: response.created_at || new Date().toISOString(),
        updatedAt: response.updated_at || new Date().toISOString(),
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Hub de Pagamentos payment status: ${error.message}`,
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
      this.log("info", "Canceling Hub de Pagamentos payment", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Hub de Pagamentos payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel Hub de Pagamentos payment"
      );
    }
  }

  /**
   * Normaliza o status do Hub de Pagamentos para o status padrão
   */
  private normalizeHubStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      analyzing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      cancelled: PaymentStatus.CANCELLED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      failed: PaymentStatus.FAILED,
      rejected: PaymentStatus.FAILED,
      denied: PaymentStatus.FAILED,
    };

    return statusMap[status?.toLowerCase()] || PaymentStatus.PENDING;
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

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeHubStatus(gatewayStatus);
  }
}

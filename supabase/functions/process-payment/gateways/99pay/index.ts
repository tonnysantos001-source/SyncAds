// ============================================
// 99PAY GATEWAY
// ============================================
//
// Documentação: https://99pay.com.br/docs/api
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
 * 99Pay Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiKey
 * - apiSecret
 */
export class Pay99Gateway extends BaseGateway {
  name = "99Pay";
  slug = "99pay";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.99pay.com.br/v1",
    sandbox: "https://sandbox.api.99pay.com.br/v1",
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

      if (!credentials.apiSecret) {
        return {
          isValid: false,
          message: "API Secret is required",
        };
      }

      // Tentar fazer uma chamada de teste à API
      try {
        const endpoint = credentials.isSandbox
          ? this.endpoints.sandbox
          : this.endpoints.production;

        const response = await fetch(`${endpoint}/auth/validate`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": credentials.apiKey as string,
            "X-API-Secret": credentials.apiSecret as string,
          },
        });

        if (response.ok) {
          this.log("info", "99Pay credentials validated successfully");
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

        this.log("warn", "99Pay validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate 99Pay credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "99Pay credential validation failed", error);
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

      this.log("info", "Processing 99Pay payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      let payment: any = {
        external_id: request.orderId,
        amount: Math.round(request.amount * 100), // Centavos
        currency: "BRL",
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/99pay`,
        return_url: request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
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
              exp_month: request.paymentDetails.card.expiryMonth,
              exp_year: request.paymentDetails.card.expiryYear,
              cvv: request.paymentDetails.card.cvv,
            };
          }
          if (request.paymentDetails?.installments) {
            payment.installments = request.paymentDetails.installments;
          }
          break;

        case PaymentMethod.BOLETO:
          payment.payment_method = "boleto";
          payment.expires_at = new Date(Date.now() + 3 * 24 * 3600000).toISOString(); // 3 dias
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
            "X-API-Key": config.credentials.apiKey as string,
            "X-API-Secret": config.credentials.apiSecret as string,
          },
          body: JSON.stringify(payment),
        }
      );

      return this.createSuccessResponse({
        transactionId: request.orderId,
        gatewayTransactionId: response.id || response.payment_id,
        status: this.normalize99PayStatus(response.status),
        paymentUrl: response.payment_url,
        qrCode: response.pix?.qr_code,
        qrCodeBase64: response.pix?.qr_code_base64,
        boletoUrl: response.boleto?.url,
        boletoBarcode: response.boleto?.barcode,
        expiresAt: response.expires_at,
        message: "99Pay payment created successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via 99Pay"
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
      this.log("info", "Processing 99Pay webhook", { payload });

      if (!payload.external_id && !payload.payment_id) {
        return {
          success: false,
          processed: false,
          message: "Missing payment identifier in webhook payload",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: payload.external_id,
        gatewayTransactionId: payload.payment_id || payload.id,
        status: this.normalize99PayStatus(payload.status),
        message: "99Pay webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "99Pay webhook processing failed", error);
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
      this.log("info", "Getting 99Pay payment status", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": config.credentials.apiKey as string,
            "X-API-Secret": config.credentials.apiSecret as string,
          },
        }
      );

      return {
        transactionId: response.external_id,
        gatewayTransactionId: response.id || response.payment_id,
        status: this.normalize99PayStatus(response.status),
        amount: response.amount / 100, // De centavos para reais
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method),
        createdAt: response.created_at || new Date().toISOString(),
        updatedAt: response.updated_at || new Date().toISOString(),
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get 99Pay payment status: ${error.message}`,
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
      this.log("info", "Canceling 99Pay payment", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": config.credentials.apiKey as string,
            "X-API-Secret": config.credentials.apiSecret as string,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "99Pay payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel 99Pay payment"
      );
    }
  }

  /**
   * Normaliza o status do 99Pay para o status padrão
   */
  private normalize99PayStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      cancelled: PaymentStatus.CANCELLED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      failed: PaymentStatus.FAILED,
      rejected: PaymentStatus.FAILED,
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
    return this.normalize99PayStatus(gatewayStatus);
  }
}

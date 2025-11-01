// ============================================
// GRANITO GATEWAY
// ============================================
//
// Documentação: https://docs.granito.com.br/
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
 * Granito Gateway Implementation
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
export class GranitoGateway extends BaseGateway {
  name = "Granito";
  slug = "granito";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.granito.com.br/v1",
    sandbox: "https://sandbox.api.granito.com.br/v1",
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

        const response = await fetch(`${endpoint}/auth/validate`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": credentials.apiKey as string,
            "X-Merchant-Id": credentials.merchantId as string,
          },
        });

        if (response.ok) {
          this.log("info", "Granito credentials validated successfully");
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

        this.log("warn", "Granito validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate Granito credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Granito credential validation failed", error);
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

      this.log("info", "Processing Granito payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      let payment: any = {
        reference_id: request.orderId,
        amount: Math.round(request.amount * 100), // Centavos
        currency: "BRL",
        description: `Pedido #${request.orderId}`,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/granito`,
        return_url: request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
      };

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          payment.payment_method = "pix";
          payment.expiration_time = 3600; // 1 hora

          const pixResponse = await this.makeRequest<any>(
            `${endpoint}/payments/pix`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": config.credentials.apiKey as string,
                "X-Merchant-Id": config.credentials.merchantId as string,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: pixResponse.transaction_id || pixResponse.id,
            status: this.normalizeGranitoStatus(pixResponse.status),
            paymentUrl: pixResponse.payment_url,
            qrCode: pixResponse.pix_code,
            qrCodeBase64: pixResponse.pix_qr_code_base64,
            expiresAt: pixResponse.expires_at,
            message: "Granito PIX payment created successfully",
          });

        case PaymentMethod.CREDIT_CARD:
          payment.payment_method = "credit_card";
          if (request.paymentDetails?.card) {
            payment.card = {
              number: request.paymentDetails.card.number,
              holder_name: request.paymentDetails.card.holderName,
              expiration_month: request.paymentDetails.card.expiryMonth,
              expiration_year: request.paymentDetails.card.expiryYear,
              cvv: request.paymentDetails.card.cvv,
            };
          }
          payment.installments = request.paymentDetails?.installments || 1;

          const cardResponse = await this.makeRequest<any>(
            `${endpoint}/payments/card`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": config.credentials.apiKey as string,
                "X-Merchant-Id": config.credentials.merchantId as string,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: cardResponse.transaction_id || cardResponse.id,
            status: this.normalizeGranitoStatus(cardResponse.status),
            message: "Granito credit card payment created successfully",
          });

        case PaymentMethod.BOLETO:
          payment.payment_method = "boleto";
          payment.due_date = new Date(Date.now() + 3 * 24 * 3600000).toISOString().split("T")[0]; // 3 dias
          payment.instructions = `Pagamento referente ao pedido ${request.orderId}`;

          const boletoResponse = await this.makeRequest<any>(
            `${endpoint}/payments/boleto`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-API-Key": config.credentials.apiKey as string,
                "X-Merchant-Id": config.credentials.merchantId as string,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: boletoResponse.transaction_id || boletoResponse.id,
            status: PaymentStatus.PENDING,
            boletoUrl: boletoResponse.boleto_url,
            boletoBarcode: boletoResponse.barcode || boletoResponse.digitable_line,
            expiresAt: payment.due_date,
            message: "Granito boleto payment created successfully",
          });

        default:
          throw new GatewayError(
            `Payment method ${request.paymentMethod} not supported`,
            this.slug,
            "UNSUPPORTED_METHOD"
          );
      }
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Granito"
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
      this.log("info", "Processing Granito webhook", { payload });

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
        status: this.normalizeGranitoStatus(payload.status),
        message: "Granito webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "Granito webhook processing failed", error);
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
      this.log("info", "Getting Granito payment status", { gatewayTransactionId });

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
            "X-Merchant-Id": config.credentials.merchantId as string,
          },
        }
      );

      return {
        transactionId: response.reference_id,
        gatewayTransactionId: response.transaction_id || response.id,
        status: this.normalizeGranitoStatus(response.status),
        amount: response.amount / 100, // De centavos para reais
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method),
        createdAt: response.created_at || new Date().toISOString(),
        updatedAt: response.updated_at || new Date().toISOString(),
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Granito payment status: ${error.message}`,
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
      this.log("info", "Canceling Granito payment", { gatewayTransactionId });

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
            "X-Merchant-Id": config.credentials.merchantId as string,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Granito payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel Granito payment"
      );
    }
  }

  /**
   * Normaliza o status do Granito para o status padrão
   */
  private normalizeGranitoStatus(status: string): PaymentStatus {
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
    return this.normalizeGranitoStatus(gatewayStatus);
  }
}

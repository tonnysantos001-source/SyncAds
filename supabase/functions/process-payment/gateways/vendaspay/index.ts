// ============================================
// VENDASPAY GATEWAY
// ============================================
//
// Documentação: https://vendaspay.com.br/api/docs
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
 * VendasPay Gateway Implementation
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
export class VendasPayGateway extends BaseGateway {
  name = "VendasPay";
  slug = "vendaspay";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.vendaspay.com.br/v1",
    sandbox: "https://sandbox.api.vendaspay.com.br/v1",
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
            "Authorization": `Bearer ${credentials.apiKey}`,
            "X-Merchant-Id": credentials.merchantId as string,
          },
        });

        if (response.ok) {
          this.log("info", "VendasPay credentials validated successfully");
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

        this.log("warn", "VendasPay validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate VendasPay credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "VendasPay credential validation failed", error);
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

      this.log("info", "Processing VendasPay payment", {
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
        description: `Pedido #${request.orderId}`,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          document: this.formatDocument(request.customer.document),
          phone: this.formatPhone(request.customer.phone || ""),
        },
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/vendaspay`,
        return_url: request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
      };

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          payment.payment_method = "pix";
          payment.expires_in = 3600; // 1 hora

          const pixResponse = await this.makeRequest<any>(
            `${endpoint}/payments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.credentials.apiKey}`,
                "X-Merchant-Id": config.credentials.merchantId as string,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: pixResponse.id || pixResponse.payment_id,
            status: this.normalizeVendasPayStatus(pixResponse.status),
            paymentUrl: pixResponse.payment_url,
            qrCode: pixResponse.pix?.qr_code,
            qrCodeBase64: pixResponse.pix?.qr_code_base64,
            expiresAt: pixResponse.expires_at,
            message: "VendasPay PIX payment created successfully",
          });

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

          const cardResponse = await this.makeRequest<any>(
            `${endpoint}/payments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.credentials.apiKey}`,
                "X-Merchant-Id": config.credentials.merchantId as string,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: cardResponse.id || cardResponse.payment_id,
            status: this.normalizeVendasPayStatus(cardResponse.status),
            message: "VendasPay card payment created successfully",
          });

        case PaymentMethod.BOLETO:
          payment.payment_method = "boleto";
          payment.due_date = new Date(Date.now() + 3 * 24 * 3600000).toISOString().split("T")[0];
          payment.instructions = `Pagamento do pedido ${request.orderId}`;

          const boletoResponse = await this.makeRequest<any>(
            `${endpoint}/payments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${config.credentials.apiKey}`,
                "X-Merchant-Id": config.credentials.merchantId as string,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: boletoResponse.id || boletoResponse.payment_id,
            status: this.normalizeVendasPayStatus(boletoResponse.status),
            boletoUrl: boletoResponse.boleto?.pdf_url,
            boletoBarcode: boletoResponse.boleto?.barcode,
            expiresAt: payment.due_date,
            message: "VendasPay boleto payment created successfully",
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
        "Failed to process payment via VendasPay"
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
      this.log("info", "Processing VendasPay webhook", { payload });

      if (!payload.reference_id && !payload.payment_id && !payload.id) {
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
        status: this.normalizeVendasPayStatus(payload.status),
        message: "VendasPay webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "VendasPay webhook processing failed", error);
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
      this.log("info", "Getting VendasPay payment status", { gatewayTransactionId });

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
            "X-Merchant-Id": config.credentials.merchantId as string,
          },
        }
      );

      return {
        transactionId: response.reference_id,
        gatewayTransactionId: response.id || response.payment_id,
        status: this.normalizeVendasPayStatus(response.status),
        amount: response.amount / 100, // De centavos para reais
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method),
        createdAt: response.created_at || new Date().toISOString(),
        updatedAt: response.updated_at || new Date().toISOString(),
        paidAt: response.paid_at,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get VendasPay payment status: ${error.message}`,
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
      this.log("info", "Canceling VendasPay payment", { gatewayTransactionId });

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
            "X-Merchant-Id": config.credentials.merchantId as string,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "VendasPay payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel VendasPay payment"
      );
    }
  }

  /**
   * Normaliza o status do VendasPay para o status padrão
   */
  private normalizeVendasPayStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      waiting_payment: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      analyzing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
      confirmed: PaymentStatus.APPROVED,
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
    return this.normalizeVendasPayStatus(gatewayStatus);
  }
}

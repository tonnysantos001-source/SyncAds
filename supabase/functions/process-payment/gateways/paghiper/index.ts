// ============================================
// PAGHIPER GATEWAY
// ============================================
//
// Documentação: https://dev.paghiper.com/
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
 * Paghiper Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiKey
 * - token
 */
export class PaghiperGateway extends BaseGateway {
  name = "Paghiper";
  slug = "paghiper";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.paghiper.com",
    sandbox: "https://api.paghiper.com",
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

      if (!credentials.token) {
        return {
          isValid: false,
          message: "Token is required",
        };
      }

      // Tentar fazer uma chamada de teste à API
      try {
        const endpoint = this.endpoints.production;

        const response = await fetch(`${endpoint}/transaction/list`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: credentials.apiKey,
            token: credentials.token,
            limit: 1,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.result === "success") {
            this.log("info", "Paghiper credentials validated successfully");
            return {
              isValid: true,
              message: "Credentials are valid",
            };
          }
        }

        if (response.status === 401 || response.status === 403) {
          return {
            isValid: false,
            message: "Invalid credentials - unauthorized",
          };
        }

        this.log("warn", "Paghiper validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate Paghiper credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Paghiper credential validation failed", error);
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

      this.log("info", "Processing Paghiper payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.endpoints.production;

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          const pixPayment = {
            apiKey: config.credentials.apiKey,
            token: config.credentials.token,
            order_id: request.orderId,
            payer_email: request.customer.email,
            payer_name: request.customer.name,
            payer_cpf_cnpj: this.formatDocument(request.customer.document),
            payer_phone: this.formatPhone(request.customer.phone || ""),
            notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/paghiper`,
            discount_cents: 0,
            shipping_price_cents: 0,
            days_due_date: 1,
            type_bank_slip: "pix",
            items: [
              {
                description: `Pedido #${request.orderId}`,
                quantity: 1,
                item_id: request.orderId,
                price_cents: Math.round(request.amount * 100),
              },
            ],
          };

          const pixResponse = await this.makeRequest<any>(
            `${endpoint}/transaction/create`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(pixPayment),
            }
          );

          if (pixResponse.result === "reject") {
            throw new GatewayError(
              pixResponse.response_message || "PIX payment rejected",
              this.slug,
              "PAYMENT_REJECTED"
            );
          }

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: pixResponse.transaction_id || pixResponse.pix_create_request?.transaction_id,
            status: PaymentStatus.PENDING,
            paymentUrl: pixResponse.pix_create_request?.qrcode_image_url,
            qrCode: pixResponse.pix_create_request?.emv,
            qrCodeBase64: pixResponse.pix_create_request?.qrcode_base64,
            expiresAt: pixResponse.pix_create_request?.due_date,
            message: "Paghiper PIX payment created successfully",
          });

        case PaymentMethod.BOLETO:
          const boletoPayment = {
            apiKey: config.credentials.apiKey,
            token: config.credentials.token,
            order_id: request.orderId,
            payer_email: request.customer.email,
            payer_name: request.customer.name,
            payer_cpf_cnpj: this.formatDocument(request.customer.document),
            payer_phone: this.formatPhone(request.customer.phone || ""),
            payer_street: request.customer.address?.street || "Rua Exemplo",
            payer_number: request.customer.address?.number || "100",
            payer_complement: request.customer.address?.complement || "",
            payer_district: request.customer.address?.district || "Centro",
            payer_city: request.customer.address?.city || "São Paulo",
            payer_state: request.customer.address?.state || "SP",
            payer_zip_code: this.formatZipCode(request.customer.address?.zipCode || "01000000"),
            notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/paghiper`,
            discount_cents: 0,
            shipping_price_cents: 0,
            days_due_date: 3,
            type_bank_slip: "bolepix",
            items: [
              {
                description: `Pedido #${request.orderId}`,
                quantity: 1,
                item_id: request.orderId,
                price_cents: Math.round(request.amount * 100),
              },
            ],
          };

          const boletoResponse = await this.makeRequest<any>(
            `${endpoint}/transaction/create`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(boletoPayment),
            }
          );

          if (boletoResponse.result === "reject") {
            throw new GatewayError(
              boletoResponse.response_message || "Boleto payment rejected",
              this.slug,
              "PAYMENT_REJECTED"
            );
          }

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: boletoResponse.transaction_id || boletoResponse.bank_slip?.transaction_id,
            status: PaymentStatus.PENDING,
            boletoUrl: boletoResponse.bank_slip?.url_slip_pdf,
            boletoBarcode: boletoResponse.bank_slip?.digitable_line,
            expiresAt: boletoResponse.bank_slip?.due_date,
            message: "Paghiper boleto payment created successfully",
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
        "Failed to process payment via Paghiper"
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
      this.log("info", "Processing Paghiper webhook", { payload });

      if (!payload.order_id && !payload.transaction_id) {
        return {
          success: false,
          processed: false,
          message: "Missing payment identifier in webhook payload",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: payload.order_id,
        gatewayTransactionId: payload.transaction_id,
        status: this.normalizePaghiperStatus(payload.status),
        message: "Paghiper webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "Paghiper webhook processing failed", error);
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
      this.log("info", "Getting Paghiper payment status", { gatewayTransactionId });

      const endpoint = this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${endpoint}/transaction/status`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: config.credentials.apiKey,
            token: config.credentials.token,
            transaction_id: gatewayTransactionId,
          }),
        }
      );

      if (response.result === "reject") {
        throw new GatewayError(
          response.response_message || "Failed to get payment status",
          this.slug,
          "STATUS_ERROR"
        );
      }

      const statusData = response.status_request;

      return {
        transactionId: statusData.order_id,
        gatewayTransactionId: statusData.transaction_id,
        status: this.normalizePaghiperStatus(statusData.status),
        amount: statusData.value_cents ? statusData.value_cents / 100 : 0,
        currency: "BRL",
        paymentMethod: statusData.type_bank_slip === "pix" ? PaymentMethod.PIX : PaymentMethod.BOLETO,
        createdAt: statusData.created_date || new Date().toISOString(),
        updatedAt: statusData.modified_date || new Date().toISOString(),
        paidAt: statusData.status === "paid" ? statusData.paid_date : undefined,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Paghiper payment status: ${error.message}`,
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
      this.log("info", "Canceling Paghiper payment", { gatewayTransactionId });

      const endpoint = this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${endpoint}/transaction/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            apiKey: config.credentials.apiKey,
            token: config.credentials.token,
            transaction_id: gatewayTransactionId,
          }),
        }
      );

      if (response.result === "reject") {
        throw new GatewayError(
          response.response_message || "Failed to cancel payment",
          this.slug,
          "CANCEL_ERROR"
        );
      }

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Paghiper payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel Paghiper payment"
      );
    }
  }

  /**
   * Normaliza o status do Paghiper para o status padrão
   */
  private normalizePaghiperStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      waiting: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
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
   * Formata CEP para o padrão Paghiper (00000-000)
   */
  private formatZipCode(zipCode: string): string {
    const cleaned = zipCode.replace(/\D/g, "");
    if (cleaned.length === 8) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    return cleaned;
  }

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizePaghiperStatus(gatewayStatus);
  }
}

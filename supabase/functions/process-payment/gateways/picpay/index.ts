// ============================================
// PICPAY GATEWAY
// ============================================
//
// Documentação: https://ecommerce.picpay.com/doc/
// Prioridade: Alta
// Tipo: wallet
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
 * PicPay Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Carteira Digital PicPay
 *
 * Credenciais necessárias:
 * - picpayToken (x-picpay-token)
 * - sellerToken (x-seller-token)
 */
export class PicPayGateway extends BaseGateway {
  name = "PicPay";
  slug = "picpay";
  supportedMethods = [PaymentMethod.PIX, PaymentMethod.WALLET];

  endpoints = {
    production: "https://appws.picpay.com/ecommerce/public",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.picpayToken) {
        return {
          isValid: false,
          message: "PicPay Token (x-picpay-token) is required",
        };
      }

      if (!credentials.sellerToken) {
        return {
          isValid: false,
          message: "Seller Token (x-seller-token) is required",
        };
      }

      // Tentar fazer uma chamada de teste à API
      try {
        const testPayment = {
          referenceId: `test_${Date.now()}`,
          callbackUrl: "https://example.com/callback",
          value: 1.00,
          buyer: {
            firstName: "Test",
            lastName: "User",
            document: "12345678901",
            email: "test@example.com",
            phone: "+55119999999999",
          },
        };

        const response = await fetch(`${this.endpoints.production}/payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-picpay-token": credentials.picpayToken as string,
            "x-seller-token": credentials.sellerToken as string,
          },
          body: JSON.stringify(testPayment),
        });

        // Se retornar 200 ou 201, credenciais válidas
        if (response.ok) {
          this.log("info", "PicPay credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        // Se retornar 401, credenciais inválidas
        if (response.status === 401 || response.status === 403) {
          return {
            isValid: false,
            message: "Invalid credentials - unauthorized",
          };
        }

        // Outros erros podem ser de formato, mas credenciais OK
        this.log("warn", "PicPay validation returned non-auth error, accepting credentials");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate PicPay credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "PicPay credential validation failed", error);
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

      this.log("info", "Processing PicPay payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      // PicPay usa o mesmo endpoint para PIX e Carteira
      // O cliente escolhe o método no app
      const payment = {
        referenceId: request.orderId,
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/picpay`,
        returnUrl: request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
        value: request.amount,
        expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        buyer: {
          firstName: request.customer.name.split(" ")[0],
          lastName: request.customer.name.split(" ").slice(1).join(" ") || request.customer.name.split(" ")[0],
          document: this.formatDocument(request.customer.document),
          email: request.customer.email,
          phone: request.customer.phone ? this.formatPhoneForPicPay(request.customer.phone) : "+5511999999999",
        },
        channel: "ecommerce",
      };

      const response = await this.makeRequest<any>(
        `${this.endpoints.production}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-picpay-token": config.credentials.picpayToken as string,
            "x-seller-token": config.credentials.sellerToken as string,
          },
          body: JSON.stringify(payment),
        }
      );

      return this.createSuccessResponse({
        transactionId: response.referenceId,
        gatewayTransactionId: response.referenceId,
        status: PaymentStatus.PENDING,
        paymentUrl: response.paymentUrl,
        qrCode: response.qrcode?.content,
        qrCodeBase64: response.qrcode?.base64,
        expiresAt: response.expiresAt,
        message: "PicPay payment created successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via PicPay"
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
      this.log("info", "Processing PicPay webhook", { payload });

      // PicPay webhook envia:
      // {
      //   "referenceId": "ordem123",
      //   "authorizationId": "555008cef7f321d00ef236333"
      // }

      if (!payload.referenceId) {
        return {
          success: false,
          processed: false,
          message: "Missing referenceId in webhook payload",
        };
      }

      // Quando recebe webhook, o status mudou para PAID
      return {
        success: true,
        processed: true,
        transactionId: payload.referenceId,
        message: "PicPay webhook processed - payment confirmed",
      };
    } catch (error: any) {
      this.log("error", "PicPay webhook processing failed", error);
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
      this.log("info", "Getting PicPay payment status", { gatewayTransactionId });

      const response = await this.makeRequest<any>(
        `${this.endpoints.production}/payments/${gatewayTransactionId}/status`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-picpay-token": config.credentials.picpayToken as string,
            "x-seller-token": config.credentials.sellerToken as string,
          },
        }
      );

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.authorizationId || gatewayTransactionId,
        status: this.normalizePicPayStatus(response.status),
        amount: response.value || 0,
        currency: "BRL",
        paymentMethod: PaymentMethod.WALLET,
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
        paidAt: response.status === "paid" ? response.updatedAt : undefined,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get PicPay payment status: ${error.message}`,
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
      this.log("info", "Canceling PicPay payment", { gatewayTransactionId });

      await this.makeRequest<any>(
        `${this.endpoints.production}/payments/${gatewayTransactionId}/cancellations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-picpay-token": config.credentials.picpayToken as string,
            "x-seller-token": config.credentials.sellerToken as string,
          },
          body: JSON.stringify({
            authorizationId: gatewayTransactionId,
          }),
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "PicPay payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel PicPay payment"
      );
    }
  }

  /**
   * Normaliza o status do PicPay para o status padrão
   */
  private normalizePicPayStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      created: PaymentStatus.PENDING,
      analysis: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      cancelled: PaymentStatus.CANCELLED,
      chargeback: PaymentStatus.REFUNDED,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Formata telefone para o padrão PicPay (+5511999999999)
   */
  private formatPhoneForPicPay(phone: string): string {
    const cleaned = this.formatPhone(phone);

    // Se já tem código do país
    if (cleaned.startsWith("55")) {
      return `+${cleaned}`;
    }

    // Adicionar código do país
    return `+55${cleaned}`;
  }

  /**
   * Normaliza o status do PicPay para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizePicPayStatus(gatewayStatus);
  }
}

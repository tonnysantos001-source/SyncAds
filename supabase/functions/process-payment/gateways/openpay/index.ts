// ============================================
// OPENPAY GATEWAY
// ============================================
//
// Documentação: https://www.openpay.mx/docs/api/
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
 * Openpay Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - merchantId
 * - privateKey
 * - publicKey
 */
export class OpenpayGateway extends BaseGateway {
  name = "Openpay";
  slug = "openpay";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.openpay.mx/v1",
    sandbox: "https://sandbox-api.openpay.mx/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.merchantId) {
        return {
          isValid: false,
          message: "Merchant ID is required",
        };
      }

      if (!credentials.privateKey) {
        return {
          isValid: false,
          message: "Private Key is required",
        };
      }

      // Tentar fazer uma chamada de teste à API
      try {
        const endpoint = credentials.isSandbox
          ? this.endpoints.sandbox
          : this.endpoints.production;

        const auth = Buffer.from(`${credentials.privateKey}:`).toString("base64");

        const response = await fetch(
          `${endpoint}/${credentials.merchantId}/cards`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
          }
        );

        if (response.ok || response.status === 404) {
          this.log("info", "Openpay credentials validated successfully");
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

        this.log("warn", "Openpay validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate Openpay credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Openpay credential validation failed", error);
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

      this.log("info", "Processing Openpay payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const auth = Buffer.from(`${config.credentials.privateKey}:`).toString(
        "base64"
      );

      let payment: any = {
        method: this.getOpenpayMethod(request.paymentMethod),
        amount: request.amount,
        description: `Pedido #${request.orderId}`,
        order_id: request.orderId,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          phone_number: this.formatPhone(request.customer.phone || ""),
        },
      };

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          // Openpay no Brasil usa SPEI (similar ao PIX no México)
          payment.method = "bank_account";
          payment.redirect_url = request.metadata?.returnUrl || `${Deno.env.get("SUPABASE_URL")}/checkout/success`;

          const pixResponse = await this.makeRequest<any>(
            `${endpoint}/${config.credentials.merchantId}/charges`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: pixResponse.id,
            status: this.normalizeOpenpayStatus(pixResponse.status),
            paymentUrl: pixResponse.payment_method?.url,
            message: "Openpay payment created successfully",
          });

        case PaymentMethod.CREDIT_CARD:
          if (request.paymentDetails?.card) {
            payment.source_id = await this.createCardToken(
              request.paymentDetails.card,
              config
            );
          }
          payment.device_session_id = request.metadata?.deviceSessionId;

          const cardResponse = await this.makeRequest<any>(
            `${endpoint}/${config.credentials.merchantId}/charges`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: cardResponse.id,
            status: this.normalizeOpenpayStatus(cardResponse.status),
            message: "Openpay card payment created successfully",
          });

        case PaymentMethod.BOLETO:
          payment.method = "store";
          payment.due_date = new Date(Date.now() + 3 * 24 * 3600000)
            .toISOString()
            .split("T")[0];

          const boletoResponse = await this.makeRequest<any>(
            `${endpoint}/${config.credentials.merchantId}/charges`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Basic ${auth}`,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: boletoResponse.id,
            status: this.normalizeOpenpayStatus(boletoResponse.status),
            boletoUrl: boletoResponse.payment_method?.url,
            boletoBarcode: boletoResponse.payment_method?.reference,
            expiresAt: payment.due_date,
            message: "Openpay boleto payment created successfully",
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
        "Failed to process payment via Openpay"
      );
    }
  }

  /**
   * Cria token de cartão
   */
  private async createCardToken(
    card: any,
    config: GatewayConfig
  ): Promise<string> {
    const endpoint = config.credentials.isSandbox
      ? this.endpoints.sandbox
      : this.endpoints.production;

    const auth = Buffer.from(`${config.credentials.privateKey}:`).toString(
      "base64"
    );

    const response = await this.makeRequest<any>(
      `${endpoint}/${config.credentials.merchantId}/tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          card_number: card.number,
          holder_name: card.holderName,
          expiration_year: card.expiryYear,
          expiration_month: card.expiryMonth,
          cvv2: card.cvv,
        }),
      }
    );

    return response.id;
  }

  /**
   * Processa webhook do gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing Openpay webhook", { payload });

      const transaction = payload.transaction;

      if (!transaction?.id) {
        return {
          success: false,
          processed: false,
          message: "Missing transaction data in webhook payload",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: transaction.order_id,
        gatewayTransactionId: transaction.id,
        status: this.normalizeOpenpayStatus(transaction.status),
        message: "Openpay webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "Openpay webhook processing failed", error);
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
      this.log("info", "Getting Openpay payment status", {
        gatewayTransactionId,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const auth = Buffer.from(`${config.credentials.privateKey}:`).toString(
        "base64"
      );

      const response = await this.makeRequest<any>(
        `${endpoint}/${config.credentials.merchantId}/charges/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return {
        transactionId: response.order_id,
        gatewayTransactionId: response.id,
        status: this.normalizeOpenpayStatus(response.status),
        amount: response.amount || 0,
        currency: response.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.method),
        createdAt: response.creation_date || new Date().toISOString(),
        updatedAt: response.operation_date || new Date().toISOString(),
        paidAt: response.status === "completed" ? response.operation_date : undefined,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Openpay payment status: ${error.message}`,
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
      this.log("info", "Canceling Openpay payment", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const auth = Buffer.from(`${config.credentials.privateKey}:`).toString(
        "base64"
      );

      await this.makeRequest<any>(
        `${endpoint}/${config.credentials.merchantId}/charges/${gatewayTransactionId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
          body: JSON.stringify({
            description: "Cancelamento solicitado",
          }),
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Openpay payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel Openpay payment"
      );
    }
  }

  /**
   * Mapeia método de pagamento para Openpay
   */
  private getOpenpayMethod(method: PaymentMethod): string {
    const methodMap: Record<PaymentMethod, string> = {
      [PaymentMethod.PIX]: "bank_account",
      [PaymentMethod.CREDIT_CARD]: "card",
      [PaymentMethod.DEBIT_CARD]: "card",
      [PaymentMethod.BOLETO]: "store",
      [PaymentMethod.WALLET]: "card",
    };

    return methodMap[method] || "card";
  }

  /**
   * Normaliza o status do Openpay para o status padrão
   */
  private normalizeOpenpayStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      in_progress: PaymentStatus.PENDING,
      pending_payment: PaymentStatus.PENDING,
      charge_pending: PaymentStatus.PENDING,
      completed: PaymentStatus.APPROVED,
      paid: PaymentStatus.APPROVED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      failed: PaymentStatus.FAILED,
      declined: PaymentStatus.FAILED,
    };

    return statusMap[status?.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Normaliza o método de pagamento
   */
  private normalizePaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      bank_account: PaymentMethod.PIX,
      card: PaymentMethod.CREDIT_CARD,
      store: PaymentMethod.BOLETO,
    };

    return methodMap[method?.toLowerCase()] || PaymentMethod.PIX;
  }

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeOpenpayStatus(gatewayStatus);
  }
}

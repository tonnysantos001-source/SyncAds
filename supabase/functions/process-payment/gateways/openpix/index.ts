// ============================================
// OPENPIX GATEWAY
// ============================================
//
// Documentação: https://developers.openpix.com.br/
// Prioridade: Média
// Tipo: specialized (PIX only)
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
 * OpenPix Gateway Implementation
 *
 * Métodos suportados:
 * - PIX (exclusivamente)
 *
 * Credenciais necessárias:
 * - appId
 * - apiKey
 */
export class OpenPixGateway extends BaseGateway {
  name = "OpenPix";
  slug = "openpix";
  supportedMethods = [PaymentMethod.PIX];

  endpoints = {
    production: "https://api.openpix.com.br/api/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.appId) {
        return {
          isValid: false,
          message: "App ID is required",
        };
      }

      if (!credentials.apiKey) {
        return {
          isValid: false,
          message: "API Key is required",
        };
      }

      // Testar credenciais com uma chamada à API
      try {
        const response = await fetch(`${this.endpoints.production}/account`, {
          method: "GET",
          headers: {
            Authorization: credentials.apiKey as string,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          this.log("info", "OpenPix credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401) {
          return {
            isValid: false,
            message: "Invalid API Key",
          };
        }

        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate credentials online, accepting them");
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Credential validation failed", error);
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

      // OpenPix suporta apenas PIX
      if (request.paymentMethod !== PaymentMethod.PIX) {
        throw new Error(
          `OpenPix only supports PIX payments. Requested: ${request.paymentMethod}`
        );
      }

      this.log("info", "Processing OpenPix PIX payment", {
        orderId: request.orderId,
        amount: request.amount,
      });

      return await this.processPIX(request, config);
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via OpenPix"
      );
    }
  }

  /**
   * Processa pagamento PIX
   */
  private async processPIX(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    const chargeData = {
      correlationID: request.orderId,
      value: Math.round(request.amount * 100), // centavos
      type: "DYNAMIC",
      comment: `Pedido ${request.orderId}`,
      expiresIn: 3600, // 1 hora em segundos
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        taxID: this.formatDocument(request.customer.document),
        phone: this.formatPhone(request.customer.phone || "11999999999"),
      },
      additionalInfo: [
        {
          key: "Order ID",
          value: request.orderId,
        },
        {
          key: "Customer",
          value: request.customer.name,
        },
      ],
    };

    const response = await this.makeRequest<any>(
      `${this.endpoints.production}/charge`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: config.credentials.apiKey as string,
        },
        body: JSON.stringify(chargeData),
      }
    );

    const charge = response.charge;

    return this.createSuccessResponse({
      transactionId: charge.correlationID,
      gatewayTransactionId: charge.transactionID,
      status: this.normalizeOpenPixStatus(charge.status),
      qrCode: charge.brCode,
      qrCodeBase64: charge.qrCodeImage,
      pixKey: charge.pixKey,
      expiresAt: charge.expiresDate,
      message: "PIX created successfully via OpenPix",
    });
  }

  /**
   * Processa webhook do gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing OpenPix webhook", {
        event: payload.event,
        charge: payload.charge?.correlationID,
      });

      // OpenPix envia eventos como charge.completed, charge.expired, etc
      if (payload.charge) {
        const charge = payload.charge;
        const status = this.normalizeOpenPixStatus(charge.status);

        return {
          success: true,
          processed: true,
          transactionId: charge.correlationID || charge.transactionID,
          message: "OpenPix webhook processed successfully",
        };
      }

      // Webhook de PIX recebido
      if (payload.pix) {
        const pix = payload.pix;

        return {
          success: true,
          processed: true,
          transactionId: pix.correlationID || pix.transactionID,
          message: "OpenPix PIX webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "OpenPix webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "OpenPix webhook processing failed", error);
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
      this.log("info", "Getting OpenPix payment status", { gatewayTransactionId });

      const response = await this.makeRequest<any>(
        `${this.endpoints.production}/charge/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: config.credentials.apiKey as string,
          },
        }
      );

      const charge = response.charge;

      return {
        transactionId: charge.correlationID,
        gatewayTransactionId: charge.transactionID,
        status: this.normalizeOpenPixStatus(charge.status),
        amount: (charge.value || 0) / 100,
        currency: "BRL",
        paymentMethod: PaymentMethod.PIX,
        createdAt: charge.createdAt,
        updatedAt: charge.updatedAt || charge.createdAt,
        paidAt: charge.paidAt,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get payment status: ${error.message}`,
        this.slug,
        error.code,
        error.statusCode
      );
    }
  }

  /**
   * Cancela um pagamento PIX
   */
  async cancelPayment(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.log("info", "Canceling OpenPix payment", { gatewayTransactionId });

      await this.makeRequest<any>(
        `${this.endpoints.production}/charge/${gatewayTransactionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: config.credentials.apiKey as string,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Payment cancelled successfully via OpenPix",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel OpenPix payment"
      );
    }
  }

  /**
   * Normaliza o status do OpenPix para o status padrão
   */
  private normalizeOpenPixStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      ACTIVE: PaymentStatus.PENDING,
      PENDING: PaymentStatus.PENDING,
      COMPLETED: PaymentStatus.APPROVED,
      PAID: PaymentStatus.APPROVED,
      EXPIRED: PaymentStatus.EXPIRED,
      CANCELLED: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  /**
   * Normaliza o status do OpenPix para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeOpenPixStatus(gatewayStatus);
  }

  /**
   * Valida assinatura do webhook OpenPix
   */
  validateWebhookSignature(
    payload: any,
    signature: string,
    secret: string
  ): { isValid: boolean; error?: string } {
    return this.validateWebhookSignatureHMAC(payload, signature, secret);
  }
}

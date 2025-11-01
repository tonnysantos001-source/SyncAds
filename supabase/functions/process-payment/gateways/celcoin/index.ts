// ============================================
// CELCOIN GATEWAY
// ============================================
//
// Documentação: https://developers.celcoin.com.br/
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
 * Celcoin Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Boleto
 * - Cartão de Crédito
 *
 * Credenciais necessárias:
 * - clientId
 * - clientSecret
 */
export class CelcoinGateway extends BaseGateway {
  name = "Celcoin";
  slug = "celcoin";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.BOLETO,
    PaymentMethod.CREDIT_CARD,
  ];

  endpoints = {
    production: "https://api.celcoin.com.br/v5",
    sandbox: "https://sandbox.openfinance.celcoin.com.br/v5",
  };

  private tokenCache: { token: string; expiresAt: number } | null = null;

  /**
   * Obtém token de autenticação
   */
  private async getAuthToken(config: GatewayConfig): Promise<string> {
    // Verificar cache
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token;
    }

    const endpoint = config.credentials.isSandbox
      ? this.endpoints.sandbox
      : this.endpoints.production;

    const credentials = Buffer.from(
      `${config.credentials.clientId}:${config.credentials.clientSecret}`
    ).toString("base64");

    const response = await this.makeRequest<any>(
      `${endpoint}/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials",
      }
    );

    // Cachear token (expira em 1 hora por padrão, guardar por 50 minutos)
    this.tokenCache = {
      token: response.access_token,
      expiresAt: Date.now() + 50 * 60 * 1000,
    };

    return response.access_token;
  }

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.clientId) {
        return {
          isValid: false,
          message: "Client ID is required",
        };
      }

      if (!credentials.clientSecret) {
        return {
          isValid: false,
          message: "Client Secret is required",
        };
      }

      // Tentar obter token de autenticação
      try {
        const endpoint = credentials.isSandbox
          ? this.endpoints.sandbox
          : this.endpoints.production;

        const credentialsBase64 = Buffer.from(
          `${credentials.clientId}:${credentials.clientSecret}`
        ).toString("base64");

        const response = await fetch(`${endpoint}/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentialsBase64}`,
          },
          body: "grant_type=client_credentials",
        });

        if (response.ok) {
          this.log("info", "Celcoin credentials validated successfully");
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

        this.log("warn", "Celcoin validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate Celcoin credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Celcoin credential validation failed", error);
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

      this.log("info", "Processing Celcoin payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const token = await this.getAuthToken(config);

      let payment: any = {
        externalId: request.orderId,
        amount: request.amount,
        customer: {
          name: request.customer.name,
          taxId: this.formatDocument(request.customer.document),
          email: request.customer.email,
          phoneNumber: this.formatPhone(request.customer.phone || ""),
        },
        callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/celcoin`,
      };

      let apiPath = "";
      let responseData: any;

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          apiPath = "/pix/qrcode";
          payment.expirationTime = 3600; // 1 hora em segundos
          payment.description = `Pedido #${request.orderId}`;

          responseData = await this.makeRequest<any>(
            `${endpoint}${apiPath}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: responseData.transactionId || responseData.id,
            status: PaymentStatus.PENDING,
            paymentUrl: responseData.paymentUrl,
            qrCode: responseData.emvqrcps,
            qrCodeBase64: responseData.imagemQrcode,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            message: "Celcoin PIX payment created successfully",
          });

        case PaymentMethod.BOLETO:
          apiPath = "/transactions/billpayments/authorize";
          payment.dueDate = new Date(Date.now() + 3 * 24 * 3600000).toISOString().split("T")[0];
          payment.instructions = `Pagamento do pedido ${request.orderId}`;

          responseData = await this.makeRequest<any>(
            `${endpoint}${apiPath}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: responseData.transactionId || responseData.id,
            status: PaymentStatus.PENDING,
            boletoUrl: responseData.boletoUrl || responseData.url,
            boletoBarcode: responseData.barcode || responseData.digitableLine,
            expiresAt: payment.dueDate,
            message: "Celcoin boleto payment created successfully",
          });

        case PaymentMethod.CREDIT_CARD:
          apiPath = "/transactions/card";
          if (request.paymentDetails?.card) {
            payment.card = {
              cardNumber: request.paymentDetails.card.number,
              holderName: request.paymentDetails.card.holderName,
              expirationMonth: request.paymentDetails.card.expiryMonth,
              expirationYear: request.paymentDetails.card.expiryYear,
              securityCode: request.paymentDetails.card.cvv,
            };
          }
          payment.installments = request.paymentDetails?.installments || 1;

          responseData = await this.makeRequest<any>(
            `${endpoint}${apiPath}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(payment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: responseData.transactionId || responseData.id,
            status: this.normalizeCelcoinStatus(responseData.status),
            message: "Celcoin card payment created successfully",
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
        "Failed to process payment via Celcoin"
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
      this.log("info", "Processing Celcoin webhook", { payload });

      if (!payload.externalId && !payload.transactionId) {
        return {
          success: false,
          processed: false,
          message: "Missing payment identifier in webhook payload",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: payload.externalId,
        gatewayTransactionId: payload.transactionId || payload.id,
        status: this.normalizeCelcoinStatus(payload.status),
        message: "Celcoin webhook processed successfully",
      };
    } catch (error: any) {
      this.log("error", "Celcoin webhook processing failed", error);
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
      this.log("info", "Getting Celcoin payment status", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const token = await this.getAuthToken(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/transactions/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        transactionId: response.externalId,
        gatewayTransactionId: response.transactionId || response.id,
        status: this.normalizeCelcoinStatus(response.status),
        amount: response.amount || 0,
        currency: "BRL",
        paymentMethod: this.normalizePaymentMethod(response.paymentMethod),
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
        paidAt: response.paidAt,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Celcoin payment status: ${error.message}`,
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
      this.log("info", "Canceling Celcoin payment", { gatewayTransactionId });

      const endpoint = config.credentials.isSandbox
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const token = await this.getAuthToken(config);

      await this.makeRequest<any>(
        `${endpoint}/transactions/${gatewayTransactionId}/cancel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Celcoin payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel Celcoin payment"
      );
    }
  }

  /**
   * Normaliza o status do Celcoin para o status padrão
   */
  private normalizeCelcoinStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      authorized: PaymentStatus.APPROVED,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
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
      card: PaymentMethod.CREDIT_CARD,
    };

    return methodMap[method?.toLowerCase()] || PaymentMethod.PIX;
  }

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeCelcoinStatus(gatewayStatus);
  }
}

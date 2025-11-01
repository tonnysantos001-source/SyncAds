// ============================================
// JUNO GATEWAY
// ============================================
//
// Documentação: https://dev.juno.com.br/
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
 * Juno Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - clientId
 * - clientSecret
 * - privateToken
 */
export class JunoGateway extends BaseGateway {
  name = "Juno";
  slug = "juno";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.juno.com.br",
    sandbox: "https://sandbox.juno.com.br",
  };

  private accessTokenCache: {
    token: string;
    expiresAt: number;
  } | null = null;

  /**
   * Obtém access token OAuth2
   */
  private async getAccessToken(config: GatewayConfig): Promise<string> {
    if (
      this.accessTokenCache &&
      this.accessTokenCache.expiresAt > Date.now()
    ) {
      return this.accessTokenCache.token;
    }

    const endpoint = this.getEndpoint(config);
    const credentials = btoa(
      `${config.credentials.clientId}:${config.credentials.clientSecret}`
    );

    try {
      const response = await fetch(`${endpoint}/authorization-server/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        throw new Error("Failed to get access token");
      }

      const data = await response.json();

      this.accessTokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000 * 0.9,
      };

      return data.access_token;
    } catch (error: any) {
      throw new GatewayError(
        `Failed to authenticate with Juno: ${error.message}`,
        this.slug,
        "AUTH_ERROR"
      );
    }
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

      if (!credentials.privateToken) {
        return {
          isValid: false,
          message: "Private Token is required",
        };
      }

      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const auth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);

      const response = await fetch(`${endpoint}/authorization-server/oauth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
      });

      if (response.ok) {
        this.log("info", "Juno credentials validated successfully");
        return {
          isValid: true,
          message: "Credentials are valid",
        };
      }

      return {
        isValid: false,
        message: "Invalid credentials",
      };
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

      this.log("info", "Processing Juno payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      if (request.paymentMethod === PaymentMethod.PIX) {
        return await this.processPIX(request, config, endpoint, accessToken);
      }

      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        return await this.processCreditCard(request, config, endpoint, accessToken);
      }

      if (request.paymentMethod === PaymentMethod.BOLETO) {
        return await this.processBoleto(request, config, endpoint, accessToken);
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Juno"
      );
    }
  }

  /**
   * Processa pagamento PIX
   */
  private async processPIX(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string,
    accessToken: string
  ): Promise<PaymentResponse> {
    const dueDate = new Date(Date.now() + 3600000).toISOString().split("T")[0];

    const chargeData = {
      charge: {
        description: `Pedido ${request.orderId}`,
        references: [request.orderId],
        amount: request.amount,
        dueDate: dueDate,
        installments: 1,
        maxOverdueDays: 0,
        fine: 0,
        interest: 0,
        paymentTypes: ["PIX"],
      },
      billing: {
        name: request.customer.name,
        document: this.formatDocument(request.customer.document),
        email: request.customer.email,
        phone: this.formatPhone(request.customer.phone || "11999999999"),
        notify: true,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/charges`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Api-Version": "2",
          "X-Resource-Token": config.credentials.privateToken as string,
        },
        body: JSON.stringify(chargeData),
      }
    );

    const charge = response._embedded?.charges?.[0];
    const pixInfo = charge?.pix;

    return this.createSuccessResponse({
      transactionId: charge?.id || response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: PaymentStatus.PENDING,
      qrCode: pixInfo?.payload,
      qrCodeBase64: pixInfo?.imageInBase64,
      expiresAt: charge?.dueDate,
      message: "PIX created successfully via Juno",
    });
  }

  /**
   * Processa pagamento com Cartão de Crédito
   */
  private async processCreditCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string,
    accessToken: string
  ): Promise<PaymentResponse> {
    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const chargeData = {
      charge: {
        description: `Pedido ${request.orderId}`,
        references: [request.orderId],
        amount: request.amount,
        dueDate: dueDate,
        installments: 1,
        paymentTypes: ["CREDIT_CARD"],
      },
      billing: {
        name: request.customer.name,
        document: this.formatDocument(request.customer.document),
        email: request.customer.email,
        phone: this.formatPhone(request.customer.phone || "11999999999"),
      },
    };

    const chargeResponse = await this.makeRequest<any>(
      `${endpoint}/charges`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Api-Version": "2",
          "X-Resource-Token": config.credentials.privateToken as string,
        },
        body: JSON.stringify(chargeData),
      }
    );

    const charge = chargeResponse._embedded?.charges?.[0];

    const creditCardData = {
      chargeId: charge.id,
      creditCardDetails: {
        creditCardHash: this.hashCard(request.card),
      },
      billing: {
        name: request.customer.name,
        document: this.formatDocument(request.customer.document),
        email: request.customer.email,
      },
    };

    const paymentResponse = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Api-Version": "2",
          "X-Resource-Token": config.credentials.privateToken as string,
        },
        body: JSON.stringify(creditCardData),
      }
    );

    return this.createSuccessResponse({
      transactionId: charge.id,
      gatewayTransactionId: paymentResponse.transactionId,
      status: this.normalizeJunoStatus(paymentResponse.status || "PENDING"),
      authorizationCode: paymentResponse.authorizationCode,
      message: "Credit card payment processed successfully via Juno",
    });
  }

  /**
   * Hash do cartão (simplificado - na produção usar biblioteca)
   */
  private hashCard(card: any): string {
    if (!card) return "";
    const cardString = `${card.number}${card.holderName}${card.expiryMonth}${card.expiryYear}${card.cvv}`;
    return btoa(cardString);
  }

  /**
   * Processa pagamento com Boleto
   */
  private async processBoleto(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string,
    accessToken: string
  ): Promise<PaymentResponse> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const chargeData = {
      charge: {
        description: `Pedido ${request.orderId}`,
        references: [request.orderId],
        amount: request.amount,
        dueDate: dueDate.toISOString().split("T")[0],
        installments: 1,
        maxOverdueDays: 0,
        fine: 2.00,
        interest: "0.033",
        paymentTypes: ["BOLETO"],
      },
      billing: {
        name: request.customer.name,
        document: this.formatDocument(request.customer.document),
        email: request.customer.email,
        phone: this.formatPhone(request.customer.phone || "11999999999"),
        notify: true,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/charges`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Api-Version": "2",
          "X-Resource-Token": config.credentials.privateToken as string,
        },
        body: JSON.stringify(chargeData),
      }
    );

    const charge = response._embedded?.charges?.[0];

    return this.createSuccessResponse({
      transactionId: charge?.id || response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: PaymentStatus.PENDING,
      paymentUrl: charge?._links?.boleto?.href,
      barcodeNumber: charge?.billetDetails?.barcodeNumber,
      digitableLine: charge?.billetDetails?.digitableLine,
      expiresAt: charge?.dueDate,
      message: "Boleto created successfully via Juno",
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
      this.log("info", "Processing Juno webhook", {
        eventType: payload.eventType,
      });

      if (payload.data && payload.data[0]) {
        const data = payload.data[0];
        const status = this.normalizeJunoStatus(data.status);

        return {
          success: true,
          processed: true,
          transactionId: data.id || data.chargeId,
          message: "Juno webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Juno webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Juno webhook processing failed", error);
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
      this.log("info", "Getting Juno payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/charges/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Api-Version": "2",
            "X-Resource-Token": config.credentials.privateToken as string,
          },
        }
      );

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizeJunoStatus(response.status),
        amount: response.amount || 0,
        currency: "BRL",
        paymentMethod: this.mapJunoPaymentMethod(response.paymentTypes?.[0]),
        createdAt: response.createdOn,
        updatedAt: response.updatedOn || response.createdOn,
        paidAt: response.paidAt,
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
   * Normaliza o status do Juno para o status padrão
   */
  private normalizeJunoStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      ACTIVE: PaymentStatus.PENDING,
      PENDING: PaymentStatus.PENDING,
      PAID: PaymentStatus.APPROVED,
      CONFIRMED: PaymentStatus.APPROVED,
      CANCELLED: PaymentStatus.CANCELLED,
      FAILED: PaymentStatus.FAILED,
      REFUNDED: PaymentStatus.REFUNDED,
      EXPIRED: PaymentStatus.EXPIRED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento do Juno para nosso enum
   */
  private mapJunoPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      PIX: PaymentMethod.PIX,
      CREDIT_CARD: PaymentMethod.CREDIT_CARD,
      BOLETO: PaymentMethod.BOLETO,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status do Juno para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeJunoStatus(gatewayStatus);
  }
}

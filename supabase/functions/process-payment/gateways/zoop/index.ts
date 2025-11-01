// ============================================
// ZOOP GATEWAY
// ============================================
//
// Documentação: https://docs.zoop.com.br/
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
 * Zoop Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - marketplaceId
 * - publishableKey
 * - apiKey
 */
export class ZoopGateway extends BaseGateway {
  name = "Zoop";
  slug = "zoop";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.zoop.ws/v1",
    sandbox: "https://api.zoop.ws/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.marketplaceId) {
        return {
          isValid: false,
          message: "Marketplace ID is required",
        };
      }

      if (!credentials.apiKey) {
        return {
          isValid: false,
          message: "API Key is required",
        };
      }

      // Testar credenciais
      try {
        const response = await fetch(
          `${this.endpoints.production}/marketplaces/${credentials.marketplaceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          this.log("info", "Zoop credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401) {
          return {
            isValid: false,
            message: "Invalid credentials",
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

      this.log("info", "Processing Zoop payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);

      // PIX
      if (request.paymentMethod === PaymentMethod.PIX) {
        return await this.processPIX(request, config, endpoint);
      }

      // Cartão de Crédito
      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        return await this.processCreditCard(request, config, endpoint);
      }

      // Cartão de Débito
      if (request.paymentMethod === PaymentMethod.DEBIT_CARD) {
        return await this.processDebitCard(request, config, endpoint);
      }

      // Boleto
      if (request.paymentMethod === PaymentMethod.BOLETO) {
        return await this.processBoleto(request, config, endpoint);
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Zoop"
      );
    }
  }

  /**
   * Processa pagamento PIX
   */
  private async processPIX(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    // Criar buyer primeiro
    const buyer = await this.createBuyer(request, config, endpoint);

    const transactionData = {
      amount: Math.round(request.amount * 100).toString(),
      currency: "BRL",
      description: `Pedido ${request.orderId}`,
      payment_type: "pix",
      on_behalf_of: config.credentials.sellerId || config.credentials.marketplaceId,
      customer: buyer.id,
      reference_id: request.orderId,
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/marketplaces/${config.credentials.marketplaceId}/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(transactionData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeZoopStatus(response.status),
      qrCode: response.payment_method?.qr_code,
      qrCodeBase64: response.payment_method?.qr_code_image,
      expiresAt: response.payment_method?.expiration_date,
      message: "PIX created successfully via Zoop",
    });
  }

  /**
   * Processa pagamento com Cartão de Crédito
   */
  private async processCreditCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    // Criar buyer
    const buyer = await this.createBuyer(request, config, endpoint);

    // Tokenizar cartão
    const tokenData = {
      holder_name: request.card?.holderName,
      card_number: request.card?.number.replace(/\s/g, ""),
      expiration_month: request.card?.expiryMonth,
      expiration_year: request.card?.expiryYear,
      security_code: request.card?.cvv,
    };

    const tokenResponse = await this.makeRequest<any>(
      `${endpoint}/marketplaces/${config.credentials.marketplaceId}/cards/tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.publishableKey + ":")}`,
        },
        body: JSON.stringify(tokenData),
      }
    );

    // Criar transação
    const transactionData = {
      amount: Math.round(request.amount * 100).toString(),
      currency: "BRL",
      description: `Pedido ${request.orderId}`,
      payment_type: "credit",
      on_behalf_of: config.credentials.sellerId || config.credentials.marketplaceId,
      customer: buyer.id,
      token: tokenResponse.id,
      installment_plan: {
        mode: "interest_free",
        number_installments: 1,
      },
      reference_id: request.orderId,
      capture: true,
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/marketplaces/${config.credentials.marketplaceId}/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(transactionData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeZoopStatus(response.status),
      authorizationCode: response.authorization_code,
      nsu: response.gateway_authorization,
      message: "Credit card payment processed successfully via Zoop",
    });
  }

  /**
   * Processa pagamento com Cartão de Débito
   */
  private async processDebitCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const buyer = await this.createBuyer(request, config, endpoint);

    const tokenData = {
      holder_name: request.card?.holderName,
      card_number: request.card?.number.replace(/\s/g, ""),
      expiration_month: request.card?.expiryMonth,
      expiration_year: request.card?.expiryYear,
      security_code: request.card?.cvv,
    };

    const tokenResponse = await this.makeRequest<any>(
      `${endpoint}/marketplaces/${config.credentials.marketplaceId}/cards/tokens`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.publishableKey + ":")}`,
        },
        body: JSON.stringify(tokenData),
      }
    );

    const transactionData = {
      amount: Math.round(request.amount * 100).toString(),
      currency: "BRL",
      description: `Pedido ${request.orderId}`,
      payment_type: "debit",
      on_behalf_of: config.credentials.sellerId || config.credentials.marketplaceId,
      customer: buyer.id,
      token: tokenResponse.id,
      reference_id: request.orderId,
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/marketplaces/${config.credentials.marketplaceId}/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(transactionData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      redirectUrl: response.payment_method?.redirect_url,
      message: "Debit card payment initiated via Zoop",
    });
  }

  /**
   * Processa pagamento com Boleto
   */
  private async processBoleto(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const buyer = await this.createBuyer(request, config, endpoint);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const transactionData = {
      amount: Math.round(request.amount * 100).toString(),
      currency: "BRL",
      description: `Pedido ${request.orderId}`,
      payment_type: "boleto",
      on_behalf_of: config.credentials.sellerId || config.credentials.marketplaceId,
      customer: buyer.id,
      reference_id: request.orderId,
      payment_method: {
        expiration_date: dueDate.toISOString().split("T")[0],
        billing_instructions: {
          late_fee: {
            mode: "PERCENTAGE",
            percentage: 2,
          },
          interest: {
            mode: "MONTHLY_PERCENTAGE",
            percentage: 1,
          },
          discount: [],
        },
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/marketplaces/${config.credentials.marketplaceId}/transactions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(transactionData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      paymentUrl: response.payment_method?.url,
      barcodeNumber: response.payment_method?.barcode,
      digitableLine: response.payment_method?.typeful_line,
      expiresAt: response.payment_method?.expiration_date,
      message: "Boleto created successfully via Zoop",
    });
  }

  /**
   * Cria um buyer (comprador) na Zoop
   */
  private async createBuyer(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<any> {
    const buyerData = {
      first_name: request.customer.name.split(" ")[0],
      last_name: request.customer.name.split(" ").slice(1).join(" ") || request.customer.name.split(" ")[0],
      email: request.customer.email,
      taxpayer_id: this.formatDocument(request.customer.document),
      phone_number: this.formatPhone(request.customer.phone || "11999999999"),
    };

    try {
      const response = await this.makeRequest<any>(
        `${endpoint}/marketplaces/${config.credentials.marketplaceId}/buyers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(buyerData),
        }
      );

      return response;
    } catch (error: any) {
      this.log("warn", "Buyer creation failed, using email as ID", error);
      return { id: request.customer.email };
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
      this.log("info", "Processing Zoop webhook", {
        type: payload.type,
        id: payload.id,
      });

      if (payload.type === "transaction.succeeded" || payload.type === "transaction.paid") {
        return {
          success: true,
          processed: true,
          transactionId: payload.id,
          message: "Zoop webhook processed successfully",
        };
      }

      if (payload.type === "transaction.failed") {
        return {
          success: true,
          processed: true,
          transactionId: payload.id,
          message: "Zoop transaction failed webhook processed",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Zoop webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Zoop webhook processing failed", error);
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
      this.log("info", "Getting Zoop payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/marketplaces/${config.credentials.marketplaceId}/transactions/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
          },
        }
      );

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizeZoopStatus(response.status),
        amount: parseInt(response.amount) / 100,
        currency: "BRL",
        paymentMethod: this.mapZoopPaymentMethod(response.payment_type),
        createdAt: response.created_at,
        updatedAt: response.updated_at || response.created_at,
        paidAt: response.status === "succeeded" ? response.updated_at : undefined,
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
   * Normaliza o status da Zoop para o status padrão
   */
  private normalizeZoopStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      pre_authorized: PaymentStatus.PROCESSING,
      succeeded: PaymentStatus.APPROVED,
      failed: PaymentStatus.FAILED,
      canceled: PaymentStatus.CANCELLED,
      reversed: PaymentStatus.REFUNDED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento da Zoop para nosso enum
   */
  private mapZoopPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit: PaymentMethod.CREDIT_CARD,
      debit: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status da Zoop para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeZoopStatus(gatewayStatus);
  }
}

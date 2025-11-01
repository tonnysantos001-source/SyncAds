// ============================================
// PAGAR.ME GATEWAY
// ============================================
//
// Documentação: https://docs.pagar.me/
// Prioridade: Alta
// API: v5
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
 * Pagar.me Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiKey (sk_test_xxx ou sk_live_xxx)
 * - encryptionKey (ek_test_xxx ou ek_live_xxx)
 */
export class PagarmeGateway extends BaseGateway {
  name = "Pagar.me";
  slug = "pagarme";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.pagar.me/core/v5",
    sandbox: "https://api.pagar.me/core/v5", // Usa mesma URL mas com chave de teste
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

      if (!credentials.encryptionKey) {
        return {
          isValid: false,
          message: "Encryption Key is required",
        };
      }

      // Validar formato das chaves
      if (!credentials.apiKey.startsWith("sk_")) {
        return {
          isValid: false,
          message: "Invalid API Key format (should start with sk_)",
        };
      }

      // Testar credenciais fazendo uma chamada à API
      try {
        const response = await fetch(`${this.endpoints.production}/customers?page=1&size=1`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
          },
        });

        if (response.ok || response.status === 200) {
          this.log("info", "Pagar.me credentials validated successfully");
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

      this.log("info", "Processing Pagar.me payment", {
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
        "Failed to process payment via Pagar.me"
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
    const orderData = {
      code: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
        type: this.getDocumentType(request.customer.document) === "CPF" ? "individual" : "company",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: request.customer.phone?.substring(0, 2) || "11",
            number: request.customer.phone?.substring(2) || "999999999",
          },
        },
      },
      items: [
        {
          code: request.orderId,
          description: `Pedido ${request.orderId}`,
          amount: this.formatAmountToCents(request.amount),
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: "pix",
          pix: {
            expires_in: 3600, // 1 hora
          },
        },
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: this.normalizePagarmeStatus(charge?.status || "pending"),
      qrCode: lastTransaction?.qr_code,
      qrCodeBase64: lastTransaction?.qr_code_url,
      expiresAt: lastTransaction?.expires_at,
      message: "PIX created successfully via Pagar.me",
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
    const orderData = {
      code: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
        type: this.getDocumentType(request.customer.document) === "CPF" ? "individual" : "company",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: request.customer.phone?.substring(0, 2) || "11",
            number: request.customer.phone?.substring(2) || "999999999",
          },
        },
      },
      items: [
        {
          code: request.orderId,
          description: `Pedido ${request.orderId}`,
          amount: this.formatAmountToCents(request.amount),
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            installments: 1,
            statement_descriptor: "SYNCADS",
            card: {
              number: request.card?.number.replace(/\s/g, ""),
              holder_name: request.card?.holderName,
              exp_month: parseInt(request.card?.expiryMonth || "0"),
              exp_year: parseInt(request.card?.expiryYear || "0"),
              cvv: request.card?.cvv,
              billing_address: request.billingAddress ? {
                line_1: `${request.billingAddress.number} ${request.billingAddress.street}`,
                line_2: request.billingAddress.complement || "",
                zip_code: this.formatZipCode(request.billingAddress.zipCode),
                city: request.billingAddress.city,
                state: request.billingAddress.state,
                country: "BR",
              } : undefined,
            },
          },
        },
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: this.normalizePagarmeStatus(charge?.status || "pending"),
      authorizationCode: lastTransaction?.acquirer_auth_code,
      nsu: lastTransaction?.acquirer_nsu,
      tid: lastTransaction?.acquirer_tid,
      message: "Credit card payment processed successfully via Pagar.me",
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
    const orderData = {
      code: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
        type: this.getDocumentType(request.customer.document) === "CPF" ? "individual" : "company",
      },
      items: [
        {
          code: request.orderId,
          description: `Pedido ${request.orderId}`,
          amount: this.formatAmountToCents(request.amount),
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: "debit_card",
          debit_card: {
            card: {
              number: request.card?.number.replace(/\s/g, ""),
              holder_name: request.card?.holderName,
              exp_month: parseInt(request.card?.expiryMonth || "0"),
              exp_year: parseInt(request.card?.expiryYear || "0"),
              cvv: request.card?.cvv,
            },
          },
        },
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: PaymentStatus.PENDING,
      redirectUrl: lastTransaction?.url,
      message: "Debit card payment initiated via Pagar.me",
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
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const orderData = {
      code: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
        type: this.getDocumentType(request.customer.document) === "CPF" ? "individual" : "company",
        phones: {
          mobile_phone: {
            country_code: "55",
            area_code: request.customer.phone?.substring(0, 2) || "11",
            number: request.customer.phone?.substring(2) || "999999999",
          },
        },
        address: request.billingAddress ? {
          line_1: `${request.billingAddress.number} ${request.billingAddress.street}`,
          line_2: request.billingAddress.complement || "",
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          country: "BR",
        } : undefined,
      },
      items: [
        {
          code: request.orderId,
          description: `Pedido ${request.orderId}`,
          amount: this.formatAmountToCents(request.amount),
          quantity: 1,
        },
      ],
      payments: [
        {
          payment_method: "boleto",
          boleto: {
            bank: "001", // Banco do Brasil
            instructions: "Pagar até o vencimento",
            due_at: dueDate.toISOString(),
          },
        },
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];
    const lastTransaction = charge?.last_transaction;

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: PaymentStatus.PENDING,
      paymentUrl: lastTransaction?.url,
      barcodeNumber: lastTransaction?.barcode,
      digitableLine: lastTransaction?.line,
      expiresAt: lastTransaction?.due_at,
      message: "Boleto created successfully via Pagar.me",
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
      this.log("info", "Processing Pagar.me webhook", {
        type: payload.type,
        id: payload.id,
      });

      // Pagar.me envia eventos como: charge.paid, charge.refunded, etc
      if (payload.type && payload.data) {
        const data = payload.data;
        const status = this.normalizePagarmeStatus(data.status);

        return {
          success: true,
          processed: true,
          transactionId: data.id || data.order_id,
          message: "Pagar.me webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Pagar.me webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Pagar.me webhook processing failed", error);
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
      this.log("info", "Getting Pagar.me payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/orders/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
          },
        }
      );

      const charge = response.charges?.[0];

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizePagarmeStatus(charge?.status || "pending"),
        amount: (response.amount || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapPagarmePaymentMethod(charge?.payment_method),
        createdAt: response.created_at,
        updatedAt: charge?.updated_at || response.created_at,
        paidAt: charge?.paid_at,
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
   * Normaliza o status do Pagar.me para o status padrão
   */
  private normalizePagarmeStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      failed: PaymentStatus.FAILED,
      not_authorized: PaymentStatus.FAILED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      partial_refunded: PaymentStatus.REFUNDED,
      overpaid: PaymentStatus.APPROVED,
      underpaid: PaymentStatus.PENDING,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento do Pagar.me para nosso enum
   */
  private mapPagarmePaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      debit_card: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };

    return methodMap[method] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status do Pagar.me para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizePagarmeStatus(gatewayStatus);
  }
}

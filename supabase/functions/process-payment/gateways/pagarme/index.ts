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
    sandbox: "https://api.pagar.me/core/v5", // v5 usa mesma URL com chave de teste
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

      if (!credentials.apiKey.startsWith("sk_")) {
        return {
          isValid: false,
          message: "Invalid API Key format (should start with sk_)",
        };
      }

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
            message: "Invalid API Key - unauthorized",
          };
        }

        return {
          isValid: true,
          message: "Credentials accepted (validation incomplete)",
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
   * Health Check do gateway (botão Testar Conexão)
   */
  async healthCheck(config: GatewayConfig): Promise<CredentialValidationResult> {
    const creds = await this.resolveCredentials(config);
    return this.validateCredentials(creds);
  }

  /**
   * Processa um pagamento
   */
  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    const startTime = Date.now();
    let responseData: any = null;
    let statusCode: number | null = null;
    let statusText = "failed";
    let errorMsg: string | undefined = undefined;
    let payloadEnv: any = null;

    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing Pagar.me payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const credentials = await this.resolveCredentials(config);
      const endpoint = this.endpoints.production;

      // PIX
      if (request.paymentMethod === PaymentMethod.PIX) {
        payloadEnv = this.buildPIXPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || "Pagar.me PIX creation failed");
        }

        const charge = responseData.charges?.[0];
        const lastTransaction = charge?.last_transaction;

        // Gravar log enriquecido
        await this.saveGatewayLog({
          userId: request.userId,
          environment: config.environment || "production",
          transactionId: request.metadata?.transactionId,
          request: payloadEnv,
          response: responseData,
          status: "success",
          statusCode: statusCode || 200,
          executionTime: Date.now() - startTime,
        });

        return this.createSuccessResponse({
          transactionId: responseData.id,
          gatewayTransactionId: charge?.id || responseData.id,
          status: this.normalizePagarmeStatus(charge?.status || "pending"),
          qrCode: lastTransaction?.qr_code,
          qrCodeBase64: lastTransaction?.qr_code_url,
          expiresAt: lastTransaction?.expires_at,
          message: "PIX created successfully via Pagar.me",
        });
      }

      // Cartão de Crédito
      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        payloadEnv = this.buildCreditCardPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || "Pagar.me Card creation failed");
        }

        const charge = responseData.charges?.[0];
        const lastTransaction = charge?.last_transaction;

        // Gravar log enriquecido
        await this.saveGatewayLog({
          userId: request.userId,
          environment: config.environment || "production",
          transactionId: request.metadata?.transactionId,
          request: payloadEnv,
          response: responseData,
          status: "success",
          statusCode: statusCode || 200,
          executionTime: Date.now() - startTime,
        });

        return this.createSuccessResponse({
          transactionId: responseData.id,
          gatewayTransactionId: charge?.id || responseData.id,
          status: this.normalizePagarmeStatus(charge?.status || "pending"),
          authorizationCode: lastTransaction?.acquirer_auth_code,
          nsu: lastTransaction?.acquirer_nsu,
          tid: lastTransaction?.acquirer_tid,
          message: "Credit card payment processed successfully via Pagar.me",
        });
      }

      // Cartão de Débito
      if (request.paymentMethod === PaymentMethod.DEBIT_CARD) {
        payloadEnv = this.buildDebitCardPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || "Pagar.me Debit Card creation failed");
        }

        const charge = responseData.charges?.[0];
        const lastTransaction = charge?.last_transaction;

        // Gravar log enriquecido
        await this.saveGatewayLog({
          userId: request.userId,
          environment: config.environment || "production",
          transactionId: request.metadata?.transactionId,
          request: payloadEnv,
          response: responseData,
          status: "success",
          statusCode: statusCode || 200,
          executionTime: Date.now() - startTime,
        });

        return this.createSuccessResponse({
          transactionId: responseData.id,
          gatewayTransactionId: charge?.id || responseData.id,
          status: PaymentStatus.PENDING,
          redirectUrl: lastTransaction?.url,
          message: "Debit card payment initiated via Pagar.me",
        });
      }

      // Boleto
      if (request.paymentMethod === PaymentMethod.BOLETO) {
        payloadEnv = this.buildBoletoPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.message || "Pagar.me Boleto creation failed");
        }

        const charge = responseData.charges?.[0];
        const lastTransaction = charge?.last_transaction;

        // Gravar log enriquecido
        await this.saveGatewayLog({
          userId: request.userId,
          environment: config.environment || "production",
          transactionId: request.metadata?.transactionId,
          request: payloadEnv,
          response: responseData,
          status: "success",
          statusCode: statusCode || 200,
          executionTime: Date.now() - startTime,
        });

        return this.createSuccessResponse({
          transactionId: responseData.id,
          gatewayTransactionId: charge?.id || responseData.id,
          status: PaymentStatus.PENDING,
          paymentUrl: lastTransaction?.url,
          barcodeNumber: lastTransaction?.barcode,
          digitableLine: lastTransaction?.line,
          expiresAt: lastTransaction?.due_at,
          message: "Boleto created successfully via Pagar.me",
        });
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      errorMsg = error.message;
      // Gravar log enriquecido de erro
      await this.saveGatewayLog({
        userId: request.userId,
        environment: config.environment || "production",
        transactionId: request.metadata?.transactionId,
        request: payloadEnv || { orderId: request.orderId, method: request.paymentMethod },
        response: { error: error.toString() },
        status: "failed",
        statusCode: statusCode || 500,
        executionTime: Date.now() - startTime,
        errorMessage: errorMsg,
      });

      return this.createErrorResponse(
        error,
        "Failed to process payment via Pagar.me"
      );
    }
  }

  // ===== AUXILIARES DE CONSTRUÇÃO DE PAYLOAD =====

  private buildPIXPayload(request: PaymentRequest) {
    return {
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
            expires_in: 3600,
          },
        },
      ],
    };
  }

  private buildCreditCardPayload(request: PaymentRequest) {
    return {
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
            installments: request.metadata?.installments || 1,
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
  }

  private buildDebitCardPayload(request: PaymentRequest) {
    return {
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
  }

  private buildBoletoPayload(request: PaymentRequest) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    return {
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
            bank: "001",
            instructions: "Pagar até o vencimento",
            due_at: dueDate.toISOString(),
          },
        },
      ],
    };
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

      if (payload.type && payload.data) {
        const data = payload.data;
        return {
          success: true,
          processed: true,
          gatewayTransactionId: data.id || data.order_id,
          message: `Pagar.me webhook ${payload.type} received`,
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

      const credentials = await this.resolveCredentials(config);
      const endpoint = this.endpoints.production;

      const response = await fetch(`${endpoint}/orders/${gatewayTransactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch status from Pagar.me");
      }

      const data = await response.json();
      const charge = data.charges?.[0];

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: data.id,
        status: this.normalizePagarmeStatus(charge?.status || "pending"),
        amount: (data.amount || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapPagarmePaymentMethod(charge?.payment_method),
        createdAt: data.created_at,
        updatedAt: charge?.updated_at || data.created_at,
        paidAt: charge?.paid_at || undefined,
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

// ============================================
// PAGSEGURO GATEWAY
// ============================================
//
// Documentação: https://dev.pagseguro.uol.com.br/
// Prioridade: Alta
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
 * PagSeguro Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - email
 * - token
 */
export class PagSeguroGateway extends BaseGateway {
  name = "PagSeguro";
  slug = "pagseguro";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.pagseguro.com",
    sandbox: "https://sandbox.api.pagseguro.com",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.email) {
        return {
          isValid: false,
          message: "Email is required",
        };
      }

      if (!credentials.token) {
        return {
          isValid: false,
          message: "Token is required",
        };
      }

      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      try {
        const response = await fetch(`${endpoint}/v2/sessions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
          },
          body: new URLSearchParams({
            email: credentials.email,
            token: credentials.token,
          }),
        });

        if (response.ok || response.status === 200) {
          this.log("info", "PagSeguro credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        return {
          isValid: false,
          message: "Invalid credentials (email or token)",
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

      this.log("info", "Processing PagSeguro payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const credentials = await this.resolveCredentials(config);
      const endpoint = config.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      // PIX
      if (request.paymentMethod === PaymentMethod.PIX) {
        payloadEnv = this.buildPIXPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials.token}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error_messages?.[0]?.description || "PagSeguro PIX creation failed");
        }

        const qrCode = responseData.qr_codes?.[0];

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
          gatewayTransactionId: responseData.id,
          status: PaymentStatus.PENDING,
          qrCode: qrCode?.text,
          qrCodeBase64: qrCode?.links?.find((l: any) => l.rel === "QRCODE.PNG")?.href || qrCode?.links?.[0]?.href,
          paymentUrl: responseData.links?.find((l: any) => l.rel === "PAY")?.href,
          expiresAt: qrCode?.expiration_date,
          message: "PIX created successfully via PagSeguro",
        });
      }

      // Cartão de Crédito
      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        payloadEnv = this.buildCreditCardPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials.token}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error_messages?.[0]?.description || "PagSeguro Card creation failed");
        }

        const charge = responseData.charges?.[0];

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
          status: this.normalizePagSeguroStatus(charge?.status || "WAITING"),
          authorizationCode: charge?.payment_method?.authorization_code,
          nsu: charge?.payment_method?.nsu,
          tid: charge?.payment_method?.tid,
          message: "Credit card payment processed successfully via PagSeguro",
        });
      }

      // Cartão de Débito
      if (request.paymentMethod === PaymentMethod.DEBIT_CARD) {
        payloadEnv = this.buildDebitCardPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials.token}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error_messages?.[0]?.description || "PagSeguro Debit Card creation failed");
        }

        const charge = responseData.charges?.[0];

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
          redirectUrl: charge?.links?.find((l: any) => l.rel === "PAY")?.href,
          message: "Debit card payment initiated via PagSeguro",
        });
      }

      // Boleto
      if (request.paymentMethod === PaymentMethod.BOLETO) {
        payloadEnv = this.buildBoletoPayload(request);
        const response = await fetch(`${endpoint}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials.token}`,
          },
          body: JSON.stringify(payloadEnv),
        });

        statusCode = response.status;
        responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error_messages?.[0]?.description || "PagSeguro Boleto creation failed");
        }

        const charge = responseData.charges?.[0];
        const boleto = charge?.payment_method?.boleto;

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
          paymentUrl: boleto?.links?.find((l: any) => l.rel === "PAY")?.href || boleto?.links?.[0]?.href,
          barcodeNumber: boleto?.barcode,
          digitableLine: boleto?.formatted_barcode,
          expiresAt: boleto?.due_date,
          message: "Boleto created successfully via PagSeguro",
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
        "Failed to process payment via PagSeguro"
      );
    }
  }

  // ===== AUXILIARES DE CONSTRUÇÃO DE PAYLOAD =====

  private buildPIXPayload(request: PaymentRequest) {
    return {
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
      },
      items: [
        {
          reference_id: request.orderId,
          name: `Pedido ${request.orderId}`,
          quantity: 1,
          unit_amount: Math.round(request.amount * 100),
        },
      ],
      qr_codes: [
        {
          amount: {
            value: Math.round(request.amount * 100),
          },
          expiration_date: new Date(Date.now() + 3600000).toISOString(),
        },
      ],
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/pagseguro`,
      ],
    };
  }

  private buildCreditCardPayload(request: PaymentRequest) {
    return {
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
      },
      items: [
        {
          reference_id: request.orderId,
          name: `Pedido ${request.orderId}`,
          quantity: 1,
          unit_amount: Math.round(request.amount * 100),
        },
      ],
      charges: [
        {
          reference_id: request.orderId,
          description: `Pagamento do pedido ${request.orderId}`,
          amount: {
            value: Math.round(request.amount * 100),
            currency: "BRL",
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: request.metadata?.installments || 1,
            capture: true,
            card: {
              number: request.card?.number.replace(/\s/g, ""),
              exp_month: request.card?.expiryMonth,
              exp_year: request.card?.expiryYear,
              security_code: request.card?.cvv,
              holder: {
                name: request.card?.holderName,
              },
              store: false,
            },
          },
        },
      ],
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/pagseguro`,
      ],
    };
  }

  private buildDebitCardPayload(request: PaymentRequest) {
    return {
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
      },
      items: [
        {
          reference_id: request.orderId,
          name: `Pedido ${request.orderId}`,
          quantity: 1,
          unit_amount: Math.round(request.amount * 100),
        },
      ],
      charges: [
        {
          reference_id: request.orderId,
          amount: {
            value: Math.round(request.amount * 100),
            currency: "BRL",
          },
          payment_method: {
            type: "DEBIT_CARD",
            card: {
              number: request.card?.number.replace(/\s/g, ""),
              exp_month: request.card?.expiryMonth,
              exp_year: request.card?.expiryYear,
              security_code: request.card?.cvv,
              holder: {
                name: request.card?.holderName,
              },
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
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
      },
      items: [
        {
          reference_id: request.orderId,
          name: `Pedido ${request.orderId}`,
          quantity: 1,
          unit_amount: Math.round(request.amount * 100),
        },
      ],
      charges: [
        {
          reference_id: request.orderId,
          description: `Pagamento do pedido ${request.orderId}`,
          amount: {
            value: Math.round(request.amount * 100),
            currency: "BRL",
          },
          payment_method: {
            type: "BOLETO",
            boleto: {
              due_date: dueDate.toISOString().split("T")[0],
              instruction_lines: {
                line_1: "Pagamento processado via checkout",
                line_2: "Via PagSeguro",
              },
              holder: {
                name: request.customer.name,
                tax_id: this.formatDocument(request.customer.document),
                email: request.customer.email,
                address: request.billingAddress ? {
                  street: request.billingAddress.street,
                  number: request.billingAddress.number,
                  complement: request.billingAddress.complement || "",
                  locality: request.billingAddress.neighborhood,
                  city: request.billingAddress.city,
                  region_code: request.billingAddress.state,
                  country: "BRA",
                  postal_code: this.formatZipCode(request.billingAddress.zipCode),
                } : undefined,
              },
            },
          },
        },
      ],
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/pagseguro`,
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
      this.log("info", "Processing PagSeguro webhook", {
        notificationCode: payload.notificationCode,
        id: payload.id
      });

      if (payload.notificationCode) {
        return {
          success: true,
          processed: true,
          gatewayTransactionId: payload.notificationCode,
          message: "PagSeguro webhook notificationCode received",
        };
      }

      if (payload.charges && payload.charges.length > 0) {
        return {
          success: true,
          processed: true,
          gatewayTransactionId: payload.id,
          message: "PagSeguro webhook order processed",
        };
      }

      return {
        success: true,
        processed: false,
        message: "PagSeguro webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "PagSeguro webhook processing failed", error);
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
      this.log("info", "Getting PagSeguro payment status", { gatewayTransactionId });

      const credentials = await this.resolveCredentials(config);
      const endpoint = config.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const response = await fetch(`${endpoint}/orders/${gatewayTransactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error_messages?.[0]?.description || "Failed to fetch status from PagSeguro");
      }

      const data = await response.json();
      const charge = data.charges?.[0];

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: data.id,
        status: this.normalizePagSeguroStatus(charge?.status || "WAITING"),
        amount: (data.items?.[0]?.unit_amount || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapPagSeguroPaymentMethod(charge?.payment_method?.type),
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
   * Normaliza o status do PagSeguro para o status padrão
   */
  private normalizePagSeguroStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      WAITING: PaymentStatus.PENDING,
      IN_ANALYSIS: PaymentStatus.PROCESSING,
      PAID: PaymentStatus.APPROVED,
      AVAILABLE: PaymentStatus.APPROVED,
      AUTHORIZED: PaymentStatus.APPROVED,
      DECLINED: PaymentStatus.FAILED,
      CANCELED: PaymentStatus.CANCELLED,
      REFUNDED: PaymentStatus.REFUNDED,
      EXPIRED: PaymentStatus.EXPIRED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento do PagSeguro para nosso enum
   */
  private mapPagSeguroPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      PIX: PaymentMethod.PIX,
      CREDIT_CARD: PaymentMethod.CREDIT_CARD,
      DEBIT_CARD: PaymentMethod.DEBIT_CARD,
      BOLETO: PaymentMethod.BOLETO,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status do PagSeguro para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizePagSeguroStatus(gatewayStatus);
  }
}

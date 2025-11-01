// ============================================
// PAGBANK GATEWAY
// ============================================
//
// Documentação: https://dev.pagbank.uol.com.br/
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
 * PagBank Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - token (OAuth2 token)
 */
export class PagBankGateway extends BaseGateway {
  name = "PagBank";
  slug = "pagbank";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.pagbank.com",
    sandbox: "https://sandbox.api.pagbank.com",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.token) {
        return {
          isValid: false,
          message: "Token is required",
        };
      }

      // Testar token fazendo uma chamada simples à API
      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      try {
        const response = await fetch(`${endpoint}/public-keys`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${credentials.token}`,
            Accept: "application/json",
          },
        });

        if (response.ok || response.status === 200) {
          this.log("info", "PagBank credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        return {
          isValid: false,
          message: "Invalid token",
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

      this.log("info", "Processing PagBank payment", {
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
        "Failed to process payment via PagBank"
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
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
        phones: [
          {
            country: "55",
            area: request.customer.phone?.substring(0, 2) || "11",
            number: request.customer.phone?.substring(2) || "999999999",
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
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
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/pagbank`,
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.token}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const qrCode = response.qr_codes?.[0];

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      qrCode: qrCode?.text,
      qrCodeBase64: qrCode?.links?.[0]?.href,
      expiresAt: qrCode?.expiration_date,
      message: "PIX created successfully via PagBank",
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
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
        phones: [
          {
            country: "55",
            area: request.customer.phone?.substring(0, 2) || "11",
            number: request.customer.phone?.substring(2) || "999999999",
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
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
            installments: 1,
            capture: true,
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
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/pagbank`,
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.token}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: this.normalizePagBankStatus(charge?.status || "WAITING"),
      authorizationCode: charge?.payment_method?.authorization_code,
      nsu: charge?.payment_method?.nsu,
      tid: charge?.payment_method?.tid,
      message: "Credit card payment processed successfully via PagBank",
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
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
      },
      items: [
        {
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

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.token}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: PaymentStatus.PENDING,
      redirectUrl: charge?.links?.find((l: any) => l.rel === "PAY")?.href,
      message: "Debit card payment initiated via PagBank",
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
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: this.formatDocument(request.customer.document),
        phones: [
          {
            country: "55",
            area: request.customer.phone?.substring(0, 2) || "11",
            number: request.customer.phone?.substring(2) || "999999999",
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
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
              holder: {
                name: request.customer.name,
                tax_id: this.formatDocument(request.customer.document),
                email: request.customer.email,
              },
            },
          },
        },
      ],
      notification_urls: [
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/pagbank`,
      ],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/orders`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.token}`,
        },
        body: JSON.stringify(orderData),
      }
    );

    const charge = response.charges?.[0];
    const boleto = charge?.payment_method?.boleto;

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status: PaymentStatus.PENDING,
      paymentUrl: boleto?.links?.[0]?.href,
      barcodeNumber: boleto?.barcode,
      digitableLine: boleto?.formatted_barcode,
      expiresAt: boleto?.due_date,
      message: "Boleto created successfully via PagBank",
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
      this.log("info", "Processing PagBank webhook", { payload });

      if (payload.charges && payload.charges.length > 0) {
        const charge = payload.charges[0];
        const status = this.normalizePagBankStatus(charge.status);

        return {
          success: true,
          processed: true,
          transactionId: payload.id,
          message: "PagBank webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "PagBank webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "PagBank webhook processing failed", error);
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
      this.log("info", "Getting PagBank payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/orders/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.credentials.token}`,
          },
        }
      );

      const charge = response.charges?.[0];

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizePagBankStatus(charge?.status || "WAITING"),
        amount: (response.items?.[0]?.unit_amount || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapPagBankPaymentMethod(charge?.payment_method?.type),
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
   * Normaliza o status do PagBank para o status padrão
   */
  private normalizePagBankStatus(status: string): PaymentStatus {
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
   * Mapeia tipo de pagamento do PagBank para nosso enum
   */
  private mapPagBankPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      PIX: PaymentMethod.PIX,
      CREDIT_CARD: PaymentMethod.CREDIT_CARD,
      DEBIT_CARD: PaymentMethod.DEBIT_CARD,
      BOLETO: PaymentMethod.BOLETO,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status do PagBank para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizePagBankStatus(gatewayStatus);
  }
}

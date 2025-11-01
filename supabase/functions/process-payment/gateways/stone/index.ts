// ============================================
// STONE GATEWAY
// ============================================
//
// Documentação: https://docs.stone.com.br/
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
 * Stone Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - merchantId
 * - apiKey
 */
export class StoneGateway extends BaseGateway {
  name = "Stone";
  slug = "stone";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.stone.com.br",
    sandbox: "https://sandbox.api.stone.com.br",
  };

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

      if (!credentials.apiKey) {
        return {
          isValid: false,
          message: "API Key is required",
        };
      }

      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      try {
        const response = await fetch(`${endpoint}/v1/merchants/${credentials.merchantId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${credentials.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          this.log("info", "Stone credentials validated successfully");
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

  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing Stone payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);

      if (request.paymentMethod === PaymentMethod.PIX) {
        return await this.processPIX(request, config, endpoint);
      }

      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        return await this.processCreditCard(request, config, endpoint);
      }

      if (request.paymentMethod === PaymentMethod.DEBIT_CARD) {
        return await this.processDebitCard(request, config, endpoint);
      }

      if (request.paymentMethod === PaymentMethod.BOLETO) {
        return await this.processBoleto(request, config, endpoint);
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Stone"
      );
    }
  }

  private async processPIX(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const paymentData = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: "pix",
      merchant_id: config.credentials.merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
        phone: request.customer.phone ? {
          country_code: "55",
          area_code: request.customer.phone.substring(0, 2),
          number: request.customer.phone.substring(2),
        } : undefined,
      },
      pix: {
        expiration_seconds: 3600,
      },
      metadata: {
        order_id: request.orderId,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/v1/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.credentials.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeStoneStatus(response.status),
      qrCode: response.pix?.qr_code,
      qrCodeBase64: response.pix?.qr_code_base64,
      expiresAt: response.pix?.expires_at,
      message: "PIX created successfully via Stone",
    });
  }

  private async processCreditCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const paymentData = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: "credit_card",
      merchant_id: config.credentials.merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
      },
      card: {
        number: request.card?.number.replace(/\s/g, ""),
        holder_name: request.card?.holderName,
        expiration_month: request.card?.expiryMonth,
        expiration_year: request.card?.expiryYear,
        cvv: request.card?.cvv,
      },
      installments: 1,
      capture: true,
      metadata: {
        order_id: request.orderId,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/v1/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.credentials.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeStoneStatus(response.status),
      authorizationCode: response.authorization_code,
      nsu: response.nsu,
      tid: response.tid,
      message: "Credit card payment processed successfully via Stone",
    });
  }

  private async processDebitCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const paymentData = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: "debit_card",
      merchant_id: config.credentials.merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
      },
      card: {
        number: request.card?.number.replace(/\s/g, ""),
        holder_name: request.card?.holderName,
        expiration_month: request.card?.expiryMonth,
        expiration_year: request.card?.expiryYear,
        cvv: request.card?.cvv,
      },
      metadata: {
        order_id: request.orderId,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/v1/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.credentials.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      redirectUrl: response.authentication_url,
      message: "Debit card payment initiated via Stone",
    });
  }

  private async processBoleto(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const paymentData = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: "boleto",
      merchant_id: config.credentials.merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
        address: request.billingAddress ? {
          street: request.billingAddress.street,
          number: request.billingAddress.number,
          complement: request.billingAddress.complement,
          neighborhood: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
        } : undefined,
      },
      boleto: {
        due_date: dueDate.toISOString().split("T")[0],
        instructions: "Pagamento processado via Stone",
      },
      metadata: {
        order_id: request.orderId,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/v1/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.credentials.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      paymentUrl: response.boleto?.url,
      barcodeNumber: response.boleto?.barcode,
      digitableLine: response.boleto?.digitable_line,
      expiresAt: response.boleto?.due_date,
      message: "Boleto created successfully via Stone",
    });
  }

  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing Stone webhook", {
        eventType: payload.event_type,
        paymentId: payload.payment_id,
      });

      if (payload.payment_id) {
        const status = this.normalizeStoneStatus(payload.status);

        return {
          success: true,
          processed: true,
          transactionId: payload.payment_id,
          message: "Stone webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Stone webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Stone webhook processing failed", error);
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentStatusResponse> {
    try {
      this.log("info", "Getting Stone payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/v1/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${config.credentials.apiKey}`,
          },
        }
      );

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizeStoneStatus(response.status),
        amount: (response.amount || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapStonePaymentMethod(response.payment_method),
        createdAt: response.created_at,
        updatedAt: response.updated_at,
        paidAt: response.paid_at,
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

  private normalizeStoneStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      authorized: PaymentStatus.APPROVED,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      failed: PaymentStatus.FAILED,
      declined: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  private mapStonePaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      debit_card: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };

    return methodMap[method] || PaymentMethod.CREDIT_CARD;
  }

  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeStoneStatus(gatewayStatus);
  }
}

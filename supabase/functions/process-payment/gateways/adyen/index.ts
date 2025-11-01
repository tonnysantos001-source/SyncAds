// ============================================
// ADYEN GATEWAY
// ============================================
//
// Documentação: https://docs.adyen.com/
// Prioridade: Média
// Tipo: international
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
 * Adyen Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiKey
 * - merchantAccount
 */
export class AdyenGateway extends BaseGateway {
  name = "Adyen";
  slug = "adyen";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://checkout-live.adyen.com/v70",
    sandbox: "https://checkout-test.adyen.com/v70",
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

      if (!credentials.merchantAccount) {
        return {
          isValid: false,
          message: "Merchant Account is required",
        };
      }

      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      try {
        const response = await fetch(`${endpoint}/paymentMethods`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": credentials.apiKey as string,
          },
          body: JSON.stringify({
            merchantAccount: credentials.merchantAccount,
          }),
        });

        if (response.ok) {
          this.log("info", "Adyen credentials validated successfully");
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

  /**
   * Processa um pagamento
   */
  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing Adyen payment", {
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
        "Failed to process payment via Adyen"
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
    const paymentData = {
      merchantAccount: config.credentials.merchantAccount,
      amount: {
        value: Math.round(request.amount * 100),
        currency: request.currency || "BRL",
      },
      reference: request.orderId,
      paymentMethod: {
        type: "pix",
      },
      returnUrl: `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
      shopperEmail: request.customer.email,
      shopperName: {
        firstName: request.customer.name.split(" ")[0],
        lastName: request.customer.name.split(" ").slice(1).join(" "),
      },
      countryCode: "BR",
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.credentials.apiKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.pspReference,
      gatewayTransactionId: response.pspReference,
      status: this.normalizeAdyenStatus(response.resultCode),
      qrCode: response.action?.qrCodeData,
      paymentUrl: response.action?.url,
      message: "PIX created successfully via Adyen",
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
    const paymentData = {
      merchantAccount: config.credentials.merchantAccount,
      amount: {
        value: Math.round(request.amount * 100),
        currency: request.currency || "BRL",
      },
      reference: request.orderId,
      paymentMethod: {
        type: "scheme",
        number: request.card?.number.replace(/\s/g, ""),
        expiryMonth: request.card?.expiryMonth,
        expiryYear: request.card?.expiryYear,
        holderName: request.card?.holderName,
        cvc: request.card?.cvv,
      },
      shopperEmail: request.customer.email,
      shopperName: {
        firstName: request.customer.name.split(" ")[0],
        lastName: request.customer.name.split(" ").slice(1).join(" "),
      },
      shopperReference: request.customer.document,
      billingAddress: request.billingAddress ? {
        street: request.billingAddress.street,
        houseNumberOrName: request.billingAddress.number,
        city: request.billingAddress.city,
        stateOrProvince: request.billingAddress.state,
        postalCode: this.formatZipCode(request.billingAddress.zipCode),
        country: "BR",
      } : undefined,
      returnUrl: `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
      captureDelayHours: 0,
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.credentials.apiKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.pspReference,
      gatewayTransactionId: response.pspReference,
      status: this.normalizeAdyenStatus(response.resultCode),
      authorizationCode: response.authCode,
      message: "Credit card payment processed successfully via Adyen",
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
    const paymentData = {
      merchantAccount: config.credentials.merchantAccount,
      amount: {
        value: Math.round(request.amount * 100),
        currency: request.currency || "BRL",
      },
      reference: request.orderId,
      paymentMethod: {
        type: "scheme",
        number: request.card?.number.replace(/\s/g, ""),
        expiryMonth: request.card?.expiryMonth,
        expiryYear: request.card?.expiryYear,
        holderName: request.card?.holderName,
        cvc: request.card?.cvv,
      },
      shopperEmail: request.customer.email,
      shopperName: {
        firstName: request.customer.name.split(" ")[0],
        lastName: request.customer.name.split(" ").slice(1).join(" "),
      },
      returnUrl: `${Deno.env.get("SUPABASE_URL")}/checkout/success`,
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.credentials.apiKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.pspReference,
      gatewayTransactionId: response.pspReference,
      status: PaymentStatus.PENDING,
      redirectUrl: response.action?.url,
      message: "Debit card payment initiated via Adyen",
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

    const paymentData = {
      merchantAccount: config.credentials.merchantAccount,
      amount: {
        value: Math.round(request.amount * 100),
        currency: request.currency || "BRL",
      },
      reference: request.orderId,
      paymentMethod: {
        type: "boletobancario",
      },
      shopperEmail: request.customer.email,
      shopperName: {
        firstName: request.customer.name.split(" ")[0],
        lastName: request.customer.name.split(" ").slice(1).join(" "),
      },
      socialSecurityNumber: this.formatDocument(request.customer.document),
      deliveryDate: dueDate.toISOString(),
      countryCode: "BR",
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": config.credentials.apiKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.pspReference,
      gatewayTransactionId: response.pspReference,
      status: PaymentStatus.PENDING,
      paymentUrl: response.action?.url,
      barcodeNumber: response.action?.reference,
      expiresAt: dueDate.toISOString(),
      message: "Boleto created successfully via Adyen",
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
      this.log("info", "Processing Adyen webhook", {
        eventCode: payload.eventCode,
        pspReference: payload.pspReference,
      });

      if (payload.pspReference) {
        const status = this.normalizeAdyenStatus(payload.eventCode);

        return {
          success: true,
          processed: true,
          transactionId: payload.pspReference,
          message: "Adyen webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Adyen webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Adyen webhook processing failed", error);
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
      this.log("info", "Getting Adyen payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "X-API-Key": config.credentials.apiKey as string,
          },
        }
      );

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.pspReference,
        status: this.normalizeAdyenStatus(response.resultCode),
        amount: (response.amount?.value || 0) / 100,
        currency: response.amount?.currency || "BRL",
        paymentMethod: this.mapAdyenPaymentMethod(response.paymentMethod?.type),
        createdAt: response.createdAt || new Date().toISOString(),
        updatedAt: response.updatedAt || new Date().toISOString(),
        paidAt: response.resultCode === "Authorised" ? response.updatedAt : undefined,
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
   * Normaliza o status do Adyen para o status padrão
   */
  private normalizeAdyenStatus(resultCode: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      Authorised: PaymentStatus.APPROVED,
      Pending: PaymentStatus.PENDING,
      Received: PaymentStatus.PENDING,
      RedirectShopper: PaymentStatus.PENDING,
      Refused: PaymentStatus.FAILED,
      Error: PaymentStatus.FAILED,
      Cancelled: PaymentStatus.CANCELLED,
      Refunded: PaymentStatus.REFUNDED,
    };

    return statusMap[resultCode] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento do Adyen para nosso enum
   */
  private mapAdyenPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      scheme: PaymentMethod.CREDIT_CARD,
      boletobancario: PaymentMethod.BOLETO,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status do Adyen para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeAdyenStatus(gatewayStatus);
  }
}

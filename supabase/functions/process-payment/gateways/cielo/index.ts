// ============================================
// CIELO GATEWAY
// ============================================
//
// Documentação: https://developercielo.github.io/manual/cielo-ecommerce
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
 * Cielo Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito/Débito
 * - Boleto
 *
 * Credenciais necessárias:
 * - merchantId
 * - merchantKey
 */
export class CieloGateway extends BaseGateway {
  name = "Cielo";
  slug = "cielo";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.cieloecommerce.cielo.com.br",
    sandbox: "https://apisandbox.cieloecommerce.cielo.com.br",
  };

  queryEndpoints = {
    production: "https://apiquery.cieloecommerce.cielo.com.br",
    sandbox: "https://apiquerysandbox.cieloecommerce.cielo.com.br",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.merchantId) {
        return {
          isValid: false,
          message: "MerchantId is required",
        };
      }

      if (!credentials.merchantKey) {
        return {
          isValid: false,
          message: "MerchantKey is required",
        };
      }

      this.log("info", "Cielo credentials validated successfully");

      return {
        isValid: true,
        message: "Credentials are valid",
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

      this.log("info", "Processing Cielo payment", {
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
        "Failed to process payment via Cielo"
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
      MerchantOrderId: request.orderId,
      Customer: {
        Name: request.customer.name,
        Email: request.customer.email,
        Identity: this.formatDocument(request.customer.document),
        IdentityType: this.getDocumentType(request.customer.document),
      },
      Payment: {
        Type: "Pix",
        Amount: Math.round(request.amount * 100),
        QrCodeExpiration: 3600,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/1/sales`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          MerchantId: config.credentials.merchantId as string,
          MerchantKey: config.credentials.merchantKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    const payment = response.Payment;

    return this.createSuccessResponse({
      transactionId: payment.PaymentId,
      gatewayTransactionId: payment.PaymentId,
      status: this.normalizeCieloStatus(payment.Status),
      qrCode: payment.QrCodeString,
      qrCodeBase64: payment.QrCodeBase64Image,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      message: "PIX created successfully via Cielo",
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
      MerchantOrderId: request.orderId,
      Customer: {
        Name: request.customer.name,
        Email: request.customer.email,
        Identity: this.formatDocument(request.customer.document),
        IdentityType: this.getDocumentType(request.customer.document),
        Address: request.billingAddress ? {
          Street: request.billingAddress.street,
          Number: request.billingAddress.number,
          Complement: request.billingAddress.complement,
          District: request.billingAddress.neighborhood,
          City: request.billingAddress.city,
          State: request.billingAddress.state,
          Country: "BRA",
          ZipCode: this.formatZipCode(request.billingAddress.zipCode),
        } : undefined,
      },
      Payment: {
        Type: "CreditCard",
        Amount: Math.round(request.amount * 100),
        Currency: "BRL",
        Country: "BRA",
        Installments: 1,
        Capture: true,
        SoftDescriptor: `PED${request.orderId.substring(0, 10)}`,
        CreditCard: {
          CardNumber: request.card?.number.replace(/\s/g, ""),
          Holder: request.card?.holderName,
          ExpirationDate: `${request.card?.expiryMonth}/${request.card?.expiryYear}`,
          SecurityCode: request.card?.cvv,
          Brand: this.detectCardBrand(request.card?.number),
        },
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/1/sales`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          MerchantId: config.credentials.merchantId as string,
          MerchantKey: config.credentials.merchantKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    const payment = response.Payment;

    return this.createSuccessResponse({
      transactionId: payment.PaymentId,
      gatewayTransactionId: payment.PaymentId,
      status: this.normalizeCieloStatus(payment.Status),
      authorizationCode: payment.AuthorizationCode,
      nsu: payment.ProofOfSale,
      tid: payment.Tid,
      message: payment.ReturnMessage || "Credit card payment processed successfully via Cielo",
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
      MerchantOrderId: request.orderId,
      Customer: {
        Name: request.customer.name,
        Email: request.customer.email,
        Identity: this.formatDocument(request.customer.document),
        IdentityType: this.getDocumentType(request.customer.document),
      },
      Payment: {
        Type: "DebitCard",
        Amount: Math.round(request.amount * 100),
        Authenticate: true,
        ReturnUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/cielo/return`,
        DebitCard: {
          CardNumber: request.card?.number.replace(/\s/g, ""),
          Holder: request.card?.holderName,
          ExpirationDate: `${request.card?.expiryMonth}/${request.card?.expiryYear}`,
          SecurityCode: request.card?.cvv,
          Brand: this.detectCardBrand(request.card?.number),
        },
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/1/sales`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          MerchantId: config.credentials.merchantId as string,
          MerchantKey: config.credentials.merchantKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    const payment = response.Payment;

    return this.createSuccessResponse({
      transactionId: payment.PaymentId,
      gatewayTransactionId: payment.PaymentId,
      status: PaymentStatus.PENDING,
      redirectUrl: payment.AuthenticationUrl,
      message: "Debit card payment initiated via Cielo - authentication required",
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
      MerchantOrderId: request.orderId,
      Customer: {
        Name: request.customer.name,
        Email: request.customer.email,
        Identity: this.formatDocument(request.customer.document),
        IdentityType: this.getDocumentType(request.customer.document),
        Address: request.billingAddress ? {
          Street: request.billingAddress.street,
          Number: request.billingAddress.number,
          Complement: request.billingAddress.complement,
          District: request.billingAddress.neighborhood,
          City: request.billingAddress.city,
          State: request.billingAddress.state,
          Country: "BRA",
          ZipCode: this.formatZipCode(request.billingAddress.zipCode),
        } : undefined,
      },
      Payment: {
        Type: "Boleto",
        Amount: Math.round(request.amount * 100),
        Provider: "Bradesco2",
        BoletoNumber: "",
        Assignor: "SyncAds",
        Demonstrative: `Pedido ${request.orderId}`,
        ExpirationDate: dueDate.toISOString().split("T")[0],
        Identification: this.formatDocument(request.customer.document),
        Instructions: "Não receber após o vencimento",
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/1/sales`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          MerchantId: config.credentials.merchantId as string,
          MerchantKey: config.credentials.merchantKey as string,
        },
        body: JSON.stringify(paymentData),
      }
    );

    const payment = response.Payment;

    return this.createSuccessResponse({
      transactionId: payment.PaymentId,
      gatewayTransactionId: payment.PaymentId,
      status: PaymentStatus.PENDING,
      paymentUrl: payment.Url,
      barcodeNumber: payment.BarCodeNumber,
      digitableLine: payment.DigitableLine,
      expiresAt: payment.ExpirationDate,
      message: "Boleto created successfully via Cielo",
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
      this.log("info", "Processing Cielo webhook", {
        paymentId: payload.PaymentId,
        changeType: payload.ChangeType,
      });

      if (payload.PaymentId) {
        const status = this.normalizeCieloStatus(payload.Payment?.Status);

        return {
          success: true,
          processed: true,
          transactionId: payload.PaymentId,
          message: "Cielo webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Cielo webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Cielo webhook processing failed", error);
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
      this.log("info", "Getting Cielo payment status", { gatewayTransactionId });

      const queryEndpoint = config.testMode || config.credentials.environment === "sandbox"
        ? this.queryEndpoints.sandbox
        : this.queryEndpoints.production;

      const response = await this.makeRequest<any>(
        `${queryEndpoint}/1/sales/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            MerchantId: config.credentials.merchantId as string,
            MerchantKey: config.credentials.merchantKey as string,
          },
        }
      );

      const payment = response.Payment;

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: payment.PaymentId,
        status: this.normalizeCieloStatus(payment.Status),
        amount: payment.Amount / 100,
        currency: "BRL",
        paymentMethod: this.mapCieloPaymentMethod(payment.Type),
        createdAt: payment.ReceivedDate,
        updatedAt: payment.CapturedDate || payment.ReceivedDate,
        paidAt: payment.CapturedDate,
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
   * Detecta a bandeira do cartão pelo número
   */
  private detectCardBrand(cardNumber?: string): string {
    if (!cardNumber) return "Visa";

    const number = cardNumber.replace(/\s/g, "");

    if (/^4/.test(number)) return "Visa";
    if (/^5[1-5]/.test(number)) return "Master";
    if (/^3[47]/.test(number)) return "Amex";
    if (/^6(?:011|5)/.test(number)) return "Discover";
    if (/^3(?:0[0-5]|[68])/.test(number)) return "Diners";
    if (/^35/.test(number)) return "JCB";
    if (/^636/.test(number)) return "Elo";
    if (/^4011|^438935|^45|^457|^504175|^627780|^636297|^636368/.test(number)) return "Elo";
    if (/^606282/.test(number)) return "Hipercard";

    return "Visa";
  }

  /**
   * Normaliza o status da Cielo para o status padrão
   */
  private normalizeCieloStatus(status: number | string): PaymentStatus {
    const statusCode = typeof status === "string" ? parseInt(status) : status;

    const statusMap: Record<number, PaymentStatus> = {
      0: PaymentStatus.PENDING, // NotFinished
      1: PaymentStatus.APPROVED, // Authorized
      2: PaymentStatus.APPROVED, // PaymentConfirmed
      3: PaymentStatus.FAILED, // Denied
      10: PaymentStatus.CANCELLED, // Voided
      11: PaymentStatus.REFUNDED, // Refunded
      12: PaymentStatus.PENDING, // Pending
      13: PaymentStatus.CANCELLED, // Aborted
      20: PaymentStatus.PENDING, // Scheduled
    };

    return statusMap[statusCode] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento da Cielo para nosso enum
   */
  private mapCieloPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      Pix: PaymentMethod.PIX,
      CreditCard: PaymentMethod.CREDIT_CARD,
      DebitCard: PaymentMethod.DEBIT_CARD,
      Boleto: PaymentMethod.BOLETO,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status da Cielo para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeCieloStatus(gatewayStatus);
  }
}

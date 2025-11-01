// ============================================
// GETNET GATEWAY
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

export class GetnetGateway extends BaseGateway {
  name = "GetNet";
  slug = "getnet";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.getnet.com.br",
    sandbox: "https://api-sandbox.getnet.com.br",
  };

  private accessTokenCache: { token: string; expiresAt: number } | null = null;

  private async getAccessToken(config: GatewayConfig): Promise<string> {
    if (this.accessTokenCache && this.accessTokenCache.expiresAt > Date.now()) {
      return this.accessTokenCache.token;
    }

    const endpoint = this.getEndpoint(config);
    const credentials = btoa(`${config.credentials.clientId}:${config.credentials.clientSecret}`);

    const response = await fetch(`${endpoint}/auth/oauth/v2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "scope=oob&grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error("Failed to get Getnet access token");
    }

    const data = await response.json();
    this.accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000 * 0.9,
    };

    return data.access_token;
  }

  async validateCredentials(credentials: GatewayCredentials): Promise<CredentialValidationResult> {
    try {
      if (!credentials.sellerId) return { isValid: false, message: "Seller ID is required" };
      if (!credentials.clientId) return { isValid: false, message: "Client ID is required" };
      if (!credentials.clientSecret) return { isValid: false, message: "Client Secret is required" };

      const endpoint = credentials.environment === "sandbox" ? this.endpoints.sandbox : this.endpoints.production;
      const auth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);

      const response = await fetch(`${endpoint}/auth/oauth/v2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "scope=oob&grant_type=client_credentials",
      });

      if (response.ok) {
        this.log("info", "Getnet credentials validated successfully");
        return { isValid: true, message: "Credentials are valid" };
      }

      return { isValid: false, message: "Invalid credentials" };
    } catch (error: any) {
      this.log("error", "Credential validation failed", error);
      return { isValid: false, message: error.message || "Invalid credentials" };
    }
  }

  async processPayment(request: PaymentRequest, config: GatewayConfig): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);
      this.log("info", "Processing Getnet payment", {
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

      if (request.paymentMethod === PaymentMethod.DEBIT_CARD) {
        return await this.processDebitCard(request, config, endpoint, accessToken);
      }

      if (request.paymentMethod === PaymentMethod.BOLETO) {
        return await this.processBoleto(request, config, endpoint, accessToken);
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      return this.createErrorResponse(error, "Failed to process payment via Getnet");
    }
  }

  private async processPIX(request: PaymentRequest, config: GatewayConfig, endpoint: string, accessToken: string): Promise<PaymentResponse> {
    const paymentData = {
      seller_id: config.credentials.sellerId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      order: {
        order_id: request.orderId,
      },
      customer: {
        customer_id: request.customer.document,
        first_name: request.customer.name.split(" ")[0],
        last_name: request.customer.name.split(" ").slice(1).join(" "),
        name: request.customer.name,
        email: request.customer.email,
        document_type: this.getDocumentType(request.customer.document),
        document_number: this.formatDocument(request.customer.document),
      },
      pix: {
        additional_data: `Pedido ${request.orderId}`,
      },
    };

    const response = await this.makeRequest<any>(`${endpoint}/v1/payments/qrcode/pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "seller_id": config.credentials.sellerId as string,
      },
      body: JSON.stringify(paymentData),
    });

    return this.createSuccessResponse({
      transactionId: response.payment_id,
      gatewayTransactionId: response.payment_id,
      status: PaymentStatus.PENDING,
      qrCode: response.qrcode_text,
      qrCodeBase64: response.qrcode_image,
      expiresAt: response.expiration_date,
      message: "PIX created successfully via Getnet",
    });
  }

  private async processCreditCard(request: PaymentRequest, config: GatewayConfig, endpoint: string, accessToken: string): Promise<PaymentResponse> {
    const paymentData = {
      seller_id: config.credentials.sellerId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      order: {
        order_id: request.orderId,
        sales_tax: 0,
        product_type: "service",
      },
      customer: {
        customer_id: request.customer.document,
        first_name: request.customer.name.split(" ")[0],
        last_name: request.customer.name.split(" ").slice(1).join(" "),
        name: request.customer.name,
        email: request.customer.email,
        document_type: this.getDocumentType(request.customer.document),
        document_number: this.formatDocument(request.customer.document),
        phone_number: this.formatPhone(request.customer.phone || ""),
      },
      device: {
        ip_address: "127.0.0.1",
      },
      credit: {
        delayed: false,
        save_card_data: false,
        transaction_type: "FULL",
        number_installments: 1,
        card: {
          number_token: request.card?.number.replace(/\s/g, ""),
          cardholder_name: request.card?.holderName,
          security_code: request.card?.cvv,
          expiration_month: request.card?.expiryMonth,
          expiration_year: request.card?.expiryYear,
        },
      },
    };

    const response = await this.makeRequest<any>(`${endpoint}/v1/payments/credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "seller_id": config.credentials.sellerId as string,
      },
      body: JSON.stringify(paymentData),
    });

    return this.createSuccessResponse({
      transactionId: response.payment_id,
      gatewayTransactionId: response.payment_id,
      status: this.normalizeGetnetStatus(response.status),
      authorizationCode: response.authorization_code,
      nsu: response.terminal_nsu,
      message: "Credit card payment processed successfully via Getnet",
    });
  }

  private async processDebitCard(request: PaymentRequest, config: GatewayConfig, endpoint: string, accessToken: string): Promise<PaymentResponse> {
    const paymentData = {
      seller_id: config.credentials.sellerId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      order: {
        order_id: request.orderId,
      },
      customer: {
        customer_id: request.customer.document,
        first_name: request.customer.name.split(" ")[0],
        last_name: request.customer.name.split(" ").slice(1).join(" "),
        name: request.customer.name,
        email: request.customer.email,
        document_type: this.getDocumentType(request.customer.document),
        document_number: this.formatDocument(request.customer.document),
      },
      debit: {
        card: {
          number_token: request.card?.number.replace(/\s/g, ""),
          cardholder_name: request.card?.holderName,
          security_code: request.card?.cvv,
          expiration_month: request.card?.expiryMonth,
          expiration_year: request.card?.expiryYear,
        },
      },
    };

    const response = await this.makeRequest<any>(`${endpoint}/v1/payments/debit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "seller_id": config.credentials.sellerId as string,
      },
      body: JSON.stringify(paymentData),
    });

    return this.createSuccessResponse({
      transactionId: response.payment_id,
      gatewayTransactionId: response.payment_id,
      status: PaymentStatus.PENDING,
      redirectUrl: response.redirect_url,
      message: "Debit card payment initiated via Getnet",
    });
  }

  private async processBoleto(request: PaymentRequest, config: GatewayConfig, endpoint: string, accessToken: string): Promise<PaymentResponse> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const paymentData = {
      seller_id: config.credentials.sellerId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      order: {
        order_id: request.orderId,
      },
      customer: {
        customer_id: request.customer.document,
        first_name: request.customer.name.split(" ")[0],
        last_name: request.customer.name.split(" ").slice(1).join(" "),
        name: request.customer.name,
        email: request.customer.email,
        document_type: this.getDocumentType(request.customer.document),
        document_number: this.formatDocument(request.customer.document),
      },
      boleto: {
        our_number: request.orderId,
        document_number: this.formatDocument(request.customer.document),
        expiration_date: dueDate.toISOString().split("T")[0],
        instructions: "Não receber após vencimento",
        provider: "santander",
      },
    };

    const response = await this.makeRequest<any>(`${endpoint}/v1/payments/boleto`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "seller_id": config.credentials.sellerId as string,
      },
      body: JSON.stringify(paymentData),
    });

    return this.createSuccessResponse({
      transactionId: response.payment_id,
      gatewayTransactionId: response.payment_id,
      status: PaymentStatus.PENDING,
      paymentUrl: response.boleto_url,
      barcodeNumber: response.barcode,
      digitableLine: response.typeful_line,
      expiresAt: response.expiration_date,
      message: "Boleto created successfully via Getnet",
    });
  }

  async handleWebhook(payload: any, signature?: string): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing Getnet webhook", { payload });

      if (payload.payment_id) {
        return {
          success: true,
          processed: true,
          transactionId: payload.payment_id,
          message: "Getnet webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Getnet webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Getnet webhook processing failed", error);
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  async getPaymentStatus(gatewayTransactionId: string, config: GatewayConfig): Promise<PaymentStatusResponse> {
    try {
      this.log("info", "Getting Getnet payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      const response = await this.makeRequest<any>(`${endpoint}/v1/payments/${gatewayTransactionId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "seller_id": config.credentials.sellerId as string,
        },
      });

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.payment_id,
        status: this.normalizeGetnetStatus(response.status),
        amount: (response.amount || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapGetnetPaymentMethod(response.payment_type),
        createdAt: response.create_date,
        updatedAt: response.update_date,
        paidAt: response.status === "APPROVED" ? response.update_date : undefined,
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

  private normalizeGetnetStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      PENDING: PaymentStatus.PENDING,
      AUTHORIZED: PaymentStatus.APPROVED,
      CONFIRMED: PaymentStatus.APPROVED,
      APPROVED: PaymentStatus.APPROVED,
      DENIED: PaymentStatus.FAILED,
      ERROR: PaymentStatus.FAILED,
      CANCELED: PaymentStatus.CANCELLED,
      REFUNDED: PaymentStatus.REFUNDED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  private mapGetnetPaymentMethod(type: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      credit: PaymentMethod.CREDIT_CARD,
      debit: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
      pix: PaymentMethod.PIX,
    };

    return methodMap[type] || PaymentMethod.CREDIT_CARD;
  }

  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeGetnetStatus(gatewayStatus);
  }
}

// ============================================
// IUGU GATEWAY
// ============================================
//
// Documentação: https://dev.iugu.com/
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
 * Iugu Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - apiToken
 * - accountId
 */
export class IuguGateway extends BaseGateway {
  name = "Iugu";
  slug = "iugu";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.iugu.com/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.apiToken) {
        return {
          isValid: false,
          message: "API Token is required",
        };
      }

      // Testar token fazendo chamada à API
      try {
        const response = await fetch(`${this.endpoints.production}/accounts`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${credentials.apiToken}`,
            Accept: "application/json",
          },
        });

        if (response.ok) {
          this.log("info", "Iugu credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401) {
          return {
            isValid: false,
            message: "Invalid API Token",
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

      this.log("info", "Processing Iugu payment", {
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

      // Boleto
      if (request.paymentMethod === PaymentMethod.BOLETO) {
        return await this.processBoleto(request, config, endpoint);
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Iugu"
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
    // Criar cliente primeiro
    const customer = await this.createCustomer(request, config, endpoint);

    // Criar fatura com PIX
    const invoiceData = {
      email: request.customer.email,
      customer_id: customer.id,
      due_date: new Date(Date.now() + 3600000).toISOString().split("T")[0],
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: this.formatDocument(request.customer.document),
        name: request.customer.name,
        phone_prefix: request.customer.phone?.substring(0, 2) || "11",
        phone: request.customer.phone?.substring(2) || "999999999",
        email: request.customer.email,
        address: request.billingAddress ? {
          street: request.billingAddress.street,
          number: request.billingAddress.number,
          district: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
        } : undefined,
      },
      ensure_workday_due_date: false,
      payable_with: "pix",
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/invoices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiToken}`,
        },
        body: JSON.stringify(invoiceData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeIuguStatus(response.status),
      qrCode: response.pix?.qrcode,
      qrCodeBase64: response.pix?.qrcode_image_url,
      paymentUrl: response.secure_url,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      message: "PIX created successfully via Iugu",
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
    // Criar token do cartão
    const tokenData = {
      account_id: config.credentials.accountId,
      method: "credit_card",
      test: config.testMode || false,
      data: {
        number: request.card?.number.replace(/\s/g, ""),
        verification_value: request.card?.cvv,
        first_name: request.card?.holderName.split(" ")[0],
        last_name: request.card?.holderName.split(" ").slice(1).join(" "),
        month: request.card?.expiryMonth,
        year: request.card?.expiryYear,
      },
    };

    const tokenResponse = await this.makeRequest<any>(
      `${endpoint}/payment_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiToken}`,
        },
        body: JSON.stringify(tokenData),
      }
    );

    // Criar cobrança
    const chargeData = {
      token: tokenResponse.id,
      email: request.customer.email,
      months: 1,
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: this.formatDocument(request.customer.document),
        name: request.customer.name,
        phone_prefix: request.customer.phone?.substring(0, 2) || "11",
        phone: request.customer.phone?.substring(2) || "999999999",
        email: request.customer.email,
        address: request.billingAddress ? {
          street: request.billingAddress.street,
          number: request.billingAddress.number,
          district: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
          country: "Brasil",
        } : undefined,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/charge`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiToken}`,
        },
        body: JSON.stringify(chargeData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.invoice_id,
      gatewayTransactionId: response.invoice_id,
      status: response.success ? PaymentStatus.APPROVED : PaymentStatus.FAILED,
      message: response.message || "Credit card payment processed successfully via Iugu",
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
    // Criar cliente primeiro
    const customer = await this.createCustomer(request, config, endpoint);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const invoiceData = {
      email: request.customer.email,
      customer_id: customer.id,
      due_date: dueDate.toISOString().split("T")[0],
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: this.formatDocument(request.customer.document),
        name: request.customer.name,
        phone_prefix: request.customer.phone?.substring(0, 2) || "11",
        phone: request.customer.phone?.substring(2) || "999999999",
        email: request.customer.email,
        address: request.billingAddress ? {
          street: request.billingAddress.street,
          number: request.billingAddress.number,
          district: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
        } : undefined,
      },
      ensure_workday_due_date: false,
      payable_with: "bank_slip",
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/invoices`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiToken}`,
        },
        body: JSON.stringify(invoiceData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      paymentUrl: response.secure_url,
      barcodeNumber: response.bank_slip?.barcode,
      digitableLine: response.bank_slip?.digitable_line,
      expiresAt: response.due_date,
      message: "Boleto created successfully via Iugu",
    });
  }

  /**
   * Cria um cliente na Iugu
   */
  private async createCustomer(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<any> {
    const customerData = {
      email: request.customer.email,
      name: request.customer.name,
      cpf_cnpj: this.formatDocument(request.customer.document),
      phone_prefix: request.customer.phone?.substring(0, 2) || "11",
      phone: request.customer.phone?.substring(2) || "999999999",
    };

    try {
      const response = await this.makeRequest<any>(
        `${endpoint}/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.credentials.apiToken}`,
          },
          body: JSON.stringify(customerData),
        }
      );

      return response;
    } catch (error: any) {
      // Se cliente já existe, buscar pelo email
      this.log("warn", "Customer creation failed, might already exist", error);
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
      this.log("info", "Processing Iugu webhook", {
        event: payload.event,
        id: payload.data?.id,
      });

      if (payload.event && payload.data) {
        const data = payload.data;
        const status = this.normalizeIuguStatus(data.status);

        return {
          success: true,
          processed: true,
          transactionId: data.id,
          message: "Iugu webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Iugu webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Iugu webhook processing failed", error);
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
      this.log("info", "Getting Iugu payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/invoices/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${config.credentials.apiToken}`,
          },
        }
      );

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizeIuguStatus(response.status),
        amount: (response.total_cents || 0) / 100,
        currency: "BRL",
        paymentMethod: this.mapIuguPaymentMethod(response.payable_with),
        createdAt: response.created_at,
        updatedAt: response.updated_at || response.created_at,
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

  /**
   * Normaliza o status da Iugu para o status padrão
   */
  private normalizeIuguStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      paid: PaymentStatus.APPROVED,
      canceled: PaymentStatus.CANCELLED,
      partially_paid: PaymentStatus.PENDING,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
      in_analysis: PaymentStatus.PROCESSING,
      in_protest: PaymentStatus.PROCESSING,
      chargeback: PaymentStatus.REFUNDED,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento da Iugu para nosso enum
   */
  private mapIuguPaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      bank_slip: PaymentMethod.BOLETO,
      all: PaymentMethod.CREDIT_CARD,
    };

    return methodMap[method] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status da Iugu para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeIuguStatus(gatewayStatus);
  }
}

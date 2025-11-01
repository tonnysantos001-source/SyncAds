// ============================================
// VINDI GATEWAY
// ============================================
//
// Documentação: https://vindi.github.io/api-docs/
// Prioridade: Média
// Tipo: processor (especializado em recorrência)
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
 * Vindi Gateway Implementation
 *
 * Métodos suportados:
 * - Cartão de Crédito
 * - Boleto
 * - Recorrência (assinaturas)
 *
 * Credenciais necessárias:
 * - apiKey
 */
export class VindiGateway extends BaseGateway {
  name = "Vindi";
  slug = "vindi";
  supportedMethods = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://app.vindi.com.br/api/v1",
    sandbox: "https://sandbox-app.vindi.com.br/api/v1",
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

      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      try {
        const response = await fetch(`${endpoint}/merchant`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(credentials.apiKey + ":")}`,
          },
        });

        if (response.ok) {
          this.log("info", "Vindi credentials validated successfully");
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

      this.log("info", "Processing Vindi payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);

      // Criar cliente primeiro
      const customer = await this.createCustomer(request, config, endpoint);

      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        return await this.processCreditCard(request, config, endpoint, customer);
      }

      if (request.paymentMethod === PaymentMethod.BOLETO) {
        return await this.processBoleto(request, config, endpoint, customer);
      }

      throw new Error(`Payment method ${request.paymentMethod} not supported`);
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via Vindi"
      );
    }
  }

  /**
   * Cria ou busca cliente na Vindi
   */
  private async createCustomer(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<any> {
    const customerData = {
      name: request.customer.name,
      email: request.customer.email,
      registry_code: this.formatDocument(request.customer.document),
      code: request.customer.document,
      phones: request.customer.phone ? [
        {
          phone_type: "mobile",
          number: this.formatPhone(request.customer.phone),
        },
      ] : [],
    };

    try {
      const response = await this.makeRequest<any>(
        `${endpoint}/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(customerData),
        }
      );

      return response.customer;
    } catch (error: any) {
      // Se cliente já existe, buscar
      this.log("warn", "Customer might already exist, searching", error);

      try {
        const searchResponse = await this.makeRequest<any>(
          `${endpoint}/customers?query=code:${request.customer.document}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
            },
          }
        );

        if (searchResponse.customers && searchResponse.customers.length > 0) {
          return searchResponse.customers[0];
        }
      } catch (searchError: any) {
        this.log("error", "Failed to search customer", searchError);
      }

      // Fallback: criar com dados mínimos
      return { id: request.customer.document };
    }
  }

  /**
   * Processa pagamento com Cartão de Crédito
   */
  private async processCreditCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string,
    customer: any
  ): Promise<PaymentResponse> {
    // Criar método de pagamento (cartão)
    const paymentProfileData = {
      holder_name: request.card?.holderName,
      card_expiration: `${request.card?.expiryMonth}/${request.card?.expiryYear}`,
      card_number: request.card?.number.replace(/\s/g, ""),
      card_cvv: request.card?.cvv,
      customer_id: customer.id,
      payment_method_code: "credit_card",
      payment_company_code: this.detectCardBrand(request.card?.number),
    };

    let paymentProfile;
    try {
      const profileResponse = await this.makeRequest<any>(
        `${endpoint}/payment_profiles`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
          },
          body: JSON.stringify(paymentProfileData),
        }
      );

      paymentProfile = profileResponse.payment_profile;
    } catch (error: any) {
      this.log("error", "Failed to create payment profile", error);
      throw new Error("Failed to create payment profile");
    }

    // Criar cobrança única
    const billData = {
      customer_id: customer.id,
      payment_method_code: "credit_card",
      bill_items: [
        {
          product_id: null,
          amount: request.amount,
          description: `Pedido ${request.orderId}`,
        },
      ],
      payment_profile: {
        id: paymentProfile.id,
      },
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/bills`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(billData),
      }
    );

    const bill = response.bill;

    return this.createSuccessResponse({
      transactionId: bill.id.toString(),
      gatewayTransactionId: bill.id.toString(),
      status: this.normalizeVindiStatus(bill.status),
      message: "Credit card payment processed successfully via Vindi",
    });
  }

  /**
   * Processa pagamento com Boleto
   */
  private async processBoleto(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string,
    customer: any
  ): Promise<PaymentResponse> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const billData = {
      customer_id: customer.id,
      payment_method_code: "bank_slip",
      bill_items: [
        {
          product_id: null,
          amount: request.amount,
          description: `Pedido ${request.orderId}`,
        },
      ],
      due_at: dueDate.toISOString().split("T")[0],
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/bills`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
        },
        body: JSON.stringify(billData),
      }
    );

    const bill = response.bill;
    const charge = bill.charges?.[0];

    return this.createSuccessResponse({
      transactionId: bill.id.toString(),
      gatewayTransactionId: bill.id.toString(),
      status: PaymentStatus.PENDING,
      paymentUrl: charge?.print_url,
      barcodeNumber: charge?.bank_slip_barcode,
      digitableLine: charge?.bank_slip_line,
      expiresAt: bill.due_at,
      message: "Boleto created successfully via Vindi",
    });
  }

  /**
   * Detecta bandeira do cartão
   */
  private detectCardBrand(cardNumber?: string): string {
    if (!cardNumber) return "visa";

    const number = cardNumber.replace(/\s/g, "");

    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^3[47]/.test(number)) return "amex";
    if (/^6(?:011|5)/.test(number)) return "discover";
    if (/^3(?:0[0-5]|[68])/.test(number)) return "diners_club";
    if (/^35/.test(number)) return "jcb";
    if (/^636/.test(number)) return "elo";
    if (/^606282/.test(number)) return "hipercard";

    return "visa";
  }

  /**
   * Processa webhook do gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing Vindi webhook", {
        event: payload.event_type,
        billId: payload.bill?.id,
      });

      if (payload.bill) {
        const status = this.normalizeVindiStatus(payload.bill.status);

        return {
          success: true,
          processed: true,
          transactionId: payload.bill.id?.toString(),
          message: "Vindi webhook processed successfully",
        };
      }

      if (payload.charge) {
        const status = this.normalizeVindiStatus(payload.charge.status);

        return {
          success: true,
          processed: true,
          transactionId: payload.charge.bill_id?.toString(),
          message: "Vindi webhook processed successfully",
        };
      }

      return {
        success: true,
        processed: false,
        message: "Vindi webhook received but not processed",
      };
    } catch (error: any) {
      this.log("error", "Vindi webhook processing failed", error);
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
      this.log("info", "Getting Vindi payment status", { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/bills/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${btoa(config.credentials.apiKey + ":")}`,
          },
        }
      );

      const bill = response.bill;

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: bill.id.toString(),
        status: this.normalizeVindiStatus(bill.status),
        amount: parseFloat(bill.amount) || 0,
        currency: "BRL",
        paymentMethod: this.mapVindiPaymentMethod(bill.payment_method?.code),
        createdAt: bill.created_at,
        updatedAt: bill.updated_at || bill.created_at,
        paidAt: bill.paid_at,
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
   * Normaliza o status da Vindi para o status padrão
   */
  private normalizeVindiStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      review: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      in_protest: PaymentStatus.PROCESSING,
      chargeback: PaymentStatus.REFUNDED,
      fraud: PaymentStatus.FAILED,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento da Vindi para nosso enum
   */
  private mapVindiPaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      credit_card: PaymentMethod.CREDIT_CARD,
      bank_slip: PaymentMethod.BOLETO,
      debit_card: PaymentMethod.DEBIT_CARD,
    };

    return methodMap[method] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status da Vindi para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeVindiStatus(gatewayStatus);
  }
}

// ============================================
// WIRECARD (MOIP) GATEWAY
// ============================================

import { BaseGateway } from "../base.ts";
import {
  PaymentMethod,
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  GatewayConfig,
  GatewayCredentials,
  CredentialValidationResult,
  PaymentStatusResponse,
  WebhookResponse,
  GatewayEndpoints,
} from "../types.ts";

export class WirecardGateway extends BaseGateway {
  name = "Wirecard (Moip)";
  slug = "wirecard-moip";
  supportedMethods = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
    PaymentMethod.WALLET,
  ];

  endpoints: GatewayEndpoints = {
    production: "https://api.moip.com.br/v2",
    sandbox: "https://sandbox.moip.com.br/v2",
  };

  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      const token = credentials.token;
      const key = credentials.key;

      if (!token || !key) {
        return {
          isValid: false,
          message: "Token and Key are required for Wirecard",
        };
      }

      // Testa credenciais fazendo uma requisição simples
      const endpoint = credentials.environment === "sandbox"
        ? this.endpoints.sandbox
        : this.endpoints.production;

      const auth = btoa(`${token}:${key}`);

      const response = await fetch(`${endpoint}/orders`, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok || response.status === 404) {
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
      return {
        isValid: false,
        message: error.message,
      };
    }
  }

  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      const endpoint = this.getEndpoint(config);
      const auth = btoa(`${config.credentials.token}:${config.credentials.key}`);

      switch (request.paymentMethod) {
        case PaymentMethod.PIX:
          return await this.processPixPayment(request, endpoint, auth);

        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          return await this.processCardPayment(request, endpoint, auth);

        case PaymentMethod.BOLETO:
          return await this.processBoletoPayment(request, endpoint, auth);

        default:
          throw new Error(`Payment method ${request.paymentMethod} not supported`);
      }
    } catch (error: any) {
      return this.createErrorResponse(error, "Failed to process Wirecard payment");
    }
  }

  private async processPixPayment(
    request: PaymentRequest,
    endpoint: string,
    auth: string
  ): Promise<PaymentResponse> {
    const transactionId = this.generateTransactionId();

    const payload = {
      ownId: transactionId,
      amount: {
        currency: "BRL",
        total: this.formatAmountToCents(request.amount),
      },
      customer: {
        ownId: request.userId,
        fullname: request.customer.name,
        email: request.customer.email,
        taxDocument: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
        phone: {
          countryCode: "55",
          areaCode: request.customer.phone?.substring(0, 2) || "11",
          number: this.formatPhone(request.customer.phone || ""),
        },
      },
      items: [
        {
          product: request.description || "Pagamento",
          quantity: 1,
          detail: request.orderId,
          price: this.formatAmountToCents(request.amount),
        },
      ],
    };

    const response = await this.makeRequest(`${endpoint}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const orderId = response.id;

    // Criar pagamento PIX
    const paymentPayload = {
      installmentCount: 1,
      fundingInstrument: {
        method: "PIX",
      },
    };

    const paymentResponse = await this.makeRequest(
      `${endpoint}/orders/${orderId}/payments`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    return this.createSuccessResponse({
      transactionId,
      gatewayTransactionId: paymentResponse.id,
      status: PaymentStatus.PENDING,
      qrCode: paymentResponse.qrCode?.text,
      qrCodeBase64: paymentResponse.qrCode?.image,
      expiresAt: paymentResponse.qrCode?.expirationDate,
      message: "PIX payment created successfully",
    });
  }

  private async processCardPayment(
    request: PaymentRequest,
    endpoint: string,
    auth: string
  ): Promise<PaymentResponse> {
    const transactionId = this.generateTransactionId();

    // Criar pedido
    const orderPayload = {
      ownId: transactionId,
      amount: {
        currency: "BRL",
        total: this.formatAmountToCents(request.amount),
      },
      customer: {
        ownId: request.userId,
        fullname: request.customer.name,
        email: request.customer.email,
        birthDate: request.customer.birthDate || "1990-01-01",
        taxDocument: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
        phone: {
          countryCode: "55",
          areaCode: request.customer.phone?.substring(0, 2) || "11",
          number: this.formatPhone(request.customer.phone || ""),
        },
        shippingAddress: request.customer.address ? {
          street: request.customer.address.street,
          streetNumber: request.customer.address.number,
          complement: request.customer.address.complement,
          district: request.customer.address.neighborhood,
          city: request.customer.address.city,
          state: request.customer.address.state,
          country: "BRA",
          zipCode: this.formatZipCode(request.customer.address.zipCode),
        } : undefined,
      },
      items: [
        {
          product: request.description || "Pagamento",
          quantity: 1,
          detail: request.orderId,
          price: this.formatAmountToCents(request.amount),
        },
      ],
    };

    const orderResponse = await this.makeRequest(`${endpoint}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const orderId = orderResponse.id;

    // Criar pagamento com cartão
    const [expiryMonth, expiryYear] = [
      request.card!.expiryMonth,
      request.card!.expiryYear,
    ];

    const paymentPayload = {
      installmentCount: request.installments || 1,
      fundingInstrument: {
        method: "CREDIT_CARD",
        creditCard: {
          hash: request.card!.token, // Se tiver token
          holder: {
            fullname: request.card!.holderName,
            birthdate: request.customer.birthDate || "1990-01-01",
            taxDocument: {
              type: this.getDocumentType(request.customer.document),
              number: this.formatDocument(request.customer.document),
            },
            phone: {
              countryCode: "55",
              areaCode: request.customer.phone?.substring(0, 2) || "11",
              number: this.formatPhone(request.customer.phone || ""),
            },
          },
          number: request.card!.number.replace(/\s/g, ""),
          expirationMonth: expiryMonth.toString().padStart(2, "0"),
          expirationYear: expiryYear.toString(),
          cvc: request.card!.cvv,
        },
      },
    };

    const paymentResponse = await this.makeRequest(
      `${endpoint}/orders/${orderId}/payments`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    return this.createSuccessResponse({
      transactionId,
      gatewayTransactionId: paymentResponse.id,
      status: this.normalizeStatus(paymentResponse.status),
      authorizationCode: paymentResponse.authorizationCode,
      message: "Card payment processed successfully",
    });
  }

  private async processBoletoPayment(
    request: PaymentRequest,
    endpoint: string,
    auth: string
  ): Promise<PaymentResponse> {
    const transactionId = this.generateTransactionId();

    // Criar pedido
    const orderPayload = {
      ownId: transactionId,
      amount: {
        currency: "BRL",
        total: this.formatAmountToCents(request.amount),
      },
      customer: {
        ownId: request.userId,
        fullname: request.customer.name,
        email: request.customer.email,
        taxDocument: {
          type: this.getDocumentType(request.customer.document),
          number: this.formatDocument(request.customer.document),
        },
        phone: {
          countryCode: "55",
          areaCode: request.customer.phone?.substring(0, 2) || "11",
          number: this.formatPhone(request.customer.phone || ""),
        },
      },
      items: [
        {
          product: request.description || "Pagamento",
          quantity: 1,
          detail: request.orderId,
          price: this.formatAmountToCents(request.amount),
        },
      ],
    };

    const orderResponse = await this.makeRequest(`${endpoint}/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const orderId = orderResponse.id;

    // Criar pagamento boleto
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const paymentPayload = {
      installmentCount: 1,
      fundingInstrument: {
        method: "BOLETO",
        boleto: {
          expirationDate: dueDate.toISOString().split("T")[0],
          instructionLines: {
            first: request.description || "Pagamento do pedido",
            second: `Pedido: ${request.orderId}`,
            third: "Não receber após o vencimento",
          },
          logoUri: request.metadata?.logoUrl,
        },
      },
    };

    const paymentResponse = await this.makeRequest(
      `${endpoint}/orders/${orderId}/payments`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentPayload),
      }
    );

    return this.createSuccessResponse({
      transactionId,
      gatewayTransactionId: paymentResponse.id,
      status: PaymentStatus.PENDING,
      paymentUrl: paymentResponse._links?.payBoleto?.printHref,
      barcodeNumber: paymentResponse.fundingInstrument?.boleto?.lineCode,
      digitableLine: paymentResponse.fundingInstrument?.boleto?.lineCode,
      expiresAt: paymentResponse.fundingInstrument?.boleto?.expirationDate,
      message: "Boleto created successfully",
    });
  }

  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      const event = payload.event;
      const resource = payload.resource;

      if (!event || !resource) {
        throw new Error("Invalid webhook payload");
      }

      return {
        success: true,
        processed: true,
        transactionId: resource.payment?.ownId || resource.ownId,
        status: this.normalizeStatus(resource.status),
        message: `Webhook processed: ${event}`,
      };
    } catch (error: any) {
      this.log("error", "Wirecard webhook error", { error: error.message });
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
      const endpoint = this.getEndpoint(config);
      const auth = btoa(`${config.credentials.token}:${config.credentials.key}`);

      const response = await this.makeRequest(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return {
        transactionId: response.ownId,
        gatewayTransactionId: response.id,
        status: this.normalizeStatus(response.status),
        amount: this.formatAmountFromCents(response.amount?.total || 0),
        currency: response.amount?.currency || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.fundingInstrument?.method),
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        paidAt: response.paidAt,
      };
    } catch (error: any) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  protected normalizeStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      "WAITING": PaymentStatus.PENDING,
      "IN_ANALYSIS": PaymentStatus.PROCESSING,
      "PRE_AUTHORIZED": PaymentStatus.PROCESSING,
      "AUTHORIZED": PaymentStatus.APPROVED,
      "CANCELLED": PaymentStatus.CANCELLED,
      "REFUNDED": PaymentStatus.REFUNDED,
      "REVERSED": PaymentStatus.REFUNDED,
      "SETTLED": PaymentStatus.APPROVED,
      "NOT_AUTHORIZED": PaymentStatus.FAILED,
    };

    return statusMap[gatewayStatus?.toUpperCase()] || PaymentStatus.PENDING;
  }

  private normalizePaymentMethod(method: string): string {
    const methodMap: Record<string, string> = {
      "CREDIT_CARD": "credit_card",
      "DEBIT_CARD": "debit_card",
      "BOLETO": "boleto",
      "PIX": "pix",
    };

    return methodMap[method?.toUpperCase()] || "unknown";
  }
}

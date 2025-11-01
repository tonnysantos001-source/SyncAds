// ============================================
// UNIVERSAL GATEWAY TEMPLATE
// ============================================
//
// Este é um template universal para implementar novos gateways.
// Copie este arquivo e adapte para o gateway específico.
//
// INSTRUÇÕES:
// 1. Copie este arquivo para o diretório do gateway: gateways/[slug]/index.ts
// 2. Substitua [GATEWAY_NAME] pelo nome do gateway (ex: "Vindi", "Yapay")
// 3. Substitua [gateway-slug] pelo slug do gateway (ex: "vindi", "yapay")
// 4. Configure os endpoints (production/sandbox)
// 5. Defina as credenciais necessárias no validateCredentials
// 6. Implemente os métodos de pagamento suportados
// 7. Adicione ao registry.ts
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
 * [GATEWAY_NAME] Gateway Implementation
 *
 * Documentação: [URL_DA_DOCUMENTACAO]
 *
 * Métodos suportados:
 * - PIX (se suportar)
 * - Cartão de Crédito (se suportar)
 * - Cartão de Débito (se suportar)
 * - Boleto (se suportar)
 *
 * Credenciais necessárias:
 * - apiKey (ou outro campo)
 * - secretKey (ou outro campo)
 */
export class [GatewayName]Gateway extends BaseGateway {
  name = "[GATEWAY_NAME]"; // Ex: "Vindi", "OpenPix", etc.
  slug = "[gateway-slug]"; // Ex: "vindi", "openpix", etc.

  // Configure os métodos que este gateway suporta
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.BOLETO,
  ];

  // Configure os endpoints da API
  endpoints = {
    production: "https://api.[gateway].com", // URL de produção
    sandbox: "https://sandbox.api.[gateway].com", // URL de sandbox (se houver)
  };

  /**
   * Valida as credenciais do gateway
   *
   * CUSTOMIZE: Adicione validação para as credenciais específicas deste gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      // CUSTOMIZE: Valide os campos de credenciais necessários
      if (!credentials.apiKey) {
        return {
          isValid: false,
          message: "API Key is required",
        };
      }

      // OPCIONAL: Testar credenciais fazendo uma chamada à API
      try {
        const endpoint = credentials.environment === "sandbox"
          ? this.endpoints.sandbox
          : this.endpoints.production;

        const response = await fetch(`${endpoint}/validate`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${credentials.apiKey}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          this.log("info", "[GATEWAY_NAME] credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401 || response.status === 403) {
          return {
            isValid: false,
            message: "Invalid credentials",
          };
        }
      } catch (error: any) {
        // Se não conseguir validar online, aceita as credenciais
        this.log("warn", "Could not validate credentials online, accepting them");
      }

      return {
        isValid: true,
        message: "Credentials accepted (offline validation)",
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
   *
   * Este método roteia para o método específico baseado no tipo de pagamento
   */
  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      this.log("info", `Processing [GATEWAY_NAME] payment`, {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);

      // Roteamento por método de pagamento
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
        `Failed to process payment via [GATEWAY_NAME]`
      );
    }
  }

  /**
   * Processa pagamento PIX
   *
   * CUSTOMIZE: Implemente a lógica específica deste gateway para PIX
   */
  private async processPIX(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    // EXEMPLO DE IMPLEMENTAÇÃO - CUSTOMIZE PARA SEU GATEWAY
    const paymentData = {
      amount: Math.round(request.amount * 100), // Centavos
      currency: "BRL",
      payment_method: "pix",
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
        phone: this.formatPhone(request.customer.phone || ""),
      },
      metadata: {
        order_id: request.orderId,
      },
      // CUSTOMIZE: Adicione campos específicos do seu gateway
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiKey}`,
          // CUSTOMIZE: Adicione headers específicos do seu gateway
        },
        body: JSON.stringify(paymentData),
      }
    );

    // CUSTOMIZE: Adapte os campos da resposta para o formato padrão
    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeGatewayStatus(response.status),
      qrCode: response.pix?.qr_code,
      qrCodeBase64: response.pix?.qr_code_base64,
      expiresAt: response.pix?.expires_at,
      message: `PIX created successfully via [GATEWAY_NAME]`,
    });
  }

  /**
   * Processa pagamento com Cartão de Crédito
   *
   * CUSTOMIZE: Implemente a lógica específica deste gateway para Cartão
   */
  private async processCreditCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    // EXEMPLO DE IMPLEMENTAÇÃO - CUSTOMIZE PARA SEU GATEWAY
    const paymentData = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: "credit_card",
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
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
      // CUSTOMIZE: Adicione campos específicos do seu gateway
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.normalizeGatewayStatus(response.status),
      authorizationCode: response.authorization_code,
      nsu: response.nsu,
      tid: response.tid,
      message: `Credit card payment processed successfully via [GATEWAY_NAME]`,
    });
  }

  /**
   * Processa pagamento com Cartão de Débito
   *
   * CUSTOMIZE: Implemente a lógica específica deste gateway para Débito
   */
  private async processDebitCard(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    // Normalmente similar ao cartão de crédito, mas com autenticação 3DS
    const paymentData = {
      amount: Math.round(request.amount * 100),
      payment_method: "debit_card",
      customer: {
        name: request.customer.name,
        email: request.customer.email,
      },
      card: {
        number: request.card?.number.replace(/\s/g, ""),
        holder_name: request.card?.holderName,
        expiration_month: request.card?.expiryMonth,
        expiration_year: request.card?.expiryYear,
        cvv: request.card?.cvv,
      },
      // CUSTOMIZE: Adicione campos específicos
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiKey}`,
        },
        body: JSON.stringify(paymentData),
      }
    );

    return this.createSuccessResponse({
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: PaymentStatus.PENDING,
      redirectUrl: response.authentication_url,
      message: `Debit card payment initiated via [GATEWAY_NAME]`,
    });
  }

  /**
   * Processa pagamento com Boleto
   *
   * CUSTOMIZE: Implemente a lógica específica deste gateway para Boleto
   */
  private async processBoleto(
    request: PaymentRequest,
    config: GatewayConfig,
    endpoint: string
  ): Promise<PaymentResponse> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 dias para vencimento

    const paymentData = {
      amount: Math.round(request.amount * 100),
      payment_method: "boleto",
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
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
        instructions: "Pagamento via [GATEWAY_NAME]",
      },
      // CUSTOMIZE: Adicione campos específicos
    };

    const response = await this.makeRequest<any>(
      `${endpoint}/payments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.credentials.apiKey}`,
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
      message: `Boleto created successfully via [GATEWAY_NAME]`,
    });
  }

  /**
   * Processa webhook do gateway
   *
   * CUSTOMIZE: Implemente a lógica de webhook específica deste gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", `Processing [GATEWAY_NAME] webhook`, { payload });

      // OPCIONAL: Validar assinatura do webhook
      if (signature) {
        // const isValid = await this.validateWebhookSignatureHMAC(payload, signature, secret);
        // if (!isValid) {
        //   return {
        //     success: false,
        //     processed: false,
        //     message: "Invalid webhook signature",
        //   };
        // }
      }

      // CUSTOMIZE: Extrair dados do webhook conforme formato do gateway
      if (payload.id || payload.transaction_id) {
        const transactionId = payload.id || payload.transaction_id;
        const status = this.normalizeGatewayStatus(payload.status);

        return {
          success: true,
          processed: true,
          transactionId: transactionId,
          message: `[GATEWAY_NAME] webhook processed successfully`,
        };
      }

      return {
        success: true,
        processed: false,
        message: `[GATEWAY_NAME] webhook received but not processed`,
      };
    } catch (error: any) {
      this.log("error", `[GATEWAY_NAME] webhook processing failed`, error);
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  /**
   * Consulta o status de um pagamento
   *
   * CUSTOMIZE: Implemente a lógica de consulta de status específica deste gateway
   */
  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentStatusResponse> {
    try {
      this.log("info", `Getting [GATEWAY_NAME] payment status`, { gatewayTransactionId });

      const endpoint = this.getEndpoint(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.credentials.apiKey}`,
          },
        }
      );

      // CUSTOMIZE: Adapte os campos da resposta
      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizeGatewayStatus(response.status),
        amount: (response.amount || 0) / 100,
        currency: response.currency || "BRL",
        paymentMethod: this.mapPaymentMethod(response.payment_method),
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

  /**
   * Normaliza o status do gateway para o status padrão
   *
   * CUSTOMIZE: Mapeie os status específicos do seu gateway
   */
  private normalizeGatewayStatus(status: string): PaymentStatus {
    // CUSTOMIZE: Adicione os status específicos do seu gateway
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      processing: PaymentStatus.PROCESSING,
      paid: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      confirmed: PaymentStatus.APPROVED,
      success: PaymentStatus.APPROVED,
      completed: PaymentStatus.APPROVED,
      failed: PaymentStatus.FAILED,
      declined: PaymentStatus.FAILED,
      error: PaymentStatus.FAILED,
      cancelled: PaymentStatus.CANCELLED,
      canceled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      expired: PaymentStatus.EXPIRED,
    };

    return statusMap[status.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia tipo de pagamento do gateway para nosso enum
   *
   * CUSTOMIZE: Mapeie os tipos de pagamento específicos do seu gateway
   */
  private mapPaymentMethod(method: string): PaymentMethod {
    const methodMap: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      debit_card: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
      bank_slip: PaymentMethod.BOLETO,
    };

    return methodMap[method?.toLowerCase()] || PaymentMethod.CREDIT_CARD;
  }

  /**
   * Override do método de normalização da classe base
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeGatewayStatus(gatewayStatus);
  }
}

// ============================================
// CHECKLIST DE IMPLEMENTAÇÃO
// ============================================
//
// Antes de considerar este gateway completo:
//
// [ ] Substituir todos os [GATEWAY_NAME] e [gateway-slug]
// [ ] Configurar endpoints corretos (production/sandbox)
// [ ] Definir credenciais necessárias
// [ ] Implementar validateCredentials
// [ ] Implementar processPIX (se suportar)
// [ ] Implementar processCreditCard (se suportar)
// [ ] Implementar processDebitCard (se suportar)
// [ ] Implementar processBoleto (se suportar)
// [ ] Implementar handleWebhook
// [ ] Implementar getPaymentStatus
// [ ] Mapear status do gateway para PaymentStatus
// [ ] Mapear métodos de pagamento
// [ ] Adicionar ao registry.ts
// [ ] Testar com credenciais sandbox
// [ ] Testar webhook
// [ ] Validar com credenciais de produção
// [ ] Documentar campos específicos
//
// ============================================

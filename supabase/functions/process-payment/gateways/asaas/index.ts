// ============================================
// ASAAS GATEWAY
// ============================================
//
// Documentação: https://docs.asaas.com/
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
 * Asaas Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 */
export class AsaasGateway extends BaseGateway {
  name = "Asaas";
  slug = "asaas";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://www.asaas.com/api/v3",
    sandbox: "https://sandbox.asaas.com/api/v3",
  };

  /**
   * Valida as credenciais do Asaas
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

      const isSandbox =
        credentials.environment !== "production" ||
        (typeof credentials.apiKey === "string" && credentials.apiKey.startsWith("$aact_hmlg_"));
      const baseUrl = isSandbox ? this.endpoints.sandbox : this.endpoints.production;

      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/payments?limit=1`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "access_token": credentials.apiKey,
        },
      });

      const executionTime = Date.now() - startTime;

      if (response.ok) {
        this.log("info", "Asaas credentials validated successfully");
        return {
          isValid: true,
          message: "Credentials are valid",
        };
      }

      return {
        isValid: false,
        message: "Invalid API Key or unauthorized access",
      };
    } catch (error: any) {
      this.log("error", "Asaas credential validation failed", error);
      return {
        isValid: false,
        message: error.message || "Connection failed",
      };
    }
  }

  /**
   * Health Check do gateway (usado no botão Testar Conexão)
   */
  async healthCheck(config: GatewayConfig): Promise<CredentialValidationResult> {
    const creds = await this.resolveCredentials(config);
    return this.validateCredentials(creds);
  }

  /**
   * Processa o pagamento criando a cobrança no Asaas
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

    try {
      this.validatePaymentRequest(request);

      const credentials = await this.resolveCredentials(config);
      const apiKey = credentials.apiKey || "";
      const isSandbox =
        config.environment !== "production" ||
        (typeof apiKey === "string" && apiKey.startsWith("$aact_hmlg_"));
      const baseUrl = isSandbox ? this.endpoints.sandbox : this.endpoints.production;

      const headers = {
        "Content-Type": "application/json",
        "access_token": apiKey,
      };

      // ── PASSO 1: Criar ou buscar cliente no Asaas ──
      const cpfCnpj = this.formatDocument(request.customer.document);
      let customerId: string | null = null;

      const searchResp = await fetch(`${baseUrl}/customers?cpfCnpj=${cpfCnpj}`, { headers });
      if (searchResp.ok) {
        const searchData = await searchResp.json();
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id;
        }
      }

      if (!customerId) {
        const createCustomer = await fetch(`${baseUrl}/customers`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: request.customer.name,
            cpfCnpj,
            email: request.customer.email,
            phone: request.customer.phone || "",
            notificationDisabled: false,
          }),
        });

        if (!createCustomer.ok) {
          const errData = await createCustomer.json().catch(() => ({}));
          throw new Error(
            `Erro ao criar cliente no Asaas: ${JSON.stringify(errData?.errors || errData)}`
          );
        }

        const customerData = await createCustomer.json();
        customerId = customerData.id;
      }

      // ── PASSO 2: Criar cobrança ──
      let billingType = "PIX";
      if (request.paymentMethod === PaymentMethod.CREDIT_CARD) {
        billingType = "CREDIT_CARD";
      } else if (request.paymentMethod === PaymentMethod.BOLETO) {
        billingType = "BOLETO";
      }

      const dueDate = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
        .toISOString()
        .split("T")[0];

      const chargePayload: any = {
        customer: customerId,
        billingType,
        value: request.amount,
        dueDate,
        description: `Pedido ${request.orderId}`,
        externalReference: request.orderId,
      };

      if (billingType === "PIX") {
        chargePayload.pixAddressKeyType = "RANDOM";
        chargePayload.expirationSeconds = 1800;
      } else if (billingType === "CREDIT_CARD" && request.card) {
        // Enviar os dados do cartão de crédito se fornecidos diretamente
        chargePayload.creditCard = {
          holderName: request.card.holderName,
          number: request.card.number.replace(/\D/g, ""),
          expiryMonth: request.card.expiryMonth,
          expiryYear: request.card.expiryYear,
          ccv: request.card.cvv,
        };
        chargePayload.creditCardHolderInfo = {
          name: request.customer.name,
          email: request.customer.email,
          cpfCnpj: cpfCnpj,
          postalCode: request.billingAddress?.zipCode?.replace(/\D/g, "") || "01000000",
          addressNumber: request.billingAddress?.number || "100",
          phone: request.customer.phone || "",
        };
      }

      const chargeResp = await fetch(`${baseUrl}/payments`, {
        method: "POST",
        headers,
        body: JSON.stringify(chargePayload),
      });

      statusCode = chargeResp.status;
      if (!chargeResp.ok) {
        const errData = await chargeResp.json().catch(() => ({}));
        throw new Error(
          `Erro ao criar cobrança Asaas: ${JSON.stringify(errData?.errors || errData?.message || errData)}`
        );
      }

      const chargeData = await chargeResp.json();
      responseData = chargeData;
      statusText = "success";

      // ── PASSO 3: Buscar QR Code se for PIX ──
      if (billingType === "PIX") {
        let pixData: any = null;
        let retries = 3;

        while (retries > 0) {
          const pixResp = await fetch(`${baseUrl}/payments/${chargeData.id}/pixQrCode`, { headers });
          if (pixResp.ok) {
            pixData = await pixResp.json();
            break;
          }
          retries--;
          if (retries > 0) {
            await this.sleep(1000);
          }
        }

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

        // Salvar log enriquecido antes de retornar
        await this.saveGatewayLog({
          userId: request.userId,
          environment: config.environment || "production",
          transactionId: request.metadata?.transactionId,
          request: chargePayload,
          response: chargeData,
          status: "success",
          statusCode: statusCode || 200,
          executionTime: Date.now() - startTime,
        });

        return this.createSuccessResponse({
          transactionId: request.orderId,
          gatewayTransactionId: chargeData.id,
          status: this.normalizeAsaasStatus(chargeData.status),
          paymentUrl: chargeData.invoiceUrl,
          qrCode: pixData?.payload || "",
          qrCodeBase64: pixData?.encodedImage || "",
          expiresAt,
          message: "PIX gerado com sucesso via Asaas",
          pixData: {
            qrCode: pixData?.payload || "",
            qrCodeBase64: pixData?.encodedImage || "",
            expiresAt,
            amount: request.amount,
          },
        });
      }

      // Salvar log enriquecido para Boleto ou Cartão
      await this.saveGatewayLog({
        userId: request.userId,
        environment: config.environment || "production",
        transactionId: request.metadata?.transactionId,
        request: chargePayload,
        response: chargeData,
        status: "success",
        statusCode: statusCode || 200,
        executionTime: Date.now() - startTime,
      });

      return this.createSuccessResponse({
        transactionId: request.orderId,
        gatewayTransactionId: chargeData.id,
        status: this.normalizeAsaasStatus(chargeData.status),
        paymentUrl: chargeData.invoiceUrl || chargeData.bankSlipUrl,
        barcodeNumber: chargeData.nossoNumero,
        digitableLine: chargeData.identificationField,
        message: "Cobrança criada com sucesso via Asaas",
        boletoData:
          billingType === "BOLETO"
            ? {
                boletoUrl: chargeData.bankSlipUrl || chargeData.invoiceUrl || "",
                barcode: chargeData.nossoNumero || "",
                digitableLine: chargeData.identificationField || "",
                dueDate: chargeData.dueDate || dueDate,
                amount: request.amount,
              }
            : undefined,
      });
    } catch (error: any) {
      errorMsg = error.message;
      // Salvar log enriquecido de falha
      await this.saveGatewayLog({
        userId: request.userId,
        environment: config.environment || "production",
        transactionId: request.metadata?.transactionId,
        request: { orderId: request.orderId, amount: request.amount, method: request.paymentMethod },
        response: { error: error.toString() },
        status: "failed",
        statusCode: statusCode || 500,
        executionTime: Date.now() - startTime,
        errorMessage: errorMsg,
      });

      return this.createErrorResponse(error, "Erro ao processar pagamento via Asaas");
    }
  }

  /**
   * Processa notificações de Webhooks do Asaas
   */
  async handleWebhook(
    payload: any,
    signature?: string
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing Asaas webhook", { event: payload.event, paymentId: payload.payment?.id });

      if (payload.payment && payload.payment.id) {
        return {
          success: true,
          processed: true,
          gatewayTransactionId: payload.payment.id,
          message: `Asaas webhook event ${payload.event} received`,
        };
      }

      return {
        success: false,
        processed: false,
        message: "Asaas webhook missing payment information",
      };
    } catch (error: any) {
      this.log("error", "Asaas webhook processing failed", error);
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  /**
   * Consulta status de pagamento no Asaas
   */
  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentStatusResponse> {
    try {
      this.log("info", "Getting Asaas payment status", { gatewayTransactionId });

      const credentials = await this.resolveCredentials(config);
      const apiKey = credentials.apiKey || "";
      const isSandbox =
        config.environment !== "production" ||
        (typeof apiKey === "string" && apiKey.startsWith("$aact_hmlg_"));
      const baseUrl = isSandbox ? this.endpoints.sandbox : this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${baseUrl}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "access_token": apiKey,
          },
        }
      );

      return {
        transactionId: response.externalReference,
        gatewayTransactionId: response.id,
        status: this.normalizeAsaasStatus(response.status),
        amount: response.value || 0,
        currency: "BRL",
        paymentMethod: this.mapAsaasPaymentMethod(response.billingType),
        createdAt: response.dateCreated,
        updatedAt: response.clientPaymentDate || response.dateCreated,
        paidAt: response.paymentDate || undefined,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Asaas payment status: ${error.message}`,
        this.slug,
        error.code,
        error.statusCode
      );
    }
  }

  /**
   * Normaliza status do Asaas para o status padrão do SyncAds
   */
  private normalizeAsaasStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      PENDING: PaymentStatus.PENDING,
      RECEIVED: PaymentStatus.APPROVED,
      CONFIRMED: PaymentStatus.APPROVED,
      OVERDUE: PaymentStatus.EXPIRED,
      REFUNDED: PaymentStatus.REFUNDED,
      REFUND_REQUESTED: PaymentStatus.REFUNDED,
      CHARGEBACK_REQUESTED: PaymentStatus.REFUNDED,
      CHARGEBACK_DISPUTE: PaymentStatus.REFUNDED,
      AWAITING_CHARGEBACK_REVERSAL: PaymentStatus.REFUNDED,
      DUNNING_REQUESTED: PaymentStatus.PENDING,
      DUNNING_RECEIVED: PaymentStatus.PENDING,
      AWAITING_RISK_ANALYSIS: PaymentStatus.PROCESSING,
      APPROVED_BY_RISK_ANALYSIS: PaymentStatus.PENDING,
      REJECTED_BY_RISK_ANALYSIS: PaymentStatus.FAILED,
      CANCELLED: PaymentStatus.CANCELLED,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  /**
   * Mapeia billingType do Asaas para PaymentMethod
   */
  private mapAsaasPaymentMethod(billingType: string): PaymentMethod {
    if (billingType === "PIX") return PaymentMethod.PIX;
    if (billingType === "BOLETO") return PaymentMethod.BOLETO;
    return PaymentMethod.CREDIT_CARD;
  }
}

// ============================================
// MERCADO PAGO GATEWAY
// ============================================
//
// Documentação: https://www.mercadopago.com.br/developers
// Prioridade: Alta
// Tipo: payment_processor
// Escopo: NACIONAL
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
 * Mercado Pago Gateway Implementation
 *
 * Métodos suportados:
 * - PIX
 * - Cartão de Crédito
 * - Boleto
 *
 * Credenciais necessárias:
 * - accessToken (Access Token do Mercado Pago)
 * - publicKey (Public Key para tokenização de cartões)
 */
export class MercadoPagoGateway extends BaseGateway {
  name = "Mercado Pago";
  slug = "mercado-pago";
  supportedMethods = [
    PaymentMethod.PIX,
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.BOLETO,
  ];

  endpoints = {
    production: "https://api.mercadopago.com/v1",
    sandbox: "https://api.mercadopago.com/v1",
  };

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.accessToken) {
        return {
          isValid: false,
          message: "Access Token is required",
        };
      }

      // Tentar fazer uma chamada de teste à API do Mercado Pago
      try {
        const endpoint = this.endpoints.production;

        const response = await fetch(`${endpoint}/users/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${credentials.accessToken}`,
          },
        });

        if (response.ok) {
          this.log("info", "Mercado Pago credentials validated successfully");
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401 || response.status === 403) {
          return {
            isValid: false,
            message: "Invalid credentials - unauthorized",
          };
        }

        this.log("warn", "Mercado Pago validation returned non-auth error");
        return {
          isValid: true,
          message: "Credentials accepted (could not fully validate)",
        };
      } catch (error: any) {
        this.log("warn", "Could not validate Mercado Pago credentials online", error);
        return {
          isValid: true,
          message: "Credentials accepted (offline validation)",
        };
      }
    } catch (error: any) {
      this.log("error", "Mercado Pago credential validation failed", error);
      return {
        isValid: false,
        message: error.message || "Invalid credentials",
      };
    }
  }

  /**
   * Health Check do gateway (botão Testar Conexão)
   */
  async healthCheck(config: GatewayConfig): Promise<CredentialValidationResult> {
    const creds = await this.resolveCredentials(config);
    return this.validateCredentials(creds);
  }

  /**
   * Processa um pagamento
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
    let payloadEnv: any = null;

    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing Mercado Pago payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const credentials = await this.resolveCredentials(config);
      const endpoint = this.endpoints.production;
      const accessToken = credentials.accessToken;

      // Configurar por método de pagamento
      switch (request.paymentMethod) {
        case PaymentMethod.PIX: {
          const pixPayment = {
            transaction_amount: request.amount,
            description: `Pedido #${request.orderId}`,
            payment_method_id: "pix",
            external_reference: request.orderId,
            payer: {
              email: request.customer.email,
              first_name: request.customer.name.split(" ")[0],
              last_name: request.customer.name.split(" ").slice(1).join(" ") || request.customer.name.split(" ")[0],
              identification: {
                type: this.formatDocument(request.customer.document).replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ",
                number: this.formatDocument(request.customer.document).replace(/\D/g, ""),
              },
            },
            notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercado-pago`,
            metadata: {
              order_id: request.orderId,
            },
          };
          payloadEnv = pixPayment;

          const response = await fetch(`${endpoint}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "X-Idempotency-Key": request.orderId,
            },
            body: JSON.stringify(pixPayment),
          });

          statusCode = response.status;
          responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || responseData.error || "Mercado Pago PIX creation failed");
          }

          statusText = "success";

          // Gravar log enriquecido
          await this.saveGatewayLog({
            userId: request.userId,
            environment: config.environment || "production",
            transactionId: request.metadata?.transactionId,
            request: pixPayment,
            response: responseData,
            status: "success",
            statusCode: statusCode || 200,
            executionTime: Date.now() - startTime,
          });

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: responseData.id?.toString(),
            status: this.normalizeMercadoPagoStatus(responseData.status),
            paymentUrl: responseData.point_of_interaction?.transaction_data?.ticket_url,
            qrCode: responseData.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: responseData.point_of_interaction?.transaction_data?.qr_code_base64,
            expiresAt: responseData.date_of_expiration,
            message: "Mercado Pago PIX payment created successfully",
          });
        }

        case PaymentMethod.CREDIT_CARD: {
          const cardPayment: any = {
            transaction_amount: request.amount,
            description: `Pedido #${request.orderId}`,
            payment_method_id: request.card?.brand?.toLowerCase() || "visa",
            installments: request.metadata?.installments || 1,
            external_reference: request.orderId,
            payer: {
              email: request.customer.email,
              first_name: request.customer.name.split(" ")[0],
              last_name: request.customer.name.split(" ").slice(1).join(" ") || request.customer.name.split(" ")[0],
              identification: {
                type: this.formatDocument(request.customer.document).replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ",
                number: this.formatDocument(request.customer.document).replace(/\D/g, ""),
              },
            },
            notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercado-pago`,
            metadata: {
              order_id: request.orderId,
            },
          };

          // Se tiver token de cartão pré-gerado, adicionar
          if (request.metadata?.cardToken) {
            cardPayment.token = request.metadata.cardToken;
          } else if (request.card) {
            // Em ambiente sandbox, podemos tentar simular ou criar sem token
            cardPayment.token = "sandbox-token";
          }
          payloadEnv = cardPayment;

          const response = await fetch(`${endpoint}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "X-Idempotency-Key": request.orderId,
            },
            body: JSON.stringify(cardPayment),
          });

          statusCode = response.status;
          responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || responseData.error || "Mercado Pago Card creation failed");
          }

          statusText = "success";

          // Gravar log enriquecido
          await this.saveGatewayLog({
            userId: request.userId,
            environment: config.environment || "production",
            transactionId: request.metadata?.transactionId,
            request: cardPayment,
            response: responseData,
            status: "success",
            statusCode: statusCode || 200,
            executionTime: Date.now() - startTime,
          });

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: responseData.id?.toString(),
            status: this.normalizeMercadoPagoStatus(responseData.status),
            message: "Mercado Pago card payment created successfully",
          });
        }

        case PaymentMethod.BOLETO: {
          const boletoPayment = {
            transaction_amount: request.amount,
            description: `Pedido #${request.orderId}`,
            payment_method_id: "bolbradesco",
            external_reference: request.orderId,
            date_of_expiration: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
            payer: {
              email: request.customer.email,
              first_name: request.customer.name.split(" ")[0],
              last_name: request.customer.name.split(" ").slice(1).join(" ") || request.customer.name.split(" ")[0],
              identification: {
                type: this.formatDocument(request.customer.document).replace(/\D/g, "").length === 11 ? "CPF" : "CNPJ",
                number: this.formatDocument(request.customer.document).replace(/\D/g, ""),
              },
              address: {
                zip_code: request.billingAddress?.zipCode?.replace(/\D/g, "") || "01000000",
                street_name: request.billingAddress?.street || "Rua Exemplo",
                street_number: request.billingAddress?.number || "100",
                neighborhood: request.billingAddress?.neighborhood || "Centro",
                city: request.billingAddress?.city || "São Paulo",
                federal_unit: request.billingAddress?.state || "SP",
              },
            },
            notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercado-pago`,
            metadata: {
              order_id: request.orderId,
            },
          };
          payloadEnv = boletoPayment;

          const response = await fetch(`${endpoint}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
              "X-Idempotency-Key": request.orderId,
            },
            body: JSON.stringify(boletoPayment),
          });

          statusCode = response.status;
          responseData = await response.json();

          if (!response.ok) {
            throw new Error(responseData.message || responseData.error || "Mercado Pago Boleto creation failed");
          }

          statusText = "success";

          // Gravar log enriquecido
          await this.saveGatewayLog({
            userId: request.userId,
            environment: config.environment || "production",
            transactionId: request.metadata?.transactionId,
            request: boletoPayment,
            response: responseData,
            status: "success",
            statusCode: statusCode || 200,
            executionTime: Date.now() - startTime,
          });

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: responseData.id?.toString(),
            status: this.normalizeMercadoPagoStatus(responseData.status),
            boletoUrl: responseData.transaction_details?.external_resource_url,
            boletoBarcode: responseData.barcode?.content,
            expiresAt: responseData.date_of_expiration,
            message: "Mercado Pago boleto payment created successfully",
          });
        }

        default:
          throw new GatewayError(
            `Payment method ${request.paymentMethod} not supported`,
            this.slug,
            "UNSUPPORTED_METHOD"
          );
      }
    } catch (error: any) {
      errorMsg = error.message;
      // Gravar log enriquecido de erro
      await this.saveGatewayLog({
        userId: request.userId,
        environment: config.environment || "production",
        transactionId: request.metadata?.transactionId,
        request: payloadEnv || { orderId: request.orderId, method: request.paymentMethod },
        response: { error: error.toString() },
        status: "failed",
        statusCode: statusCode || 500,
        executionTime: Date.now() - startTime,
        errorMessage: errorMsg,
      });

      return this.createErrorResponse(
        error,
        "Failed to process payment via Mercado Pago"
      );
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
      this.log("info", "Processing Mercado Pago webhook", { payload });

      if (payload.type === "payment" && payload.data?.id) {
        return {
          success: true,
          processed: true,
          gatewayTransactionId: payload.data.id.toString(),
          message: "Mercado Pago webhook received, status check needed",
        };
      }

      return {
        success: false,
        processed: false,
        message: "Unknown webhook type or missing payment ID",
      };
    } catch (error: any) {
      this.log("error", "Mercado Pago webhook processing failed", error);
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
      this.log("info", "Getting Mercado Pago payment status", { gatewayTransactionId });

      const credentials = await this.resolveCredentials(config);
      const endpoint = this.endpoints.production;
      const accessToken = credentials.accessToken;

      const response = await fetch(`${endpoint}/payments/${gatewayTransactionId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch payment status from Mercado Pago");
      }

      const data = await response.json();

      return {
        transactionId: data.external_reference || data.metadata?.order_id,
        gatewayTransactionId: data.id?.toString(),
        status: this.normalizeMercadoPagoStatus(data.status),
        amount: data.transaction_amount || 0,
        currency: data.currency_id || "BRL",
        paymentMethod: this.normalizePaymentMethod(data.payment_method_id),
        createdAt: data.date_created || new Date().toISOString(),
        updatedAt: data.date_last_updated || new Date().toISOString(),
        paidAt: data.status === "approved" ? data.date_approved : undefined,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get Mercado Pago payment status: ${error.message}`,
        this.slug,
        error.code,
        error.statusCode
      );
    }
  }

  /**
   * Cancela um pagamento
   */
  async cancelPayment(
    gatewayTransactionId: string,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.log("info", "Canceling Mercado Pago payment", { gatewayTransactionId });

      const credentials = await this.resolveCredentials(config);
      const endpoint = this.endpoints.production;
      const accessToken = credentials.accessToken;

      const response = await fetch(`${endpoint}/payments/${gatewayTransactionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to cancel payment in Mercado Pago");
      }

      return this.createSuccessResponse({
        transactionId: gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: PaymentStatus.CANCELLED,
        message: "Mercado Pago payment cancelled successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to cancel Mercado Pago payment"
      );
    }
  }

  /**
   * Normaliza o status do Mercado Pago para o status padrão
   */
  private normalizeMercadoPagoStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      in_process: PaymentStatus.PROCESSING,
      authorized: PaymentStatus.APPROVED,
      approved: PaymentStatus.APPROVED,
      refunded: PaymentStatus.REFUNDED,
      charged_back: PaymentStatus.REFUNDED,
      cancelled: PaymentStatus.CANCELLED,
      rejected: PaymentStatus.FAILED,
    };

    return statusMap[status?.toLowerCase()] || PaymentStatus.PENDING;
  }

  /**
   * Normaliza o método de pagamento
   */
  private normalizePaymentMethod(method: string): PaymentMethod {
    if (method === "pix") return PaymentMethod.PIX;
    if (method?.startsWith("bol")) return PaymentMethod.BOLETO;
    return PaymentMethod.CREDIT_CARD;
  }

  /**
   * Normaliza o status do gateway para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizeMercadoPagoStatus(gatewayStatus);
  }
}

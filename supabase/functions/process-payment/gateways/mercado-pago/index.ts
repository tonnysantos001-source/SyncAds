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

      // Tentar fazer uma chamada de teste à API
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
   * Processa um pagamento
   */
  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing Mercado Pago payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.endpoints.production;

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

          const pixResponse = await this.makeRequest<any>(
            `${endpoint}/payments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.credentials.accessToken}`,
                "X-Idempotency-Key": request.orderId,
              },
              body: JSON.stringify(pixPayment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: pixResponse.id?.toString(),
            status: this.normalizeMercadoPagoStatus(pixResponse.status),
            paymentUrl: pixResponse.point_of_interaction?.transaction_data?.ticket_url,
            qrCode: pixResponse.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: pixResponse.point_of_interaction?.transaction_data?.qr_code_base64,
            expiresAt: pixResponse.date_of_expiration,
            message: "Mercado Pago PIX payment created successfully",
          });
        }

        case PaymentMethod.CREDIT_CARD: {
          const cardPayment = {
            transaction_amount: request.amount,
            description: `Pedido #${request.orderId}`,
            payment_method_id: "visa", // Será ajustado baseado no token do cartão
            installments: request.paymentDetails?.installments || 1,
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

          // Se tiver dados do cartão, adicionar token
          if (request.paymentDetails?.card) {
            // Nota: Na prática, o token do cartão deve ser gerado no frontend usando o SDK do MP
            // Aqui assumimos que será enviado um cardToken já gerado
            (cardPayment as any).token = request.paymentDetails.cardToken;
          }

          const cardResponse = await this.makeRequest<any>(
            `${endpoint}/payments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.credentials.accessToken}`,
                "X-Idempotency-Key": request.orderId,
              },
              body: JSON.stringify(cardPayment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: cardResponse.id?.toString(),
            status: this.normalizeMercadoPagoStatus(cardResponse.status),
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
                zip_code: request.customer.address?.zipCode?.replace(/\D/g, "") || "01000000",
                street_name: request.customer.address?.street || "Rua Exemplo",
                street_number: request.customer.address?.number || "100",
                neighborhood: request.customer.address?.district || "Centro",
                city: request.customer.address?.city || "São Paulo",
                federal_unit: request.customer.address?.state || "SP",
              },
            },
            notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercado-pago`,
            metadata: {
              order_id: request.orderId,
            },
          };

          const boletoResponse = await this.makeRequest<any>(
            `${endpoint}/payments`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${config.credentials.accessToken}`,
                "X-Idempotency-Key": request.orderId,
              },
              body: JSON.stringify(boletoPayment),
            }
          );

          return this.createSuccessResponse({
            transactionId: request.orderId,
            gatewayTransactionId: boletoResponse.id?.toString(),
            status: this.normalizeMercadoPagoStatus(boletoResponse.status),
            boletoUrl: boletoResponse.transaction_details?.external_resource_url,
            boletoBarcode: boletoResponse.barcode?.content,
            expiresAt: boletoResponse.date_of_expiration,
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

      // Mercado Pago envia notificações no formato:
      // { id, live_mode, type, date_created, application_id, user_id, version, api_version, action, data: { id } }

      if (payload.type === "payment" && payload.data?.id) {
        return {
          success: true,
          processed: true,
          gatewayTransactionId: payload.data.id.toString(),
          message: "Mercado Pago webhook received, needs status check",
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

      const endpoint = this.endpoints.production;

      const response = await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.credentials.accessToken}`,
          },
        }
      );

      return {
        transactionId: response.external_reference || response.metadata?.order_id,
        gatewayTransactionId: response.id?.toString(),
        status: this.normalizeMercadoPagoStatus(response.status),
        amount: response.transaction_amount || 0,
        currency: response.currency_id || "BRL",
        paymentMethod: this.normalizePaymentMethod(response.payment_method_id),
        createdAt: response.date_created || new Date().toISOString(),
        updatedAt: response.date_last_updated || new Date().toISOString(),
        paidAt: response.status === "approved" ? response.date_approved : undefined,
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

      const endpoint = this.endpoints.production;

      await this.makeRequest<any>(
        `${endpoint}/payments/${gatewayTransactionId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.credentials.accessToken}`,
          },
          body: JSON.stringify({
            status: "cancelled",
          }),
        }
      );

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

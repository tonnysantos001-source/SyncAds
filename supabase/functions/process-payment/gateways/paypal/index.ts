// ============================================
// PAYPAL GATEWAY
// ============================================
//
// Documentação: https://developer.paypal.com/api/rest/
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
 * PayPal Gateway Implementation
 *
 * Métodos suportados:
 * - PayPal (Carteira)
 * - Cartão de Crédito (via PayPal)
 *
 * Credenciais necessárias:
 * - clientId
 * - clientSecret
 */
export class PayPalGateway extends BaseGateway {
  name = "PayPal";
  slug = "paypal";
  supportedMethods = [PaymentMethod.CREDIT_CARD, PaymentMethod.WALLET];

  endpoints = {
    production: "https://api.paypal.com",
    sandbox: "https://api.sandbox.paypal.com",
  };

  private accessTokenCache: {
    token: string;
    expiresAt: number;
  } | null = null;

  /**
   * Obtém access token OAuth2
   */
  private async getAccessToken(config: GatewayConfig): Promise<string> {
    // Verificar cache
    if (this.accessTokenCache && this.accessTokenCache.expiresAt > Date.now()) {
      return this.accessTokenCache.token;
    }

    const endpoint = this.getEndpoint(config);
    const credentials = btoa(
      `${config.credentials.clientId}:${config.credentials.clientSecret}`,
    );

    try {
      const response = await fetch(`${endpoint}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error_description || "Failed to get access token",
        );
      }

      const data = await response.json();

      // Cache token (expira em expires_in segundos, usamos 90% do tempo)
      this.accessTokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000 * 0.9,
      };

      return data.access_token;
    } catch (error: any) {
      throw new GatewayError(
        `Failed to authenticate with PayPal: ${error.message}`,
        this.slug,
        "AUTH_ERROR",
      );
    }
  }

  /**
   * Valida as credenciais do gateway
   */
  async validateCredentials(
    credentials: GatewayCredentials,
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.clientId) {
        return {
          isValid: false,
          message: "Client ID is required",
        };
      }

      if (!credentials.clientSecret) {
        return {
          isValid: false,
          message: "Client Secret is required",
        };
      }

      // Testar obtendo um access token
      const endpoint =
        credentials.environment === "sandbox"
          ? this.endpoints.sandbox
          : this.endpoints.production;

      const auth = btoa(`${credentials.clientId}:${credentials.clientSecret}`);

      const response = await fetch(`${endpoint}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
        body: "grant_type=client_credentials",
      });

      if (response.ok) {
        this.log("info", "PayPal credentials validated successfully");
        return {
          isValid: true,
          message: "Credentials are valid",
        };
      }

      const error = await response.json();
      return {
        isValid: false,
        message: error.error_description || "Invalid credentials",
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
    config: GatewayConfig,
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      this.log("info", "Processing PayPal payment", {
        orderId: request.orderId,
        amount: request.amount,
        method: request.paymentMethod,
      });

      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      // Criar order
      const orderData = {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: request.orderId,
            description: `Pedido ${request.orderId}`,
            custom_id: request.orderId,
            soft_descriptor: "SYNCADS",
            amount: {
              currency_code: request.currency || "USD",
              value: request.amount.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: request.currency || "USD",
                  value: request.amount.toFixed(2),
                },
              },
            },
            items: request.items
              ? request.items.map((item) => ({
                  name: item.name,
                  description: item.name,
                  unit_amount: {
                    currency_code: request.currency || "USD",
                    value: item.unitPrice.toFixed(2),
                  },
                  quantity: item.quantity.toString(),
                }))
              : [
                  {
                    name: `Pedido ${request.orderId}`,
                    description: `Pagamento do pedido ${request.orderId}`,
                    unit_amount: {
                      currency_code: request.currency || "USD",
                      value: request.amount.toFixed(2),
                    },
                    quantity: "1",
                  },
                ],
          },
        ],
        payment_source:
          request.paymentMethod === PaymentMethod.CREDIT_CARD && request.card
            ? {
                card: {
                  number: request.card.number.replace(/\s/g, ""),
                  expiry: `${request.card.expiryYear}-${request.card.expiryMonth.padStart(2, "0")}`,
                  security_code: request.card.cvv,
                  name: request.card.holderName,
                  billing_address: request.billingAddress
                    ? {
                        address_line_1: `${request.billingAddress.street}, ${request.billingAddress.number}`,
                        address_line_2: request.billingAddress.complement,
                        admin_area_2: request.billingAddress.city,
                        admin_area_1: request.billingAddress.state,
                        postal_code: this.formatZipCode(
                          request.billingAddress.zipCode,
                        ),
                        country_code: request.billingAddress.country || "BR",
                      }
                    : undefined,
                },
              }
            : undefined,
        application_context: {
          brand_name: "SyncAds",
          locale: "pt-BR",
          landing_page: "BILLING",
          shipping_preference: "NO_SHIPPING",
          user_action: "PAY_NOW",
          return_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/paypal/success`,
          cancel_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/paypal/cancel`,
        },
      };

      const response = await this.makeRequest<any>(
        `${endpoint}/v2/checkout/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            "PayPal-Request-Id": request.orderId,
          },
          body: JSON.stringify(orderData),
        },
      );

      // Se pagamento com cartão direto, tentar capturar imediatamente
      if (
        request.paymentMethod === PaymentMethod.CREDIT_CARD &&
        response.status === "CREATED"
      ) {
        try {
          const captureResponse = await this.makeRequest<any>(
            `${endpoint}/v2/checkout/orders/${response.id}/capture`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            },
          );

          const capture =
            captureResponse.purchase_units?.[0]?.payments?.captures?.[0];

          return this.createSuccessResponse({
            transactionId: response.id,
            gatewayTransactionId: capture?.id || response.id,
            status: this.normalizePayPalStatus(
              captureResponse.status || "COMPLETED",
            ),
            authorizationCode: capture?.id,
            message: "Payment processed successfully via PayPal",
          });
        } catch (captureError: any) {
          this.log("warn", "Capture failed, returning order for approval", {
            error: captureError.message,
          });
        }
      }

      // Para PayPal wallet, retornar URL de aprovação
      const approveLink = response.links?.find(
        (link: any) => link.rel === "approve",
      );

      return this.createSuccessResponse({
        transactionId: response.id,
        gatewayTransactionId: response.id,
        status: this.normalizePayPalStatus(response.status),
        redirectUrl: approveLink?.href,
        message:
          "Order created successfully, customer needs to approve payment",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to process payment via PayPal",
      );
    }
  }

  /**
   * Captura um pagamento aprovado
   */
  async capturePayment(
    orderId: string,
    config: GatewayConfig,
  ): Promise<PaymentResponse> {
    try {
      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const capture = response.purchase_units?.[0]?.payments?.captures?.[0];

      return this.createSuccessResponse({
        transactionId: response.id,
        gatewayTransactionId: capture?.id || response.id,
        status: this.normalizePayPalStatus(response.status),
        message: "Payment captured successfully",
      });
    } catch (error: any) {
      return this.createErrorResponse(
        error,
        "Failed to capture PayPal payment",
      );
    }
  }

  /**
   * Processa webhook do gateway
   */
  async handleWebhook(
    payload: any,
    signature?: string,
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing PayPal webhook", {
        eventType: payload.event_type,
        resourceType: payload.resource_type,
      });

      // PayPal envia vários tipos de eventos
      const eventType = payload.event_type;
      const resource = payload.resource;

      // Eventos de pagamento
      if (
        eventType === "PAYMENT.CAPTURE.COMPLETED" ||
        eventType === "CHECKOUT.ORDER.APPROVED"
      ) {
        return {
          success: true,
          processed: true,
          transactionId: resource.id,
          message: "PayPal payment webhook processed successfully",
        };
      }

      // Eventos de reembolso
      if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
        return {
          success: true,
          processed: true,
          transactionId: resource.id,
          message: "PayPal refund webhook processed successfully",
        };
      }

      // Eventos de disputa
      if (eventType.startsWith("CUSTOMER.DISPUTE.")) {
        return {
          success: true,
          processed: true,
          transactionId: resource.dispute_id,
          message: "PayPal dispute webhook processed successfully",
        };
      }

      this.log("info", "PayPal webhook event not handled", { eventType });

      return {
        success: true,
        processed: false,
        message: `PayPal webhook event ${eventType} received but not processed`,
      };
    } catch (error: any) {
      this.log("error", "PayPal webhook processing failed", error);
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
    config: GatewayConfig,
  ): Promise<PaymentStatusResponse> {
    try {
      this.log("info", "Getting PayPal payment status", {
        gatewayTransactionId,
      });

      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      const response = await this.makeRequest<any>(
        `${endpoint}/v2/checkout/orders/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      const purchaseUnit = response.purchase_units?.[0];
      const amount = parseFloat(purchaseUnit?.amount?.value || "0");

      return {
        transactionId: gatewayTransactionId,
        gatewayTransactionId: response.id,
        status: this.normalizePayPalStatus(response.status),
        amount: amount,
        currency: purchaseUnit?.amount?.currency_code || "USD",
        paymentMethod: PaymentMethod.WALLET,
        createdAt: response.create_time,
        updatedAt: response.update_time,
        paidAt:
          response.status === "COMPLETED" ? response.update_time : undefined,
      };
    } catch (error: any) {
      throw new GatewayError(
        `Failed to get payment status: ${error.message}`,
        this.slug,
        error.code,
        error.statusCode,
      );
    }
  }

  /**
   * Normaliza o status do PayPal para o status padrão
   */
  private normalizePayPalStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      CREATED: PaymentStatus.PENDING,
      SAVED: PaymentStatus.PENDING,
      APPROVED: PaymentStatus.PROCESSING,
      VOIDED: PaymentStatus.CANCELLED,
      COMPLETED: PaymentStatus.APPROVED,
      PAYER_ACTION_REQUIRED: PaymentStatus.PENDING,
    };

    return statusMap[status] || PaymentStatus.PENDING;
  }

  /**
   * Normaliza o status do PayPal para o status padrão
   */
  protected override normalizeStatus(gatewayStatus: string): PaymentStatus {
    return this.normalizePayPalStatus(gatewayStatus);
  }

  /**
   * Reembolsa um pagamento
   */
  async refundPayment(
    captureId: string,
    amount: number | undefined,
    config: GatewayConfig,
  ): Promise<PaymentResponse> {
    try {
      const endpoint = this.getEndpoint(config);
      const accessToken = await this.getAccessToken(config);

      const refundData = amount
        ? {
            amount: {
              value: amount.toFixed(2),
              currency_code: "USD",
            },
          }
        : {};

      const response = await this.makeRequest<any>(
        `${endpoint}/v2/payments/captures/${captureId}/refund`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(refundData),
        },
      );

      return this.createSuccessResponse({
        transactionId: response.id,
        gatewayTransactionId: response.id,
        status:
          response.status === "COMPLETED"
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PROCESSING,
        message: "Refund processed successfully via PayPal",
      });
    } catch (error: any) {
      return this.createErrorResponse(error, "Failed to refund PayPal payment");
    }
  }
}

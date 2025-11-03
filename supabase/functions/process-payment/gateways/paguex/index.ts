// ============================================
// PAGUE-X GATEWAY (inpagamentos.com)
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

export class PagueXGateway extends BaseGateway {
  name = "Pague-X";
  slug = "paguex";
  supportedMethods = [
    PaymentMethod.CREDIT_CARD,
    PaymentMethod.DEBIT_CARD,
    PaymentMethod.PIX,
    PaymentMethod.BOLETO,
  ];

  endpoints: GatewayEndpoints = {
    production: "https://api.inpagamentos.com/v1",
    sandbox: "https://api.inpagamentos.com/v1", // Mesma URL para ambos
  };

  async validateCredentials(
    credentials: GatewayCredentials,
  ): Promise<CredentialValidationResult> {
    try {
      if (!credentials.publicKey) {
        return {
          isValid: false,
          message: "publicKey is required for Pague-X",
        };
      }
      if (!credentials.secretKey) {
        return {
          isValid: false,
          message: "secretKey is required for Pague-X",
        };
      }

      // Teste básico de conexão fazendo uma requisição simples
      const endpoint = this.endpoints.production;
      const auth = this.generateBasicAuth(
        credentials.publicKey,
        credentials.secretKey,
      );

      try {
        const response = await fetch(`${endpoint}/transactions?limit=1`, {
          method: "GET",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
          },
        });

        if (response.ok || response.status === 404) {
          return {
            isValid: true,
            message: "Credentials are valid",
          };
        }

        if (response.status === 401 || response.status === 403) {
          return {
            isValid: false,
            message: "Invalid credentials - authentication failed",
          };
        }

        return {
          isValid: false,
          message: "Could not validate credentials",
        };
      } catch (error) {
        // Se der erro de rede mas as credenciais estão no formato correto, consideramos válido
        if (credentials.publicKey && credentials.secretKey) {
          return {
            isValid: true,
            message: "Credentials format is valid (network test failed)",
          };
        }
        throw error;
      }
    } catch (error: any) {
      return {
        isValid: false,
        message: error.message,
      };
    }
  }

  async processPayment(
    request: PaymentRequest,
    config: GatewayConfig,
  ): Promise<PaymentResponse> {
    try {
      this.validatePaymentRequest(request);

      const endpoint = this.getEndpoint(config);
      const transactionId = this.generateTransactionId();
      const auth = this.generateBasicAuth(
        config.credentials.publicKey,
        config.credentials.secretKey,
      );

      // Mapear método de pagamento
      const paymentMethodMap: Record<string, string> = {
        [PaymentMethod.PIX]: "pix",
        [PaymentMethod.BOLETO]: "boleto",
        [PaymentMethod.CREDIT_CARD]: "credit_card",
        [PaymentMethod.DEBIT_CARD]: "credit_card", // Usa credit_card para débito também
      };

      const paguexPaymentMethod = paymentMethodMap[request.paymentMethod];

      // Construir payload básico
      const payload: any = {
        amount: Math.round(request.amount * 100), // Converter para centavos
        paymentMethod: paguexPaymentMethod,
        postbackUrl: config.webhookUrl,
        metadata: JSON.stringify({
          orderId: request.orderId,
          userId: request.userId,
        }),
        externalRef: request.orderId,
        customer: {
          name: request.customer.name,
          email: request.customer.email,
          phone: this.formatPhone(request.customer.phone || ""),
          document: {
            type: this.getDocumentType(request.customer.document).toLowerCase(),
            number: this.formatDocument(request.customer.document),
          },
        },
      };

      // Adicionar endereço se disponível
      if (request.billingAddress) {
        payload.customer.address = {
          street: request.billingAddress.street,
          streetNumber: request.billingAddress.number,
          complement: request.billingAddress.complement || "",
          zipCode: this.formatZipCode(request.billingAddress.zipCode),
          neighborhood: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          country: "BR",
        };
      }

      // Adicionar dados de cartão se necessário
      if (
        request.card &&
        (request.paymentMethod === PaymentMethod.CREDIT_CARD ||
          request.paymentMethod === PaymentMethod.DEBIT_CARD)
      ) {
        // Para Pague-X, precisa usar o token do cartão
        // O frontend deve gerar o token usando InfinityPay.encrypt()
        if ((request as any).cardToken) {
          payload.cardToken = (request as any).cardToken;
          payload.installments = request.installments || 1;
        } else {
          // Se não tiver token, tenta enviar dados brutos (não recomendado)
          payload.card = {
            number: request.card.number.replace(/\s/g, ""),
            holderName: request.card.holderName,
            expMonth: parseInt(request.card.expiryMonth),
            expYear: parseInt(request.card.expiryYear),
            cvv: request.card.cvv,
          };
          payload.installments = request.installments || 1;
        }
      }

      this.log("info", "Processing Pague-X payment", {
        method: paguexPaymentMethod,
        amount: payload.amount,
      });

      const response = await this.makeRequest(`${endpoint}/transactions`, {
        method: "POST",
        headers: {
          Authorization: auth,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Mapear resposta da API para formato padrão
      const status = this.normalizeStatus(response.status);

      return this.createSuccessResponse({
        transactionId: transactionId,
        gatewayTransactionId: response.id?.toString() || response.secureId,
        status: status,
        qrCode: response.pix?.qrcode,
        paymentUrl: response.secureUrl || response.boleto?.url,
        barcodeNumber: response.boleto?.barcode,
        digitableLine: response.boleto?.digitableLine,
        expiresAt:
          response.pix?.expirationDate || response.boleto?.expirationDate,
        message: "Payment processed successfully via Pague-X",
        metadata: {
          paidAt: response.paidAt,
          authorizationCode: response.authorizationCode,
        },
      });
    } catch (error: any) {
      this.log("error", "Pague-X payment error", {
        error: error.message,
        stack: error.stack,
      });
      return this.createErrorResponse(
        error,
        "Failed to process Pague-X payment",
      );
    }
  }

  async handleWebhook(
    payload: any,
    signature?: string,
  ): Promise<WebhookResponse> {
    try {
      this.log("info", "Processing Pague-X webhook", {
        type: payload.type,
        objectId: payload.objectId,
      });

      // Extrair dados do webhook
      const data = payload.data;
      const transactionId = data?.id?.toString() || payload.objectId;
      const status = data?.status;

      if (!transactionId || !status) {
        throw new Error(
          "Invalid webhook payload - missing transaction ID or status",
        );
      }

      const normalizedStatus = this.normalizeStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: transactionId,
        status: normalizedStatus,
        message: "Webhook processed successfully",
        metadata: {
          type: payload.type,
          paymentMethod: data?.paymentMethod,
          amount: data?.amount,
          paidAt: data?.paidAt,
        },
      };
    } catch (error: any) {
      this.log("error", "Pague-X webhook error", { error: error.message });
      return {
        success: false,
        processed: false,
        message: error.message,
      };
    }
  }

  async getPaymentStatus(
    gatewayTransactionId: string,
    config: GatewayConfig,
  ): Promise<PaymentStatusResponse> {
    try {
      const endpoint = this.getEndpoint(config);
      const auth = this.generateBasicAuth(
        config.credentials.publicKey,
        config.credentials.secretKey,
      );

      const response = await this.makeRequest(
        `${endpoint}/transactions/${gatewayTransactionId}`,
        {
          method: "GET",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
          },
        },
      );

      return {
        transactionId: response.id?.toString(),
        gatewayTransactionId: response.id?.toString(),
        status: this.normalizeStatus(response.status),
        amount: response.amount / 100, // Converter de centavos para reais
        currency: response.currency || "BRL",
        paymentMethod: response.paymentMethod,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        paidAt: response.paidAt,
        metadata: {
          refundedAmount: response.refundedAmount,
          installments: response.installments,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  protected normalizeStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      waiting_payment: PaymentStatus.PENDING,
      pending: PaymentStatus.PROCESSING,
      approved: PaymentStatus.APPROVED,
      paid: PaymentStatus.APPROVED,
      refused: PaymentStatus.FAILED,
      in_protest: PaymentStatus.PROCESSING,
      refunded: PaymentStatus.REFUNDED,
      cancelled: PaymentStatus.CANCELLED,
      chargeback: PaymentStatus.REFUNDED,
    };

    const normalized = statusMap[gatewayStatus?.toLowerCase()];
    if (!normalized) {
      this.log("warn", `Unknown Pague-X status: ${gatewayStatus}`);
      return PaymentStatus.PENDING;
    }

    return normalized;
  }

  /**
   * Gera header de autenticação Basic Auth
   * Formato: Basic base64(publicKey:secretKey)
   */
  private generateBasicAuth(publicKey: string, secretKey: string): string {
    const credentials = `${publicKey}:${secretKey}`;
    const encoded = btoa(credentials); // Base64 encode
    return `Basic ${encoded}`;
  }
}

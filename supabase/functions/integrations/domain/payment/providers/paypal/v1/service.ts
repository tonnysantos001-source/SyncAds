import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "PayPal";
  readonly slug = "paypal";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  /**
   * Valida as credenciais do PayPal.
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
      const res = await client.ping();

      if (res.status === 401 || res.status === 403) {
        return {
          isValid: false,
          message: "Credenciais PayPal inválidas. Verifique o clientId e clientSecret.",
        };
      }

      return {
        isValid: true,
        message: "Credenciais PayPal validadas com sucesso.",
      };
    } catch (err: any) {
      return {
        isValid: true,
        message: `Credenciais aceitas (sem validação online): ${err.message}`,
      };
    }
  }

  /**
   * Processa pagamentos via PayPal.
   */
  async processPayment(
    request: PaymentRequest,
    config: IntegrationConfig
  ): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        status: "failed",
        message: validation.errors.join(", "),
      };
    }

    const client = this.getClient(config);
    const payload = Mapper.toCreateOrderPayload(request, config.webhookUrl);

    try {
      const res = await client.createOrder(payload, request.orderId);
      const body = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: "failed",
          message: `PayPal rejeitou a criação da ordem (${res.status}): ${body?.message || body?.error_description || "Erro desconhecido"}`,
          errorCode: String(res.status),
          raw: body,
        };
      }

      // Se for pagamento com cartão e a ordem foi criada com sucesso, tentamos capturar imediatamente
      if (request.paymentMethod === "credit_card" && body.status === "CREATED") {
        try {
          const capRes = await client.captureOrder(body.id);
          const capBody = await capRes.json();

          if (capRes.ok) {
            return Mapper.toPaymentResponse(capBody, request.orderId);
          }
        } catch {
          // Ignora e retorna fluxo normal para aprovação manual caso capture falhe
        }
      }

      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro de comunicação com PayPal: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de um pagamento no PayPal.
   */
  async consultPayment(
    gatewayTransactionId: string,
    config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);

    try {
      const res = await client.getOrder(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(
          `Erro ao consultar PayPal (${res.status}): ${body?.message || "Erro desconhecido"}`
        );
      }
    } catch (err: any) {
      throw new Error(`Falha ao consultar pagamento PayPal: ${err.message}`);
    }
  }

  /**
   * Estorna/reembolsa um pagamento no PayPal.
   */
  async refundPayment(
    request: RefundRequest,
    config: IntegrationConfig
  ): Promise<RefundResponse> {
    const client = this.getClient(config);

    try {
      // PayPal precisa do captureId. Usamos o gatewayTransactionId
      const res = await client.refundPayment(
        request.gatewayTransactionId,
        request.amount,
        config.credentials.currency || "USD"
      );
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          refundId: body.id || request.gatewayTransactionId,
          gatewayRefundId: body.id || request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Estorno PayPal processado com sucesso.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `PayPal rejeitou o estorno (${res.status}): ${body?.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno no PayPal: ${err.message}`,
      };
    }
  }

  /**
   * Processa webhook recebido do PayPal.
   */
  async handleWebhook(
    payload: any,
    signature?: string,
    secret?: string
  ): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return {
        success: false,
        processed: false,
        message: sigValidation.error || "Assinatura inválida",
      };
    }
    return WebhookHandler.handle(payload);
  }
}

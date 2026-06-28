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
  readonly name = "Efí";
  readonly slug = "efi";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  /**
   * Valida as credenciais da Efí.
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
          message: "Credenciais Efí inválidas. Verifique o clientId e clientSecret.",
        };
      }

      return {
        isValid: true,
        message: "Credenciais Efí validadas com sucesso.",
      };
    } catch (err: any) {
      return {
        isValid: true,
        message: `Credenciais aceitas (sem validação online): ${err.message}`,
      };
    }
  }

  /**
   * Processa pagamentos via Efí.
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
    const payload = Mapper.toCreatePaymentPayload(request, config.webhookUrl);

    try {
      const res = await client.createPayment(payload);
      const body = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: "failed",
          message: `Efí rejeitou a transação (${res.status}): ${body?.error?.message || body?.message || "Erro desconhecido"}`,
          errorCode: String(res.status),
          raw: body,
        };
      }

      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro de comunicação com Efí: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de um pagamento na Efí.
   */
  async consultPayment(
    gatewayTransactionId: string,
    config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);

    try {
      const res = await client.getPayment(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(
          `Erro ao consultar Efí (${res.status}): ${body?.error?.message || body?.message || "Erro desconhecido"}`
        );
      }
    } catch (err: any) {
      throw new Error(`Falha ao consultar pagamento Efí: ${err.message}`);
    }
  }

  /**
   * Estorna/reembolsa um pagamento na Efí.
   */
  async refundPayment(
    request: RefundRequest,
    config: IntegrationConfig
  ): Promise<RefundResponse> {
    const client = this.getClient(config);

    try {
      const res = await client.refundPayment(request.gatewayTransactionId, request.amount);
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          refundId: request.gatewayTransactionId,
          gatewayRefundId: request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Estorno Efí processado com sucesso.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Efí rejeitou o estorno (${res.status}): ${body?.error?.message || body?.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno na Efí: ${err.message}`,
      };
    }
  }

  /**
   * Processa webhook recebido da Efí.
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

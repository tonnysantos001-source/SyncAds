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
  readonly name = "PagHiper";
  readonly slug = "paghiper";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  /**
   * Valida as credenciais do PagHiper (apiKey + token).
   * Testa com consulta de status — 200 result="error" = OK, 401 = inválido.
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, false);
      const res = await client.ping();

      if (res.status === 401 || res.status === 403) {
        return {
          isValid: false,
          message: "Credenciais PagHiper inválidas. Verifique a apiKey e o token.",
        };
      }

      // 200 mesmo com result="error" (ID fictício) = credenciais OK
      return {
        isValid: true,
        message: "Credenciais PagHiper validadas com sucesso.",
      };
    } catch (err: any) {
      return {
        isValid: true,
        message: `Credenciais aceitas (sem validação online): ${err.message}`,
      };
    }
  }

  /**
   * Processa pagamento via PagHiper.
   * - PIX → endpoint pix.paghiper.com/invoice/create/
   * - Boleto → endpoint api.paghiper.com/transaction/create/
   */
  async processPayment(
    request: PaymentRequest,
    config: IntegrationConfig
  ): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const credentials = config.credentials as any;
    const notificationUrl = config.webhookUrl;

    const payload = Mapper.toTransactionPayload(request, credentials, notificationUrl);

    try {
      const isPix = request.paymentMethod === "pix";
      const res = isPix
        ? await client.createPix(payload)
        : await client.createBoleto(payload);

      const body = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: "failed",
          message: `PagHiper retornou erro ${res.status}: ${body?.message || "Erro desconhecido"}`,
          errorCode: String(res.status),
        };
      }

      return isPix
        ? Mapper.toPixResponse(body, request.orderId)
        : Mapper.toBoletoResponse(body, request.orderId);
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro de comunicação com PagHiper: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de uma transação pelo transaction_id.
   */
  async consultPayment(
    gatewayTransactionId: string,
    config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.getStatus(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(
          `Erro ao consultar PagHiper (${res.status}): ${body?.message || "Erro desconhecido"}`
        );
      }
    } catch (err: any) {
      throw new Error(`Falha ao consultar pagamento PagHiper: ${err.message}`);
    }
  }

  /**
   * Cancela uma transação no PagHiper.
   */
  async refundPayment(
    request: RefundRequest,
    config: IntegrationConfig
  ): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.cancelTransaction(request.gatewayTransactionId);
      const body = await res.json();

      if (res.ok && body?.cancel_request?.result === "success") {
        return {
          success: true,
          refundId: request.gatewayTransactionId,
          gatewayRefundId: request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Transação PagHiper cancelada com sucesso.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `PagHiper não processou o cancelamento: ${body?.cancel_request?.response_message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao cancelar transação PagHiper: ${err.message}`,
      };
    }
  }

  /**
   * Processa retorno automático (webhook) da PagHiper.
   */
  async handleWebhook(
    payload: any,
    signature?: string,
    secret?: string
  ): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Payload inválido" };
    }
    return WebhookHandler.handle(payload);
  }
}

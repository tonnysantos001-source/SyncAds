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
import { WebhookPayload } from "./types.ts";

export class Service extends BaseGateway {
  readonly name = "OpenPix";
  readonly slug = "openpix";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  /**
   * Valida credenciais OpenPix (appId).
   * Testa com GET /application — 401 = inválido, 200 = OK.
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
          message: "AppID OpenPix inválido. Crie uma aplicação em app.woovi.com > API/Plugins.",
        };
      }

      return {
        isValid: true,
        message: "Credenciais OpenPix validadas com sucesso.",
      };
    } catch (err: any) {
      return {
        isValid: true,
        message: `Credenciais aceitas (sem validação online): ${err.message}`,
      };
    }
  }

  /**
   * Cria uma cobrança PIX via OpenPix.
   * Retorna QR Code + brCode (copia e cola) + paymentLinkUrl.
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
    const payload = Mapper.toChargePayload(request);

    try {
      const res = await client.createCharge(payload);
      const body = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: "failed",
          message: `OpenPix rejeitou a cobrança (${res.status}): ${body?.error || body?.message || "Erro desconhecido"}`,
          errorCode: String(res.status),
          raw: body,
        };
      }

      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro de comunicação com OpenPix: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de uma cobrança pelo correlationID.
   */
  async consultPayment(
    gatewayTransactionId: string,
    config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.getCharge(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(
          `Erro ao consultar OpenPix (${res.status}): ${body?.error || "Erro desconhecido"}`
        );
      }
    } catch (err: any) {
      throw new Error(`Falha ao consultar cobrança OpenPix: ${err.message}`);
    }
  }

  /**
   * Cancela/remove uma cobrança OpenPix (DELETE /charge/{id}).
   */
  async refundPayment(
    request: RefundRequest,
    config: IntegrationConfig
  ): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.deleteCharge(request.gatewayTransactionId);
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          refundId: request.gatewayTransactionId,
          gatewayRefundId: request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Cobrança OpenPix cancelada com sucesso.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `OpenPix não cancelou a cobrança (${res.status}): ${body?.error || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao cancelar cobrança OpenPix: ${err.message}`,
      };
    }
  }

  /**
   * Processa webhooks da OpenPix (CHARGE_COMPLETED, CHARGE_EXPIRED, etc.).
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
    return WebhookHandler.handle(payload as WebhookPayload);
  }
}

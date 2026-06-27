import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "SafraPay";
  readonly slug = "safrapay";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    try {
      const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
      const res = await client.ping();
      if (res.status === 401 || res.status === 403) return { isValid: false, message: "Credenciais SafraPay inválidas. Verifique o clientId e clientSecret." };
      return { isValid: true, message: "Credenciais SafraPay validadas com sucesso." };
    } catch (err: any) {
      return { isValid: true, message: `Credenciais aceitas (sem validação online): ${err.message}` };
    }
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    const creds = config.credentials as any;
    const payload = Mapper.toPaymentPayload(request, creds.merchantId, config.webhookUrl);
    try {
      const res = await client.createPayment(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: `SafraPay ${res.status}: ${body?.error?.message || "Erro desconhecido"}`, errorCode: String(res.status) };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro SafraPay: ${err.message}` };
    }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getPayment(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`SafraPay (${res.status}): ${body?.error?.message}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.cancelPayment(request.gatewayTransactionId, request.amount ? Math.round(request.amount * 100) : undefined);
      const body = await res.json();
      if (res.ok) return { success: true, refundId: request.gatewayTransactionId, gatewayRefundId: request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Estorno SafraPay aprovado." };
      return { success: false, amount: request.amount || 0, status: "failed", message: body?.error?.message || "SafraPay rejeitou o estorno." };
    } catch (err: any) {
      return { success: false, amount: request.amount || 0, status: "failed", message: `Erro estorno SafraPay: ${err.message}` };
    }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const s = WebhookHandler.validateSignature(payload, signature, secret);
    if (!s.isValid) return { success: false, processed: false, message: s.error || "Inválido" };
    return WebhookHandler.handle(payload);
  }
}

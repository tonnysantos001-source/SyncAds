import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Adyen";
  readonly slug = "adyen";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    return { isValid: true, message: "Credenciais Adyen aceitas." };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    const payload = Mapper.toCreatePaymentPayload(request, config.credentials.merchantAccount, config.webhookUrl);
    try {
      const res = await client.createPayment(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: `Adyen erro ${res.status}: ${body?.message}`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) {
      return { success: false, status: "failed", message: `Erro comunicação Adyen: ${e.message}` };
    }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getPayment(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Adyen erro ${res.status}: ${body?.message}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    const amountCents = Math.round((request.amount || 0) * 100);
    try {
      const res = await client.refundPayment(request.gatewayTransactionId, amountCents, "BRL");
      const body = await res.json().catch(() => ({}));
      return res.ok
        ? { success: true, refundId: body.pspReference || request.gatewayTransactionId, gatewayRefundId: body.pspReference, amount: request.amount || 0, status: "approved", message: "Estorno Adyen solicitado." }
        : { success: false, amount: request.amount || 0, status: "failed", message: `Adyen rejeitou estorno: ${body?.message}` };
    } catch (e: any) {
      return { success: false, amount: request.amount || 0, status: "failed", message: e.message };
    }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}

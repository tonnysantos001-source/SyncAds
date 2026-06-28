import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Braintree";
  readonly slug = "braintree";

  private getClient(cfg: IntegrationConfig): Client {
    return new Client(this.http, cfg.credentials as any, cfg.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    return { isValid: true, message: "Credenciais Braintree válidas." };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    const payload = Mapper.toCreateTransactionPayload(request);
    try {
      const res = await client.createTransaction(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: `Braintree ${res.status}`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) { return { success: false, status: "failed", message: `Erro Braintree: ${e.message}` }; }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getTransaction(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Braintree ${res.status}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.refundTransaction(request.gatewayTransactionId, request.amount);
      const body = await res.json().catch(() => ({}));
      return res.ok
        ? { success: true, refundId: body.transaction?.id || request.gatewayTransactionId, gatewayRefundId: body.transaction?.id, amount: request.amount || 0, status: "approved", message: "Estorno Braintree processado." }
        : { success: false, amount: request.amount || 0, status: "failed", message: `Braintree estorno negado: ${body?.message}` };
    } catch (e: any) { return { success: false, amount: request.amount || 0, status: "failed", message: e.message }; }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}

import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Transfeera";
  readonly slug = "transfeera";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    return { isValid: true, message: "Credenciais Transfeera aceitas." };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    const payload = Mapper.toPixBillingPayload(request);
    try {
      const res = await client.createPixBilling(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: body?.message || `Transfeera erro ${res.status}`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) {
      return { success: false, status: "failed", message: `Erro comunicação Transfeera: ${e.message}` };
    }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getPixBilling(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Transfeera erro ${res.status}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const refundId = `ref-${Date.now()}`;
      const res = await client.refundPixBilling(request.gatewayTransactionId, refundId, request.amount || 0);
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          refundId: refundId,
          amount: request.amount || 0,
          status: "approved",
          message: "Estorno Pix Transfeera solicitado.",
        };
      }
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: body?.message || `Erro Transfeera: ${res.status}`,
      };
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

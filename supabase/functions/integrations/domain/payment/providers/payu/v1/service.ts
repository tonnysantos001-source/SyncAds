import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "PayU";
  readonly slug = "payu";
  private getClient(cfg: IntegrationConfig) { return new Client(this.http, cfg.credentials as any, cfg.isTestMode ?? false); }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    return v.isValid ? { isValid: true, message: "Credenciais PayU válidas." } : { isValid: false, message: v.errors.join(", ") };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const payload = Mapper.toTransactionRequest(request, config.credentials as any, config.isTestMode ?? false);
    try {
      const res = await this.getClient(config).submitTransaction(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: `PayU ${res.status}`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) { return { success: false, status: "failed", message: `Erro PayU: ${e.message}` }; }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const res = await this.getClient(config).getOrderDetail(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`PayU ${res.status}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const res = await this.getClient(config).refund(request.gatewayTransactionId, request.gatewayTransactionId, request.amount || 0);
      const body = await res.json().catch(() => ({}));
      const ok = body?.code === "SUCCESS";
      return ok
        ? { success: true, refundId: request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Estorno PayU processado." }
        : { success: false, amount: request.amount || 0, status: "failed", message: body?.error || "PayU estorno negado." };
    } catch (e: any) { return { success: false, amount: request.amount || 0, status: "failed", message: e.message }; }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}

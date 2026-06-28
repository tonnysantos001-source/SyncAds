import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Klarna";
  readonly slug = "klarna";
  private getClient(cfg: IntegrationConfig) { return new Client(this.http, cfg.credentials as any, cfg.isTestMode ?? false); }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    return v.isValid ? { isValid: true, message: "Credenciais Klarna válidas." } : { isValid: false, message: v.errors.join(", ") };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const payload = Mapper.toCreateSessionPayload(request);
    try {
      const res = await this.getClient(config).createSession(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: body?.error_messages?.join(", ") || `Klarna ${res.status}`, raw: body };
      return Mapper.sessionToPaymentResponse(body, request.orderId);
    } catch (e: any) { return { success: false, status: "failed", message: `Erro Klarna: ${e.message}` }; }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const res = await this.getClient(config).getOrder(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Klarna ${res.status}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const amountCents = Math.round((request.amount || 0) * 100);
      const res = await this.getClient(config).refundOrder(request.gatewayTransactionId, amountCents);
      return res.ok || res.status === 204
        ? { success: true, refundId: request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Estorno Klarna processado." }
        : { success: false, amount: request.amount || 0, status: "failed", message: `Klarna estorno negado (${res.status}).` };
    } catch (e: any) { return { success: false, amount: request.amount || 0, status: "failed", message: e.message }; }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}

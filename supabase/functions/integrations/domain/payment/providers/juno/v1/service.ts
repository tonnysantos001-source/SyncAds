import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";
export class Service extends BaseGateway {
  readonly name = "Juno";
  readonly slug = "juno";
  private getClient(cfg: IntegrationConfig) { return new Client(this.http, cfg.credentials as any, cfg.isTestMode ?? false); }
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    return v.isValid ? { isValid: true, message: "Credenciais Juno válidas." } : { isValid: false, message: v.errors.join(", ") };
  }
  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const payload = Mapper.toChargePayload(request);
    try {
      const res = await this.getClient(config).createCharge(payload);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: body?.details?.map((d: any) => d.message).join(", ") || `Juno ${res.status}`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) { return { success: false, status: "failed", message: `Erro Juno: ${e.message}` }; }
  }
  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const res = await this.getClient(config).getCharge(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Juno ${res.status}`);
    return Mapper.toPaymentStatusResponse(body);
  }
  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const res = await this.getClient(config).cancelCharge(request.gatewayTransactionId);
      return res.ok ? { success: true, refundId: request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Cobrança Juno cancelada." } : { success: false, amount: request.amount || 0, status: "failed", message: `Juno estorno negado (${res.status}).` };
    } catch (e: any) { return { success: false, amount: request.amount || 0, status: "failed", message: e.message }; }
  }
  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}

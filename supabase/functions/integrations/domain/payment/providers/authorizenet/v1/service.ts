import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Authorize.Net";
  readonly slug = "authorizenet";
  private getClient(cfg: IntegrationConfig) { return new Client(this.http, cfg.credentials as any, cfg.isTestMode ?? false); }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    return v.isValid ? { isValid: true, message: "Credenciais Authorize.Net válidas." } : { isValid: false, message: v.errors.join(", ") };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    const card = request.card ? {
      number: request.card.number,
      expDate: `${String(request.card.expMonth || request.card.expiryMonth).padStart(2,"0")}/${request.card.expYear || request.card.expiryYear}`,
      cvv: request.card.cvv,
    } : undefined;
    try {
      const res = await client.createTransaction(request.amount.toFixed(2), request.orderId, card, request.customer.email);
      const body = await res.json();
      if (!res.ok) return { success: false, status: "failed", message: `Authorize.Net ${res.status}`, raw: body };
      return Mapper.toPaymentResponse(body, request.orderId);
    } catch (e: any) { return { success: false, status: "failed", message: `Erro Authorize.Net: ${e.message}` }; }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const res = await this.getClient(config).getTransaction(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Authorize.Net ${res.status}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const res = await this.getClient(config).refundTransaction(request.gatewayTransactionId, (request.amount || 0).toFixed(2), "XXXX", "XXXX");
      const body = await res.json().catch(() => ({}));
      const success = body?.messages?.resultCode === "Ok";
      return success
        ? { success: true, refundId: body.transactionResponse?.transId || request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Estorno Authorize.Net processado." }
        : { success: false, amount: request.amount || 0, status: "failed", message: body?.messages?.message?.[0]?.text || "Estorno Authorize.Net negado." };
    } catch (e: any) { return { success: false, amount: request.amount || 0, status: "failed", message: e.message }; }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error };
    return WebhookHandler.handle(payload);
  }
}

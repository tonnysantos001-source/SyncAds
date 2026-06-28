import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Stark Bank";
  readonly slug = "starkbank";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    return { isValid: true, message: "Credenciais Stark Bank aceitas." };
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    
    const client = this.getClient(config);
    const method = request.paymentMethod;

    try {
      let res: Response;
      if (method === "pix") {
        const payload = Mapper.toPixRequestPayload(request);
        res = await client.createPixRequest(payload);
      } else {
        const payload = Mapper.toInvoicePayload(request);
        res = await client.createInvoice(payload);
      }

      const body = await res.json();
      if (!res.ok) {
        const errorMsg = body?.errors?.map((e: any) => e.message).join(", ") || body?.error || `Stark Bank erro ${res.status}`;
        return { success: false, status: "failed", message: errorMsg, raw: body };
      }

      const starkRes = Array.isArray(body?.requests) ? body.requests[0] : (Array.isArray(body?.invoices) ? body.invoices[0] : body);
      return Mapper.toPaymentResponse(starkRes, request.orderId, method);
    } catch (e: any) {
      return { success: false, status: "failed", message: `Erro comunicação Stark Bank: ${e.message}` };
    }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getInvoice(gatewayTransactionId);
    const body = await res.json();
    if (!res.ok) throw new Error(`Stark Bank erro ${res.status}`);
    const starkRes = Array.isArray(body?.invoices) ? body.invoices[0] : body;
    return Mapper.toPaymentStatusResponse(starkRes);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.cancelInvoice(request.gatewayTransactionId);
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        return {
          success: true,
          refundId: request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Estorno/Cancelamento Stark Bank solicitado.",
        };
      }
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: body?.errors?.map((e: any) => e.message).join(", ") || `Erro Stark Bank: ${res.status}`,
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

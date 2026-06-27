import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult, PaymentRequest, PaymentResponse,
  RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "MaxiPago!";
  readonly slug = "maxipago";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    try {
      const client = new Client(this.http, credentials, true);
      const res = await client.ping();
      const text = await res.text();
      if (text.includes("Invalid merchant")) {
        return { isValid: false, message: "merchantId ou merchantKey MaxiPago! inválidos." };
      }
      return { isValid: true, message: "Credenciais MaxiPago! validadas com sucesso." };
    } catch (err: any) {
      return { isValid: true, message: `Credenciais aceitas (sem validação online): ${err.message}` };
    }
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };

    const client = this.getClient(config);
    const params = Mapper.toTransactionParams(request, config.isTestMode ?? false);

    try {
      const res = await client.createSale(params);
      const xmlText = await res.text();
      const parsed = Mapper.parseXmlResponse(xmlText);

      if (!res.ok) {
        return { success: false, status: "failed", message: `MaxiPago! HTTP ${res.status}`, errorCode: String(res.status) };
      }

      return Mapper.toPaymentResponse(parsed, request.orderId);
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro MaxiPago!: ${err.message}` };
    }
  }

  async consultPayment(gatewayTransactionId: string, _config: IntegrationConfig): Promise<PaymentStatusResponse> {
    throw new Error("Consulta de status MaxiPago! requer a API de Relatórios. Use o portal MaxiPago!.");
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.voidTransaction(request.gatewayTransactionId);
      const xmlText = await res.text();
      const parsed = Mapper.parseXmlResponse(xmlText);
      if (parsed.responseCode === "0") {
        return { success: true, refundId: request.gatewayTransactionId, gatewayRefundId: request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Estorno MaxiPago! aprovado." };
      }
      return { success: false, amount: request.amount || 0, status: "failed", message: parsed.responseMessage || "MaxiPago! rejeitou o estorno." };
    } catch (err: any) {
      return { success: false, amount: request.amount || 0, status: "failed", message: `Erro estorno MaxiPago!: ${err.message}` };
    }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sig = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sig.isValid) return { success: false, processed: false, message: sig.error || "Inválido" };
    return WebhookHandler.handle(payload);
  }
}

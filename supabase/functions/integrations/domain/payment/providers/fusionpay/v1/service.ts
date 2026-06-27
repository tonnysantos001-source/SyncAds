import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class FusionPayService extends BaseGateway {
  readonly providerName = "fusionpay";
  readonly providerVersion = "v1";

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const result = Validator.validateCredentials(credentials);
    if (!result.isValid) return { isValid: false, errors: result.errors };
    try {
      const client = new Client(this.http, credentials, credentials.isTestMode ?? true);
      const res = await client.ping();
      if (res.ok || res.status === 404 || res.status === 401) {
        return { isValid: true };
      }
      return { isValid: false, errors: ["Falha na validação das credenciais FusionPay."] };
    } catch {
      return { isValid: true };
    }
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const credentials = config.credentials;
    const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
    const payload = Mapper.toPaymentPayload(request);
    const res = await client.createPayment(payload);
    const data = await res.json();
    if (!res.ok) {
      return { success: false, transactionId: request.orderId, status: "failed", message: data?.message || "Erro FusionPay" };
    }
    return Mapper.toPaymentResponse(data);
  }

  async getPaymentStatus(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const credentials = config.credentials;
    const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
    const res = await client.getPayment(gatewayTransactionId);
    const data = await res.json();
    return Mapper.toPaymentStatusResponse(data);
  }

  async handleWebhook(payload: any, signature: string, config: IntegrationConfig): Promise<WebhookResponse> {
    return WebhookHandler.process(payload);
  }
}

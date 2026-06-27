import { BaseGateway } from "../../../core/BaseGateway.ts";
import { CredentialValidationResult, PaymentRequest, PaymentResponse, RefundRequest, RefundResponse, PaymentStatusResponse, WebhookResponse, IntegrationConfig } from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Vindi";
  readonly slug = "vindi";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const v = Validator.validateCredentials(credentials);
    if (!v.isValid) return { isValid: false, message: v.errors.join(", ") };
    try {
      const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
      const res = await client.ping();
      if (res.status === 401 || res.status === 403) return { isValid: false, message: "API Key Vindi inválida. Verifique em Configurações > API no painel." };
      return { isValid: true, message: "Credenciais Vindi validadas com sucesso." };
    } catch (err: any) {
      return { isValid: true, message: `Credenciais aceitas (sem validação online): ${err.message}` };
    }
  }

  async processPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const v = Validator.validatePaymentRequest(request);
    if (!v.isValid) return { success: false, status: "failed", message: v.errors.join(", ") };
    const client = this.getClient(config);
    try {
      // 1. Criar/obter cliente
      const customerRes = await client.createCustomer(Mapper.toVindiCustomer(request));
      const customerData = await customerRes.json();
      if (!customerRes.ok || !customerData.customer) {
        const errMsg = customerData.errors?.map((e: any) => e.message).join(", ") || "Erro ao criar cliente na Vindi.";
        return { success: false, status: "failed", message: errMsg };
      }
      const customerId: number = customerData.customer.id;

      // 2. Para cartão: tokenizar
      let paymentProfileId: number | undefined;
      if ((request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card") && request.card) {
        const profileRes = await client.createPaymentProfile({
          customer_id: customerId,
          holder_name: request.card.holderName,
          card_number: request.card.number.replace(/\D/g, ""),
          card_expiration: `${String(request.card.expMonth).padStart(2, "0")}/${request.card.expYear}`,
          card_cvv: request.card.cvv,
          payment_method_code: "credit_card",
        });
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.payment_profile) paymentProfileId = profileData.payment_profile.id;
      }

      // 3. Criar fatura
      const billRes = await client.createBill(Mapper.toBillPayload(request, customerId, paymentProfileId));
      const billData = await billRes.json();
      return Mapper.toBillResponse(billData, request.orderId);
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro Vindi: ${err.message}` };
    }
  }

  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);
    const res = await client.getBill(Number(gatewayTransactionId));
    const body = await res.json();
    if (!res.ok) throw new Error(`Vindi (${res.status}): ${body?.errors?.[0]?.message}`);
    return Mapper.toPaymentStatusResponse(body);
  }

  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    const client = this.getClient(config);
    try {
      const res = await client.cancelBill(Number(request.gatewayTransactionId));
      if (res.ok || res.status === 204) return { success: true, refundId: request.gatewayTransactionId, gatewayRefundId: request.gatewayTransactionId, amount: request.amount || 0, status: "approved", message: "Fatura Vindi cancelada com sucesso." };
      const body = await res.json().catch(() => ({}));
      return { success: false, amount: request.amount || 0, status: "failed", message: `Vindi rejeitou o cancelamento: ${body?.errors?.[0]?.message || "Erro desconhecido"}` };
    } catch (err: any) {
      return { success: false, amount: request.amount || 0, status: "failed", message: `Erro cancelamento Vindi: ${err.message}` };
    }
  }

  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const s = WebhookHandler.validateSignature(payload, signature, secret);
    if (!s.isValid) return { success: false, processed: false, message: s.error || "Inválido" };
    return WebhookHandler.handle(payload);
  }
}

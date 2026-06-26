import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  RefundRequest,
  RefundResponse,
  PaymentStatusResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Ever Pay";
  readonly slug = "everpay";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode);
  }

  /**
   * Validação de credenciais brutas (Health Check)
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, true);
      const res = await client.ping();
      
      if (res.ok) {
        return { isValid: true, message: "Conexão estabelecida com Ever Pay com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pela Ever Pay. HTTP status ${res.status}: ${body.message || "Erro desconhecido"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com Ever Pay: ${err.message}` };
    }
  }

  /**
   * Implementação específica para criação de Pix
   */
  async createPix(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createPayment(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Ever Pay rejeitou a cobrança Pix (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "PIX_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Ever Pay: ${err.message}` };
    }
  }

  /**
   * Implementação específica para criação de Boleto
   */
  async createBoleto(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createPayment(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Ever Pay rejeitou a emissão do boleto (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "BOLETO_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Ever Pay: ${err.message}` };
    }
  }

  /**
   * Implementação específica para criação de Cartão de Crédito
   */
  async createCreditCard(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    if (!request.card) {
      return { success: false, status: "failed", message: "Dados do cartão de crédito são obrigatórios." };
    }

    const client = this.getClient(config);

    try {
      // Passo 1: Tokenizar o cartão
      const cardRes = await client.tokenizeCard({
        name: request.card.holder,
        number: request.card.number.replace(/\s/g, ""),
        cvc: request.card.cvv,
        exp_month: Number(request.card.expirationMonth),
        exp_year: Number(request.card.expirationYear),
      });
      const cardBody = await cardRes.json();

      if (!cardRes.ok) {
        return {
          success: false,
          status: "failed",
          message: `Falha na tokenização do cartão na Ever Pay: ${cardBody.message || "Erro no cartão"}`,
        };
      }

      const cardToken = cardBody.id; // ID do token gerado (ex: "tok_123")

      // Passo 2: Criar pagamento com o token do cartão
      const apiPayload = Mapper.toPaymentPayload(request, cardToken);
      const paymentRes = await client.createPayment(apiPayload);
      const paymentBody = await paymentRes.json();

      if (paymentRes.ok) {
        return Mapper.toPaymentResponse(paymentBody);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Ever Pay rejeitou o pagamento com cartão (${paymentRes.status}): ${paymentBody.message || "Erro desconhecido"}`,
          errorCode: paymentBody.error || "CREDIT_CARD_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar cartão com Ever Pay: ${err.message}` };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getPayment(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar pagamento na Ever Pay (${res.status}): ${body.message}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento na Ever Pay: ${err.message}`);
    }
  }

  /**
   * Reembolsa um pagamento aprovado
   */
  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const amountCents = request.amount ? Math.round(request.amount * 100) : undefined;
      const res = await client.refundPayment(request.gatewayTransactionId, amountCents);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          refundId: String(body.id || request.gatewayTransactionId),
          gatewayRefundId: String(body.id || request.gatewayTransactionId),
          amount: request.amount || (body.amount ? (body.amount / 100) : 0),
          status: "approved",
          message: "Reembolso processado com sucesso na Ever Pay.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Erro ao reembolsar transação na Ever Pay (${res.status}): ${body.message}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno na Ever Pay: ${err.message}`,
      };
    }
  }

  /**
   * Tratamento de Webhooks
   */
  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Assinatura inválida" };
    }
    return WebhookHandler.handle(payload);
  }
}

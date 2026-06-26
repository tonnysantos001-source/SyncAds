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
  readonly name = "Dias Marketplace";
  readonly slug = "diasmarketplace";

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
        return { isValid: true, message: "Conexão estabelecida com Dias Marketplace com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pela Dias Marketplace. HTTP status ${res.status}: ${body.message || "Erro desconhecido"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com Dias Marketplace: ${err.message}` };
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
    (apiPayload.paymentMethod as any).type = "pix";

    try {
      const res = await client.createTransaction(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Dias Marketplace rejeitou a cobrança Pix (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "PIX_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Dias Marketplace: ${err.message}` };
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

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);
    (apiPayload.paymentMethod as any).type = "credit_card";

    try {
      const res = await client.createTransaction(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Dias Marketplace rejeitou o pagamento com cartão (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "CREDIT_CARD_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Dias Marketplace: ${err.message}` };
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
    (apiPayload.paymentMethod as any).type = "boleto";

    try {
      const res = await client.createTransaction(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Dias Marketplace rejeitou a emissão do boleto (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "BOLETO_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Dias Marketplace: ${err.message}` };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getTransaction(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar pagamento no Dias Marketplace (${res.status}): ${body.message}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento: ${err.message}`);
    }
  }

  /**
   * Reembolsa um pagamento aprovado
   */
  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.refundTransaction(request.gatewayTransactionId, request.amount);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          refundId: String(body.id || request.gatewayTransactionId),
          gatewayRefundId: String(body.id || request.gatewayTransactionId),
          amount: request.amount || body.amount || 0,
          status: "approved",
          message: "Reembolso processado com sucesso no Dias Marketplace.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Erro ao reembolsar transação no Dias Marketplace (${res.status}): ${body.message}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno no Dias Marketplace: ${err.message}`,
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

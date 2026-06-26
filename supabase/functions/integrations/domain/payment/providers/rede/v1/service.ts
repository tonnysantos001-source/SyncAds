import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  RefundRequest,
  RefundResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "Rede";
  readonly slug = "rede";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode);
  }

  /**
   * Validação real de credenciais brutas (Health Check)
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, true);
      const res = await client.ping();
      
      // Conexão aceita se 200, ou se retornar 401 provando que bateu na API mas deu erro de PV/Token
      if (res.ok || res.status === 200 || res.status === 401) {
        return { isValid: true, message: "Conexão com a Rede estabelecida com sucesso." };
      } else {
        const body = await res.text().catch(() => "");
        return { 
          isValid: false, 
          message: `Conexão rejeitada pela Rede. HTTP status ${res.status}: ${body.slice(0, 100)}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com a Rede: ${err.message}` };
    }
  }

  /**
   * Processamento de PIX
   */
  override async createPix(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createTransaction(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse({ ...body, kind: "pix" });
      } else {
        return {
          success: false,
          status: "failed",
          message: `Rede rejeitou o PIX: ${body.returnMessage || body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar PIX na Rede: ${err.message}` };
    }
  }

  /**
   * Processamento de Cartão de Crédito
   */
  override async createCreditCard(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createTransaction(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse({ ...body, kind: "credit" });
      } else {
        return {
          success: false,
          status: "failed",
          message: `Rede rejeitou o cartão: ${body.returnMessage || body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar cartão na Rede: ${err.message}` };
    }
  }

  /**
   * Processamento de Boleto
   */
  override async createBoleto(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createTransaction(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse({ ...body, kind: "boleto" });
      } else {
        return {
          success: false,
          status: "failed",
          message: `Rede rejeitou o boleto: ${body.returnMessage || body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar boleto na Rede: ${err.message}` };
    }
  }

  /**
   * Consulta o status de uma transação na Rede
   */
  override async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getTransaction(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar transação na Rede (${res.status}): ${body.returnMessage || body.message || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar transação na Rede: ${err.message}`);
    }
  }

  /**
   * Reembolsa uma transação na Rede
   */
  override async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.refundTransaction(request.gatewayTransactionId, request.amount);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          refundId: body.refundId || body.tid,
          gatewayRefundId: body.refundId || body.tid,
          amount: request.amount || 0,
          status: "approved",
          message: "Reembolso processado com sucesso na Rede.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Rede rejeitou o reembolso: ${body.returnMessage || body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Erro ao processar reembolso na Rede: ${err.message}`,
      };
    }
  }

  /**
   * Tratamento de Webhooks
   */
  override async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Assinatura inválida" };
    }
    return WebhookHandler.handle(payload);
  }
}

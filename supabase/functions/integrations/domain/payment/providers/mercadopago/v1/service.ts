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
  readonly name = "Mercado Pago";
  readonly slug = "mercadopago";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials, config.isTestMode);
  }

  /**
   * Valida credenciais (AccessToken) fazendo uma chamada de ping real à API
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
        return { isValid: true, message: "Conexão com Mercado Pago validada com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return {
          isValid: false,
          message: `Erro do Mercado Pago (${res.status}): ${body.message || "Credenciais rejeitadas"}`,
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao validar: ${err.message}` };
    }
  }

  /**
   * Processamento de Pix no Mercado Pago
   */
  async createPix(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const payload = Mapper.toPaymentPayload(request);
    
    // Forçar Pix
    payload.payment_method_id = "pix";

    try {
      const res = await client.createPayment(payload, request.idempotencyKey);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Erro da API do Mercado Pago (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "GATEWAY_ERROR",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Falha de conexão com Mercado Pago: ${err.message}`,
      };
    }
  }

  /**
   * Processamento de Cartão de Crédito no Mercado Pago
   */
  async createCreditCard(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    if (!request.metadata?.token) {
      return {
        success: false,
        status: "failed",
        message: "Token do cartão não fornecido em metadata.token",
      };
    }

    const client = this.getClient(config);
    const payload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createPayment(payload, request.idempotencyKey);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Erro de processamento do cartão (${res.status}): ${body.message || "Transação rejeitada"}`,
          errorCode: body.error || "CREDIT_CARD_REJECTED",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Falha ao processar cartão de crédito: ${err.message}`,
      };
    }
  }

  /**
   * Processamento de Boleto no Mercado Pago
   */
  async createBoleto(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const payload = Mapper.toPaymentPayload(request);
    
    // Forçar Boleto Bradesco
    payload.payment_method_id = "bolbradesco";

    try {
      const res = await client.createPayment(payload, request.idempotencyKey);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Erro ao emitir boleto (${res.status}): ${body.message || "Erro desconhecido"}`,
          errorCode: body.error || "BOLETO_ERROR",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Falha ao emitir boleto no Mercado Pago: ${err.message}`,
      };
    }
  }

  /**
   * Cancela uma transação pendente no Mercado Pago
   */
  async cancelPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.cancelPayment(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Erro ao cancelar pagamento (${res.status}): ${body.message}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro ao cancelar pagamento: ${err.message}`,
      };
    }
  }

  /**
   * Reembolsa um pagamento aprovado
   */
  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.refundPayment(request.gatewayTransactionId, request.amount);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          refundId: String(body.id),
          gatewayRefundId: String(body.id),
          amount: body.amount || request.amount || 0,
          status: "approved",
          message: "Reembolso executado com sucesso.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Erro ao reembolsar (${res.status}): ${body.message}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno: ${err.message}`,
      };
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
        throw new Error(`Erro ao consultar pagamento (${res.status}): ${body.message}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de rede ao consultar pagamento: ${err.message}`);
    }
  }

  /**
   * Trata webhook
   */
  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Assinatura inválida" };
    }
    return WebhookHandler.handle(payload);
  }
}

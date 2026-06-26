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
  readonly name = "Wirecard (Moip)";
  readonly slug = "wirecard-moip";

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
      
      if (res.ok || res.status === 200 || res.status === 404) {
        return { isValid: true, message: "Conexão estabelecida com Wirecard com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pelo Wirecard. ${body.message || "Token ou Key inválidos"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro ao conectar com Wirecard: ${err.message}` };
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
    const orderPayload = Mapper.toOrderPayload(request);
    const paymentPayload = Mapper.toPaymentPayload(request);

    try {
      // 1. Criar Ordem
      const orderRes = await client.createOrder(orderPayload);
      const orderBody = await orderRes.json();

      if (!orderRes.ok) {
        return {
          success: false,
          status: "failed",
          message: `Wirecard rejeitou a criação do pedido: ${orderBody.message || "Erro desconhecido"}`,
        };
      }

      const orderId = orderBody.id;

      // 2. Criar Pagamento PIX
      const paymentRes = await client.createPayment(orderId, paymentPayload);
      const paymentBody = await paymentRes.json();

      if (paymentRes.ok) {
        return Mapper.toPaymentResponse(paymentBody, request.orderId);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Wirecard rejeitou o pagamento do PIX: ${paymentBody.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar PIX: ${err.message}` };
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
    const orderPayload = Mapper.toOrderPayload(request);
    const paymentPayload = Mapper.toPaymentPayload(request);

    try {
      // 1. Criar Ordem
      const orderRes = await client.createOrder(orderPayload);
      const orderBody = await orderRes.json();

      if (!orderRes.ok) {
        return {
          success: false,
          status: "failed",
          message: `Wirecard rejeitou a criação do pedido com cartão: ${orderBody.message || "Erro desconhecido"}`,
        };
      }

      const orderId = orderBody.id;

      // 2. Criar Pagamento com Cartão
      const paymentRes = await client.createPayment(orderId, paymentPayload);
      const paymentBody = await paymentRes.json();

      if (paymentRes.ok) {
        return Mapper.toPaymentResponse(paymentBody, request.orderId);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Wirecard rejeitou o pagamento com cartão: ${paymentBody.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar cartão: ${err.message}` };
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
    const orderPayload = Mapper.toOrderPayload(request);
    const paymentPayload = Mapper.toPaymentPayload(request);

    try {
      // 1. Criar Ordem
      const orderRes = await client.createOrder(orderPayload);
      const orderBody = await orderRes.json();

      if (!orderRes.ok) {
        return {
          success: false,
          status: "failed",
          message: `Wirecard rejeitou a criação do pedido para boleto: ${orderBody.message || "Erro desconhecido"}`,
        };
      }

      const orderId = orderBody.id;

      // 2. Criar Pagamento com Boleto
      const paymentRes = await client.createPayment(orderId, paymentPayload);
      const paymentBody = await paymentRes.json();

      if (paymentRes.ok) {
        return Mapper.toPaymentResponse(paymentBody, request.orderId);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Wirecard rejeitou a criação do boleto: ${paymentBody.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar boleto: ${err.message}` };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  override async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getPayment(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar pagamento no Wirecard (${res.status}): ${body.message || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento: ${err.message}`);
    }
  }

  /**
   * Reembolsa um pagamento
   */
  override async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const refundPayload = request.amount ? { amount: Math.round(request.amount * 100) } : {};

      const res = await client.refundPayment(request.gatewayTransactionId, refundPayload);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          refundId: body.id,
          gatewayRefundId: body.id,
          amount: request.amount || 0,
          status: body.status === "COMPLETED" || body.status === "SETTLED" ? "approved" : "pending",
          message: "Reembolso processado com sucesso no Wirecard.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Wirecard rejeitou o reembolso: ${body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Erro ao processar reembolso no Wirecard: ${err.message}`,
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

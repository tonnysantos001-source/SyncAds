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
  readonly name = "PayPal";
  readonly slug = "paypal";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode, this.cache);
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
      const client = new Client(this.http, credentials, true, this.cache);
      const res = await client.ping();
      
      if (res.ok) {
        return { isValid: true, message: "Conexão estabelecida com PayPal com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pelo PayPal. ${body.message || "Client ID ou Client Secret inválidos"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro ao conectar com PayPal: ${err.message}` };
    }
  }

  /**
   * Sobrescreve createPayment para interceptar métodos específicos do PayPal
   */
  override async createPayment(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    if (request.paymentMethod === "paypal" || request.paymentMethod === "wallet") {
      return this.createPayPalWallet(request, config);
    }
    return super.createPayment(request, config);
  }

  /**
   * Processamento do PayPal Wallet
   */
  async createPayPalWallet(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createOrder(apiPayload, request.orderId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `PayPal rejeitou a criação da ordem: ${body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de rede ao criar ordem: ${err.message}` };
    }
  }

  /**
   * Processamento de Cartão de Crédito via PayPal
   */
  override async createCreditCard(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createOrder(apiPayload, request.orderId);
      const body = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: "failed",
          message: `PayPal rejeitou a criação da ordem com cartão: ${body.message || "Erro desconhecido"}`,
        };
      }

      const orderId = body.id;
      // Tenta capturar imediatamente
      const captureRes = await client.captureOrder(orderId);
      const captureBody = await captureRes.json();

      if (captureRes.ok) {
        return Mapper.toPaymentResponse(captureBody);
      } else {
        // Se a captura falhar, retorna a ordem criada
        return Mapper.toPaymentResponse(body);
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de rede ao processar cartão no PayPal: ${err.message}` };
    }
  }

  /**
   * Consulta o status de um pagamento no PayPal
   */
  override async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getOrder(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar pagamento no PayPal (${res.status}): ${body.message || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento: ${err.message}`);
    }
  }

  /**
   * Reembolsa um pagamento no PayPal
   */
  override async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const currency = "BRL"; // Valor padrão para reembolsos se não vier na request (PayPal exige moeda)
      
      const refundData = request.amount
        ? {
            amount: {
              value: request.amount.toFixed(2),
              currency_code: currency,
            },
          }
        : {};

      const res = await client.refundCapture(request.gatewayTransactionId, refundData);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          refundId: body.id,
          gatewayRefundId: body.id,
          amount: request.amount || 0,
          status: body.status === "COMPLETED" ? "approved" : "pending",
          message: "Reembolso processado com sucesso no PayPal.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `PayPal rejeitou o reembolso: ${body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Erro ao processar reembolso no PayPal: ${err.message}`,
      };
    }
  }

  /**
   * Tratamento oficial de Webhooks
   */
  override async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Assinatura inválida" };
    }
    return WebhookHandler.handle(payload);
  }
}

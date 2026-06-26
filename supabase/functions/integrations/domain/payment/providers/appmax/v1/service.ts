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
  readonly name = "Appmax";
  readonly slug = "appmax";

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
      
      // Se der 200 ou 400 (Bad Request de validação de parâmetros), o token é válido.
      // Se der 401 ou 403, as credenciais estão erradas.
      if (res.status === 200 || res.status === 400) {
        return { isValid: true, message: "Conexão com Appmax validada com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pela Appmax. HTTP status ${res.status}: ${body.message || "Credenciais incorretas"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com Appmax: ${err.message}` };
    }
  }

  /**
   * Helper unificado para executar o fluxo de 3 passos na Appmax:
   * 1. Criar Cliente
   * 2. Criar Pedido
   * 3. Criar Pagamento
   */
  private async processAppmaxPayment(
    method: "pix" | "ticket" | "credit-card",
    request: PaymentRequest,
    config: IntegrationConfig,
    cardToken?: string
  ): Promise<PaymentResponse> {
    const client = this.getClient(config);

    try {
      // Passo 1: Criar Cliente
      const customerPayload = Mapper.toCustomerPayload(request);
      const customerRes = await client.createCustomer(customerPayload);
      const customerBody = await customerRes.json();

      if (!customerRes.ok || !customerBody.success) {
        return {
          success: false,
          status: "failed",
          message: `Erro ao criar cliente na Appmax: ${customerBody.message || "Erro desconhecido"}`,
        };
      }

      const customerId = customerBody.data.id;

      // Passo 2: Criar Pedido
      const orderPayload = Mapper.toOrderPayload(request);
      const orderRes = await client.createOrder({
        customer_id: customerId,
        products: orderPayload.products,
      });
      const orderBody = await orderRes.json();

      if (!orderRes.ok || !orderBody.success) {
        return {
          success: false,
          status: "failed",
          message: `Erro ao criar pedido na Appmax: ${orderBody.message || "Erro desconhecido"}`,
        };
      }

      const orderId = orderBody.data.id;

      // Passo 3: Criar Pagamento
      const paymentPayload = Mapper.toPaymentPayload(request, cardToken);
      const paymentRes = await client.createPayment(method, {
        order_id: orderId,
        customer_id: customerId,
        payment: paymentPayload,
      });
      const paymentBody = await paymentRes.json();

      if (paymentRes.ok && paymentBody.success) {
        return Mapper.toPaymentResponse(paymentBody);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Erro no processamento do pagamento na Appmax: ${paymentBody.message || "Erro de transação"}`,
          errorCode: paymentBody.error || "TRANSACTION_ERROR",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Falha de comunicação com a Appmax: ${err.message}`,
      };
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
    return this.processAppmaxPayment("pix", request, config);
  }

  /**
   * Implementação específica para criação de Boleto
   */
  async createBoleto(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }
    return this.processAppmaxPayment("ticket", request, config);
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
      // Passo 0: Tokenizar o cartão
      const cardRes = await client.tokenizeCard({
        name: request.card.holder,
        number: request.card.number.replace(/\s/g, ""),
        cvv: request.card.cvv,
        month: Number(request.card.expirationMonth),
        year: Number(request.card.expirationYear.slice(-2)),
      });
      const cardBody = await cardRes.json();

      if (!cardRes.ok || !cardBody.success) {
        return {
          success: false,
          status: "failed",
          message: `Falha na tokenização do cartão na Appmax: ${cardBody.message || "Erro no cartão"}`,
        };
      }

      const token = cardBody.data.token;

      // Executar o fluxo normal usando o token gerado
      return this.processAppmaxPayment("credit-card", request, config, token);
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro na tokenização/processamento do cartão de crédito: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de um pagamento na Appmax
   */
  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getOrder(gatewayTransactionId);
      const body = await res.json();

      if (res.ok && body.success) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar pagamento na Appmax (${res.status}): ${body.message || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento na Appmax: ${err.message}`);
    }
  }

  /**
   * Reembolsa um pagamento aprovado
   */
  async refundPayment(request: RefundRequest, config: IntegrationConfig): Promise<RefundResponse> {
    try {
      const client = this.getClient(config);
      const amountCents = request.amount ? Math.round(request.amount * 100) : undefined;
      const res = await client.refundTransaction(request.gatewayTransactionId, amountCents);
      const body = await res.json();

      if (res.ok && body.success) {
        return {
          success: true,
          refundId: String(body.data?.id || request.gatewayTransactionId),
          gatewayRefundId: String(body.data?.id || request.gatewayTransactionId),
          amount: request.amount || 0,
          status: "approved",
          message: "Reembolso processado com sucesso na Appmax.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Erro ao reembolsar transação na Appmax (${res.status}): ${body.message || "Solicitação recusada"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno na Appmax: ${err.message}`,
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

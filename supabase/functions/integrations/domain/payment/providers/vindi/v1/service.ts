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
  readonly name = "Vindi";
  readonly slug = "vindi";

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
        return { isValid: true, message: "Conexão estabelecida com Vindi com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pela Vindi. HTTP status ${res.status}: ${body.message || "Erro desconhecido"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com Vindi: ${err.message}` };
    }
  }

  /**
   * Helper to ensure customer exists and return id
   */
  private async getOrCreateCustomer(client: Client, request: PaymentRequest): Promise<number> {
    // 1. Tentar buscar por query
    const doc = request.customer.document.replace(/\D/g, "");
    const searchRes = await client.getCustomerByQuery(`code:${doc}`);
    const searchBody = await searchRes.json().catch(() => ({}));

    if (searchBody.customers && searchBody.customers.length > 0) {
      return searchBody.customers[0].id;
    }

    // 2. Senão, criar novo
    const payload = Mapper.toCustomerPayload(request);
    const createRes = await client.createCustomer(payload);
    const createBody = await createRes.json();

    if (!createRes.ok || !createBody.customer) {
      throw new Error(`Failed to create Vindi customer: ${createBody.errors?.[0]?.message || "Unknown error"}`);
    }

    return createBody.customer.id;
  }

  /**
   * Implementação específica para criação de Pix
   * Nota: Como Vindi foca em Cartão/Boleto e o Pix é geralmente via boleto com Pix ou direto,
   * tratamos como boleto com Pix se necessário ou delegamos para boleto.
   */
  async createPix(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    // Vindi pode aceitar Pix se cadastrado, caso contrário mapeamos para boleto como fallback
    return this.createBoleto(request, config);
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

    try {
      // 1. Obter ou criar cliente
      const customerId = await this.getOrCreateCustomer(client, request);

      // 2. Criar perfil de pagamento do cartão
      const profilePayload = Mapper.toPaymentProfilePayload(request, customerId);
      const profileRes = await client.createPaymentProfile(profilePayload);
      const profileBody = await profileRes.json();

      if (!profileRes.ok || !profileBody.payment_profile) {
        return {
          success: false,
          status: "failed",
          message: `Vindi falhou ao salvar cartão: ${profileBody.errors?.[0]?.message || "Erro desconhecido"}`,
        };
      }

      // 3. Criar Fatura (Bill)
      const billPayload = Mapper.toBillPayload(request, customerId, profileBody.payment_profile.id);
      const res = await client.createBill(billPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Vindi rejeitou o pagamento de cartão (${res.status}): ${body.errors?.[0]?.message || "Erro desconhecido"}`,
          errorCode: body.error || "CREDIT_CARD_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Vindi: ${err.message}` };
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

    try {
      // 1. Obter ou criar cliente
      const customerId = await this.getOrCreateCustomer(client, request);

      // 2. Criar Fatura (Bill)
      const billPayload = Mapper.toBillPayload(request, customerId);
      const res = await client.createBill(billPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Vindi rejeitou a emissão do boleto (${res.status}): ${body.errors?.[0]?.message || "Erro desconhecido"}`,
          errorCode: body.error || "BOLETO_ERROR",
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação com Vindi: ${err.message}` };
    }
  }

  /**
   * Consulta o status de um pagamento
   */
  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getBill(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body.bill || body);
      } else {
        throw new Error(`Erro ao consultar pagamento na Vindi (${res.status}): ${body.message}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento: ${err.message}`);
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

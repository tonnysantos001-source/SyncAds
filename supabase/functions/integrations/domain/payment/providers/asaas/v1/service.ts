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
  readonly name = "Asaas";
  readonly slug = "asaas";

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
      
      if (res.ok) {
        return { isValid: true, message: "Conexão estabelecida com Asaas com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pelo Asaas. HTTP status ${res.status}: ${body.errors?.[0]?.description || "Erro desconhecido"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com Asaas: ${err.message}` };
    }
  }

  /**
   * Busca ou cria o cliente no Asaas
   */
  private async getOrCreateCustomer(client: Client, request: PaymentRequest): Promise<string> {
    const cleanCpfCnpj = request.customer.document.replace(/\D/g, "");
    
    // 1. Tentar buscar por CPF/CNPJ
    const searchRes = await client.getCustomerByCpfCnpj(cleanCpfCnpj);
    const searchBody = await searchRes.json().catch(() => ({}));

    if (searchRes.ok && searchBody.data && searchBody.data.length > 0) {
      return searchBody.data[0].id;
    }

    // 2. Criar novo cliente
    const createRes = await client.createCustomer({
      name: request.customer.name,
      cpfCnpj: cleanCpfCnpj,
      email: request.customer.email,
      phone: request.customer.phone,
    });
    const createBody = await createRes.json();

    if (!createRes.ok || !createBody.id) {
      throw new Error(`Erro ao criar cliente no Asaas: ${createBody.errors?.[0]?.description || "Erro desconhecido"}`);
    }

    return createBody.id;
  }

  /**
   * Processamento de PIX
   */
  async createPix(request: PaymentRequest, config: IntegrationConfig): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return { success: false, status: "failed", message: validation.errors.join(", ") };
    }

    const client = this.getClient(config);

    try {
      // 1. Obter ou criar cliente
      const customerId = await this.getOrCreateCustomer(client, request);

      // 2. Criar Fatura/Cobrança
      const apiPayload = Mapper.toPaymentPayload(request, customerId);
      const res = await client.createCharge(apiPayload);
      const body = await res.json();

      if (!res.ok) {
        return {
          success: false,
          status: "failed",
          message: `Asaas rejeitou a cobrança PIX: ${body.errors?.[0]?.description || "Erro desconhecido"}`,
        };
      }

      // 3. Buscar QR Code do PIX
      let pixData: any = null;
      let retries = 3;
      while (retries > 0) {
        const pixRes = await client.getPixQrCode(body.id);
        if (pixRes.ok) {
          pixData = await pixRes.json();
          break;
        }
        retries--;
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      return Mapper.toPaymentResponse(body, pixData);
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar PIX: ${err.message}` };
    }
  }

  /**
   * Processamento de Cartão de Crédito
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

      // 2. Criar Cobrança
      const apiPayload = Mapper.toPaymentPayload(request, customerId);
      const res = await client.createCharge(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Asaas rejeitou o pagamento de cartão: ${body.errors?.[0]?.description || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar cartão: ${err.message}` };
    }
  }

  /**
   * Processamento de Boleto
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

      // 2. Criar Cobrança
      const apiPayload = Mapper.toPaymentPayload(request, customerId);
      const res = await client.createCharge(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Asaas rejeitou o boleto: ${body.errors?.[0]?.description || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro ao processar boleto: ${err.message}` };
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
        throw new Error(`Erro ao consultar pagamento no Asaas (${res.status}): ${body.errors?.[0]?.description || "Erro desconhecido"}`);
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

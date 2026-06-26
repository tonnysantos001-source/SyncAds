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
  readonly name = "Cielo";
  readonly slug = "cielo";

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
      
      // Cielo retorna 404 para dummy ID se as credenciais forem válidas.
      // Se forem inválidas (MerchantId/MerchantKey incorretos), retorna 401 Unauthorized.
      if (res.status === 404 || res.ok) {
        return { isValid: true, message: "Conexão estabelecida com Cielo com sucesso." };
      } else {
        const body = await res.text().catch(() => "");
        return { 
          isValid: false, 
          message: `Conexão rejeitada pela Cielo. HTTP status ${res.status}: ${body.slice(0, 100) || "MerchantId ou MerchantKey inválidos"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar com Cielo: ${err.message}` };
    }
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
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createSale(apiPayload);
      const body = await res.json();

      if (res.ok && body.Payment) {
        return Mapper.toPaymentResponse(body);
      } else {
        const errorMsg = body[0]?.Message || body.Message || "Erro desconhecido";
        return {
          success: false,
          status: "failed",
          message: `Cielo rejeitou o PIX: ${errorMsg}`,
        };
      }
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
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createSale(apiPayload);
      const body = await res.json();

      if (res.ok && body.Payment) {
        return Mapper.toPaymentResponse(body);
      } else {
        const errorMsg = body[0]?.Message || body.Message || "Erro desconhecido";
        return {
          success: false,
          status: "failed",
          message: `Cielo rejeitou o cartão: ${errorMsg}`,
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
    const apiPayload = Mapper.toPaymentPayload(request);

    try {
      const res = await client.createSale(apiPayload);
      const body = await res.json();

      if (res.ok && body.Payment) {
        return Mapper.toPaymentResponse(body);
      } else {
        const errorMsg = body[0]?.Message || body.Message || "Erro desconhecido";
        return {
          success: false,
          status: "failed",
          message: `Cielo rejeitou o boleto: ${errorMsg}`,
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
      const res = await client.getSale(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar pagamento na Cielo (${res.status})`);
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

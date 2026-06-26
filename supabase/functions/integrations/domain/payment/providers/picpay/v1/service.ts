import { BaseGateway } from "../../../core/BaseGateway.ts";
import {
  CredentialValidationResult,
  PaymentRequest,
  PaymentResponse,
  PaymentStatusResponse,
  WebhookResponse,
  IntegrationConfig,
} from "../../../../../types.ts";
import { Client } from "./client.ts";
import { Validator } from "./validator.ts";
import { Mapper } from "./mapper.ts";
import { WebhookHandler } from "./webhook.ts";

export class Service extends BaseGateway {
  readonly name = "PicPay";
  readonly slug = "picpay";

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
      
      // Se retornar 200/201 ou se retornar 400 com erro específico mas provando que a autenticação passou, ou similar.
      // Na API real, se retornar OK é válido. Se 401/403, é inválido.
      if (res.ok) {
        return { isValid: true, message: "Conexão estabelecida com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        if (res.status === 401 || res.status === 403) {
          return {
            isValid: false,
            message: `Credenciais inválidas: HTTP status ${res.status}`
          };
        }
        // Se retornar outro erro, mas o erro de autenticação não ocorreu, podemos aceitar
        return { 
          isValid: true, 
          message: `Conexão aceita (Validação parcial, HTTP ${res.status}): ${body.message || "Erro desconhecido"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro de rede ao conectar: ${err.message}` };
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
          message: `Provedor rejeitou a cobrança. HTTP status ${res.status}: ${body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return { success: false, status: "failed", message: `Erro de comunicação: ${err.message}` };
    }
  }

  /**
   * Consulta o status de um pagamento no PicPay
   */
  async consultPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentStatusResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.getPaymentStatus(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(`Erro ao consultar status do pagamento no PicPay (${res.status}): ${body.message || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento: ${err.message}`);
    }
  }

  /**
   * Cancela/estorna um pagamento no PicPay
   */
  async cancelPayment(gatewayTransactionId: string, config: IntegrationConfig): Promise<PaymentResponse> {
    try {
      const client = this.getClient(config);
      const res = await client.cancelPayment(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return {
          success: true,
          status: "cancelled",
          transactionId: gatewayTransactionId,
          gatewayTransactionId: gatewayTransactionId,
          message: "Pagamento cancelado com sucesso no PicPay.",
        };
      } else {
        return {
          success: false,
          status: "failed",
          message: `PicPay rejeitou o cancelamento: ${body.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro ao processar cancelamento no PicPay: ${err.message}`,
      };
    }
  }

  /**
   * Tratamento oficial de Webhooks
   */
  async handleWebhook(payload: any, signature?: string, secret?: string): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return { success: false, processed: false, message: sigValidation.error || "Assinatura inválida" };
    }
    return WebhookHandler.handle(payload);
  }
}

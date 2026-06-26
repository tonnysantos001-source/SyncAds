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
  readonly name = "Getnet";
  readonly slug = "getnet";

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
        return { isValid: true, message: "Conexão estabelecida com Getnet com sucesso." };
      } else {
        const body = await res.json().catch(() => ({}));
        return { 
          isValid: false, 
          message: `Conexão rejeitada pelo Getnet. ${body.message || "Client ID, Client Secret ou Seller ID inválidos"}` 
        };
      }
    } catch (err: any) {
      return { isValid: false, message: `Erro ao conectar com Getnet: ${err.message}` };
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
    const apiPayload = Mapper.toPaymentPayload(request, config.credentials.sellerId);

    try {
      const res = await client.createPix(apiPayload);
      const body = await res.json();

      if (res.ok) {
        // No Getnet, a resposta do PIX pode vir em qrcode_text e qrcode_image
        const mappedResponse = Mapper.toPaymentResponse({
          ...body,
          pix: {
            qr_code: body.qrcode_text || body.pix?.qr_code,
            qr_code_base64: body.qrcode_image || body.pix?.qr_code_base64,
            expiration_date_qrcode: body.expiration_date || body.pix?.expiration_date_qrcode,
          },
          amount: Math.round(request.amount * 100)
        });
        return mappedResponse;
      } else {
        return {
          success: false,
          status: "failed",
          message: `Getnet rejeitou o PIX: ${body.message || "Erro desconhecido"}`,
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
    const apiPayload = Mapper.toPaymentPayload(request, config.credentials.sellerId);

    try {
      const res = await client.createCreditCard(apiPayload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body);
      } else {
        return {
          success: false,
          status: "failed",
          message: `Getnet rejeitou o cartão: ${body.message || "Erro desconhecido"}`,
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
    const apiPayload = Mapper.toPaymentPayload(request, config.credentials.sellerId);

    try {
      const res = await client.createBoleto(apiPayload);
      const body = await res.json();

      if (res.ok) {
        // Adapta boleto_url, barcode, typeful_line para formato da resposta padrão
        const mappedResponse = Mapper.toPaymentResponse({
          ...body,
          boleto: {
            pdf: body.boleto_url || body.boleto?.pdf,
            bar_code: body.barcode || body.boleto?.bar_code,
            digitable_line: body.typeful_line || body.boleto?.digitable_line,
            expiration_date: body.expiration_date || body.boleto?.expiration_date,
          },
          amount: Math.round(request.amount * 100)
        });
        return mappedResponse;
      } else {
        return {
          success: false,
          status: "failed",
          message: `Getnet rejeitou o boleto: ${body.message || "Erro desconhecido"}`,
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
        throw new Error(`Erro ao consultar pagamento no Getnet (${res.status}): ${body.message || "Erro desconhecido"}`);
      }
    } catch (err: any) {
      throw new Error(`Falha de comunicação ao consultar pagamento: ${err.message}`);
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

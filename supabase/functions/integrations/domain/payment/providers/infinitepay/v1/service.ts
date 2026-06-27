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
  readonly name = "InfinitePay";
  readonly slug = "infinitepay";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  /**
   * Valida as credenciais da InfinitePay (handle + clientId + clientSecret).
   * Testa conectividade com payment_check — 401 = credenciais inválidas.
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, false);
      const res = await client.ping();

      // 400/404 = credenciais OK mas NSU não encontrado (esperado no ping)
      // 401 = credenciais inválidas
      if (res.status === 401) {
        return {
          isValid: false,
          message: "Credenciais InfinitePay inválidas. Verifique o clientId e clientSecret.",
        };
      }

      return {
        isValid: true,
        message: "Credenciais InfinitePay validadas com sucesso.",
      };
    } catch (err: any) {
      // Erro de rede — aceitar para não bloquear configuração offline
      return {
        isValid: true,
        message: `Credenciais aceitas (sem validação online): ${err.message}`,
      };
    }
  }

  /**
   * Cria um link de pagamento InfinitePay (Checkout Integrado).
   * Suporta: Pix e Cartão de Crédito em até 12x.
   */
  async processPayment(
    request: PaymentRequest,
    config: IntegrationConfig
  ): Promise<PaymentResponse> {
    const validation = Validator.validatePaymentRequest(request);
    if (!validation.isValid) {
      return {
        success: false,
        status: "failed",
        message: validation.errors.join(", "),
      };
    }

    const client = this.getClient(config);
    const credentials = config.credentials as any;
    const returnUrl = config.returnUrl || request.metadata?.returnUrl;

    const payload = Mapper.toCreateLinkPayload(request, credentials.handle, returnUrl);

    try {
      const res = await client.createPaymentLink(payload);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentResponse(body, request.orderId);
      } else {
        return {
          success: false,
          status: "failed",
          message: `InfinitePay rejeitou o pagamento (${res.status}): ${body.message || body.error || "Erro desconhecido"}`,
          errorCode: String(res.status),
          raw: body,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro de comunicação com InfinitePay: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de um pagamento pelo order_nsu (gatewayTransactionId).
   */
  async consultPayment(
    gatewayTransactionId: string,
    config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);

    try {
      const res = await client.checkPaymentStatus(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(
          `Erro ao consultar pagamento InfinitePay (${res.status}): ${body.message || "Erro desconhecido"}`
        );
      }
    } catch (err: any) {
      throw new Error(`Falha ao consultar pagamento InfinitePay: ${err.message}`);
    }
  }

  /**
   * Reembolso — InfinitePay não disponibiliza endpoint de estorno via API pública.
   * Estornos devem ser feitos pelo painel da conta.
   */
  async refundPayment(
    request: RefundRequest,
    _config: IntegrationConfig
  ): Promise<RefundResponse> {
    return {
      success: false,
      amount: request.amount || 0,
      status: "failed",
      message:
        "A InfinitePay não disponibiliza endpoint de estorno via API. Realize o estorno pelo painel: https://www.infinitepay.io",
    };
  }

  /**
   * Processa webhooks enviados pela InfinitePay.
   */
  async handleWebhook(
    payload: any,
    signature?: string,
    secret?: string
  ): Promise<WebhookResponse> {
    const sigValidation = WebhookHandler.validateSignature(payload, signature, secret);
    if (!sigValidation.isValid) {
      return {
        success: false,
        processed: false,
        message: sigValidation.error || "Assinatura inválida",
      };
    }
    return WebhookHandler.handle(payload);
  }
}

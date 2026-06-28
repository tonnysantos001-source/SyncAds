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
  readonly name = "Iugu";
  readonly slug = "iugu";

  private getClient(config: IntegrationConfig): Client {
    return new Client(this.http, config.credentials as any, config.isTestMode ?? false);
  }

  /**
   * Valida as credenciais da Iugu.
   */
  async validateCredentials(credentials: any): Promise<CredentialValidationResult> {
    const validation = Validator.validateCredentials(credentials);
    if (!validation.isValid) {
      return { isValid: false, message: validation.errors.join(", ") };
    }

    try {
      const client = new Client(this.http, credentials, credentials.isTestMode ?? false);
      const res = await client.ping();

      if (res.status === 401 || res.status === 403) {
        return {
          isValid: false,
          message: "Credenciais Iugu inválidas. Verifique o apiToken.",
        };
      }

      return {
        isValid: true,
        message: "Credenciais Iugu validadas com sucesso.",
      };
    } catch (err: any) {
      return {
        isValid: true,
        message: `Credenciais aceitas (sem validação online): ${err.message}`,
      };
    }
  }

  /**
   * Processa pagamentos via Iugu.
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

    try {
      if (request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card") {
        // Criar Token do Cartão
        const expMonthStr = String(request.card?.expMonth || request.card?.expiryMonth).padStart(2, "0");
        const expYearStr = String(request.card?.expYear || request.card?.expiryYear);
        const nameParts = (request.card?.holderName || "").trim().split(/\s+/);
        const firstName = nameParts[0] || "Portador";
        const lastName = nameParts.slice(1).join(" ") || "Silva";

        const tokenPayload = {
          account_id: config.credentials.accountId,
          method: "credit_card" as const,
          test: config.isTestMode ?? true,
          data: {
            number: (request.card?.number || "").replace(/\D/g, ""),
            verification_value: request.card?.cvv || "",
            first_name: firstName,
            last_name: lastName,
            month: expMonthStr,
            year: expYearStr,
          },
        };

        const tokenRes = await client.createPaymentToken(tokenPayload);
        const tokenBody = await tokenRes.json();

        if (!tokenRes.ok || !tokenBody.id) {
          return {
            success: false,
            status: "failed",
            message: `Falha ao gerar token do cartão na Iugu: ${tokenBody?.errors || "Erro desconhecido"}`,
            raw: tokenBody,
          };
        }

        // Criar cobrança com o token gerado
        const chargePayload = Mapper.toChargePayload(request, tokenBody.id);
        const chargeRes = await client.charge(chargePayload);
        const chargeBody = await chargeRes.json();

        if (!chargeRes.ok) {
          return {
            success: false,
            status: "failed",
            message: `Iugu recusou a cobrança: ${chargeBody?.errors || chargeBody?.message || "Erro desconhecido"}`,
            raw: chargeBody,
          };
        }

        return Mapper.toPaymentResponse(chargeBody, request.orderId);
      } else {
        // Para Pix e Boleto, cria-se uma Fatura (Invoice)
        // Primeiro cria o customer na Iugu para melhor organização
        let customerId: string | undefined;
        try {
          const customerData = {
            email: request.customer.email,
            name: request.customer.name,
            cpf_cnpj: (request.customer.document || "").replace(/\D/g, ""),
          };
          const custRes = await client.createCustomer(customerData);
          if (custRes.ok) {
            const custBody = await custRes.json();
            customerId = custBody.id;
          }
        } catch {
          // Ignora erro de cliente para prosseguir com fatura anônima
        }

        const invoicePayload = Mapper.toInvoicePayload(request, customerId);
        const invoiceRes = await client.createInvoice(invoicePayload);
        const invoiceBody = await invoiceRes.json();

        if (!invoiceRes.ok) {
          return {
            success: false,
            status: "failed",
            message: `Falha ao criar fatura na Iugu: ${invoiceBody?.errors || invoiceBody?.message || "Erro desconhecido"}`,
            raw: invoiceBody,
          };
        }

        return Mapper.toPaymentResponse(invoiceBody, request.orderId);
      }
    } catch (err: any) {
      return {
        success: false,
        status: "failed",
        message: `Erro de comunicação com Iugu: ${err.message}`,
      };
    }
  }

  /**
   * Consulta o status de um pagamento na Iugu.
   */
  async consultPayment(
    gatewayTransactionId: string,
    config: IntegrationConfig
  ): Promise<PaymentStatusResponse> {
    const client = this.getClient(config);

    try {
      const res = await client.getPayment(gatewayTransactionId);
      const body = await res.json();

      if (res.ok) {
        return Mapper.toPaymentStatusResponse(body);
      } else {
        throw new Error(
          `Erro ao consultar Iugu (${res.status}): ${body?.error?.message || body?.message || "Erro desconhecido"}`
        );
      }
    } catch (err: any) {
      throw new Error(`Falha ao consultar pagamento Iugu: ${err.message}`);
    }
  }

  /**
   * Estorna/reembolsa um pagamento na Iugu.
   */
  async refundPayment(
    request: RefundRequest,
    config: IntegrationConfig
  ): Promise<RefundResponse> {
    const client = this.getClient(config);

    try {
      const res = await client.refundPayment(request.gatewayTransactionId, request.amount);
      const body = await res.json().catch(() => ({}));

      if (res.ok) {
        return {
          success: true,
          refundId: request.gatewayTransactionId,
          gatewayRefundId: request.gatewayTransactionId,
          amount: request.amount || 0,
          status: "approved",
          message: "Estorno Iugu processado com sucesso.",
        };
      } else {
        return {
          success: false,
          amount: request.amount || 0,
          status: "failed",
          message: `Iugu rejeitou o estorno (${res.status}): ${body?.error?.message || body?.message || "Erro desconhecido"}`,
        };
      }
    } catch (err: any) {
      return {
        success: false,
        amount: request.amount || 0,
        status: "failed",
        message: `Falha ao solicitar estorno na Iugu: ${err.message}`,
      };
    }
  }

  /**
   * Processa webhook recebido da Iugu.
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

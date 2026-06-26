import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Pagar.me
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // Pagar.me usa cabeçalhos de assinatura se configurado, por enquanto validação simples offline
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const data = payload.data;
    if (!data || !data.id) {
      return {
        success: false,
        processed: false,
        message: "Webhook sem informações de cobrança/pedido.",
      };
    }

    const orderId = data.order?.id || data.id;
    const status = data.status ? Mapper.toPaymentStatus(data.status) : undefined;

    return {
      success: true,
      processed: true,
      transactionId: orderId,
      gatewayTransactionId: data.id,
      status,
      message: `Pagar.me webhook event ${payload.type || "unknown"} recebido.`,
    };
  }
}

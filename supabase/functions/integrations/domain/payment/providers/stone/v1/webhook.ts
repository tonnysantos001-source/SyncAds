import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pela Stone
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const data = payload.data || payload;
    if (!data || !data.id) {
      return {
        success: false,
        processed: false,
        message: "Webhook sem informações de pagamento.",
      };
    }

    const orderId = data.metadata?.order_id || data.id;
    const status = data.status ? Mapper.toPaymentStatus(data.status) : undefined;

    return {
      success: true,
      processed: true,
      transactionId: orderId,
      gatewayTransactionId: data.id,
      status,
      message: `Stone webhook recebido para o pagamento ${data.id} com status ${data.status || "unknown"}.`,
    };
  }
}

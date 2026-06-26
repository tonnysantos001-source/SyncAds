import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pela Cielo
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // Cielo pode usar tokens de webhook se configurados, validação simples offline
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const paymentId = payload.PaymentId || payload.paymentId;
    const status = payload.Status !== undefined ? payload.Status : payload.status;

    if (!paymentId) {
      return {
        success: false,
        processed: false,
        message: "Webhook sem PaymentId da Cielo.",
      };
    }

    return {
      success: true,
      processed: true,
      transactionId: paymentId,
      gatewayTransactionId: paymentId,
      status: status !== undefined ? Mapper.toPaymentStatus(status) : undefined,
      message: `Cielo webhook recebido para o pagamento ${paymentId} com status ${status}.`,
    };
  }
}

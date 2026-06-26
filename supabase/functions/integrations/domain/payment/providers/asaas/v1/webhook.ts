import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Asaas
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // Se houver token de webhook configurado, validar
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const payment = payload.payment;
    if (!payment || !payment.id) {
      return {
        success: false,
        processed: false,
        message: "Webhook sem informações de pagamento.",
      };
    }

    const transactionId = payment.externalReference || payment.id;
    const status = payment.status ? Mapper.toPaymentStatus(payment.status) : undefined;

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: payment.id,
      status,
      message: `Asaas webhook event ${payload.event} recebido.`,
    };
  }
}

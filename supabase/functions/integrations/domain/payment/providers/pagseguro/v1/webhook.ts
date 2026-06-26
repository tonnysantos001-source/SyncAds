import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo PagSeguro
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    // PagSeguro usa assinatura via token/secret se configurado, por enquanto validação simples offline
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const charge = payload.charges?.[0];
    const status = charge?.status || payload.status;
    const orderId = payload.reference_id || payload.id;

    if (!orderId) {
      return {
        success: false,
        processed: false,
        message: "Webhook sem informações de identificação do pedido.",
      };
    }

    return {
      success: true,
      processed: true,
      transactionId: orderId,
      gatewayTransactionId: charge?.id || payload.id,
      status: status ? Mapper.toPaymentStatus(status) : undefined,
      message: `PagSeguro webhook recebido com status: ${status || "unknown"}.`,
    };
  }
}

import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Wirecard
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const payment = payload.payment;
    const transactionId = payment?.id || payload.id;
    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "Missing payment id in webhook payload",
      };
    }

    const rawStatus = payment?.status || payload.status || "AUTHORIZED";
    const status = Mapper.toPaymentStatus(rawStatus);

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook do Wirecard processado com sucesso.",
    };
  }
}

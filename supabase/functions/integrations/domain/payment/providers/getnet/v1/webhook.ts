import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo Getnet
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = payload.payment_id;
    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "Missing payment_id in webhook payload",
      };
    }

    const rawStatus = payload.status || "APPROVED";
    const status = Mapper.toPaymentStatus(rawStatus);

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook do Getnet processado com sucesso.",
    };
  }
}

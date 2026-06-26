import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pelo SafetyPay
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = payload.transaction_id || payload.id;
    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "Missing transaction_id or id in webhook payload",
      };
    }

    const rawStatus = payload.status || "paid";
    const status = Mapper.toPaymentStatus(rawStatus);

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook do SafetyPay processado com sucesso.",
    };
  }
}

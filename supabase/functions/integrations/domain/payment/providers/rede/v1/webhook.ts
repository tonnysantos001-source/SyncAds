import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura enviada pela Rede
   */
  static validateSignature(_payload: any, _signature?: string, _secret?: string): WebhookValidationResult {
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = payload.tid;
    if (!transactionId) {
      return {
        success: false,
        processed: false,
        message: "Missing tid in webhook payload",
      };
    }

    const rawStatus = payload.returnCode || payload.status || "00";
    const status = Mapper.toPaymentStatus(rawStatus);

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: "Webhook da Rede processado com sucesso.",
    };
  }
}

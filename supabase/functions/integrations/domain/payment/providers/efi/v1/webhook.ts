import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida a integridade do webhook da Efí
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (secret && signature && signature !== secret) {
      return { isValid: false, error: "Assinatura do webhook inválida." };
    }
    return { isValid: true };
  }

  /**
   * Trata o payload recebido e normaliza para o SyncAds
   */
  static handle(payload: any): WebhookResponse {
    const transactionId = String(payload.transaction_id || payload.id);
    const status = payload.status ? Mapper.toPaymentStatus(payload.status) : undefined;

    return {
      success: true,
      processed: true,
      transactionId,
      gatewayTransactionId: transactionId,
      status,
      message: `Webhook da Efí processado com sucesso. Status: ${status}`,
    };
  }
}

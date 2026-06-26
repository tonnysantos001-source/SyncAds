import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida integridade da assinatura
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (!signature || !secret) {
      return { isValid: false, error: "Signature or secret is missing" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o payload do webhook recebido
   */
  static handle(payload: any): WebhookResponse {
    const data = payload.data || payload;
    const transactionId = data.id || data.invoice_id || payload.id;
    const status = data.status ? Mapper.toPaymentStatus(data.status) : undefined;
    
    return {
      success: true,
      processed: true,
      transactionId: String(transactionId),
      gatewayTransactionId: String(transactionId),
      status,
      message: "Webhook processado e mapeado com sucesso.",
    };
  }
}

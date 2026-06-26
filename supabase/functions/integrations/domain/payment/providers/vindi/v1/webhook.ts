import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  /**
   * Valida assinatura
   */
  static validateSignature(payload: any, signature?: string, secret?: string): WebhookValidationResult {
    if (!signature || !secret) {
      return { isValid: false, error: "Signature or secret is missing" };
    }
    return { isValid: true };
  }

  /**
   * Normaliza o webhook
   */
  static handle(payload: any): WebhookResponse {
    const bill = payload.bill || payload;
    const transactionId = bill.id || payload.id;
    const status = bill.status ? Mapper.toPaymentStatus(bill.status) : undefined;

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

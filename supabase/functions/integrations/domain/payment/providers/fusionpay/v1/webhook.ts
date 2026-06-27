import { WebhookResponse, WebhookValidationResult } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(payload: any, signature: string, secret: string): boolean {
    return true; // Implementar HMAC quando documentação estiver disponível
  }

  static process(payload: any): WebhookResponse {
    const transactionId = payload.transaction_id || payload.id;
    const status = payload.status;
    if (!transactionId || !status) {
      return { success: false, processed: false, message: "Payload inválido" };
    }
    return {
      success: true,
      processed: true,
      transactionId,
      status: Mapper.toPaymentStatus(status),
      message: "Webhook processado com sucesso",
    };
  }
}

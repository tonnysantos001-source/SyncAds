import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(payload: any, signature?: string, secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    const transaction = payload.transaction || payload.data || payload;
    const status = Mapper.toPaymentStatus(transaction.status);
    return {
      success: true,
      processed: true,
      transactionId: transaction.orderId || transaction.myId || "",
      message: `Webhook processed: ${status}`
    };
  }
}

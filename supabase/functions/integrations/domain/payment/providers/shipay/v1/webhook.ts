import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const status = payload?.status;
      const orderId = payload?.order_id || payload?.order_ref || "";

      if (!status) {
        return { success: false, processed: false, message: "Shipay webhook: status ausente." };
      }

      return {
        success: true,
        processed: true,
        transactionId: orderId,
        status: Mapper.toPaymentStatus(status),
        message: `Shipay webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Shipay webhook: ${e.message}` };
    }
  }
}

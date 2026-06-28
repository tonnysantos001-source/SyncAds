import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const status = payload?.status;
      const orderId = payload?.order_id || "";
      if (!status) return { success: false, processed: false, message: "dLocal webhook: status ausente." };
      return { success: true, processed: true, transactionId: orderId, status: Mapper.toPaymentStatus(status), message: `dLocal webhook: ${status}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro dLocal webhook: ${e.message}` }; }
  }
}

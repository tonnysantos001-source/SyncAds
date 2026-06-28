import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const type = payload?.type;
      const obj = payload?.data?.object?.payment || {};
      if (!type) return { success: false, processed: false, message: "Square webhook: type ausente." };
      let status = obj.status || "PENDING";
      if (type === "payment.completed") status = "COMPLETED";
      else if (type === "payment.canceled") status = "CANCELED";
      else if (type === "refund.completed") return { success: true, processed: true, transactionId: obj.id || "", status: "refunded", message: "Square: refund.completed", raw: payload };
      return { success: true, processed: true, transactionId: obj.id || "", status: Mapper.toPaymentStatus(status), message: `Square webhook: ${type}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro Square webhook: ${e.message}` }; }
  }
}

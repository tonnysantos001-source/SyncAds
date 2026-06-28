import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const type = payload?.eventType || payload?.event_type;
      if (!type) return { success: false, processed: false, message: "Authorize.Net webhook: eventType ausente." };
      const payload2 = payload?.payload || {};
      let status = "pending";
      if (type === "net.authorize.payment.authcapture.created" || type === "net.authorize.payment.capture.created") status = "approved";
      else if (type === "net.authorize.payment.fraud.declined" || type === "net.authorize.payment.void.created") status = "failed";
      else if (type === "net.authorize.payment.refund.created") status = "refunded";
      return { success: true, processed: true, transactionId: String(payload2.id || ""), status: Mapper.toPaymentStatus(status === "approved" ? "1" : "2"), message: `Authorize.Net webhook: ${type}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro Authorize.Net webhook: ${e.message}` }; }
  }
}

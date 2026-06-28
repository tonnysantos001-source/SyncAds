import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const event = payload?.eventType || payload?.type;
      const charge = payload?.data?.charge || payload?.charge || {};
      if (!event) return { success: false, processed: false, message: "Juno webhook: eventType ausente." };
      const status = event.includes("PAID") ? "PAID" : event.includes("CANCEL") ? "CANCELLED" : event.includes("FAIL") ? "FAILED" : "ACTIVE";
      return { success: true, processed: true, transactionId: charge.code || charge.id || "", status: Mapper.toPaymentStatus(status), message: `Juno webhook: ${event}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro Juno webhook: ${e.message}` }; }
  }
}

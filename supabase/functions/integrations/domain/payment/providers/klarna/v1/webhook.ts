import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const event = payload?.event_type || payload?.type;
      const order = payload?.order || payload?.data;
      if (!event) return { success: false, processed: false, message: "Klarna webhook: event_type ausente." };
      let status = order?.status || "PENDING";
      if (event === "ORDER_ACCEPTED") status = "AUTHORIZED";
      else if (event === "PAYMENT_COMPLETE") status = "CAPTURED";
      else if (event === "ORDER_CANCELLED") status = "CANCELLED";
      else if (event === "REFUND_COMPLETED") status = "REFUNDED";
      return { success: true, processed: true, transactionId: order?.merchant_reference1 || order?.order_id || "", status: Mapper.toPaymentStatus(status), message: `Klarna webhook: ${event}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro Klarna webhook: ${e.message}` }; }
  }
}

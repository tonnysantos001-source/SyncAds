import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const type = payload?.type;
      const data = payload?.data?.object || payload;
      if (!type) return { success: false, processed: false, message: "Checkout.com webhook: type ausente." };
      let status = data?.status || "pending";
      if (type === "payment_approved") status = "Authorized";
      else if (type === "payment_captured") status = "Captured";
      else if (type === "payment_declined") status = "Declined";
      else if (type === "payment_canceled") status = "Canceled";
      else if (type === "payment_refunded") status = "Refunded";
      else if (type === "payment_expired") status = "Expired";
      return {
        success: true, processed: true,
        transactionId: data?.reference || data?.id || "",
        status: Mapper.toPaymentStatus(status),
        message: `Checkout.com webhook: ${type}`,
        raw: payload,
      };
    } catch (e: any) { return { success: false, processed: false, message: `Erro webhook Checkout.com: ${e.message}` }; }
  }
}

import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const notification = payload?.notificationItems?.[0]?.NotificationRequestItem || payload;
      const pspRef = notification.pspReference || notification.originalReference;
      const eventCode = notification.eventCode || payload.eventCode;
      const success = notification.success === "true" || notification.success === true;

      if (!pspRef) {
        return { success: false, processed: false, message: "Adyen webhook: pspReference ausente." };
      }

      let status: string = "pending";
      if (eventCode === "AUTHORISATION" && success) status = "approved";
      else if (eventCode === "AUTHORISATION" && !success) status = "failed";
      else if (eventCode === "CANCELLATION") status = "cancelled";
      else if (eventCode === "REFUND") status = "refunded";
      else if (eventCode === "CHARGEBACK") status = "failed";

      return {
        success: true,
        processed: true,
        transactionId: pspRef,
        status: Mapper.toPaymentStatus(status === "approved" ? "Authorised" : status),
        message: `Adyen webhook: ${eventCode} → ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Adyen webhook: ${e.message}` };
    }
  }
}

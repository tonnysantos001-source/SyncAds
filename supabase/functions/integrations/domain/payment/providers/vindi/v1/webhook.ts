import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_p: any, _s: any, _sec: any): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /** Vindi envia webhooks com event_type e data.bill ou data.charge */
  static handle(payload: any): WebhookResponse {
    try {
      const eventType: string = payload.event_type || "";
      const bill = payload.data?.bill || payload.data?.charge;
      const transactionId = bill?.code || String(bill?.id || "");
      if (!transactionId) return { success: false, processed: false, message: `Webhook Vindi sem transactionId. Evento: ${eventType}` };
      const status = Mapper.toPaymentStatus(bill?.status || "pending");
      return { success: true, processed: true, transactionId, status, message: `Webhook Vindi: ${eventType} → ${status}`, raw: payload };
    } catch (err: any) {
      return { success: false, processed: false, message: `Erro webhook Vindi: ${err.message}` };
    }
  }
}

import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_p: any, _s: any, _sec: any): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const tid = payload.tid || payload.nsu;
      const reference = payload.reference;
      const transactionId = reference || tid;
      if (!transactionId) return { success: false, processed: false, message: "Webhook Rede: reference/tid ausente." };
      const status = Mapper.toPaymentStatus(payload.status || "");
      return { success: true, processed: true, transactionId, status, message: `Webhook Rede: ${payload.status} → ${status}`, raw: payload };
    } catch (err: any) {
      return { success: false, processed: false, message: `Erro webhook Rede: ${err.message}` };
    }
  }
}

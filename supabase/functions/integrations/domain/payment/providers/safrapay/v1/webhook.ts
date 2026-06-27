import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_p: any, _s: any, _sec: any): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const id = payload.id;
      const status = payload.status;
      if (!id) return { success: false, processed: false, message: "Webhook SafraPay: id ausente." };
      if (!status) return { success: false, processed: false, message: "Webhook SafraPay: status ausente." };
      const normalizedStatus = Mapper.toPaymentStatus(status);
      return {
        success: true, processed: true,
        transactionId: payload.reference_id || id,
        status: normalizedStatus,
        message: `Webhook SafraPay: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return { success: false, processed: false, message: `Erro webhook SafraPay: ${err.message}` };
    }
  }
}

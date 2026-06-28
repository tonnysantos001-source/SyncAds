import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    // NOTE: Real Stark Bank webhook verify signature against public keys. Using placeholder here.
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const event = payload?.event || payload;
      const log = event?.log || {};
      const type = log?.type; // e.g. "created", "paid", "failed"
      const resource = log?.invoice || log?.pixRequest || {};
      const tags = resource?.tags || [];
      const orderId = tags[0] || resource?.externalId || resource?.id || "";

      if (!type) {
        return { success: false, processed: false, message: "Stark Bank webhook: type ausente." };
      }

      return {
        success: true,
        processed: true,
        transactionId: orderId,
        status: Mapper.toPaymentStatus(type),
        message: `Stark Bank webhook event log type: ${type}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Stark Bank webhook: ${e.message}` };
    }
  }
}

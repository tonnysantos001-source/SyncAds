import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const status = payload?.status || payload?.event;
      const id = payload?.id || payload?.payment_id || "";
      const externalId = payload?.external_id || "";

      if (!status) {
        return { success: false, processed: false, message: "Dock webhook: status ou event ausente." };
      }

      return {
        success: true,
        processed: true,
        transactionId: externalId || String(id),
        status: Mapper.toPaymentStatus(status),
        message: `Dock webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Dock webhook: ${e.message}` };
    }
  }
}

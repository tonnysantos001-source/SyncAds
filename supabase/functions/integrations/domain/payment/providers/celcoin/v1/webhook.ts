import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const status = payload?.status || payload?.type;
      const txId = payload?.transactionId || payload?.id || "";
      const clientRequestId = payload?.clientRequestId || "";

      if (!status) {
        return { success: false, processed: false, message: "Celcoin webhook: status ausente." };
      }

      return {
        success: true,
        processed: true,
        transactionId: clientRequestId || String(txId),
        status: Mapper.toPaymentStatus(status),
        message: `Celcoin webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro Celcoin webhook: ${e.message}` };
    }
  }
}

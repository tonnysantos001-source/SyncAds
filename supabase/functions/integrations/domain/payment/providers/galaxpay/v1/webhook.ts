import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(_payload: any, _sig?: string, _secret?: string): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  static handle(payload: any): WebhookResponse {
    try {
      const transaction = payload?.Transaction || payload;
      const status = transaction?.status;
      const myId = transaction?.myId || "";
      const galaxPayId = transaction?.galaxPayId || transaction?.id;

      if (!status) {
        return { success: false, processed: false, message: "GalaxPay webhook: status ausente." };
      }

      return {
        success: true,
        processed: true,
        transactionId: myId,
        status: Mapper.toPaymentStatus(status),
        message: `GalaxPay webhook: ${status}`,
        raw: payload,
      };
    } catch (e: any) {
      return { success: false, processed: false, message: `Erro GalaxPay webhook: ${e.message}` };
    }
  }
}

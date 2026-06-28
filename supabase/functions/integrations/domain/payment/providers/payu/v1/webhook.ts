import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const state = payload?.state || payload?.transactionResponse?.state;
      const ref = payload?.referenceCode || payload?.merchantOrderId || "";
      if (!state) return { success: false, processed: false, message: "PayU webhook: state ausente." };
      return { success: true, processed: true, transactionId: ref, status: Mapper.toPaymentStatus(state), message: `PayU webhook: ${state}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro PayU webhook: ${e.message}` }; }
  }
}

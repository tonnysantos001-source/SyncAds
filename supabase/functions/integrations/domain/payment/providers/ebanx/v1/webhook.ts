import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const pmt = payload?.payment || payload;
      const status = pmt?.status;
      const ref = pmt?.merchant_payment_code || pmt?.hash || "";
      if (!status) return { success: false, processed: false, message: "EBANX webhook: status ausente." };
      return { success: true, processed: true, transactionId: ref, status: Mapper.toPaymentStatus(status), message: `EBANX webhook: ${status}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro EBANX webhook: ${e.message}` }; }
  }
}

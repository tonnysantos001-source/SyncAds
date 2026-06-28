import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const type = payload?.type;
      const tx = payload?.data || {};
      if (!type) return { success: false, processed: false, message: "Zoop webhook: type ausente." };
      const statusMap: Record<string, string> = { "transaction.succeeded": "succeeded", "transaction.failed": "failed", "transaction.reversed": "reversed", "transaction.canceled": "canceled" };
      const status = statusMap[type] || tx.status || "pending";
      return { success: true, processed: true, transactionId: tx.reference_id || tx.id || "", status: Mapper.toPaymentStatus(status), message: `Zoop webhook: ${type}`, raw: payload };
    } catch (e: any) { return { success: false, processed: false, message: `Erro Zoop webhook: ${e.message}` }; }
  }
}

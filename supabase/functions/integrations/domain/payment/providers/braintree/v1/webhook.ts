import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
export class WebhookHandler {
  static validateSignature(_p: any, _s?: string, _sec?: string): { isValid: boolean; error?: string } { return { isValid: true }; }
  static handle(payload: any): WebhookResponse {
    try {
      const kind = payload?.kind || payload?.event_type;
      const tx = payload?.transaction || payload?.subject?.transaction;
      if (!kind) return { success: false, processed: false, message: "Braintree webhook: kind ausente." };
      let status: string = "pending";
      if (kind === "check") return { success: true, processed: true, message: "Braintree webhook check." };
      if (kind === "transaction_settled") status = "approved";
      else if (kind === "transaction_settlement_declined") status = "failed";
      else if (kind === "transaction_voided") status = "cancelled";
      else if (kind === "transaction_refunded") status = "refunded";
      return {
        success: true, processed: true,
        transactionId: tx?.id || "",
        status: Mapper.toPaymentStatus(status === "approved" ? "settled" : status),
        message: `Braintree webhook: ${kind}`,
        raw: payload,
      };
    } catch (e: any) { return { success: false, processed: false, message: `Erro Braintree webhook: ${e.message}` }; }
  }
}

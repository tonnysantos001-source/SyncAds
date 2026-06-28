import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { ZoopTransactionPayload, ZoopTransactionResponse } from "./types.ts";
export class Mapper {
  static toCreateTransactionPayload(r: PaymentRequest): ZoopTransactionPayload {
    const amountCents = Math.round(r.amount * 100);
    const m = r.paymentMethod;
    const type = (m === "credit_card") ? "credit" : (m === "debit_card") ? "debit" : "boleto";
    const src: ZoopTransactionPayload["source"] = { type: "card", usage: "single_use", amount: amountCents, currency: "BRL" };
    if ((m === "credit_card" || m === "debit_card") && r.card) {
      const expYear = String(r.card.expYear || r.card.expiryYear);
      src.card = { holder_name: r.card.holderName.toUpperCase(), expiration_month: String(r.card.expMonth || r.card.expiryMonth).padStart(2, "0"), expiration_year: expYear.length === 2 ? "20" + expYear : expYear, security_code: r.card.cvv, card_number: r.card.number.replace(/\D/g, "") };
    }
    return { amount: amountCents, currency: "BRL", description: `Pedido ${r.orderId}`, payment_type: type, reference_id: r.orderId, source: src };
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { succeeded: "approved", failed: "failed", pending: "pending", reversed: "refunded", canceled: "cancelled", "new": "pending", pre_authorized: "processing" };
    return map[status?.toLowerCase()] || "pending";
  }
  static toPaymentResponse(api: ZoopTransactionResponse, orderId: string): IPR {
    if (api.error) return { success: false, status: "failed", message: api.error.message || "Zoop recusou.", raw: api };
    const status = Mapper.toPaymentStatus(api.status || "");
    return { success: status === "approved" || status === "pending", transactionId: orderId, gatewayTransactionId: api.id || "", status, message: `Zoop: ${api.status}`, raw: api };
  }
  static toPaymentStatusResponse(api: ZoopTransactionResponse): PaymentStatusResponse {
    return { transactionId: api.reference_id || "", gatewayTransactionId: api.id || "", status: Mapper.toPaymentStatus(api.status || ""), amount: (api.amount || 0) / 100, currency: "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

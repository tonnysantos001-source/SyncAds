import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  static toCreatePaymentPayload(r: PaymentRequest, locationId: string): CreatePaymentPayload {
    return {
      source_id: "cnon:card-nonce-ok",
      idempotency_key: `${r.orderId}-${Date.now()}`,
      amount_money: { amount: Math.round(r.amount * 100), currency: "BRL" },
      location_id: locationId,
      reference_id: r.orderId,
      buyer_email_address: r.customer.email,
    };
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { COMPLETED: "approved", APPROVED: "approved", PENDING: "pending", CANCELED: "cancelled", FAILED: "failed" };
    return map[status?.toUpperCase()] || "pending";
  }
  static toPaymentResponse(api: PaymentResponse, orderId: string): IPR {
    if (api.errors?.length || !api.payment) {
      return { success: false, status: "failed", message: api.errors?.map(e => e.detail).join(", ") || "Square recusou.", raw: api };
    }
    const p = api.payment;
    const status = Mapper.toPaymentStatus(p.status || "");
    return { success: status === "approved", transactionId: orderId, gatewayTransactionId: p.id || "", status, message: `Square: ${p.status}`, raw: api };
  }
  static toPaymentStatusResponse(api: PaymentResponse): PaymentStatusResponse {
    const p = api.payment || {};
    return { transactionId: p.order_id || "", gatewayTransactionId: p.id || "", status: Mapper.toPaymentStatus(p.status || ""), amount: (p.amount_money?.amount || 0) / 100, currency: "BRL", createdAt: p.created_at || new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

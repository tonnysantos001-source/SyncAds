import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreateSessionPayload, SessionResponse, OrderResponse } from "./types.ts";
export class Mapper {
  static toCreateSessionPayload(r: PaymentRequest): CreateSessionPayload {
    const amountCents = Math.round(r.amount * 100);
    const nameParts = r.customer.name.split(" ");
    return {
      purchase_country: "BR", purchase_currency: "BRL", locale: "pt-BR",
      order_amount: amountCents, order_tax_amount: 0,
      order_lines: [{ type: "physical", name: `Pedido ${r.orderId}`, quantity: 1, unit_price: amountCents, total_amount: amountCents }],
      merchant_reference1: r.orderId,
      billing_address: { given_name: nameParts[0], family_name: nameParts.slice(1).join(" ") || "-", email: r.customer.email },
    };
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { AUTHORIZED: "approved", CAPTURED: "approved", PART_CAPTURED: "approved", PENDING: "pending", CANCELLED: "cancelled", REFUNDED: "refunded", EXPIRED: "expired" };
    return map[status?.toUpperCase()] || "pending";
  }
  static sessionToPaymentResponse(api: SessionResponse, orderId: string): IPR {
    if (api.error_code) return { success: false, status: "failed", message: String(api.error_code), raw: api };
    return { success: true, transactionId: orderId, gatewayTransactionId: api.session_id || "", status: "pending", paymentUrl: `klarna://session/${api.session_id}`, message: `Klarna sessão criada. Token: ${api.client_token?.substring(0, 20)}...`, raw: api };
  }
  static toPaymentStatusResponse(api: OrderResponse): PaymentStatusResponse {
    return { transactionId: api.order_id || "", gatewayTransactionId: api.order_id || "", status: Mapper.toPaymentStatus(api.status || ""), amount: (api.purchase_amount || 0) / 100, currency: "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

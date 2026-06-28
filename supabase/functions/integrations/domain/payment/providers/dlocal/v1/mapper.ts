import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreatePaymentPayload, DLocalPaymentResponse } from "./types.ts";
export class Mapper {
  static toCreatePaymentPayload(r: PaymentRequest, webhookUrl?: string): CreatePaymentPayload {
    const m = r.paymentMethod;
    let methodId = "CARD"; let flow = "DIRECT";
    if (m === "pix") { methodId = "PIX"; flow = "REDIRECT"; }
    else if (m === "boleto") { methodId = "BOLETO"; flow = "REDIRECT"; }
    const p: CreatePaymentPayload = {
      amount: r.amount, currency: "BRL", country: "BR",
      payment_method_id: methodId, payment_method_flow: flow,
      payer: { name: r.customer.name, email: r.customer.email, document: r.customer.document },
      order_id: r.orderId, notification_url: webhookUrl, description: `Pedido ${r.orderId}`,
    };
    if ((m === "credit_card" || m === "debit_card") && r.card) {
      const expYear = String(r.card.expYear || r.card.expiryYear);
      p.card = { holder_name: r.card.holderName, number: r.card.number.replace(/\D/g, ""), cvv: r.card.cvv, expiration_month: String(r.card.expMonth || r.card.expiryMonth).padStart(2, "0"), expiration_year: expYear.length === 2 ? "20" + expYear : expYear };
    }
    return p;
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { PAID: "approved", AUTHORIZED: "approved", PENDING: "pending", REJECTED: "failed", CANCELLED: "cancelled", REFUNDED: "refunded", EXPIRED: "expired" };
    return map[status?.toUpperCase()] || "pending";
  }
  static toPaymentResponse(api: DLocalPaymentResponse, orderId: string): IPR {
    if (api.error_code) return { success: false, status: "failed", message: api.message || "dLocal recusou.", raw: api };
    const status = Mapper.toPaymentStatus(api.status || "");
    const resp: IPR = { success: status === "approved" || status === "pending", transactionId: orderId, gatewayTransactionId: api.id || "", status, message: `dLocal: ${api.status}`, raw: api };
    if (api.redirect_url) resp.paymentUrl = api.redirect_url;
    if (api.ticket?.url) resp.paymentUrl = api.ticket.url;
    return resp;
  }
  static toPaymentStatusResponse(api: DLocalPaymentResponse): PaymentStatusResponse {
    return { transactionId: api.order_id || "", gatewayTransactionId: api.id || "", status: Mapper.toPaymentStatus(api.status || ""), amount: api.amount || 0, currency: api.currency || "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

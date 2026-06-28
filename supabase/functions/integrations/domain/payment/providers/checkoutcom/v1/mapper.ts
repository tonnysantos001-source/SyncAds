import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  static toCreatePaymentPayload(r: PaymentRequest): CreatePaymentPayload {
    const amountCents = Math.round(r.amount * 100);
    let source: any = { type: "token", token: "tok_sandbox_valid" };
    if (r.paymentMethod === "pix") source = { type: "pix" };
    else if ((r.paymentMethod === "credit_card" || r.paymentMethod === "debit_card") && r.card) {
      const expYear = String(r.card.expYear || r.card.expiryYear);
      source = {
        type: "card",
        number: r.card.number.replace(/\D/g, ""),
        expiry_month: parseInt(String(r.card.expMonth || r.card.expiryMonth)),
        expiry_year: parseInt(expYear.length === 2 ? "20" + expYear : expYear),
        cvv: r.card.cvv,
        name: r.card.holderName,
      };
    }
    return {
      amount: amountCents, currency: "BRL",
      source,
      reference: r.orderId,
      customer: { email: r.customer.email, name: r.customer.name },
      capture: true,
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      Authorized: "approved", Captured: "approved", "Card Verified": "approved",
      Pending: "pending", Declined: "failed", Canceled: "cancelled",
      Refunded: "refunded", "Partially Refunded": "refunded", Expired: "expired",
    };
    return map[status] || "pending";
  }

  static toPaymentResponse(api: PaymentResponse, orderId: string): IPR {
    if (api.error_type || !api.id) {
      return { success: false, status: "failed", message: api.error_codes?.join(", ") || api.message || "Checkout.com recusou.", raw: api };
    }
    const status = Mapper.toPaymentStatus(api.status || "");
    const resp: IPR = {
      success: status === "approved" || status === "pending",
      transactionId: orderId, gatewayTransactionId: api.id,
      status, message: `Checkout.com: ${api.status}`, raw: api,
    };
    if (api._links?.redirect?.href) resp.paymentUrl = api._links.redirect.href;
    return resp;
  }

  static toPaymentStatusResponse(api: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: api.reference || "", gatewayTransactionId: api.id || "",
      status: Mapper.toPaymentStatus(api.status || ""),
      amount: (api.amount || 0) / 100, currency: api.currency || "BRL",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  }
}

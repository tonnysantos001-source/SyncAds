import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { GalaxPayTransactionPayload, GalaxPayTransactionResponse } from "./types.ts";
export class Mapper {
  static toCreateTransactionPayload(r: PaymentRequest): GalaxPayTransactionPayload {
    const due = new Date(); due.setDate(due.getDate() + 3);
    const amountCents = Math.round(r.amount * 100);
    const p: GalaxPayTransactionPayload = {
      myId: r.orderId, value: amountCents, payday: due.toISOString().split("T")[0], payedOutsideGalaxPay: false,
      Customer: { myId: `cust_${r.orderId}`, name: r.customer.name, document: r.customer.document || "", emails: [r.customer.email] },
    };
    if ((r.paymentMethod === "credit_card" || r.paymentMethod === "debit_card") && r.card) {
      const expYear = String(r.card.expYear || r.card.expiryYear);
      p.PaymentMethodCreditCard = { Card: { number: r.card.number.replace(/\D/g, ""), holder: r.card.holderName.toUpperCase(), expiresAt: `${String(r.card.expMonth || r.card.expiryMonth).padStart(2,"0")}/${expYear.length === 2 ? "20" + expYear : expYear}`, cvv: r.card.cvv }, installment: 1 };
    } else if (r.paymentMethod === "pix") {
      p.PaymentMethodPix = { value: amountCents, myId: `pix_${r.orderId}` };
    } else {
      p.PaymentMethodBoleto = { instructions: `Pedido ${r.orderId} - SyncAds` };
    }
    return p;
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { payedboleto: "approved", payedcreditcard: "approved", payedpix: "approved", notpayed: "failed", waitingpayment: "pending", canceled: "cancelled", reversed: "refunded" };
    return map[status?.toLowerCase().replace(/_/g, "")] || "pending";
  }
  static toPaymentResponse(api: GalaxPayTransactionResponse, orderId: string): IPR {
    if (api.error) return { success: false, status: "failed", message: api.message || api.messages?.join(", ") || "GalaxPay recusou.", raw: api };
    const status = Mapper.toPaymentStatus(api.status || "waitingPayment");
    return { success: status === "approved" || status === "pending", transactionId: orderId, gatewayTransactionId: String(api.galaxPayId || api.id || ""), status, message: `GalaxPay: ${api.status}`, raw: api };
  }
  static toPaymentStatusResponse(api: GalaxPayTransactionResponse): PaymentStatusResponse {
    return { transactionId: api.myId || "", gatewayTransactionId: String(api.galaxPayId || api.id || ""), status: Mapper.toPaymentStatus(api.status || ""), amount: (api.value || 0) / 100, currency: "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

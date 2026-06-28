import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { Credentials, EBANXPaymentPayload, EBANXPaymentResponse } from "./types.ts";
export class Mapper {
  static toCreatePaymentPayload(r: PaymentRequest, integrationKey: string): EBANXPaymentPayload {
    const m = r.paymentMethod;
    let typeCode = "creditcard";
    if (m === "boleto") typeCode = "boleto";
    else if (m === "pix") typeCode = "pix";
    else if (m === "debit_card") typeCode = "debitcard";
    const p: EBANXPaymentPayload = {
      integration_key: integrationKey, operation: "request", mode: "full",
      payment: {
        name: r.customer.name, email: r.customer.email, document: r.customer.document || "",
        currency_code: "BRL", amount_total: r.amount.toFixed(2),
        payment_type_code: typeCode, merchant_payment_code: r.orderId,
        country: "br",
      },
    };
    if ((m === "credit_card" || m === "debit_card") && r.card) {
      const expMonth = String(r.card.expMonth || r.card.expiryMonth).padStart(2, "0");
      const expYear = String(r.card.expYear || r.card.expiryYear);
      p.payment.creditcard = { card_number: r.card.number.replace(/\D/g, ""), card_name: r.card.holderName.toUpperCase(), card_due_date: `${expMonth}/${expYear.length === 2 ? "20" + expYear : expYear}`, card_cvv: r.card.cvv };
    }
    return p;
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { CO: "approved", CA: "cancelled", PE: "pending", OP: "pending", RP: "refunded", CH: "failed" };
    return map[status?.toUpperCase()] || "pending";
  }
  static toPaymentResponse(api: EBANXPaymentResponse, orderId: string): IPR {
    if (api.status === "ERROR") return { success: false, status: "failed", message: api.status_message || "EBANX recusou.", raw: api };
    const pmt = api.payment;
    const status = Mapper.toPaymentStatus(pmt?.status || "PE");
    const resp: IPR = { success: status === "approved" || status === "pending", transactionId: orderId, gatewayTransactionId: pmt?.hash || "", status, message: `EBANX: ${pmt?.status}`, raw: api };
    if (pmt?.boleto_url) resp.paymentUrl = pmt.boleto_url;
    if (pmt?.pix_qr_code) { resp.qrCode = pmt.pix_qr_code; resp.pixData = { qrCode: pmt.pix_qr_code, amount: parseFloat(pmt.amount_br || "0") }; }
    return resp;
  }
  static toPaymentStatusResponse(api: EBANXPaymentResponse): PaymentStatusResponse {
    const pmt = api.payment || {};
    return { transactionId: pmt.merchant_payment_code || "", gatewayTransactionId: pmt.hash || "", status: Mapper.toPaymentStatus(pmt.status || "PE"), amount: parseFloat(pmt.amount_br || "0"), currency: "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreateTransactionPayload, TransactionResponse } from "./types.ts";

export class Mapper {
  static toCreateTransactionPayload(r: PaymentRequest): CreateTransactionPayload {
    const p: CreateTransactionPayload = {
      amount: r.amount.toFixed(2),
      orderId: r.orderId,
      options: { submitForSettlement: true },
    };
    if ((r.paymentMethod === "credit_card" || r.paymentMethod === "debit_card") && r.card) {
      const expMonth = String(r.card.expMonth || r.card.expiryMonth).padStart(2, "0");
      const expYear = String(r.card.expYear || r.card.expiryYear);
      p.creditCard = {
        number: r.card.number.replace(/\D/g, ""),
        expirationDate: `${expMonth}/${expYear.length === 2 ? "20" + expYear : expYear}`,
        cvv: r.card.cvv,
        cardholderName: r.card.holderName.toUpperCase(),
      };
    } else {
      p.paymentMethodNonce = "fake-valid-nonce";
    }
    return p;
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      authorized: "approved", submitted_for_settlement: "processing", settling: "processing",
      settled: "approved", settlement_declined: "failed", processor_declined: "failed",
      voided: "cancelled", failed: "failed", unrecognized: "pending", pending: "pending",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(api: TransactionResponse, orderId: string): IPR {
    if (!api.success || !api.transaction) {
      const errMsg = api.errors?.deepErrors?.map(e => e.message).join(", ") || api.message || "Braintree recusou.";
      return { success: false, status: "failed", message: errMsg, raw: api };
    }
    const tx = api.transaction;
    const status = Mapper.toPaymentStatus(tx.status || "");
    return {
      success: status === "approved" || status === "processing",
      transactionId: orderId,
      gatewayTransactionId: tx.id || "",
      status,
      message: `Braintree: ${tx.status}`,
      raw: api,
    };
  }

  static toPaymentStatusResponse(api: TransactionResponse): PaymentStatusResponse {
    const tx = api.transaction || {};
    return {
      transactionId: tx.id || "",
      gatewayTransactionId: tx.id || "",
      status: Mapper.toPaymentStatus(tx.status || ""),
      amount: parseFloat(tx.amount || "0"),
      currency: "BRL",
      createdAt: tx.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

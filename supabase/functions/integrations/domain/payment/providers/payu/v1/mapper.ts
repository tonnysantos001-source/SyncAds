import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { Credentials, PayUTransactionRequest, PayUResponse } from "./types.ts";
export class Mapper {
  static toTransactionRequest(r: PaymentRequest, creds: Credentials, isTest: boolean): PayUTransactionRequest {
    const method = r.paymentMethod === "pix" ? "PIX" : r.paymentMethod === "boleto" ? "BOLETO_BANCARIO" : "VISA";
    const req: PayUTransactionRequest = {
      language: "pt", command: "SUBMIT_TRANSACTION",
      merchant: { apiKey: creds.apiKey, apiLogin: creds.apiLogin },
      transaction: {
        order: {
          accountId: creds.merchantId, referenceCode: r.orderId,
          description: `Pagamento SyncAds ${r.orderId}`,
          additionalValues: { TX_VALUE: { value: r.amount, currency: "BRL" } },
          buyer: { fullName: r.customer.name, emailAddress: r.customer.email },
        },
        type: "AUTHORIZATION_AND_CAPTURE",
        paymentMethod: method, paymentCountry: "BR",
        payer: { fullName: r.customer.name, emailAddress: r.customer.email },
      },
      test: isTest,
    };
    if ((r.paymentMethod === "credit_card" || r.paymentMethod === "debit_card") && r.card) {
      const expMonth = String(r.card.expMonth || r.card.expiryMonth).padStart(2, "0");
      const expYear = String(r.card.expYear || r.card.expiryYear);
      req.transaction.creditCard = { number: r.card.number.replace(/\D/g, ""), securityCode: r.card.cvv, expirationDate: `${expYear.length === 2 ? "20" + expYear : expYear}/${expMonth}`, name: r.card.holderName };
    }
    return req;
  }
  static toPaymentStatus(state: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { APPROVED: "approved", DECLINED: "failed", PENDING: "pending", EXPIRED: "expired", ERROR: "failed" };
    return map[state?.toUpperCase()] || "pending";
  }
  static toPaymentResponse(api: PayUResponse, orderId: string): IPR {
    if (api.code !== "SUCCESS" || !api.transactionResponse) {
      return { success: false, status: "failed", message: api.error || api.transactionResponse?.responseMessage || "PayU recusou.", raw: api };
    }
    const tx = api.transactionResponse;
    const status = Mapper.toPaymentStatus(tx.state || "");
    const resp: IPR = { success: status === "approved" || status === "pending", transactionId: orderId, gatewayTransactionId: tx.transactionId || String(tx.orderId || ""), status, message: `PayU: ${tx.state} - ${tx.responseCode}`, raw: api };
    const ep = tx.extraParameters;
    if (ep?.URL_PAYMENT_RECEIPT_HTML) resp.paymentUrl = ep.URL_PAYMENT_RECEIPT_HTML;
    return resp;
  }
  static toPaymentStatusResponse(api: PayUResponse): PaymentStatusResponse {
    const tx = api.transactionResponse || {};
    return { transactionId: String(tx.orderId || ""), gatewayTransactionId: tx.transactionId || "", status: Mapper.toPaymentStatus(tx.state || ""), amount: 0, currency: "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

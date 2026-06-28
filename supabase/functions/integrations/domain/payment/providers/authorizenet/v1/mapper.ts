import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { TransactionResponse } from "./types.ts";
export class Mapper {
  static toPaymentStatus(responseCode: string): PaymentStatus {
    if (responseCode === "1") return "approved";
    if (responseCode === "4") return "pending";
    return "failed";
  }
  static toPaymentResponse(api: TransactionResponse, orderId: string): IPR {
    const tx = api.transactionResponse;
    const resultCode = api.messages?.resultCode;
    if (resultCode === "Error" || !tx) {
      const errMsg = api.messages?.message?.map(m => m.text).join(", ") || tx?.errors?.map(e => e.errorText).join(", ") || "Authorize.Net recusou.";
      return { success: false, status: "failed", message: errMsg, raw: api };
    }
    const status = Mapper.toPaymentStatus(tx.responseCode || "2");
    return { success: status === "approved", transactionId: orderId, gatewayTransactionId: tx.transId || "", status, message: `Authorize.Net: ${tx.messages?.[0]?.description || status}`, raw: api };
  }
  static toPaymentStatusResponse(api: any): PaymentStatusResponse {
    const tx = api.transaction || api.transactionResponse || {};
    return { transactionId: tx.refId || "", gatewayTransactionId: tx.transId || "", status: Mapper.toPaymentStatus(tx.responseCode || "2"), amount: parseFloat(tx.settleAmount || "0"), currency: "USD", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

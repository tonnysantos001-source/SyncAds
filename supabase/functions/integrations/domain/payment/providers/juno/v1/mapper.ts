import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { JunoChargePayload, JunoChargeResponse } from "./types.ts";
export class Mapper {
  static toChargePayload(r: PaymentRequest): JunoChargePayload {
    const m = r.paymentMethod;
    const types = m === "credit_card" ? ["CREDIT_CARD"] : m === "pix" ? ["PIX"] : ["BOLETO"];
    const due = new Date(); due.setDate(due.getDate() + 3);
    return {
      charge: { description: `Pedido ${r.orderId}`, amount: r.amount, references: [r.orderId], dueDate: due.toISOString().split("T")[0], paymentTypes: types, maxOverdueDays: 3 },
      billing: { name: r.customer.name, document: r.customer.document || "", email: r.customer.email },
    };
  }
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = { ACTIVE: "pending", PAID: "approved", CANCELLED: "cancelled", FAILED: "failed", EXPIRED: "expired", DUE: "expired" };
    return map[status?.toUpperCase()] || "pending";
  }
  static toPaymentResponse(api: JunoChargeResponse, orderId: string): IPR {
    if (api.error) return { success: false, status: "failed", message: api.details?.map(d => d.message).join(", ") || api.error, raw: api };
    const status = Mapper.toPaymentStatus(api.status || "ACTIVE");
    const resp: IPR = { success: status === "approved" || status === "pending", transactionId: orderId, gatewayTransactionId: api.id || api.code || "", status, message: `Juno: ${api.status || "criado"}`, raw: api };
    if (api.link) resp.paymentUrl = api.link;
    if (api.checkoutUrl) resp.paymentUrl = api.checkoutUrl;
    return resp;
  }
  static toPaymentStatusResponse(api: JunoChargeResponse): PaymentStatusResponse {
    return { transactionId: api.code || "", gatewayTransactionId: api.id || "", status: Mapper.toPaymentStatus(api.status || ""), amount: api.amount || 0, currency: "BRL", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }
}

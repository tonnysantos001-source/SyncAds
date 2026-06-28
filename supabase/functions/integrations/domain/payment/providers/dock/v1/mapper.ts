import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { DockPaymentPayload, DockResponse } from "./types.ts";

export class Mapper {
  static toCreatePaymentPayload(r: PaymentRequest): DockPaymentPayload {
    const m = r.paymentMethod;
    const method = m === "pix" ? "PIX" : m === "boleto" ? "BOLETO" : "CARD";

    return {
      amount: r.amount,
      external_id: r.orderId,
      payment_method: method,
      customer: {
        name: r.customer.name,
        document: r.customer.document?.replace(/\D/g, "") || "",
        email: r.customer.email,
      },
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      APPROVED: "approved",
      PENDING: "pending",
      FAILED: "failed",
      CANCELLED: "cancelled",
    };
    return map[status?.toUpperCase()] || "pending";
  }

  static toPaymentResponse(api: DockResponse, orderId: string): IPR {
    if (api.error) {
      return {
        success: false,
        status: "failed",
        message: api.message || api.error || "Dock recusou o pagamento.",
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.status || "PENDING");
    const resp: IPR = {
      success: status === "approved" || status === "pending",
      transactionId: orderId,
      gatewayTransactionId: api.id || "",
      status,
      message: `Dock: ${api.status || "pendente"}`,
      raw: api,
    };

    if (api.payment_url) {
      resp.paymentUrl = api.payment_url;
    }
    if (api.qr_code) {
      resp.qrCode = api.qr_code;
      resp.pixData = {
        qrCode: api.qr_code,
        amount: api.amount || 0,
      };
    }

    return resp;
  }

  static toPaymentStatusResponse(api: DockResponse): PaymentStatusResponse {
    return {
      transactionId: api.external_id || "",
      gatewayTransactionId: api.id || "",
      status: Mapper.toPaymentStatus(api.status || "PENDING"),
      amount: api.amount || 0,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

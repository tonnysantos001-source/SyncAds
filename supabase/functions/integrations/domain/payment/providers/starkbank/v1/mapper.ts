import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { StarkResponse } from "./types.ts";

export class Mapper {
  static toPixRequestPayload(r: PaymentRequest): any {
    return {
      amount: Math.round(r.amount * 100),
      name: r.customer.name,
      taxId: r.customer.document?.replace(/\D/g, "") || "",
      externalId: r.orderId,
      tags: [r.orderId],
    };
  }

  static toInvoicePayload(r: PaymentRequest): any {
    const due = new Date();
    due.setDate(due.getDate() + 3);
    return {
      amount: Math.round(r.amount * 100),
      name: r.customer.name,
      taxId: r.customer.document?.replace(/\D/g, "") || "",
      due: due.toISOString().split("T")[0],
      tags: [r.orderId],
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      success: "approved",
      paid: "approved",
      created: "pending",
      processing: "processing",
      failed: "failed",
      canceled: "cancelled",
      expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(api: StarkResponse, orderId: string, method: string): IPR {
    if (api.errors && api.errors.length > 0) {
      return {
        success: false,
        status: "failed",
        message: api.errors.map(e => e.message).join(", ") || api.error || "Stark Bank recusou o pagamento.",
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.status || "created");
    const resp: IPR = {
      success: status === "approved" || status === "pending" || status === "processing",
      transactionId: orderId,
      gatewayTransactionId: api.id || "",
      status,
      message: `Stark Bank: ${api.status}`,
      raw: api,
    };

    if (method === "pix" && api.brcode) {
      resp.qrCode = api.brcode;
      resp.pixData = {
        qrCode: api.brcode,
        amount: (api.amount || 0) / 100,
      };
    }

    if (api.pdf) {
      resp.paymentUrl = api.pdf;
    }

    return resp;
  }

  static toPaymentStatusResponse(api: StarkResponse): PaymentStatusResponse {
    return {
      transactionId: api.id || "",
      gatewayTransactionId: api.id || "",
      status: Mapper.toPaymentStatus(api.status || "created"),
      amount: (api.amount || api.nominalAmount || 0) / 100,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

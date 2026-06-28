import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { ShipayPixRequest, ShipayResponse } from "./types.ts";

export class Mapper {
  static toPixBillingPayload(r: PaymentRequest, callbackUrl?: string): ShipayPixRequest {
    return {
      address_key: "shipay-key-placeholder", // normal Pix key
      total: r.amount,
      order_ref: r.orderId,
      callback_url: callbackUrl || "",
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      approved: "approved",
      pending: "pending",
      cancelled: "cancelled",
      expired: "expired",
      refunded: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  static toPaymentResponse(api: ShipayResponse, orderId: string): IPR {
    if (api.error) {
      return {
        success: false,
        status: "failed",
        message: api.message || api.error || "Shipay recusou o pagamento.",
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.status || "pending");
    const resp: IPR = {
      success: status === "approved" || status === "pending",
      transactionId: orderId,
      gatewayTransactionId: api.order_id || "",
      status,
      message: `Shipay: ${api.status || "pendente"}`,
      raw: api,
    };

    if (api.qr_code || api.qr_code_text) {
      const code = api.qr_code_text || api.qr_code || "";
      resp.qrCode = code;
      resp.pixData = {
        qrCode: code,
        amount: api.total || 0,
      };
    }

    return resp;
  }

  static toPaymentStatusResponse(api: ShipayResponse): PaymentStatusResponse {
    return {
      transactionId: api.order_id || "",
      gatewayTransactionId: api.order_id || "",
      status: Mapper.toPaymentStatus(api.status || "pending"),
      amount: api.total || 0,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

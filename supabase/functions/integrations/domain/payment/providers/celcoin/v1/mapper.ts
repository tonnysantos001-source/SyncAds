import { PaymentRequest, PaymentResponse as IPR, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CelcoinPixRequest, CelcoinResponse } from "./types.ts";

export class Mapper {
  static toPixRequestPayload(r: PaymentRequest): CelcoinPixRequest {
    return {
      amount: r.amount,
      clientRequestId: r.orderId,
      key: "syncads-pix-key-placeholder", // normal Pix key
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      PAID: "approved",
      CREATED: "pending",
      PROCESSING: "processing",
      EXPIRED: "expired",
      ERROR: "failed",
      CANCELLED: "cancelled",
    };
    return map[status?.toUpperCase()] || "pending";
  }

  static toPaymentResponse(api: CelcoinResponse, orderId: string): IPR {
    if (api.errorCode) {
      return {
        success: false,
        status: "failed",
        message: api.message || "Celcoin recusou o pagamento.",
        errorCode: api.errorCode,
        raw: api,
      };
    }
    const status = Mapper.toPaymentStatus(api.status || "CREATED");
    const resp: IPR = {
      success: status === "approved" || status === "pending" || status === "processing",
      transactionId: orderId,
      gatewayTransactionId: String(api.transactionId || ""),
      status,
      message: `Celcoin: ${api.status || "criado"}`,
      raw: api,
    };

    if (api.qrCode?.emv || api.emv) {
      const code = api.qrCode?.emv || api.emv || "";
      resp.qrCode = code;
      resp.pixData = {
        qrCode: code,
        amount: api.amount || 0,
      };
    }

    return resp;
  }

  static toPaymentStatusResponse(api: CelcoinResponse): PaymentStatusResponse {
    return {
      transactionId: api.clientRequestId || "",
      gatewayTransactionId: String(api.transactionId || ""),
      status: Mapper.toPaymentStatus(api.status || "CREATED"),
      amount: api.amount || 0,
      currency: "BRL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

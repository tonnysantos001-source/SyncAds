import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { CreatePaymentPayload, CreatePaymentResponse } from "./types.ts";

export class Mapper {
  static toPaymentPayload(request: PaymentRequest, merchantId?: string, webhookUrl?: string): CreatePaymentPayload {
    const method = request.paymentMethod as any;
    const doc = (request.customer.document || "").replace(/\D/g, "");
    const phone = (request.customer.phone || "").replace(/\D/g, "");

    const payload: CreatePaymentPayload = {
      merchant_id: merchantId,
      reference_id: request.orderId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: method,
      capture: true,
      customer: { name: request.customer.name, email: request.customer.email, document: doc, phone: phone || undefined },
      installments: request.installments || 1,
      notification_url: webhookUrl,
    };

    if (request.card && (method === "credit_card" || method === "debit_card")) {
      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        holder_name: request.card.holderName,
        exp_month: String(request.card.expMonth).padStart(2, "0"),
        exp_year: String(request.card.expYear),
        cvv: request.card.cvv,
      };
    }

    return payload;
  }

  static toPaymentResponse(api: CreatePaymentResponse, orderId: string): PaymentResponse {
    if (api.error || !api.id) {
      return { success: false, status: "failed", message: api.error?.message || "SafraPay rejeitou o pagamento.", errorCode: api.error?.code };
    }
    const status = Mapper.toPaymentStatus(api.status || "pending");
    const result: PaymentResponse = {
      success: true,
      transactionId: orderId,
      gatewayTransactionId: api.id,
      status,
      message: `Pagamento SafraPay: ${api.status}`,
      authCode: api.authorization_code,
      raw: api,
    };
    if (api.pix) {
      result.qrCode = api.pix.qr_code;
      result.pixData = { qrCode: api.pix.qr_code || "", qrCodeImage: api.pix.qr_code_url, amount: (api.amount || 0) / 100 };
      result.expiresAt = api.pix.expires_at;
    }
    return result;
  }

  static toPaymentStatusResponse(api: CreatePaymentResponse): PaymentStatusResponse {
    return {
      transactionId: api.reference_id || "",
      gatewayTransactionId: api.id || "",
      status: Mapper.toPaymentStatus(api.status || "pending"),
      amount: (api.amount || 0) / 100,
      currency: "BRL",
      paymentMethod: api.payment_method || "unknown",
      createdAt: api.created_at || new Date().toISOString(),
      updatedAt: api.created_at || new Date().toISOString(),
    };
  }

  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      authorized: "approved", paid: "approved", captured: "approved", approved: "approved", succeeded: "approved",
      pending: "pending", waiting: "pending", processing: "processing",
      failed: "failed", declined: "failed", error: "failed",
      cancelled: "cancelled", canceled: "cancelled", voided: "cancelled",
      refunded: "refunded", expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}

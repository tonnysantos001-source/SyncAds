import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static formatPhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do Bravos Pay
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    return {
      transaction_id: request.orderId,
      amount: request.amount,
      currency: "BRL",
      payment_method: request.paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
        phone: this.formatPhone(request.customer.phone || ""),
      },
      metadata: {
        order_id: request.orderId,
      },
    };
  }

  /**
   * Converte a resposta da API do Bravos Pay para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "pending";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["success", "approved", "paid", "pending", "processing"].includes(rawStatus.toLowerCase());

    const result: PaymentResponse = {
      success,
      transactionId: response.transaction_id,
      gatewayTransactionId: response.id || response.transaction_id,
      status,
      message: response.message || `Transação processada com status: ${rawStatus}`,
    };

    const paymentUrl = response.payment_url || response.boleto_url;
    if (paymentUrl) {
      result.paymentUrl = paymentUrl;
      result.redirectUrl = paymentUrl;
    }

    const qrCode = response.qr_code || response.pix_qr_code;
    if (qrCode) {
      result.qrCode = qrCode;
      result.pixData = {
        qrCode,
        amount: 0,
      };
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do Bravos Pay para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    return {
      transactionId: response.transaction_id || response.id,
      gatewayTransactionId: response.id || response.transaction_id,
      status: this.toPaymentStatus(response.status),
      amount: response.amount || 0,
      currency: response.currency || "BRL",
      paymentMethod: response.payment_method || "pix",
      createdAt: response.created_at || new Date().toISOString(),
      updatedAt: response.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      success: "approved",
      approved: "approved",
      paid: "approved",
      completed: "approved",
      failed: "failed",
      declined: "failed",
      error: "failed",
      cancelled: "cancelled",
      canceled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

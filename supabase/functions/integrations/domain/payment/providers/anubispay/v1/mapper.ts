import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do AnubisPay
   */
  static toPaymentPayload(request: PaymentRequest, merchantId: string): PaymentRequestPayload {
    return {
      transaction_id: request.orderId,
      amount: request.amount,
      currency: request.currency || "BRL",
      payment_method: request.paymentMethod,
      merchant_id: merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: this.formatDocument(request.customer.document),
      },
    };
  }

  /**
   * Converte a resposta da API do AnubisPay para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "pending";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["success", "approved", "paid", "pending"].includes(rawStatus.toLowerCase());

    const result: PaymentResponse = {
      success,
      transactionId: response.transaction_id,
      gatewayTransactionId: response.transaction_id,
      status,
      message: `Transação processada no AnubisPay com status: ${rawStatus}`,
    };

    if (response.payment_url) {
      result.paymentUrl = response.payment_url;
      result.redirectUrl = response.payment_url;
    }

    if (response.qr_code) {
      result.qrCode = response.qr_code;
      result.pixData = {
        qrCode: response.qr_code,
        amount: 0,
      };
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do AnubisPay para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    return {
      transactionId: response.transaction_id,
      gatewayTransactionId: response.transaction_id,
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
      success: "approved",
      approved: "approved",
      paid: "approved",
      failed: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

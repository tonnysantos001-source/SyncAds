import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request do SyncAds para payload da API da Efí
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = (request.customer.document || "").replace(/\D/g, "");

    const payload: PaymentRequestPayload = {
      transaction_id: request.orderId,
      amount: request.amount, // Usa o valor direto (como especificado no legado)
      currency: request.currency || "BRL",
      payment_method: request.paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: cleanDoc,
      },
      metadata: {
        orderId: request.orderId,
        ...(request.metadata || {}),
      },
    };

    if (request.customer.phone) {
      payload.customer.phone = request.customer.phone.replace(/\D/g, "");
    }

    // Mapear dados do cartão
    if (request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card") {
      payload.installments = request.installments || 1;

      if (request.card) {
        payload.card = {
          number: request.card.number.replace(/\s/g, ""),
          holder_name: request.card.holder,
          expiry_month: request.card.expirationMonth,
          expiry_year: request.card.expirationYear,
          cvv: request.card.cvv,
        };
      } else if (request.metadata) {
        payload.card = {
          number: (request.metadata.cardNumber || "").replace(/\s/g, ""),
          holder_name: request.metadata.cardHolder || "",
          expiry_month: request.metadata.cardExpirationMonth || "",
          expiry_year: request.metadata.cardExpirationYear || "",
          cvv: request.metadata.cardCvv || "",
        };
      }
    }

    return payload;
  }

  /**
   * Converte a resposta da API da Efí para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const status = this.toPaymentStatus(response.status);
    const success = ["approved", "paid", "completed", "success"].includes(response.status.toLowerCase());
    const id = response.id || response.transaction_id || "";

    const paymentResponse: PaymentResponse = {
      success,
      transactionId: id,
      gatewayTransactionId: id,
      status,
      message: response.message || `Pagamento processado com status: ${response.status}`,
    };

    // Pix
    const qrCode = response.qr_code || response.pix_qr_code;
    if (qrCode) {
      paymentResponse.qrCode = qrCode;
      paymentResponse.pixKey = qrCode;
      paymentResponse.expiresAt = response.expires_at;
      paymentResponse.pixData = {
        qrCode,
        amount: response.amount,
        expiresAt: response.expires_at,
      };
    }

    // Boleto
    const efiBoletoUrl = response.payment_url || response.boleto_url;
    if (efiBoletoUrl || response.barcode) {
      paymentResponse.paymentUrl = efiBoletoUrl;
      paymentResponse.barcodeNumber = response.barcode;
      paymentResponse.digitableLine = response.digitable_line;
      paymentResponse.expiresAt = response.expires_at;
      paymentResponse.boletoData = {
        boletoUrl: efiBoletoUrl || "",
        barcode: response.barcode || "",
        digitableLine: response.digitable_line || "",
        dueDate: response.expires_at || "",
        amount: response.amount,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API da Efí para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    const id = response.id || response.transaction_id || "";

    return {
      transactionId: id,
      gatewayTransactionId: id,
      status: this.toPaymentStatus(response.status),
      amount: response.amount,
      currency: "BRL",
      paymentMethod: response.payment_url || response.boleto_url ? "boleto" : (response.qr_code || response.pix_qr_code ? "pix" : "credit_card"),
      createdAt: response.expires_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mapeia status da Efí para status interno do SyncAds
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      paid: "approved",
      approved: "approved",
      completed: "approved",
      success: "approved",
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

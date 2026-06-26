import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do Dom Pagamentos
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const payload: PaymentRequestPayload = {
      amount: Math.round(request.amount * 100), // Converte para centavos
      payment_method: request.paymentMethod as any,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: request.customer.document.replace(/\D/g, ""), // Apenas números
        phone: request.customer.phone ? request.customer.phone.replace(/\D/g, "") : undefined,
      },
    };

    if (request.paymentMethod === "credit_card" && request.card) {
      payload.card = {
        number: request.card.number.replace(/\s/g, ""),
        holderName: request.card.holderName,
        expiryMonth: request.card.expiryMonth,
        expiryYear: request.card.expiryYear,
        cvv: request.card.cvv,
      };
      payload.installments = request.installments || 1;
    }

    if (request.metadata?.notifyUrl) {
      payload.postback_url = request.metadata.notifyUrl;
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Dom Pagamentos para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const status = this.toPaymentStatus(response.status);
    const success = ["approved", "paid"].includes(response.status.toLowerCase());

    const paymentResponse: PaymentResponse = {
      success,
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status,
      message: `Pagamento processado com status: ${response.status}`,
    };

    // Pix
    if (response.qr_code) {
      paymentResponse.qrCode = response.qr_code;
      paymentResponse.pixKey = response.qr_code;
      paymentResponse.pixData = {
        qrCode: response.qr_code,
        amount: response.amount / 100,
      };
    }

    // Boleto
    if (response.payment_url || response.barcode || response.digitable_line) {
      paymentResponse.paymentUrl = response.payment_url;
      paymentResponse.barcodeNumber = response.barcode;
      paymentResponse.digitableLine = response.digitable_line;
      paymentResponse.boletoData = {
        boletoUrl: response.payment_url || "",
        barcode: response.barcode || "",
        digitableLine: response.digitable_line || "",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 dias de vencimento padrão
        amount: response.amount / 100,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API da Dom Pagamentos para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    return {
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status: this.toPaymentStatus(response.status),
      amount: response.amount / 100,
      currency: "BRL",
      paymentMethod: "pix", // Fallback padrão
      createdAt: response.created_at || new Date().toISOString(),
      updatedAt: response.updated_at || response.created_at || new Date().toISOString(),
      paidAt: response.paid_at || undefined,
    };
  }

  /**
   * Mapeia status da Dom Pagamentos para status interno do SyncAds
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      approved: "approved",
      paid: "approved",
      failed: "failed",
      refused: "failed",
      rejected: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

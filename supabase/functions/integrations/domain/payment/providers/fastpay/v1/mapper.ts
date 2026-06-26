import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request interna do SyncAds para o formato da API do Fast Pay
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const rawDoc = request.customer.document.replace(/\D/g, "");
    const docType = rawDoc.length > 11 ? "cnpj" : "cpf";

    const payload: PaymentRequestPayload = {
      amount: request.amount, // Valor decimal / float como número
      currency: "BRL",
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        phone: request.customer.phone ? request.customer.phone.replace(/\D/g, "") : "",
        document: {
          type: docType,
          id: rawDoc,
        },
      },
      paymentMethod: { type: "pix" }, // Fallback padrão
    };

    if (request.paymentMethod === "pix") {
      payload.paymentMethod = { type: "pix" };
    } else if (request.paymentMethod === "boleto") {
      payload.paymentMethod = { type: "boleto" };
    } else if (request.paymentMethod === "credit_card" && request.card) {
      payload.paymentMethod = {
        type: "credit_card",
        number: request.card.number.replace(/\s/g, ""),
        holderName: request.card.holderName,
        expirationMonth: request.card.expiryMonth,
        expirationYear: request.card.expiryYear,
        cvv: request.card.cvv,
        installments: request.installments || 1,
      };
    }

    if (request.metadata?.notifyUrl) {
      payload.postbackUrl = request.metadata.notifyUrl;
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Fast Pay para o formato padronizado do SyncAds
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
    if (response.qrCode) {
      paymentResponse.qrCode = response.qrCode;
      paymentResponse.pixKey = response.qrCode;
      paymentResponse.pixData = {
        qrCode: response.qrCode,
        amount: response.amount,
      };
    }

    // Boleto
    if (response.paymentUrl || response.barcode || response.digitableLine) {
      paymentResponse.paymentUrl = response.paymentUrl;
      paymentResponse.barcodeNumber = response.barcode;
      paymentResponse.digitableLine = response.digitableLine;
      paymentResponse.boletoData = {
        boletoUrl: response.paymentUrl || "",
        barcode: response.barcode || "",
        digitableLine: response.digitableLine || "",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 dias de vencimento padrão
        amount: response.amount,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API da Fast Pay para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    return {
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status: this.toPaymentStatus(response.status),
      amount: response.amount,
      currency: "BRL",
      paymentMethod: "pix", // Fallback padrão
      createdAt: response.createdAt || new Date().toISOString(),
      updatedAt: response.updatedAt || response.createdAt || new Date().toISOString(),
      paidAt: response.paidAt || undefined,
    };
  }

  /**
   * Mapeia status da Fast Pay para status interno do SyncAds
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

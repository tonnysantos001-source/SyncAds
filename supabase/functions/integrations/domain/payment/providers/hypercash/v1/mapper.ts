import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request do SyncAds para payload da API do HyperCash
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = (request.customer.document || "").replace(/\D/g, "");
    const docType = cleanDoc.length > 11 ? "CNPJ" : "CPF";
    const amountInCents = Math.round(request.amount * 100);

    let paymentMethod: "PIX" | "BOLETO" | "CREDIT_CARD";
    switch (request.paymentMethod.toLowerCase()) {
      case "pix":
        paymentMethod = "PIX";
        break;
      case "boleto":
        paymentMethod = "BOLETO";
        break;
      case "credit_card":
        paymentMethod = "CREDIT_CARD";
        break;
      default:
        paymentMethod = "PIX";
    }

    const payload: PaymentRequestPayload = {
      amount: amountInCents,
      currency: request.currency || "BRL",
      paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: docType as "CPF" | "CNPJ",
          number: cleanDoc,
        },
      },
      metadata: {
        orderId: request.orderId,
        ...(request.metadata || {}),
      },
    };

    if (request.customer.phone) {
      payload.customer.phone = request.customer.phone.replace(/\D/g, "");
    }

    // Mapear dados do cartão se for CREDIT_CARD
    if (paymentMethod === "CREDIT_CARD") {
      payload.installments = request.installments || 1;
      
      if (request.card) {
        payload.card = {
          number: request.card.number.replace(/\D/g, ""),
          holder: request.card.holder,
          expirationMonth: request.card.expirationMonth,
          expirationYear: request.card.expirationYear,
          cvv: request.card.cvv,
        };
      } else if (request.metadata) {
        // Fallback para campos de metadados se o cartão não estiver no objeto principal
        payload.card = {
          number: (request.metadata.cardNumber || "").replace(/\D/g, ""),
          holder: request.metadata.cardHolder || "",
          expirationMonth: request.metadata.cardExpirationMonth || "",
          expirationYear: request.metadata.cardExpirationYear || "",
          cvv: request.metadata.cardCvv || "",
        };
      }
    }

    // Se houver notifyUrl para webhook específico
    if (request.metadata?.notifyUrl) {
      payload.postbackUrl = request.metadata.notifyUrl;
    }

    return payload;
  }

  /**
   * Converte a resposta da API da HyperCash para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const data = response.data;
    const status = this.toPaymentStatus(data.status);
    const success = ["approved", "paid"].includes(data.status.toLowerCase());

    const paymentResponse: PaymentResponse = {
      success,
      transactionId: data.id,
      gatewayTransactionId: data.id,
      status,
      message: response.message || `Pagamento processado com status: ${data.status}`,
    };

    // Mapeamento Pix
    if (data.paymentMethod === "PIX" && data.pix) {
      paymentResponse.qrCode = data.pix.qr_code;
      paymentResponse.pixKey = data.pix.qr_code;
      paymentResponse.expiresAt = data.pix.expiration_date;
      paymentResponse.pixData = {
        qrCode: data.pix.qr_code,
        amount: data.amount / 100,
        expiresAt: data.pix.expiration_date,
      };
    }

    // Mapeamento Boleto
    if (data.paymentMethod === "BOLETO" && data.boleto) {
      paymentResponse.paymentUrl = data.boleto.url;
      paymentResponse.barcodeNumber = data.boleto.barcode;
      paymentResponse.digitableLine = data.boleto.digitable_line;
      paymentResponse.expiresAt = data.boleto.due_date;
      paymentResponse.boletoData = {
        boletoUrl: data.boleto.url,
        barcode: data.boleto.barcode,
        digitableLine: data.boleto.digitable_line,
        dueDate: data.boleto.due_date,
        amount: data.amount / 100,
      };
    }

    // Mapeamento Cartão
    if (data.paymentMethod === "CREDIT_CARD" && data.card) {
      paymentResponse.metadata = {
        brand: data.card.brand,
        lastFour: data.card.last_four,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API da HyperCash para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    const data = response.data;

    let internalMethodMap: Record<string, string> = {
      PIX: "pix",
      BOLETO: "boleto",
      CREDIT_CARD: "credit_card",
    };

    return {
      transactionId: data.id,
      gatewayTransactionId: data.id,
      status: this.toPaymentStatus(data.status),
      amount: data.amount / 100,
      currency: data.currency || "BRL",
      paymentMethod: internalMethodMap[data.paymentMethod] || "pix",
      createdAt: data.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mapeia status da HyperCash para status interno do SyncAds
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      approved: "approved",
      paid: "approved",
      failed: "failed",
      rejected: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

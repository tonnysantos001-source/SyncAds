import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request do SyncAds para payload da API da Bestfy
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = (request.customer.document || "").replace(/\D/g, "");
    const docType = cleanDoc.length > 11 ? "cnpj" : "cpf";
    const amountInCents = Math.round(request.amount * 100);

    let paymentMethod: "pix" | "boleto" | "credit_card";
    switch (request.paymentMethod.toLowerCase()) {
      case "pix":
        paymentMethod = "pix";
        break;
      case "boleto":
        paymentMethod = "boleto";
        break;
      case "credit_card":
        paymentMethod = "credit_card";
        break;
      default:
        paymentMethod = "pix";
    }

    // Bestfy exige a lista de itens. Se não houver, criamos um item padrão correspondente ao valor total
    const items = request.items && request.items.length > 0
      ? request.items.map((item) => ({
          title: item.name,
          unitPrice: Math.round(item.price * 100),
          quantity: item.quantity || 1,
          tangible: false,
        }))
      : [
          {
            title: `Pedido SyncAds AI #${request.orderId}`,
            unitPrice: amountInCents,
            quantity: 1,
            tangible: false,
          },
        ];

    const payload: PaymentRequestPayload = {
      amount: amountInCents,
      paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: docType as "cpf" | "cnpj",
          number: cleanDoc,
        },
      },
      items,
      metadata: request.orderId,
    };

    if (request.customer.phone) {
      payload.customer.phone = request.customer.phone.replace(/\D/g, "");
    }

    // Mapear dados do cartão se for credit_card
    if (paymentMethod === "credit_card") {
      payload.installments = request.installments || 1;
      
      const token = request.metadata?.token || request.metadata?.hash;
      
      if (token) {
        payload.card = {
          hash: token,
        };
      } else if (request.card) {
        payload.card = {
          number: request.card.number.replace(/\D/g, ""),
          holderName: request.card.holder,
          expirationMonth: parseInt(request.card.expirationMonth, 10),
          expirationYear: parseInt(request.card.expirationYear, 10),
          cvv: request.card.cvv,
        };
      } else if (request.metadata) {
        payload.card = {
          number: (request.metadata.cardNumber || "").replace(/\D/g, ""),
          holderName: request.metadata.cardHolder || "",
          expirationMonth: parseInt(request.metadata.cardExpirationMonth || "0", 10),
          expirationYear: parseInt(request.metadata.cardExpirationYear || "0", 10),
          cvv: request.metadata.cardCvv || "",
        };
      }
    }

    // Webhook URL
    if (request.metadata?.notifyUrl) {
      payload.postbackUrl = request.metadata.notifyUrl;
    }

    return payload;
  }

  /**
   * Converte a resposta da API da Bestfy para o formato padronizado do SyncAds
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

    if (response.secureUrl) {
      paymentResponse.paymentUrl = response.secureUrl;
    }

    // Pix
    if (response.paymentMethod === "pix" && response.pix) {
      paymentResponse.qrCode = response.pix.qrcode;
      paymentResponse.pixKey = response.pix.qrcode;
      paymentResponse.expiresAt = response.pix.expirationDate;
      paymentResponse.pixData = {
        qrCode: response.pix.qrcode,
        amount: response.amount / 100,
        expiresAt: response.pix.expirationDate,
      };
    }

    // Boleto
    if (response.paymentMethod === "boleto" && response.boleto) {
      paymentResponse.paymentUrl = response.boleto.url;
      paymentResponse.barcodeNumber = response.boleto.barcode;
      paymentResponse.digitableLine = response.boleto.digitableLine;
      paymentResponse.expiresAt = response.boleto.expirationDate;
      paymentResponse.boletoData = {
        boletoUrl: response.boleto.url,
        barcode: response.boleto.barcode,
        digitableLine: response.boleto.digitableLine,
        dueDate: response.boleto.expirationDate,
        amount: response.amount / 100,
      };
    }

    // Cartão
    if (response.paymentMethod === "credit_card" && response.card) {
      paymentResponse.metadata = {
        brand: response.card.brand,
        lastFour: response.card.lastDigits,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API da Bestfy para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    let internalMethodMap: Record<string, string> = {
      pix: "pix",
      boleto: "boleto",
      credit_card: "credit_card",
    };

    return {
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status: this.toPaymentStatus(response.status),
      amount: response.amount / 100,
      currency: "BRL",
      paymentMethod: internalMethodMap[response.paymentMethod] || "pix",
      createdAt: response.createdAt || new Date().toISOString(),
      updatedAt: response.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Mapeia status da Bestfy para status interno do SyncAds
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

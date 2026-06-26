import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  /**
   * Converte a request do SyncAds para payload da API do Pagou.ai
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = request.customer.document.replace(/\D/g, "");
    const docType = cleanDoc.length > 11 ? "CNPJ" : "CPF";
    const amountInCents = Math.round(request.amount * 100);

    let method: "pix" | "credit_card" | "voucher";
    switch (request.paymentMethod) {
      case "pix":
        method = "pix";
        break;
      case "credit_card":
        method = "credit_card";
        break;
      case "boleto":
        method = "voucher";
        break;
      default:
        method = "pix";
    }

    const payload: PaymentRequestPayload = {
      external_ref: request.orderId,
      amount: amountInCents,
      currency: request.currency || "BRL",
      method,
      buyer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: docType as "CPF" | "CNPJ",
          number: cleanDoc,
        },
      },
      products: [
        {
          name: `Pedido SyncAds AI #${request.orderId}`,
          price: amountInCents,
          quantity: 1,
        },
      ],
    };

    if (request.customer.phone) {
      payload.buyer.phone = request.customer.phone.replace(/\D/g, "");
    }

    if (method === "credit_card") {
      payload.token = request.metadata?.token;
      payload.installments = request.installments || 1;
    }

    // Se houver URL de webhook específica
    if (request.metadata?.notifyUrl) {
      payload.notify_url = request.metadata.notifyUrl;
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Pagou.ai para o formato padronizado do SyncAds
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
      message: `Pagamento processado com status: ${data.status}`,
    };

    // Mapeamento Pix
    if (data.method === "pix" && data.pix) {
      paymentResponse.qrCode = data.pix.qr_code;
      paymentResponse.pixKey = data.pix.qr_code;
      paymentResponse.expiresAt = data.pix.expiration_date;
      paymentResponse.pixData = {
        qrCode: data.pix.qr_code,
        amount: data.amount / 100,
        expiresAt: data.pix.expiration_date,
      };
    }

    // Mapeamento Boleto / Voucher
    if (data.method === "voucher" && data.voucher) {
      const dueDate = data.voucher.due_date || new Date(Date.now() + 3*24*60*60*1000).toISOString();
      const barcode = data.voucher.barcode || data.voucher.digitable_line || "";
      
      paymentResponse.paymentUrl = data.voucher.url;
      paymentResponse.barcodeNumber = barcode;
      paymentResponse.digitableLine = data.voucher.digitable_line || barcode;
      paymentResponse.expiresAt = dueDate;
      paymentResponse.boletoData = {
        boletoUrl: data.voucher.url,
        barcode,
        digitableLine: data.voucher.digitable_line || barcode,
        dueDate,
        amount: data.amount / 100,
      };
    }

    // Mapeamento Cartão
    if (data.method === "credit_card" && data.card) {
      paymentResponse.metadata = {
        brand: data.card.brand,
        lastFour: data.card.last_four,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte o status da consulta da API do Pagou.ai para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    const data = response.data;
    
    let internalMethodMap: Record<string, any> = {
      pix: "pix",
      credit_card: "credit_card",
      voucher: "boleto",
    };

    return {
      transactionId: data.id,
      gatewayTransactionId: data.id,
      status: this.toPaymentStatus(data.status),
      amount: data.amount / 100,
      currency: data.currency || "BRL",
      paymentMethod: internalMethodMap[data.method] || "credit_card",
      createdAt: new Date().toISOString(), // Fallback
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Mapeia status do Pagou.ai para status interno do SyncAds
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

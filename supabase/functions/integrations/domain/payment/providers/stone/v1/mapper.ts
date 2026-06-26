import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static getDocumentType(doc: string): "CPF" | "CNPJ" {
    const cleanDoc = doc.replace(/\D/g, "");
    return cleanDoc.length <= 11 ? "CPF" : "CNPJ";
  }

  private static formatZipCode(zip: string): string {
    return zip.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do Stone
   */
  static toPaymentPayload(request: PaymentRequest, merchantId: string): PaymentRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
    const docType = this.getDocumentType(request.customer.document);
    const centsAmount = Math.round(request.amount * 100);

    let paymentMethod: "pix" | "credit_card" | "debit_card" | "boleto" = "pix";
    if (request.paymentMethod === "credit_card") {
      paymentMethod = "credit_card";
    } else if (request.paymentMethod === "debit_card") {
      paymentMethod = "debit_card";
    } else if (request.paymentMethod === "boleto") {
      paymentMethod = "boleto";
    }

    const payload: PaymentRequestPayload = {
      amount: centsAmount,
      currency: "BRL",
      payment_method: paymentMethod,
      merchant_id: merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: docType,
          number: cleanDoc,
        },
      },
      metadata: {
        order_id: request.orderId,
      },
    };

    if (request.customer.phone) {
      const cleanPhone = request.customer.phone.replace(/\D/g, "");
      payload.customer.phone = {
        country_code: "55",
        area_code: cleanPhone.substring(0, 2) || "11",
        number: cleanPhone.substring(2) || "999999999",
      };
    }

    if (paymentMethod === "pix") {
      payload.pix = {
        expiration_seconds: 3600,
      };
    } else if (paymentMethod === "credit_card" && request.card) {
      payload.installments = request.installments || 1;
      payload.capture = true;
      payload.card = {
        number: request.card.number.replace(/\s/g, ""),
        holder_name: request.card.holderName,
        expiration_month: request.card.expiryMonth.padStart(2, "0"),
        expiration_year: request.card.expiryYear.toString().slice(-2),
        cvv: request.card.cvv,
      };
    } else if (paymentMethod === "debit_card" && request.card) {
      payload.card = {
        number: request.card.number.replace(/\s/g, ""),
        holder_name: request.card.holderName,
        expiration_month: request.card.expiryMonth.padStart(2, "0"),
        expiration_year: request.card.expiryYear.toString().slice(-2),
        cvv: request.card.cvv,
      };
    } else if (paymentMethod === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      payload.boleto = {
        due_date: dueDate.toISOString().split("T")[0],
        instructions: "Pagamento processado via Stone",
      };

      if (request.billingAddress) {
        payload.customer.address = {
          street: request.billingAddress.street,
          number: request.billingAddress.number,
          complement: request.billingAddress.complement || "",
          neighborhood: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
        };
      }
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Stone para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "pending";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["paid", "approved", "confirmed", "succeeded"].includes(rawStatus.toLowerCase());

    const result: PaymentResponse = {
      success,
      transactionId: response.metadata?.order_id || response.id,
      gatewayTransactionId: response.id,
      status,
      message: `Transação processada com status: ${rawStatus}`,
    };

    if (response.authorization_code) result.authorizationCode = response.authorization_code;
    if (response.nsu) result.nsu = response.nsu;
    if (response.tid) result.tid = response.tid;
    if (response.authentication_url) result.redirectUrl = response.authentication_url;

    // Pix
    if (response.pix) {
      result.qrCode = response.pix.qr_code;
      result.qrCodeBase64 = response.pix.qr_code_base64;
      result.expiresAt = response.pix.expires_at;
      result.pixData = {
        qrCode: response.pix.qr_code,
        qrCodeBase64: response.pix.qr_code_base64,
        expiresAt: response.pix.expires_at,
        amount: response.amount / 100,
      };
    }

    // Boleto
    if (response.boleto) {
      result.paymentUrl = response.boleto.url;
      result.barcodeNumber = response.boleto.barcode;
      result.digitableLine = response.boleto.line;
      result.boletoData = {
        boletoUrl: response.boleto.url,
        barcode: response.boleto.barcode || "",
        digitableLine: response.boleto.line || "",
        dueDate: response.boleto.due_date || "",
        amount: response.amount / 100,
      };
    }

    return result;
  }

  /**
   * Converte a resposta da API do Stone para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    let method: "pix" | "credit_card" | "debit_card" | "boleto" = "pix";
    if (response.payment_method === "credit_card") method = "credit_card";
    else if (response.payment_method === "debit_card") method = "debit_card";
    else if (response.payment_method === "boleto") method = "boleto";

    return {
      transactionId: response.metadata?.order_id || response.id,
      gatewayTransactionId: response.id,
      status: this.toPaymentStatus(response.status),
      amount: response.amount / 100,
      currency: "BRL",
      paymentMethod: method,
      createdAt: response.created_at || new Date().toISOString(),
      updatedAt: response.updated_at || response.created_at || new Date().toISOString(),
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      paid: "approved",
      approved: "approved",
      confirmed: "approved",
      succeeded: "approved",
      failed: "failed",
      declined: "failed",
      canceled: "cancelled",
      cancelled: "cancelled",
      refunded: "refunded",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

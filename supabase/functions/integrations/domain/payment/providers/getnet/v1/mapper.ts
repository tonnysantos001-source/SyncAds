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

  private static formatPhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do Getnet
   */
  static toPaymentPayload(request: PaymentRequest, sellerId: string): PaymentRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
    const docType = this.getDocumentType(request.customer.document);
    const centsAmount = Math.round(request.amount * 100);

    const nameParts = request.customer.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "Cliente";
    const lastName = nameParts.slice(1).join(" ") || firstName;

    let paymentMethod = "pix";
    if (request.paymentMethod === "credit_card") {
      paymentMethod = "credit";
    } else if (request.paymentMethod === "debit_card") {
      paymentMethod = "debit";
    } else if (request.paymentMethod === "boleto") {
      paymentMethod = "boleto";
    }

    const payload: PaymentRequestPayload = {
      seller_id: sellerId,
      amount: centsAmount,
      currency: "BRL",
      order: {
        order_id: request.orderId,
      },
      customer: {
        customer_id: cleanDoc,
        first_name: firstName,
        last_name: lastName,
        name: request.customer.name,
        email: request.customer.email,
        document_type: docType,
        document_number: cleanDoc,
      },
      payment_method: paymentMethod,
    };

    if (request.customer.phone && payload.customer) {
      payload.customer.phone_number = this.formatPhone(request.customer.phone);
    }

    if (paymentMethod === "pix") {
      payload.pix = {
        expiration_time: 3600,
      };
    } else if (paymentMethod === "credit" && request.card) {
      payload.order = {
        order_id: request.orderId,
        sales_tax: 0,
      };
      payload.device = {
        ip_address: "127.0.0.1",
      };
      payload.credit = {
        delayed: false,
        save_card_data: false,
        transaction_type: "FULL",
        number_installments: request.installments || 1,
        card: {
          number_token: request.card.number.replace(/\s/g, ""),
          cardholder_name: request.card.holderName,
          expiration_month: request.card.expiryMonth.padStart(2, "0"),
          expiration_year: request.card.expiryYear.toString().slice(-2),
          security_code: request.card.cvv,
        },
      };
    } else if (paymentMethod === "debit" && request.card) {
      payload.debit = {
        delayed: false,
        save_card_data: false,
        transaction_type: "FULL",
        number_installments: 1,
        card: {
          number_token: request.card.number.replace(/\s/g, ""),
          cardholder_name: request.card.holderName,
          expiration_month: request.card.expiryMonth.padStart(2, "0"),
          expiration_year: request.card.expiryYear.toString().slice(-2),
          security_code: request.card.cvv,
        },
      };
    } else if (paymentMethod === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      payload.boleto = {
        our_number: request.orderId,
        document_number: cleanDoc,
        expiration_date: dueDate.toISOString().split("T")[0],
        instructions: "Não receber após vencimento",
        provider: "santander",
      };

      if (request.billingAddress && payload.customer) {
        payload.customer.billing_address = {
          street: request.billingAddress.street,
          number: request.billingAddress.number,
          complement: request.billingAddress.complement || "",
          district: request.billingAddress.neighborhood,
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          postal_code: request.billingAddress.zipCode.replace(/\D/g, ""),
          country: "Brasil",
        };
      }
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Getnet para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const rawStatus = response.status || "PENDING";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["approved", "authorized", "confirmed"].includes(rawStatus.toLowerCase()) || rawStatus.toLowerCase() === "pending";

    const result: PaymentResponse = {
      success,
      transactionId: response.payment_id,
      gatewayTransactionId: response.payment_id,
      status,
      message: `Cobrança processada no Getnet com status: ${rawStatus}`,
    };

    if (response.nsu) result.nsu = response.nsu;
    if (response.authorization_code) result.authorizationCode = response.authorization_code;

    // Pix
    if (response.pix) {
      result.qrCode = response.pix.qr_code;
      result.qrCodeBase64 = response.pix.qr_code_base64;
      result.expiresAt = response.pix.expiration_date_qrcode || new Date(Date.now() + 3600000).toISOString();
      result.pixData = {
        qrCode: response.pix.qr_code,
        qrCodeBase64: response.pix.qr_code_base64,
        expiresAt: result.expiresAt,
        amount: response.amount / 100,
      };
    }

    // Boleto
    if (response.boleto) {
      result.paymentUrl = response.boleto.pdf;
      result.barcodeNumber = response.boleto.bar_code;
      result.digitableLine = response.boleto.digitable_line;
      result.expiresAt = response.boleto.expiration_date;
      result.boletoData = {
        boletoUrl: response.boleto.pdf || "",
        barcode: response.boleto.bar_code || "",
        digitableLine: response.boleto.digitable_line || "",
        dueDate: response.boleto.expiration_date || "",
        amount: response.amount / 100,
      };
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do Getnet para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const rawMethod = response.payment_type || "pix";
    let method: any = "pix";
    if (rawMethod === "credit") method = "credit_card";
    else if (rawMethod === "debit") method = "debit_card";
    else if (rawMethod === "boleto") method = "boleto";

    return {
      transactionId: response.payment_id,
      gatewayTransactionId: response.payment_id,
      status: this.toPaymentStatus(response.status),
      amount: response.amount / 100,
      currency: "BRL",
      paymentMethod: method,
      createdAt: response.create_date || new Date().toISOString(),
      updatedAt: response.update_date || response.create_date || new Date().toISOString(),
      paidAt: response.status === "APPROVED" ? response.update_date : undefined,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      PENDING: "pending",
      AUTHORIZED: "approved",
      CONFIRMED: "approved",
      APPROVED: "approved",
      DENIED: "failed",
      ERROR: "failed",
      CANCELED: "cancelled",
      REFUNDED: "refunded",
    };
    return map[status.toUpperCase()] || "pending";
  }
}

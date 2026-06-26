import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static getDocumentType(doc: string): "individual" | "company" {
    const cleanDoc = doc.replace(/\D/g, "");
    return cleanDoc.length <= 11 ? "individual" : "company";
  }

  private static formatAmountToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private static formatZipCode(zip: string): string {
    return zip.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do Pagar.me
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
    const docType = this.getDocumentType(request.customer.document);
    const centsAmount = this.formatAmountToCents(request.amount);

    let paymentMethod: "pix" | "credit_card" | "debit_card" | "boleto" = "pix";
    if (request.paymentMethod === "credit_card") {
      paymentMethod = "credit_card";
    } else if (request.paymentMethod === "debit_card") {
      paymentMethod = "debit_card";
    } else if (request.paymentMethod === "boleto") {
      paymentMethod = "boleto";
    }

    const payload: PaymentRequestPayload = {
      code: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: cleanDoc,
        type: docType,
      },
      items: [
        {
          code: request.orderId,
          description: `Pedido ${request.orderId}`,
          amount: centsAmount,
          quantity: 1,
        },
      ],
      payments: [],
    };

    if (request.customer.phone) {
      const cleanPhone = request.customer.phone.replace(/\D/g, "");
      payload.customer.phones = {
        mobile_phone: {
          country_code: "55",
          area_code: cleanPhone.substring(0, 2) || "11",
          number: cleanPhone.substring(2) || "999999999",
        },
      };
    }

    // Mapeamento específico por método
    if (paymentMethod === "pix") {
      payload.payments.push({
        payment_method: "pix",
        pix: {
          expires_in: 3600,
        },
      });
    } else if (paymentMethod === "credit_card" && request.card) {
      payload.payments.push({
        payment_method: "credit_card",
        credit_card: {
          installments: request.installments || 1,
          statement_descriptor: "SYNCADS",
          card: {
            number: request.card.number.replace(/\s/g, ""),
            holder_name: request.card.holderName,
            exp_month: parseInt(request.card.expiryMonth),
            exp_year: parseInt(request.card.expiryYear),
            cvv: request.card.cvv,
            billing_address: request.billingAddress ? {
              line_1: `${request.billingAddress.number} ${request.billingAddress.street}`,
              line_2: request.billingAddress.complement || "",
              zip_code: this.formatZipCode(request.billingAddress.zipCode),
              city: request.billingAddress.city,
              state: request.billingAddress.state,
              country: "BR",
            } : undefined,
          },
        },
      });
    } else if (paymentMethod === "debit_card" && request.card) {
      payload.payments.push({
        payment_method: "debit_card",
        debit_card: {
          card: {
            number: request.card.number.replace(/\s/g, ""),
            holder_name: request.card.holderName,
            exp_month: parseInt(request.card.expiryMonth),
            exp_year: parseInt(request.card.expiryYear),
            cvv: request.card.cvv,
          },
        },
      });
    } else if (paymentMethod === "boleto") {
      const dueAt = new Date();
      dueAt.setDate(dueAt.getDate() + 3);

      payload.payments.push({
        payment_method: "boleto",
        boleto: {
          due_at: dueAt.toISOString(),
          document_number: request.orderId,
        },
      });

      if (request.billingAddress) {
        payload.customer.address = {
          line_1: `${request.billingAddress.number} ${request.billingAddress.street}`,
          line_2: request.billingAddress.complement || "",
          zip_code: this.formatZipCode(request.billingAddress.zipCode),
          city: request.billingAddress.city,
          state: request.billingAddress.state,
          country: "BR",
        };
      }
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Pagar.me para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const charge = response.charges?.[0];
    const status = this.toPaymentStatus(charge?.status || response.status || "pending");
    const success = ["paid", "approved", "captured"].includes((charge?.status || response.status || "").toLowerCase());
    const lastTx = charge?.last_transaction;

    const result: PaymentResponse = {
      success,
      transactionId: response.id,
      gatewayTransactionId: charge?.id || response.id,
      status,
      message: `Pedido processado com status: ${charge?.status || response.status}`,
    };

    if (lastTx) {
      if (lastTx.acquirer_auth_code) result.authorizationCode = lastTx.acquirer_auth_code;
      if (lastTx.acquirer_nsu) result.nsu = lastTx.acquirer_nsu;
      if (lastTx.acquirer_tid) result.tid = lastTx.acquirer_tid;

      // Pix
      if (lastTx.qr_code) {
        result.qrCode = lastTx.qr_code;
        result.qrCodeBase64 = lastTx.qr_code_url;
        result.expiresAt = lastTx.expires_at;
        result.pixData = {
          qrCode: lastTx.qr_code,
          qrCodeBase64: lastTx.qr_code_url,
          expiresAt: lastTx.expires_at,
          amount: response.amount / 100,
        };
      }

      // Boleto
      if (lastTx.url && charge.payment_method === "boleto") {
        result.paymentUrl = lastTx.url;
        result.barcodeNumber = lastTx.barcode;
        result.digitableLine = lastTx.line;
        result.boletoData = {
          boletoUrl: lastTx.url,
          barcode: lastTx.barcode || "",
          digitableLine: lastTx.line || "",
          dueDate: lastTx.due_at || "",
          amount: response.amount / 100,
        };
      }

      // Debit Redirect
      if (lastTx.url && charge.payment_method === "debit_card") {
        result.redirectUrl = lastTx.url;
      }
    }

    return result;
  }

  /**
   * Converte a resposta da API do Pagar.me para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const charge = response.charges?.[0] || response;
    
    let method: "pix" | "credit_card" | "debit_card" | "boleto" = "pix";
    if (charge.payment_method === "credit_card") method = "credit_card";
    else if (charge.payment_method === "debit_card") method = "debit_card";
    else if (charge.payment_method === "boleto") method = "boleto";

    return {
      transactionId: response.id || charge.id,
      gatewayTransactionId: charge.id,
      status: this.toPaymentStatus(charge.status),
      amount: charge.amount / 100,
      currency: "BRL",
      paymentMethod: method,
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
      paid: "approved",
      captured: "approved",
      approved: "approved",
      processing: "processing",
      failed: "failed",
      declined: "failed",
      canceled: "cancelled",
      overdue: "failed",
      refunded: "refunded",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

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

  private static detectCardBrand(cardNumber?: string): string {
    if (!cardNumber) return "Visa";
    const clean = cardNumber.replace(/\s/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^3[47]/.test(clean)) return "Amex";
    if (/^6011|^65|^64[4-9]|^622/.test(clean)) return "Discover";
    if (/^(606282|5067|5090|650|651|655)/.test(clean)) return "Elo";
    if (/^(38|60|65)/.test(clean)) return "Hipercard";
    return "Visa"; // Fallback
  }

  /**
   * Converte a request interna do SyncAds para o formato da API da Cielo
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
    const docType = this.getDocumentType(request.customer.document);
    const centsAmount = Math.round(request.amount * 100);

    let paymentMethod: "Pix" | "CreditCard" | "DebitCard" | "Boleto" = "Pix";
    if (request.paymentMethod === "credit_card") {
      paymentMethod = "CreditCard";
    } else if (request.paymentMethod === "debit_card") {
      paymentMethod = "DebitCard";
    } else if (request.paymentMethod === "boleto") {
      paymentMethod = "Boleto";
    }

    const payload: PaymentRequestPayload = {
      MerchantOrderId: request.orderId,
      Customer: {
        Name: request.customer.name,
        Email: request.customer.email,
        Identity: cleanDoc,
        IdentityType: docType,
      },
      Payment: {
        Type: paymentMethod,
        Amount: centsAmount,
      },
    };

    if (request.billingAddress) {
      payload.Customer.Address = {
        Street: request.billingAddress.street,
        Number: request.billingAddress.number,
        Complement: request.billingAddress.complement || "",
        District: request.billingAddress.neighborhood,
        City: request.billingAddress.city,
        State: request.billingAddress.state,
        Country: "BRA",
        ZipCode: this.formatZipCode(request.billingAddress.zipCode),
      };
    }

    if (paymentMethod === "Pix") {
      payload.Payment.QrCodeExpiration = 3600;
    } else if (paymentMethod === "CreditCard" && request.card) {
      payload.Payment.Currency = "BRL";
      payload.Payment.Country = "BRA";
      payload.Payment.Installments = request.installments || 1;
      payload.Payment.Capture = true;
      payload.Payment.SoftDescriptor = `SYNCADS`;
      payload.Payment.CreditCard = {
        CardNumber: request.card.number.replace(/\s/g, ""),
        Holder: request.card.holderName,
        ExpirationDate: `${request.card.expiryMonth}/${request.card.expiryYear}`,
        SecurityCode: request.card.cvv,
        Brand: this.detectCardBrand(request.card.number),
      };
    } else if (paymentMethod === "DebitCard" && request.card) {
      const supabaseUrl = (typeof Deno !== "undefined" ? Deno.env.get("SUPABASE_URL") : null) || "https://api.syncads.ai";
      payload.Payment.Authenticate = true;
      payload.Payment.ReturnUrl = `${supabaseUrl}/functions/v1/payment-webhook/cielo/return`;
      payload.Payment.DebitCard = {
        CardNumber: request.card.number.replace(/\s/g, ""),
        Holder: request.card.holderName,
        ExpirationDate: `${request.card.expiryMonth}/${request.card.expiryYear}`,
        SecurityCode: request.card.cvv,
        Brand: this.detectCardBrand(request.card.number),
      };
    } else if (paymentMethod === "Boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      payload.Payment.Provider = "Bradesco2";
      payload.Payment.Assignor = "SyncAds";
      payload.Payment.Demonstrative = `Pedido ${request.orderId}`;
      payload.Payment.ExpirationDate = dueDate.toISOString().split("T")[0];
    }

    return payload;
  }

  /**
   * Converte a resposta da API da Cielo para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const payment = response.Payment;
    const rawStatus = payment.Status;
    const status = this.toPaymentStatus(rawStatus);
    // Na Cielo, status 1 = Autorizado (Cartão), status 2 = Pago (Geral), status 12 = Pendente (Pix/Boleto)
    const success = [1, 2, 12].includes(rawStatus);

    const result: PaymentResponse = {
      success,
      transactionId: response.MerchantOrderId || payment.PaymentId,
      gatewayTransactionId: payment.PaymentId,
      status,
      message: payment.ReturnMessage || `Transação processada com status: ${rawStatus}`,
    };

    if (payment.AuthorizationCode) result.authorizationCode = payment.AuthorizationCode;
    if (payment.ProofOfSale) result.nsu = payment.ProofOfSale;
    if (payment.Tid) result.tid = payment.Tid;
    if (payment.AuthenticationUrl) result.redirectUrl = payment.AuthenticationUrl;

    // Pix
    if (payment.QrCodeString) {
      result.qrCode = payment.QrCodeString;
      result.qrCodeBase64 = payment.QrCodeBase64Image;
      result.expiresAt = new Date(Date.now() + 3600000).toISOString();
      result.pixData = {
        qrCode: payment.QrCodeString,
        qrCodeBase64: payment.QrCodeBase64Image,
        expiresAt: result.expiresAt,
        amount: payment.Amount / 100,
      };
    }

    // Boleto
    if (payment.Type === "Boleto" || payment.Url) {
      // Para boleto, URL de pagamento contém o boleto
      if (payment.Type === "Boleto") {
        result.paymentUrl = payment.Url;
        result.barcodeNumber = payment.BarCodeNumber;
        result.digitableLine = payment.DigitableLine;
        result.boletoData = {
          boletoUrl: payment.Url || "",
          barcode: payment.BarCodeNumber || "",
          digitableLine: payment.DigitableLine || "",
          dueDate: payment.ExpirationDate || "",
          amount: payment.Amount / 100,
        };
      }
    }

    return result;
  }

  /**
   * Converte a resposta da API da Cielo para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const payment = response.Payment || response;
    
    let method: "pix" | "credit_card" | "debit_card" | "boleto" = "pix";
    if (payment.Type === "CreditCard") method = "credit_card";
    else if (payment.Type === "DebitCard") method = "debit_card";
    else if (payment.Type === "Boleto") method = "boleto";

    return {
      transactionId: response.MerchantOrderId || payment.PaymentId,
      gatewayTransactionId: payment.PaymentId,
      status: this.toPaymentStatus(payment.Status),
      amount: payment.Amount / 100,
      currency: "BRL",
      paymentMethod: method,
      createdAt: new Date().toISOString(), // Cielo não retorna a data de criação diretamente na query simples
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Normaliza status
   * Cielo Status Codes:
   * 0 - NotFinished
   * 1 - Authorized (credit card)
   * 2 - PaymentConfirmed (paid)
   * 3 - Denied
   * 10 - Voided
   * 11 - Refunded
   * 12 - Pending (boleto / pix waiting payment)
   */
  static toPaymentStatus(status: number): PaymentStatus {
    const map: Record<number, PaymentStatus> = {
      0: "pending",
      1: "approved",
      2: "approved",
      3: "failed",
      10: "cancelled",
      11: "refunded",
      12: "pending",
    };
    return map[status] || "pending";
  }
}

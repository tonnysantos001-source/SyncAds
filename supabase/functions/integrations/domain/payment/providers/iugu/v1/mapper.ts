import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { InvoiceResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static formatZipCode(zip: string): string {
    return zip.replace(/\D/g, "");
  }

  /**
   * Converte a request do SyncAds para payload de cliente da Iugu
   */
  static toCustomerPayload(request: PaymentRequest): any {
    const doc = this.formatDocument(request.customer.document);
    return {
      email: request.customer.email,
      name: request.customer.name,
      cpf_cnpj: doc,
      phone_prefix: request.customer.phone?.substring(0, 2) || "11",
      phone: request.customer.phone?.substring(2) || "999999999",
    };
  }

  /**
   * Converte a request interna do SyncAds para o formato de Invoice da Iugu (Pix/Boleto)
   */
  static toInvoicePayload(request: PaymentRequest, customerId: string): any {
    const doc = this.formatDocument(request.customer.document);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const payload: any = {
      email: request.customer.email,
      customer_id: customerId,
      due_date: dueDate.toISOString().split("T")[0],
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: doc,
        name: request.customer.name,
        phone_prefix: request.customer.phone?.substring(0, 2) || "11",
        phone: request.customer.phone?.substring(2) || "999999999",
        email: request.customer.email,
      },
      ensure_workday_due_date: false,
    };

    if (request.paymentMethod === "pix") {
      payload.payable_with = "pix";
    } else if (request.paymentMethod === "boleto") {
      payload.payable_with = "bank_slip";
    }

    if (request.billingAddress) {
      payload.payer.address = {
        street: request.billingAddress.street,
        number: request.billingAddress.number,
        district: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        zip_code: this.formatZipCode(request.billingAddress.zipCode),
      };
    }

    return payload;
  }

  /**
   * Converte a request para Token de Cartão da Iugu
   */
  static toPaymentTokenPayload(request: PaymentRequest, accountId: string, isTestMode: boolean): any {
    if (!request.card) throw new Error("Card details are required for token generation");

    return {
      account_id: accountId,
      method: "credit_card",
      test: isTestMode,
      data: {
        number: request.card.number.replace(/\s/g, ""),
        verification_value: request.card.cvv,
        first_name: request.card.holderName.split(" ")[0],
        last_name: request.card.holderName.split(" ").slice(1).join(" ") || "Silva",
        month: request.card.expiryMonth,
        year: request.card.expiryYear,
      },
    };
  }

  /**
   * Converte a request para Cobrança de Cartão da Iugu (Charge)
   */
  static toChargePayload(request: PaymentRequest, token: string): any {
    const doc = this.formatDocument(request.customer.document);

    return {
      token,
      email: request.customer.email,
      months: 1,
      items: [
        {
          description: `Pedido ${request.orderId}`,
          quantity: 1,
          price_cents: Math.round(request.amount * 100),
        },
      ],
      payer: {
        cpf_cnpj: doc,
        name: request.customer.name,
        phone_prefix: request.customer.phone?.substring(0, 2) || "11",
        phone: request.customer.phone?.substring(2) || "999999999",
        email: request.customer.email,
      },
    };
  }

  /**
   * Converte a resposta da API do Iugu para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: any): PaymentResponse {
    // Para boleto/pix, o retorno costuma ser a Invoice
    // Para cartao, a resposta contem a fatura no campo invoice_id
    const status = this.toPaymentStatus(response.status || (response.success ? "paid" : "pending"));
    const success = response.success || ["approved", "paid"].includes(String(response.status).toLowerCase());

    const invoiceId = response.invoice_id || response.id;

    const paymentResponse: PaymentResponse = {
      success,
      transactionId: String(invoiceId),
      gatewayTransactionId: String(invoiceId),
      status,
      message: response.message || `Pagamento processado com status: ${response.status}`,
    };

    // Pix
    if (response.pix?.qrcode) {
      paymentResponse.qrCode = response.pix.qrcode;
      paymentResponse.pixKey = response.pix.qrcode;
      paymentResponse.pixData = {
        qrCode: response.pix.qrcode,
        amount: (response.total_cents || 0) / 100,
      };
    } else if (response.pix?.qrcode_image_url) {
      paymentResponse.qrCodeBase64 = response.pix.qrcode_image_url;
    }

    // Boleto
    if (response.secure_url && response.payable_with === "bank_slip") {
      paymentResponse.paymentUrl = response.secure_url;
      paymentResponse.barcodeNumber = response.bank_slip?.barcode;
      paymentResponse.digitableLine = response.bank_slip?.digitable_line;
      paymentResponse.boletoData = {
        boletoUrl: response.secure_url,
        barcode: response.bank_slip?.barcode || "",
        digitableLine: response.bank_slip?.digitable_line || "",
        dueDate: response.due_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: (response.total_cents || 0) / 100,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API do Iugu para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: InvoiceResponsePayload): PaymentStatusResponse {
    return {
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status: this.toPaymentStatus(response.status),
      amount: (response.total_cents || 0) / 100,
      currency: "BRL",
      paymentMethod: response.bank_slip ? "boleto" : response.pix ? "pix" : "credit_card",
      createdAt: response.created_at || new Date().toISOString(),
      updatedAt: response.updated_at || response.created_at || new Date().toISOString(),
      paidAt: response.paid_at || undefined,
    };
  }

  /**
   * Mapeia status do Iugu para status interno do SyncAds
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      approved: "approved",
      paid: "approved",
      failed: "failed",
      canceled: "cancelled",
      cancelled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

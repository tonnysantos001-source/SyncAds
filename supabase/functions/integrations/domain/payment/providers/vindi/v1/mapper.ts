import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { BillResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static formatPhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private static detectCardBrand(cardNumber?: string): string {
    if (!cardNumber) return "visa";
    const number = cardNumber.replace(/\s/g, "");
    if (/^4/.test(number)) return "visa";
    if (/^5[1-5]/.test(number)) return "mastercard";
    if (/^3[47]/.test(number)) return "amex";
    if (/^6(?:011|5)/.test(number)) return "discover";
    if (/^3(?:0[0-5]|[68])/.test(number)) return "diners_club";
    if (/^35/.test(number)) return "jcb";
    if (/^636/.test(number)) return "elo";
    if (/^606282/.test(number)) return "hipercard";
    return "visa";
  }

  /**
   * Converte a request do SyncAds para payload de cliente da Vindi
   */
  static toCustomerPayload(request: PaymentRequest): any {
    const doc = this.formatDocument(request.customer.document);
    const payload: any = {
      name: request.customer.name,
      email: request.customer.email,
      registry_code: doc,
      code: doc,
    };

    if (request.customer.phone) {
      payload.phones = [
        {
          phone_type: "mobile",
          number: this.formatPhone(request.customer.phone),
        },
      ];
    }

    return payload;
  }

  /**
   * Converte a request para Perfil de Pagamento da Vindi
   */
  static toPaymentProfilePayload(request: PaymentRequest, customerId: number): any {
    if (!request.card) throw new Error("Card details are required for payment profile creation");

    return {
      holder_name: request.card.holderName,
      card_expiration: `${request.card.expiryMonth}/${request.card.expiryYear}`,
      card_number: request.card.number.replace(/\s/g, ""),
      card_cvv: request.card.cvv,
      customer_id: customerId,
      payment_method_code: "credit_card",
      payment_company_code: this.detectCardBrand(request.card.number),
    };
  }

  /**
   * Converte a request para payload de Cobrança da Vindi (Bill)
   */
  static toBillPayload(request: PaymentRequest, customerId: number, profileId?: number): any {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3);

    const payload: any = {
      customer_id: customerId,
      bill_items: [
        {
          product_id: null,
          amount: request.amount, // Vindi aceita decimal float direto
          description: `Pedido ${request.orderId}`,
        },
      ],
    };

    if (request.paymentMethod === "credit_card" && profileId) {
      payload.payment_method_code = "credit_card";
      payload.payment_profile = { id: profileId };
    } else if (request.paymentMethod === "boleto") {
      payload.payment_method_code = "bank_slip";
      payload.due_at = dueDate.toISOString().split("T")[0];
    } else {
      // Fallback
      payload.payment_method_code = "bank_slip";
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Vindi para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: any): PaymentResponse {
    const bill = response.bill || response;
    const status = this.toPaymentStatus(bill.status);
    const success = ["approved", "paid"].includes(bill.status.toLowerCase());

    const paymentResponse: PaymentResponse = {
      success,
      transactionId: String(bill.id),
      gatewayTransactionId: String(bill.id),
      status,
      message: `Fatura criada com status: ${bill.status}`,
    };

    const charge = bill.charges?.[0];

    // Boleto
    if (charge?.print_url && bill.payment_method?.code === "bank_slip") {
      paymentResponse.paymentUrl = charge.print_url;
      paymentResponse.barcodeNumber = charge.bank_slip_barcode;
      paymentResponse.digitableLine = charge.bank_slip_line;
      paymentResponse.boletoData = {
        boletoUrl: charge.print_url,
        barcode: charge.bank_slip_barcode || "",
        digitableLine: charge.bank_slip_line || "",
        dueDate: bill.due_at || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: parseFloat(bill.amount) || 0,
      };
    }

    return paymentResponse;
  }

  /**
   * Converte a resposta da API do Vindi para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: BillResponsePayload): PaymentStatusResponse {
    return {
      transactionId: String(response.id),
      gatewayTransactionId: String(response.id),
      status: this.toPaymentStatus(response.status),
      amount: response.amount,
      currency: "BRL",
      paymentMethod: response.payment_method_code === "bank_slip" ? "boleto" : "credit_card",
      createdAt: response.created_at || new Date().toISOString(),
      updatedAt: response.updated_at || response.created_at || new Date().toISOString(),
    };
  }

  /**
   * Mapeia status do Vindi para status interno do SyncAds
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      review: "processing",
      paid: "approved",
      approved: "approved",
      succeeded: "approved",
      canceled: "cancelled",
      cancelled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

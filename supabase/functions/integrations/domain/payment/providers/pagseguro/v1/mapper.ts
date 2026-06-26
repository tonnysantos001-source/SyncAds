import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static formatAmountToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  private static formatZipCode(zip: string): string {
    return zip.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do PagSeguro
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
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
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        tax_id: cleanDoc,
      },
      items: [
        {
          reference_id: request.orderId,
          name: `Pedido ${request.orderId}`,
          quantity: 1,
          unit_amount: centsAmount,
        },
      ],
      notification_urls: [
        `${(typeof Deno !== "undefined" ? Deno.env.get("SUPABASE_URL") : null) || "https://api.syncads.ai"}/functions/v1/payment-webhook/pagseguro`,
      ],
    };

    if (paymentMethod === "pix") {
      payload.qr_codes = [
        {
          amount: {
            value: centsAmount,
          },
          expiration_date: new Date(Date.now() + 3600000).toISOString(),
        },
      ];
    } else if (paymentMethod === "credit_card" && request.card) {
      payload.charges = [
        {
          reference_id: request.orderId,
          description: `Pagamento do pedido ${request.orderId}`,
          amount: {
            value: centsAmount,
            currency: "BRL",
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: request.installments || 1,
            capture: true,
            card: {
              number: request.card.number.replace(/\s/g, ""),
              exp_month: request.card.expiryMonth.padStart(2, "0"),
              exp_year: request.card.expiryYear.toString().slice(-2),
              security_code: request.card.cvv,
              holder: {
                name: request.card.holderName,
              },
              store: false,
            },
          },
        },
      ];
    } else if (paymentMethod === "debit_card" && request.card) {
      payload.charges = [
        {
          reference_id: request.orderId,
          amount: {
            value: centsAmount,
            currency: "BRL",
          },
          payment_method: {
            type: "DEBIT_CARD",
            card: {
              number: request.card.number.replace(/\s/g, ""),
              exp_month: request.card.expiryMonth.padStart(2, "0"),
              exp_year: request.card.expiryYear.toString().slice(-2),
              security_code: request.card.cvv,
              holder: {
                name: request.card.holderName,
              },
            },
          },
        },
      ];
    } else if (paymentMethod === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      payload.charges = [
        {
          reference_id: request.orderId,
          description: `Pagamento do pedido ${request.orderId}`,
          amount: {
            value: centsAmount,
            currency: "BRL",
          },
          payment_method: {
            type: "BOLETO",
            boleto: {
              due_date: dueDate.toISOString().split("T")[0],
              instruction_lines: {
                line_1: "Pagamento do pedido",
                line_2: "Não receber após o vencimento",
              },
              holder: {
                name: request.customer.name,
                tax_id: cleanDoc,
                email: request.customer.email,
                address: request.billingAddress ? {
                  street: request.billingAddress.street,
                  number: request.billingAddress.number,
                  locality: request.billingAddress.neighborhood,
                  city: request.billingAddress.city,
                  region_code: request.billingAddress.state,
                  country: "BRA",
                  postal_code: this.formatZipCode(request.billingAddress.zipCode),
                } : undefined,
              },
            },
          },
        },
      ];
    }

    return payload;
  }

  /**
   * Converte a resposta da API do PagSeguro para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload): PaymentResponse {
    const charge = response.charges?.[0];
    const qrCodeObj = response.qr_codes?.[0];
    
    // Status principal
    const rawStatus = charge?.status || (response.id ? "pending" : "failed");
    const status = this.toPaymentStatus(rawStatus);
    const success = ["paid", "approved", "authorized", "pending"].includes(rawStatus.toLowerCase());

    const result: PaymentResponse = {
      success,
      transactionId: response.reference_id || response.id,
      gatewayTransactionId: response.id,
      status,
      message: `Pedido processado com status: ${rawStatus}`,
    };

    if (qrCodeObj) {
      result.qrCode = qrCodeObj.text;
      result.qrCodeBase64 = qrCodeObj.links?.find((l: any) => l.rel === "QRCODE.PNG")?.href || qrCodeObj.links?.[0]?.href;
      result.expiresAt = qrCodeObj.expiration_date;
      result.paymentUrl = response.links?.find((l: any) => l.rel === "PAY")?.href;
      result.pixData = {
        qrCode: qrCodeObj.text,
        qrCodeBase64: result.qrCodeBase64,
        expiresAt: qrCodeObj.expiration_date,
        amount: (charge?.amount?.value || response.charges?.[0]?.amount?.value || 0) / 100,
      };
    }

    if (charge) {
      if (charge.payment_method?.authorization_code) result.authorizationCode = charge.payment_method.authorization_code;
      if (charge.payment_method?.nsu) result.nsu = charge.payment_method.nsu;
      if (charge.payment_method?.tid) result.tid = charge.payment_method.tid;

      // Boleto
      const boleto = charge.payment_method?.boleto;
      if (boleto) {
        const payLink = boleto.links?.find((l: any) => l.rel === "PAY")?.href || boleto.links?.[0]?.href;
        result.paymentUrl = payLink;
        result.barcodeNumber = boleto.barcode;
        result.digitableLine = boleto.formatted_barcode;
        result.boletoData = {
          boletoUrl: payLink || "",
          barcode: boleto.barcode || "",
          digitableLine: boleto.formatted_barcode || "",
          dueDate: boleto.due_date || "",
          amount: charge.amount.value / 100,
        };
      }

      // Debit redirect link
      if (charge.payment_method?.type === "DEBIT_CARD") {
        const redirectUrl = charge.links?.find((l: any) => l.rel === "PAY")?.href;
        if (redirectUrl) result.redirectUrl = redirectUrl;
      }
    }

    return result;
  }

  /**
   * Converte a resposta da API do PagSeguro para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const charge = response.charges?.[0] || response;
    
    let method: "pix" | "credit_card" | "debit_card" | "boleto" = "pix";
    if (charge.payment_method?.type === "CREDIT_CARD") method = "credit_card";
    else if (charge.payment_method?.type === "DEBIT_CARD") method = "debit_card";
    else if (charge.payment_method?.type === "BOLETO") method = "boleto";

    const cents = charge.amount?.value || 0;

    return {
      transactionId: response.reference_id || response.id,
      gatewayTransactionId: response.id || charge.id,
      status: this.toPaymentStatus(charge.status || response.status || "WAITING"),
      amount: cents / 100,
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
      waiting: "pending",
      authorized: "approved",
      paid: "approved",
      in_analysis: "processing",
      declined: "failed",
      canceled: "cancelled",
      refunded: "refunded",
    };
    return map[status.toLowerCase()] || "pending";
  }
}

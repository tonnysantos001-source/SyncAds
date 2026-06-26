import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { OrderRequestPayload, PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  private static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  private static getDocumentType(doc: string): "CPF" | "CNPJ" {
    const cleanDoc = doc.replace(/\D/g, "");
    return cleanDoc.length <= 11 ? "CPF" : "CNPJ";
  }

  private static formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    // Se tiver 55 no início, remove para pegar o ddd + número
    const withoutDdi = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;
    return withoutDdi.substring(2) || "999999999";
  }

  private static formatAreaCode(phone: string): string {
    const cleaned = phone.replace(/\D/g, "");
    const withoutDdi = cleaned.startsWith("55") ? cleaned.slice(2) : cleaned;
    return withoutDdi.substring(0, 2) || "11";
  }

  /**
   * Converte a request interna do SyncAds para o formato de Ordem do Wirecard
   */
  static toOrderPayload(request: PaymentRequest): OrderRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
    const docType = this.getDocumentType(request.customer.document);
    const centsAmount = Math.round(request.amount * 100);

    const payload: OrderRequestPayload = {
      ownId: request.orderId,
      amount: {
        currency: request.currency || "BRL",
        total: centsAmount,
      },
      customer: {
        ownId: request.userId,
        fullname: request.customer.name,
        email: request.customer.email,
        taxDocument: {
          type: docType,
          number: cleanDoc,
        },
      },
      items: [
        {
          product: `Pedido ${request.orderId}`,
          quantity: 1,
          detail: request.orderId,
          price: centsAmount,
        },
      ],
    };

    if (request.customer.phone) {
      payload.customer.phone = {
        countryCode: "55",
        areaCode: this.formatAreaCode(request.customer.phone),
        number: this.formatPhone(request.customer.phone),
      };
    }

    return payload;
  }

  /**
   * Converte a request interna do SyncAds para o formato de Pagamento do Wirecard
   */
  static toPaymentPayload(request: PaymentRequest): PaymentRequestPayload {
    const cleanDoc = this.formatDocument(request.customer.document);
    const docType = this.getDocumentType(request.customer.document);

    let method: "PIX" | "CREDIT_CARD" | "BOLETO" = "PIX";
    if (request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card") {
      method = "CREDIT_CARD"; // Moip trata cartão pelo fluxo de CREDIT_CARD
    } else if (request.paymentMethod === "boleto") {
      method = "BOLETO";
    }

    const payload: PaymentRequestPayload = {
      installmentCount: request.installments || 1,
      fundingInstrument: {
        method,
      },
    };

    if (method === "CREDIT_CARD" && request.card) {
      const expirationYear = request.card.expiryYear.toString();
      // O Moip exige o ano com 2 dígitos ou 4 dígitos? Geralmente 2 ou 4. Vamos pegar 2 dígitos se maior que 2000
      const formattedYear = expirationYear.length === 4 ? expirationYear.slice(-2) : expirationYear;

      payload.fundingInstrument.creditCard = {
        holder: {
          fullname: request.card.holderName || request.customer.name,
          birthDate: request.customer.birthDate || "1990-01-01",
          taxDocument: {
            type: docType,
            number: cleanDoc,
          },
          phone: {
            countryCode: "55",
            areaCode: this.formatAreaCode(request.customer.phone || ""),
            number: this.formatPhone(request.customer.phone || ""),
          },
        },
      };
    } else if (method === "BOLETO") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      payload.fundingInstrument.boleto = {
        expirationDate: dueDate.toISOString().split("T")[0],
        instructionLines: {
          first: "Não receber após o vencimento",
          second: "Pagamento do pedido " + request.orderId,
        },
      };
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Wirecard para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload, orderOwnId: string): PaymentResponse {
    const rawStatus = response.status || "WAITING";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["AUTHORIZED", "SETTLED", "WAITING", "IN_ANALYSIS"].includes(rawStatus);

    const result: PaymentResponse = {
      success,
      transactionId: orderOwnId,
      gatewayTransactionId: response.id,
      status,
      message: `Pagamento processado no Wirecard com status: ${rawStatus}`,
    };

    // Pix
    if (response.qrCode) {
      result.qrCode = response.qrCode.text;
      result.qrCodeBase64 = response.qrCode.image;
      result.expiresAt = response.qrCode.expirationDate;
      result.pixData = {
        qrCode: response.qrCode.text,
        qrCodeBase64: response.qrCode.image,
        expiresAt: response.qrCode.expirationDate,
        amount: response.amount.total / 100,
      };
    }

    // Boleto
    const boletoLink = response._links?.payBoleto;
    if (boletoLink) {
      result.paymentUrl = boletoLink.pdf;
      // Moip retorna barcode / digitableLine no payload do boleto se disponível, ou podemos extrair dos eventos/links.
      // Adicionamos placeholders se não vier direto na API
      result.boletoData = {
        boletoUrl: boletoLink.pdf,
        barcode: "",
        digitableLine: "",
        dueDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().split("T")[0],
        amount: response.amount.total / 100,
      };
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do Wirecard para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: any): PaymentStatusResponse {
    const methodMap: Record<string, any> = {
      CREDIT_CARD: "credit_card",
      BOLETO: "boleto",
      PIX: "pix",
    };
    const method = methodMap[response.fundingInstrument?.method] || "pix";

    return {
      transactionId: response.id,
      gatewayTransactionId: response.id,
      status: this.toPaymentStatus(response.status),
      amount: response.amount.total / 100,
      currency: "BRL",
      paymentMethod: method,
      createdAt: response.createdAt || new Date().toISOString(),
      updatedAt: response.updatedAt || response.createdAt || new Date().toISOString(),
      paidAt: response.status === "AUTHORIZED" || response.status === "SETTLED" ? response.updatedAt : undefined,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      WAITING: "pending",
      IN_ANALYSIS: "processing",
      AUTHORIZED: "approved",
      SETTLED: "approved",
      CANCELLED: "cancelled",
      REFUNDED: "refunded",
      REVERSED: "refunded",
    };
    return map[status.toUpperCase()] || "pending";
  }
}

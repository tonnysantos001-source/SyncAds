import { PaymentRequest, PaymentResponse, PaymentStatus, PaymentStatusResponse } from "../../../../../types.ts";
import { PaymentRequestPayload, PaymentResponsePayload } from "./types.ts";

export class Mapper {
  static formatPhone(phone: string): string {
    const clean = phone.replace(/\D/g, "");
    if (clean.length === 11 || clean.length === 10) {
      return `+55${clean}`;
    }
    return clean ? `+${clean}` : "";
  }

  static formatDocument(doc: string): string {
    return doc.replace(/\D/g, "");
  }

  static getDocumentType(doc: string): string {
    const clean = doc.replace(/\D/g, "");
    return clean.length > 11 ? "CNPJ" : "CPF";
  }

  static formatZipCode(zip: string): string {
    return zip.replace(/\D/g, "");
  }

  /**
   * Converte a request interna do SyncAds para o formato da API do Pague-X
   */
  static toPaymentPayload(request: PaymentRequest, webhookUrl?: string): PaymentRequestPayload {
    const paymentMethodMap: Record<string, string> = {
      pix: "pix",
      boleto: "boleto",
      credit_card: "credit_card",
      debit_card: "credit_card", // Usa credit_card para débito também
    };

    const payload: PaymentRequestPayload = {
      amount: Math.round(request.amount * 100), // Converter para centavos
      currency: request.currency || "BRL",
      paymentMethod: paymentMethodMap[request.paymentMethod] || "pix",
      installments: request.installments || 1,
      postbackUrl: webhookUrl,
      metadata: JSON.stringify({
        orderId: request.orderId,
        userId: request.userId,
      }),
      externalRef: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        phone: this.formatPhone(request.customer.phone || ""),
        document: {
          type: this.getDocumentType(request.customer.document).toLowerCase(),
          number: this.formatDocument(request.customer.document),
        },
      },
      items: [
        {
          title: `Pedido #${request.orderId}`,
          unitPrice: Math.round(request.amount * 100),
          quantity: 1,
          tangible: false,
        },
      ],
    };

    if (request.billingAddress) {
      payload.customer.address = {
        street: request.billingAddress.street,
        streetNumber: request.billingAddress.number,
        complement: request.billingAddress.complement || "",
        zipCode: this.formatZipCode(request.billingAddress.zipCode),
        neighborhood: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        country: "BR",
      };
    }

    // Adicionar dados de cartão ou cardToken se aplicável
    if (
      request.card &&
      (request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card")
    ) {
      if ((request as any).cardToken) {
        payload.cardToken = (request as any).cardToken;
      } else {
        payload.card = {
          number: request.card.number.replace(/\s/g, ""),
          holderName: request.card.holderName,
          expMonth: parseInt(request.card.expiryMonth),
          expYear: parseInt(request.card.expiryYear),
          cvv: request.card.cvv,
        };
      }
    }

    return payload;
  }

  /**
   * Converte a resposta da API do Pague-X para o formato padronizado do SyncAds
   */
  static toPaymentResponse(response: PaymentResponsePayload, amount: number): PaymentResponse {
    const rawStatus = response.status || "pending";
    const status = this.toPaymentStatus(rawStatus);
    const success = ["approved", "paid", "pending", "waiting_payment"].includes(rawStatus.toLowerCase());

    const result: PaymentResponse = {
      success,
      transactionId: response.id?.toString() || response.secureId || "N/A",
      gatewayTransactionId: response.id?.toString() || response.secureId || "N/A",
      status,
      paymentUrl: response.secureUrl,
      message: `Pagamento processado via Pague-X com status: ${rawStatus}`,
      metadata: {
        paidAt: response.paidAt,
        authorizationCode: response.authorizationCode,
      },
    };

    if (response.pix) {
      result.pixData = {
        qrCode: response.pix.qrcode,
        qrCodeBase64: response.pix.qrcodeImage,
        expiresAt: response.pix.expirationDate,
        amount,
      };
    }

    if (response.boleto) {
      result.boletoData = {
        boletoUrl: response.boleto.url,
        barcode: response.boleto.barcode,
        digitableLine: response.boleto.digitableLine,
        dueDate: response.boleto.expirationDate,
        amount,
      };
    }

    return result;
  }

  /**
   * Converte a resposta de status da API do Pague-X para resposta de status do SyncAds
   */
  static toPaymentStatusResponse(response: PaymentResponsePayload): PaymentStatusResponse {
    const amountVal = response.amount ? response.amount / 100 : 0;
    return {
      transactionId: response.id?.toString() || response.secureId || "N/A",
      gatewayTransactionId: response.id?.toString() || response.secureId || "N/A",
      status: this.toPaymentStatus(response.status),
      amount: amountVal,
      currency: response.currency || "BRL",
      paymentMethod: response.pix ? "pix" : (response.boleto ? "boleto" : "credit_card"),
      createdAt: response.createdAt || new Date().toISOString(),
      updatedAt: response.updatedAt || new Date().toISOString(),
      paidAt: response.paidAt,
    };
  }

  /**
   * Normaliza status
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      waiting_payment: "pending",
      pending: "processing",
      approved: "approved",
      paid: "approved",
      refused: "failed",
      in_protest: "processing",
      refunded: "refunded",
      cancelled: "cancelled",
      chargeback: "refunded",
    };

    return statusMap[status?.toLowerCase()] || "pending";
  }
}

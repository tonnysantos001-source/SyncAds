import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da Pague-X.
   */
  static toCreatePaymentPayload(request: PaymentRequest, webhookUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g);
    const phoneClean = (request.customer.phone || "").replace(/\D/g);
    const docType = docClean.length > 11 ? "cnpj" : "cpf";

    let paymentMethod: "credit_card" | "pix" | "boleto" = "credit_card";
    if (request.paymentMethod === "pix") paymentMethod = "pix";
    else if (request.paymentMethod === "boleto") paymentMethod = "boleto";

    // Pague-X espera amount em centavos (padrão APIs brasileiras)
    const payload: CreatePaymentPayload = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      paymentMethod,
      installments: request.installments || 1,
      postbackUrl: webhookUrl,
      externalRef: request.orderId,
      metadata: JSON.stringify({
        orderId: request.orderId,
      }),
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        phone: phoneClean,
        document: {
          type: docType,
          number: docClean,
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
        streetNumber: String(request.billingAddress.number),
        complement: request.billingAddress.complement || "",
        zipCode: (request.billingAddress.zipCode || "").replace(/\D/g, ""),
        neighborhood: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        country: "BR",
      };
    }

    if ((request as any).cardToken) {
      payload.cardToken = (request as any).cardToken;
    } else if (request.card && paymentMethod === "credit_card") {
      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        holderName: request.card.holderName.toUpperCase(),
        expMonth: Number(request.card.expMonth || request.card.expiryMonth),
        expYear: Number(request.card.expYear || request.card.expiryYear),
        cvv: request.card.cvv,
      };
    }

    return payload;
  }

  /**
   * Converte resposta da Pague-X para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || (!apiResponse.id && !apiResponse.secureId)) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "Pague-X recusou o pagamento.",
        errorCode: apiResponse.error?.code || "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(String(apiResponse.status || "pending"));

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: String(apiResponse.id || apiResponse.secureId || ""),
      status: statusVal,
      message: apiResponse.message || `Pague-X status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.pix) {
      response.qrCode = apiResponse.pix.qrcode;
      response.pixData = {
        qrCode: apiResponse.pix.qrcode || "",
        qrCodeImage: apiResponse.pix.qrcodeImage,
        amount: (apiResponse.amount || 0) / 100,
      };
      response.expiresAt = apiResponse.pix.expirationDate;
    }

    if (apiResponse.boleto) {
      response.paymentUrl = apiResponse.boleto.url;
      response.redirectUrl = apiResponse.boleto.url;
      response.barcodeNumber = apiResponse.boleto.barcode;
      response.digitableLine = apiResponse.boleto.digitableLine;
      response.expiresAt = apiResponse.boleto.expirationDate;
    } else if (apiResponse.secureUrl) {
      response.paymentUrl = apiResponse.secureUrl;
      response.redirectUrl = apiResponse.secureUrl;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: String(apiResponse.id || ""),
      gatewayTransactionId: String(apiResponse.id || ""),
      status: Mapper.toPaymentStatus(String(apiResponse.status || "pending")),
      amount: (apiResponse.amount || 0) / 100,
      currency: apiResponse.currency || "BRL",
      paymentMethod: apiResponse.paymentMethod || "unknown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Normaliza os códigos de status da Pague-X.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
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
    return map[status?.toLowerCase()] || "pending";
  }
}

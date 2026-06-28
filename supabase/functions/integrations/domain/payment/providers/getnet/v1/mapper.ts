import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
  PaymentMethod,
} from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da GetNet.
   */
  static toCreatePaymentPayload(request: PaymentRequest, sellerId: string, webhookUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");
    const docType = docClean.length > 11 ? "CNPJ" : "CPF";

    const nameParts = request.customer.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Silva";

    let paymentMethod: "credit_card" | "pix" | "boleto" = "credit_card";
    if (request.paymentMethod === "pix") paymentMethod = "pix";
    else if (request.paymentMethod === "boleto") paymentMethod = "boleto";

    const payload: CreatePaymentPayload = {
      seller_id: sellerId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      order: {
        order_id: request.orderId,
      },
      customer: {
        customer_id: docClean,
        first_name: firstName,
        last_name: lastName,
        name: request.customer.name,
        email: request.customer.email,
        document_type: docType,
        document_number: docClean,
        phone_number: phoneClean || undefined,
      },
    };

    if (paymentMethod === "pix") {
      payload.pix = {
        additional_data: `Pedido ${request.orderId}`,
      };
    } else if (paymentMethod === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      payload.boleto = {
        our_number: request.orderId,
        document_number: docClean,
        expiration_date: dueDate.toISOString().split("T")[0],
        instructions: "Não receber após vencimento",
        provider: "santander",
      };
    } else if (paymentMethod === "credit_card" && request.card) {
      payload.device = {
        ip_address: "127.0.0.1",
      };
      payload.credit = {
        delayed: false,
        save_card_data: false,
        transaction_type: "FULL",
        number_installments: request.installments || 1,
        card: {
          number_token: request.card.number.replace(/\D/g, ""),
          cardholder_name: request.card.holderName.toUpperCase(),
          security_code: request.card.cvv,
          expiration_month: String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0"),
          expiration_year: String(request.card.expYear || request.card.expiryYear),
        },
      };
    }

    return payload;
  }

  /**
   * Converte resposta da GetNet para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || !apiResponse.payment_id) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.error?.description || apiResponse.message || "GetNet recusou o pagamento.",
        errorCode: "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "PENDING");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.payment_id || "",
      status: statusVal,
      message: apiResponse.message || `GetNet status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.authorization_code) response.authorizationCode = apiResponse.authorization_code;
    if (apiResponse.terminal_nsu) response.nsu = apiResponse.terminal_nsu;

    if (apiResponse.qrcode_text) {
      response.qrCode = apiResponse.qrcode_text;
      response.pixData = {
        qrCode: apiResponse.qrcode_text,
        qrCodeImage: apiResponse.qrcode_image,
        amount: (apiResponse.amount || 0) / 100,
      };
      response.expiresAt = apiResponse.expiration_date;
    }

    if (apiResponse.boleto_url) {
      response.paymentUrl = apiResponse.boleto_url;
      response.redirectUrl = apiResponse.boleto_url;
      response.barcodeNumber = apiResponse.barcode;
      response.digitableLine = apiResponse.typeful_line;
      response.expiresAt = apiResponse.expiration_date;
    } else if (apiResponse.redirect_url) {
      response.paymentUrl = apiResponse.redirect_url;
      response.redirectUrl = apiResponse.redirect_url;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.payment_id || "",
      gatewayTransactionId: apiResponse.payment_id || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "PENDING"),
      amount: (apiResponse.amount || 0) / 100,
      currency: "BRL",
      paymentMethod: Mapper.mapGetnetPaymentMethod(apiResponse.payment_type || ""),
      createdAt: apiResponse.create_date || new Date().toISOString(),
      updatedAt: apiResponse.update_date || new Date().toISOString(),
      paidAt: apiResponse.status === "APPROVED" ? apiResponse.update_date : undefined,
    };
  }

  /**
   * Normaliza os códigos de status da GetNet.
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
    return map[status?.toUpperCase()] || "pending";
  }

  /**
   * Mapeia tipo de pagamento da GetNet.
   */
  private static mapGetnetPaymentMethod(type: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      credit: PaymentMethod.CREDIT_CARD,
      debit: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
      pix: PaymentMethod.PIX,
    };
    return map[type?.toLowerCase()] || PaymentMethod.CREDIT_CARD;
  }
}

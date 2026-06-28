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
   * Converte PaymentRequest no DTO da Stone.
   */
  static toCreatePaymentPayload(request: PaymentRequest, merchantId: string, callbackUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const docType = docClean.length > 11 ? "CNPJ" : "CPF";
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");

    const paymentTypeMap: Record<string, "pix" | "credit_card" | "debit_card" | "boleto"> = {
      pix: "pix",
      boleto: "boleto",
      credit_card: "credit_card",
      debit_card: "debit_card",
    };

    const type = paymentTypeMap[request.paymentMethod] || "credit_card";

    const payload: CreatePaymentPayload = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method: type,
      merchant_id: merchantId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: {
          type: docType,
          number: docClean,
        },
      },
      metadata: {
        order_id: request.orderId,
      },
    };

    if (phoneClean && phoneClean.length >= 10) {
      payload.customer.phone = {
        country_code: "55",
        area_code: phoneClean.substring(0, 2),
        number: phoneClean.substring(2),
      };
    }

    if (request.billingAddress) {
      payload.customer.address = {
        street: request.billingAddress.street,
        number: String(request.billingAddress.number),
        complement: request.billingAddress.complement || undefined,
        neighborhood: request.billingAddress.neighborhood,
        city: request.billingAddress.city,
        state: request.billingAddress.state,
        zip_code: (request.billingAddress.zipCode || "").replace(/\D/g, ""),
      };
    }

    if (type === "pix") {
      payload.pix = {
        expiration_seconds: 3600,
      };
    } else if (type === "boleto") {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      payload.boleto = {
        due_date: dueDate.toISOString().split("T")[0],
        instructions: "Pagamento processado via Stone",
      };
    } else if ((type === "credit_card" || type === "debit_card") && request.card) {
      const expMonth = String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0");
      const expYear = String(request.card.expYear || request.card.expiryYear);

      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        holder_name: request.card.holderName.toUpperCase(),
        expiration_month: expMonth,
        expiration_year: expYear,
        cvv: request.card.cvv,
      };
      payload.installments = request.installments || 1;
      payload.capture = true;
    }

    return payload;
  }

  /**
   * Converte resposta da Stone para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || !apiResponse.id) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "Stone recusou o pagamento.",
        errorCode: "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "pending");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending" || statusVal === "processing",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id || "",
      status: statusVal,
      message: apiResponse.message || `Stone status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.authorization_code) response.authorizationCode = apiResponse.authorization_code;
    if (apiResponse.nsu) response.nsu = apiResponse.nsu;
    if (apiResponse.tid) response.tid = apiResponse.tid;

    if (apiResponse.pix?.qr_code) {
      response.qrCode = apiResponse.pix.qr_code;
      response.pixData = {
        qrCode: apiResponse.pix.qr_code,
        qrCodeImage: apiResponse.pix.qr_code_base64,
        amount: (apiResponse.amount || 0) / 100,
      };
      response.expiresAt = apiResponse.pix.expires_at;
    }

    if (apiResponse.boleto?.url) {
      response.paymentUrl = apiResponse.boleto.url;
      response.redirectUrl = apiResponse.boleto.url;
      response.barcodeNumber = apiResponse.boleto.barcode;
      response.digitableLine = apiResponse.boleto.digitable_line;
      response.expiresAt = apiResponse.boleto.due_date;
    } else if (apiResponse.authentication_url) {
      response.paymentUrl = apiResponse.authentication_url;
      response.redirectUrl = apiResponse.authentication_url;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.id || "",
      gatewayTransactionId: apiResponse.id || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "pending"),
      amount: (apiResponse.amount || 0) / 100,
      currency: "BRL",
      paymentMethod: Mapper.mapStonePaymentMethod(apiResponse.payment_method || ""),
      createdAt: apiResponse.created_at || new Date().toISOString(),
      updatedAt: apiResponse.updated_at || new Date().toISOString(),
      paidAt: apiResponse.paid_at,
    };
  }

  /**
   * Normaliza os códigos de status da Stone.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      authorized: "approved",
      paid: "approved",
      approved: "approved",
      failed: "failed",
      declined: "failed",
      cancelled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }

  /**
   * Mapeia tipo de pagamento da Stone.
   */
  private static mapStonePaymentMethod(method: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      pix: PaymentMethod.PIX,
      credit_card: PaymentMethod.CREDIT_CARD,
      debit_card: PaymentMethod.DEBIT_CARD,
      boleto: PaymentMethod.BOLETO,
    };
    return map[method?.toLowerCase()] || PaymentMethod.CREDIT_CARD;
  }
}

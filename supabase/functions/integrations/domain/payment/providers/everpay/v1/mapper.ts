import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da Ever Pay.
   */
  static toCreatePaymentPayload(request: PaymentRequest, webhookUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");

    let payment_method: "credit_card" | "pix" | "boleto" = "credit_card";
    if (request.paymentMethod === "pix") payment_method = "pix";
    else if (request.paymentMethod === "boleto") payment_method = "boleto";

    // Ever Pay espera amount em centavos (padrão APIs brasileiras)
    const payload: CreatePaymentPayload = {
      transaction_id: request.orderId,
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: docClean,
        phone: phoneClean || undefined,
      },
      metadata: {
        order_id: request.orderId,
      },
      installments: request.installments || 1,
      notification_url: webhookUrl,
    };

    if (request.card && payment_method === "credit_card") {
      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        holder_name: request.card.holderName.toUpperCase(),
        expiry_month: String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0"),
        expiry_year: String(request.card.expYear || request.card.expiryYear),
        cvv: request.card.cvv,
      };
    }

    return payload;
  }

  /**
   * Converte resposta da Ever Pay para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || (!apiResponse.id && !apiResponse.transaction_id)) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "Ever Pay recusou o pagamento.",
        errorCode: apiResponse.error?.code || "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "pending");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id || apiResponse.transaction_id || "",
      status: statusVal,
      message: apiResponse.message || `Ever Pay status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.qr_code) {
      response.qrCode = apiResponse.qr_code;
      response.pixData = {
        qrCode: apiResponse.qr_code,
        qrCodeImage: apiResponse.qr_code_base64,
        amount: (apiResponse.amount || 0) / 100,
      };
      response.expiresAt = apiResponse.expires_at;
    }

    if (apiResponse.payment_url || apiResponse.boleto_url) {
      response.paymentUrl = apiResponse.payment_url || apiResponse.boleto_url;
      response.redirectUrl = apiResponse.payment_url || apiResponse.boleto_url;
      response.barcodeNumber = apiResponse.barcode;
      response.digitableLine = apiResponse.digitable_line;
      response.expiresAt = apiResponse.expires_at;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.transaction_id || "",
      gatewayTransactionId: apiResponse.id || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "pending"),
      amount: (apiResponse.amount || 0) / 100,
      currency: apiResponse.currency || "BRL",
      paymentMethod: apiResponse.payment_method || "unknown",
      createdAt: apiResponse.created_at || new Date().toISOString(),
      updatedAt: apiResponse.created_at || new Date().toISOString(),
    };
  }

  /**
   * Normaliza os códigos de status da Ever Pay.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      approved: "approved",
      paid: "approved",
      completed: "approved",
      success: "approved",
      pending: "pending",
      processing: "processing",
      failed: "failed",
      declined: "failed",
      error: "failed",
      cancelled: "cancelled",
      canceled: "cancelled",
      voided: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}

import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload do SafetyPay.
   */
  static toCreatePaymentPayload(request: PaymentRequest, callbackUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");

    const payload: CreatePaymentPayload = {
      transaction_id: request.orderId,
      amount: request.amount,
      currency: "BRL",
      payment_method: request.paymentMethod,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: docClean,
        phone: phoneClean || undefined,
      },
      metadata: {
        order_id: request.orderId,
        user_id: request.userId,
      },
    };

    if (request.card && (request.paymentMethod === "credit_card" || request.paymentMethod === "debit_card")) {
      const expMonth = String(request.card.expMonth || request.card.expiryMonth).padStart(2, "0");
      const expYear = String(request.card.expYear || request.card.expiryYear);

      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        holder_name: request.card.holderName.toUpperCase(),
        expiry_month: expMonth,
        expiry_year: expYear,
        cvv: request.card.cvv,
      };
      payload.installments = request.installments || 1;
    }

    return payload;
  }

  /**
   * Converte resposta do SafetyPay para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || (!apiResponse.id && !apiResponse.transaction_id)) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "SafetyPay recusou a transação.",
        errorCode: "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "pending");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending" || statusVal === "processing",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id || apiResponse.transaction_id || "",
      status: statusVal,
      message: apiResponse.message || `SafetyPay status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.qr_code || apiResponse.pix_qr_code) {
      response.qrCode = apiResponse.qr_code || apiResponse.pix_qr_code;
      response.pixData = {
        qrCode: response.qrCode || "",
        qrCodeImage: apiResponse.qr_code_base64,
        amount: apiResponse.amount || 0,
      };
      response.expiresAt = apiResponse.expires_at;
    }

    if (apiResponse.boleto_url || apiResponse.payment_url) {
      response.paymentUrl = apiResponse.boleto_url || apiResponse.payment_url;
      response.redirectUrl = apiResponse.boleto_url || apiResponse.payment_url;
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
      gatewayTransactionId: apiResponse.id || apiResponse.transaction_id || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "pending"),
      amount: apiResponse.amount || 0,
      currency: (apiResponse.currency as any) || "BRL",
      paymentMethod: apiResponse.payment_method || "unknown",
      createdAt: apiResponse.created_at || new Date().toISOString(),
      updatedAt: apiResponse.updated_at || new Date().toISOString(),
      paidAt: apiResponse.paid_at,
    };
  }

  /**
   * Normaliza os códigos de status do SafetyPay.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      pending: "pending",
      processing: "processing",
      paid: "approved",
      approved: "approved",
      completed: "approved",
      success: "approved",
      failed: "failed",
      declined: "failed",
      error: "failed",
      cancelled: "cancelled",
      canceled: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}

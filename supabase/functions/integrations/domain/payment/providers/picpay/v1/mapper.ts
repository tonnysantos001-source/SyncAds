import {
  PaymentRequest,
  PaymentResponse as InternalPaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreatePaymentPayload, PaymentResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload do PicPay.
   */
  static toCreatePaymentPayload(request: PaymentRequest, callbackUrl?: string): CreatePaymentPayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");
    
    // PicPay requer DDI + DDD + Número. Ex: +5511999999999
    let formattedPhone = "+5511999999999";
    if (phoneClean) {
      formattedPhone = phoneClean.startsWith("55") ? `+${phoneClean}` : `+55${phoneClean}`;
    }

    const nameParts = request.customer.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || firstName;

    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // 1 hora de expiração

    return {
      referenceId: request.orderId,
      callbackUrl: callbackUrl || "https://syncads.com.br/webhook/picpay",
      returnUrl: request.metadata?.returnUrl || "https://syncads.com.br/success",
      value: request.amount,
      expiresAt: expires.toISOString(),
      buyer: {
        firstName,
        lastName,
        document: docClean,
        email: request.customer.email,
        phone: formattedPhone,
      },
      channel: "ecommerce",
    };
  }

  /**
   * Converte resposta do PicPay para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: PaymentResponse,
    orderId: string
  ): InternalPaymentResponse {
    if (apiResponse.error || !apiResponse.referenceId) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || apiResponse.message || "PicPay recusou a transação.",
        errorCode: "PAYMENT_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "created");

    const response: InternalPaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending" || statusVal === "processing",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.referenceId || "",
      status: statusVal,
      message: apiResponse.message || `PicPay status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    if (apiResponse.paymentUrl) {
      response.paymentUrl = apiResponse.paymentUrl;
      response.redirectUrl = apiResponse.paymentUrl;
    }

    if (apiResponse.qrcode?.content) {
      response.qrCode = apiResponse.qrcode.content;
      response.pixData = {
        qrCode: apiResponse.qrcode.content,
        qrCodeImage: apiResponse.qrcode.base64,
        amount: apiResponse.value || 0,
      };
      response.expiresAt = apiResponse.expiresAt;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: PaymentResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.referenceId || "",
      gatewayTransactionId: apiResponse.authorizationId || apiResponse.referenceId || "",
      status: Mapper.toPaymentStatus(apiResponse.status || "created"),
      amount: apiResponse.value || 0,
      currency: "BRL",
      paymentMethod: "wallet",
      createdAt: apiResponse.createdAt || new Date().toISOString(),
      updatedAt: apiResponse.updatedAt || new Date().toISOString(),
      paidAt: apiResponse.status === "paid" ? apiResponse.updatedAt : undefined,
    };
  }

  /**
   * Normaliza os códigos de status do PicPay.
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      created: "pending",
      analysis: "processing",
      paid: "approved",
      completed: "approved",
      refunded: "refunded",
      expired: "expired",
      cancelled: "cancelled",
      chargeback: "refunded",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}

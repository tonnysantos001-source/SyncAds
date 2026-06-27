import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import { CreateChargePayload, ChargeResponse } from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da RoxPay.
   * Valores de amount e items em CENTAVOS.
   */
  static toCreateChargePayload(request: PaymentRequest, webhookUrl?: string): CreateChargePayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneClean = (request.customer.phone || "").replace(/\D/g, "");

    // Mapear o paymentMethod
    let payment_method: "credit_card" | "pix" | "boleto" = "credit_card";
    if (request.paymentMethod === "pix") payment_method = "pix";
    else if (request.paymentMethod === "boleto") payment_method = "boleto";

    const payload: CreateChargePayload = {
      amount: Math.round(request.amount * 100),
      currency: "BRL",
      payment_method,
      description: `Pedido ${request.orderId}`,
      reference_id: request.orderId,
      customer: {
        name: request.customer.name,
        email: request.customer.email,
        document: docClean,
        phone: phoneClean || undefined,
      },
      installments: request.installments || 1,
      notification_url: webhookUrl,
    };

    if (request.card && payment_method === "credit_card") {
      payload.card = {
        number: request.card.number.replace(/\D/g, ""),
        holder_name: request.card.holderName.toUpperCase(),
        expiration_month: String(request.card.expMonth).padStart(2, "0"),
        expiration_year: String(request.card.expYear),
        cvv: request.card.cvv,
      };
    }

    return payload;
  }

  /**
   * Converte a resposta de criação de cobrança da RoxPay para o padrão interno.
   */
  static toPaymentResponse(
    apiResponse: ChargeResponse,
    orderId: string
  ): PaymentResponse {
    if (apiResponse.error || !apiResponse.id) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error?.message || "RoxPay recusou o pagamento.",
        errorCode: apiResponse.error?.code || "CHARGE_ERROR",
        raw: apiResponse,
      };
    }

    const statusVal = Mapper.toPaymentStatus(apiResponse.status || "pending");

    const response: PaymentResponse = {
      success: statusVal === "approved" || statusVal === "pending",
      transactionId: orderId,
      gatewayTransactionId: apiResponse.id,
      status: statusVal,
      authCode: apiResponse.authorization_code,
      message: `RoxPay status: ${apiResponse.status}`,
      raw: apiResponse,
    };

    // Caso seja PIX
    if (apiResponse.pix) {
      response.qrCode = apiResponse.pix.qr_code;
      response.pixData = {
        qrCode: apiResponse.pix.qr_code || "",
        qrCodeImage: apiResponse.pix.qr_code_url,
        amount: (apiResponse.amount || 0) / 100,
      };
      response.expiresAt = apiResponse.pix.expires_at;
    }

    // Caso seja Boleto
    if (apiResponse.boleto) {
      response.paymentUrl = apiResponse.boleto.pdf_url;
      response.redirectUrl = apiResponse.boleto.pdf_url;
      response.barcodeNumber = apiResponse.boleto.digitable_line;
      response.digitableLine = apiResponse.boleto.digitable_line;
      response.expiresAt = apiResponse.boleto.expires_at;
    }

    return response;
  }

  /**
   * Converte resposta de consulta para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: ChargeResponse): PaymentStatusResponse {
    return {
      transactionId: apiResponse.reference_id || "",
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
   * Normaliza os códigos de status da RoxPay para o padrão interno.
   * Status RoxPay: "approved" | "pending" | "failed" | "cancelled" | "refunded"
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      approved: "approved",
      paid: "approved",
      captured: "approved",
      succeeded: "approved",
      pending: "pending",
      waiting: "pending",
      processing: "processing",
      failed: "failed",
      declined: "failed",
      canceled: "cancelled",
      cancelled: "cancelled",
      voided: "cancelled",
      refunded: "refunded",
      expired: "expired",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}

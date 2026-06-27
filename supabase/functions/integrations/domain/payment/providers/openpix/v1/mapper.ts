import {
  PaymentRequest,
  PaymentResponse,
  PaymentStatus,
  PaymentStatusResponse,
} from "../../../../../types.ts";
import {
  CreateChargePayload,
  CreateChargeResponse,
  GetChargeResponse,
} from "./types.ts";

export class Mapper {
  /**
   * Converte PaymentRequest no payload da OpenPix.
   * Valor em CENTAVOS (ex: R$10,00 = 1000).
   */
  static toChargePayload(request: PaymentRequest): CreateChargePayload {
    const docClean = (request.customer.document || "").replace(/\D/g, "");
    const phoneRaw = (request.customer.phone || "").replace(/\D/g, "");
    const phone = phoneRaw ? (phoneRaw.startsWith("55") ? `+${phoneRaw}` : `+55${phoneRaw}`) : undefined;

    return {
      correlationID: request.orderId,
      value: Math.round(request.amount * 100),
      comment: `Pedido ${request.orderId}`,
      expiresIn: 3600, // 1 hora
      customer: {
        name: request.customer.name,
        email: request.customer.email || undefined,
        taxID: docClean || undefined,
        phone,
      },
    };
  }

  /**
   * Converte resposta de criação de cobrança para PaymentResponse.
   */
  static toPaymentResponse(
    apiResponse: CreateChargeResponse,
    orderId: string
  ): PaymentResponse {
    const charge = apiResponse.charge;

    if (!charge || apiResponse.error) {
      return {
        success: false,
        status: "failed",
        message: apiResponse.error || "OpenPix não criou a cobrança.",
        errorCode: "CHARGE_ERROR",
      };
    }

    return {
      success: true,
      transactionId: orderId,
      gatewayTransactionId: charge.identifier || charge.correlationID,
      status: Mapper.toPaymentStatus(charge.status),
      qrCode: charge.brCode,
      paymentUrl: charge.paymentLinkUrl,
      redirectUrl: charge.paymentLinkUrl,
      pixData: {
        qrCode: charge.brCode,
        qrCodeImage: charge.qrCodeImage,
        amount: charge.value / 100,
      },
      expiresAt: charge.expiresDate,
      message: "Cobrança PIX OpenPix criada com sucesso.",
      raw: apiResponse,
    };
  }

  /**
   * Converte resposta de consulta de cobrança para PaymentStatusResponse.
   */
  static toPaymentStatusResponse(apiResponse: GetChargeResponse): PaymentStatusResponse {
    const charge = apiResponse.charge;
    if (!charge) throw new Error("Cobrança não encontrada na OpenPix.");

    return {
      transactionId: charge.correlationID,
      gatewayTransactionId: charge.identifier || charge.correlationID,
      status: Mapper.toPaymentStatus(charge.status),
      amount: charge.value / 100,
      currency: "BRL",
      paymentMethod: "pix",
      createdAt: charge.createdAt || new Date().toISOString(),
      updatedAt: charge.paidAt || charge.createdAt || new Date().toISOString(),
      paidAt: charge.paidAt,
    };
  }

  /**
   * Normaliza os status da OpenPix para o padrão interno.
   * Status OpenPix: "ACTIVE" | "COMPLETED" | "EXPIRED" | "REMOVED_BY_MERCHANT"
   */
  static toPaymentStatus(status: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      active: "pending",
      pending: "pending",
      completed: "approved",
      paid: "approved",
      approved: "approved",
      expired: "expired",
      removed_by_merchant: "cancelled",
      removed_by_user: "cancelled",
      failed: "failed",
      error: "failed",
    };
    return map[status?.toLowerCase()] || "pending";
  }
}

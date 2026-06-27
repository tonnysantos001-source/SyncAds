import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";

export class WebhookHandler {
  static validateSignature(
    _payload: any,
    _signature: string | undefined,
    _secret: string | undefined
  ): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /**
   * Processa o webhook da Cielo.
   * Payload esperado: { PaymentId, Status, MerchantOrderId }
   */
  static handle(payload: any): WebhookResponse {
    try {
      const paymentId = payload.PaymentId || payload.paymentId;
      const status = payload.Status !== undefined ? payload.Status : payload.status;
      const orderId = payload.MerchantOrderId || payload.merchantOrderId;

      if (!paymentId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Cielo inválido: PaymentId ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(Number(status));

      return {
        success: true,
        processed: true,
        transactionId: orderId || paymentId,
        status: normalizedStatus,
        message: `Webhook Cielo: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Cielo: ${err.message}`,
      };
    }
  }
}

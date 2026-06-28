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
   */
  static handle(payload: any): WebhookResponse {
    try {
      const paymentId = payload.PaymentId;
      const status = payload.Payment?.Status;

      if (!paymentId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Cielo inválido: PaymentId ausente.",
        };
      }

      if (status === undefined) {
        return {
          success: false,
          processed: false,
          message: "Webhook Cielo inválido: Status de pagamento ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: paymentId,
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

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
   * Processa o webhook da Stone.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const paymentId = payload.payment_id;
      const status = payload.status;

      if (!paymentId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Stone inválido: payment_id ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook Stone inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: paymentId,
        status: normalizedStatus,
        message: `Webhook Stone: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Stone: ${err.message}`,
      };
    }
  }
}

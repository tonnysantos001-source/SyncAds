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
   * Processa o webhook da Axelpay.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const paymentId = payload.id;
      const status = payload.status;
      const referenceId = payload.reference_id;

      if (!paymentId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Axelpay inválido: id ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook Axelpay inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: referenceId || paymentId,
        status: normalizedStatus,
        message: `Webhook Axelpay: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Axelpay: ${err.message}`,
      };
    }
  }
}

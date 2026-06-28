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
   * Processa o webhook da Ever Pay.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const transactionId = payload.transaction_id || payload.id;
      const status = payload.status;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Ever Pay inválido: transaction_id/id ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook Ever Pay inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId,
        status: normalizedStatus,
        message: `Webhook Ever Pay: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Ever Pay: ${err.message}`,
      };
    }
  }
}

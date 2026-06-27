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
   * Processa webhook enviado pela RoxPay.
   * Payload: { id, status, reference_id, amount }
   */
  static handle(payload: any): WebhookResponse {
    try {
      const chargeId = payload.id;
      const status = payload.status;
      const referenceId = payload.reference_id;

      if (!chargeId) {
        return {
          success: false,
          processed: false,
          message: "Webhook RoxPay inválido: id ausente.",
        };
      }

      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook RoxPay inválido: status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: referenceId || chargeId,
        status: normalizedStatus,
        message: `Webhook RoxPay: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook RoxPay: ${err.message}`,
      };
    }
  }
}

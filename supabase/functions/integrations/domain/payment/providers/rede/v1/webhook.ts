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
   * Processa o webhook da Rede.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const tid = payload.tid;
      const returnCode = payload.returnCode || payload.status;

      if (!tid) {
        return {
          success: false,
          processed: false,
          message: "Webhook Rede inválido: tid ausente.",
        };
      }

      if (!returnCode) {
        return {
          success: false,
          processed: false,
          message: "Webhook Rede inválido: returnCode/status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(returnCode);

      return {
        success: true,
        processed: true,
        transactionId: tid,
        status: normalizedStatus,
        message: `Webhook Rede: ${returnCode} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Rede: ${err.message}`,
      };
    }
  }
}

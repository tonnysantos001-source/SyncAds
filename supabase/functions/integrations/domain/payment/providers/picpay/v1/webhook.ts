import { WebhookResponse } from "../../../../../types.ts";

export class WebhookHandler {
  static validateSignature(
    _payload: any,
    _signature: string | undefined,
    _secret: string | undefined
  ): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /**
   * Processa o webhook do PicPay.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const referenceId = payload.referenceId;
      const status = payload.status || "paid"; // PicPay chama webhook pós-pagamento confirmado

      if (!referenceId) {
        return {
          success: false,
          processed: false,
          message: "Webhook PicPay inválido: referenceId ausente.",
        };
      }

      return {
        success: true,
        processed: true,
        transactionId: referenceId,
        status: "approved",
        message: `Webhook PicPay: ${status} → approved`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook PicPay: ${err.message}`,
      };
    }
  }
}

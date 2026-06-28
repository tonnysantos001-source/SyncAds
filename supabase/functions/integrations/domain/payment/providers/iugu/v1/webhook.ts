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
   * Processa o webhook da Iugu.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const event = payload.event;
      const data = payload.data || {};
      const paymentId = data.id || payload.id;

      if (!paymentId) {
        return {
          success: false,
          processed: false,
          message: "Webhook Iugu inválido: ID de fatura/pagamento ausente.",
        };
      }

      const status = data.status || payload.status;
      if (!status) {
        return {
          success: false,
          processed: false,
          message: "Webhook Iugu inválido: Status ausente.",
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId: paymentId,
        status: normalizedStatus,
        message: `Webhook Iugu event [${event}]: ${status} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook Iugu: ${err.message}`,
      };
    }
  }
}

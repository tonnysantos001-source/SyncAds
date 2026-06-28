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
   * Processa o webhook do PayPal.
   */
  static handle(payload: any): WebhookResponse {
    try {
      const eventType = payload.event_type;
      const resource = payload.resource || {};
      const transactionId = resource.id;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          message: "Webhook PayPal inválido: resource.id ausente.",
        };
      }

      if (eventType === "PAYMENT.CAPTURE.COMPLETED" || eventType === "CHECKOUT.ORDER.APPROVED") {
        return {
          success: true,
          processed: true,
          transactionId,
          status: "approved",
          message: `Webhook PayPal [${eventType}]: approved`,
          raw: payload,
        };
      }

      if (eventType === "PAYMENT.CAPTURE.REFUNDED") {
        return {
          success: true,
          processed: true,
          transactionId,
          status: "refunded",
          message: `Webhook PayPal [${eventType}]: refunded`,
          raw: payload,
        };
      }

      return {
        success: true,
        processed: false,
        message: `Webhook PayPal de tipo ${eventType} recebido e ignorado.`,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro webhook PayPal: ${err.message}`,
      };
    }
  }
}

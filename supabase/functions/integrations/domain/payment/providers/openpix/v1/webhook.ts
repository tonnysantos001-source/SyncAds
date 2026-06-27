import { WebhookResponse } from "../../../../../types.ts";
import { Mapper } from "./mapper.ts";
import { WebhookPayload } from "./types.ts";

export class WebhookHandler {
  /**
   * OpenPix não usa assinatura HMAC — valida apenas estrutura do evento.
   * Eventos: OPENPIX:CHARGE_COMPLETED | OPENPIX:CHARGE_EXPIRED | OPENPIX:CHARGE_CREATED
   */
  static validateSignature(
    _payload: any,
    _signature: string | undefined,
    _secret: string | undefined
  ): { isValid: boolean; error?: string } {
    return { isValid: true };
  }

  /**
   * Processa o webhook da OpenPix.
   * O payload contém: event + charge (com correlationID, status, value)
   */
  static handle(payload: WebhookPayload): WebhookResponse {
    try {
      const event = payload.event;
      const charge = payload.charge;

      if (!event) {
        return {
          success: false,
          processed: false,
          message: "Webhook OpenPix inválido: campo 'event' ausente.",
        };
      }

      // Mapear evento para status
      let status: string;
      switch (event) {
        case "OPENPIX:CHARGE_COMPLETED":
          status = "completed";
          break;
        case "OPENPIX:CHARGE_EXPIRED":
          status = "expired";
          break;
        case "OPENPIX:CHARGE_CREATED":
          status = "active";
          break;
        default:
          status = charge?.status || "pending";
      }

      const transactionId = charge?.correlationID || charge?.identifier;

      if (!transactionId) {
        return {
          success: false,
          processed: false,
          message: `Webhook OpenPix sem correlationID. Evento: ${event}`,
        };
      }

      const normalizedStatus = Mapper.toPaymentStatus(status);

      return {
        success: true,
        processed: true,
        transactionId,
        status: normalizedStatus,
        message: `Webhook OpenPix processado. Evento: ${event} → ${normalizedStatus}`,
        raw: payload,
      };
    } catch (err: any) {
      return {
        success: false,
        processed: false,
        message: `Erro ao processar webhook OpenPix: ${err.message}`,
      };
    }
  }
}
